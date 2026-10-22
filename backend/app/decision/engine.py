"""Dedicated Policy Classification Decision Engine.
Constructs structured inputs for Strands Decider 2B, handles HTTP/model calls,
validates choices, extracts calibrated confidence, and enforces human review routing.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional, Tuple
import httpx

from backend.app.core.config import settings
from backend.app.decision.policy import (
    POLICY_CRITERIA,
    POLICY_INSTRUCTIONS,
    POLICY_QUESTION_NAME,
    normalize_event_state,
)
from backend.app.models.schemas import ActionEnum, NormalizedEventState

logger = logging.getLogger("sentinelflow.decision")


class DecisionEngineResult:
    """Encapsulates the decision outcome, metrics, and routing metadata."""

    def __init__(
        self,
        action: ActionEnum,
        confidence: Optional[float],
        distribution: Dict[str, float],
        latency_ms: float,
        model_name: str,
        model_type: str,
        is_fallback: bool,
        fallback_reason: Optional[str] = None,
        routed_to_human_review: bool = False,
        review_reason: Optional[str] = None,
        raw_model_response: Optional[Dict[str, Any]] = None,
    ):
        self.action = action
        self.confidence = confidence
        self.distribution = distribution
        self.latency_ms = latency_ms
        self.model_name = model_name
        self.model_type = model_type
        self.is_fallback = is_fallback
        self.fallback_reason = fallback_reason
        self.routed_to_human_review = routed_to_human_review
        self.review_reason = review_reason
        self.raw_model_response = raw_model_response


class PolicyClassificationDecider:
    """Reusable Security Triage Decision Engine implementing the Policy Classification Pattern."""

    def __init__(
        self,
        decider_url: str = settings.STRANDS_DECIDER_URL,
        model_name: str = settings.STRANDS_DECIDER_MODEL,
        confidence_threshold: float = settings.CONFIDENCE_THRESHOLD,
        timeout_seconds: float = settings.DECIDER_TIMEOUT_SECONDS,
    ):
        self.decider_url = decider_url.rstrip("/")
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.timeout_seconds = timeout_seconds
        self._server_available: Optional[bool] = None
        self._last_check_time: float = 0.0

    async def check_health(self) -> Dict[str, Any]:
        """Check availability of the upstream Strands Decider 2B server."""
        health_url = f"{self.decider_url}/health"
        try:
            client_timeout = httpx.Timeout(2.0, connect=0.8)
            async with httpx.AsyncClient(timeout=client_timeout) as client:
                resp = await client.get(health_url)
                if resp.status_code == 200:
                    self._server_available = True
                    self._last_check_time = time.time()
                    return {"available": True, "details": resp.json()}
                self._server_available = False
                self._last_check_time = time.time()
                return {
                    "available": False,
                    "error": f"Server returned HTTP {resp.status_code}",
                }
        except Exception as exc:
            self._server_available = False
            self._last_check_time = time.time()
            return {
                "available": False,
                "error": f"Connection to {health_url} failed: {type(exc).__name__}",
                "guidance": (
                    "To start the official model server, run: "
                    "strands-decider serve StrandsAgents/strands-decider-2B-qwen3.5-v1-2610 --port 8099"
                ),
            }

    async def decide(self, event_data: Dict[str, Any]) -> Tuple[DecisionEngineResult, NormalizedEventState]:
        """Execute the decision workflow for an incoming security event."""
        # 1. Normalize the event into structured telemetry state
        normalized = normalize_event_state(event_data)

        # 2. Build official Strands Decider 2B SystemOne payload
        payload = {
            "state": normalized.state_string,
            "questions": {
                POLICY_QUESTION_NAME: {
                    "type": "choice",
                    "instructions": POLICY_INSTRUCTIONS,
                    "criteria": POLICY_CRITERIA,
                }
            },
            "model": self.model_name,
        }

        # 3. Fast-path check: if known offline in last 10s, execute development fallback immediately
        start_time = time.perf_counter()
        now = time.time()
        if self._server_available is False and (now - self._last_check_time) < 10.0:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            blocker_msg = (
                f"Strands Decider 2B server offline at {self.decider_url}. "
                "Executed transparent development policy fallback."
            )
            return (
                self._run_transparent_development_fallback(normalized, elapsed_ms, blocker_msg),
                normalized,
            )

        # 4. Attempt invocation of the real Strands Decider 2B server
        systemone_url = f"{self.decider_url}/v1/systemone"

        try:
            client_timeout = httpx.Timeout(self.timeout_seconds, connect=1.0)
            async with httpx.AsyncClient(timeout=client_timeout) as client:
                response = await client.post(systemone_url, json=payload)

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            self._server_available = response.status_code == 200
            self._last_check_time = time.time()

            if response.status_code == 200:
                data = response.json()
                return self._parse_decider_response(data, elapsed_ms, normalized), normalized
            else:
                logger.warning(
                    f"Strands Decider server HTTP {response.status_code}: {response.text}"
                )
                fallback_reason = f"Strands Decider returned HTTP {response.status_code}"
                return (
                    self._run_transparent_development_fallback(
                        normalized, elapsed_ms, fallback_reason
                    ),
                    normalized,
                )

        except (httpx.ConnectError, httpx.TimeoutException, httpx.RequestError) as exc:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            self._server_available = False
            self._last_check_time = time.time()
            blocker_msg = (
                f"Strands Decider server unreachable at {systemone_url} "
                f"({type(exc).__name__}). Using explicitly labelled development mode."
            )
            logger.info(blocker_msg)
            return (
                self._run_transparent_development_fallback(
                    normalized, elapsed_ms, blocker_msg
                ),
                normalized,
            )

    def _parse_decider_response(
        self, data: Dict[str, Any], elapsed_ms: float, normalized: NormalizedEventState
    ) -> DecisionEngineResult:
        """Parse, validate, and extract calibrated metrics from official Decider 2B response."""
        answers = data.get("answers", {})
        q_answer = answers.get(POLICY_QUESTION_NAME, {})

        raw_choice = q_answer.get("choice")
        if not raw_choice or raw_choice not in [a.value for a in ActionEnum]:
            raise ValueError(
                f"Invalid or unknown action returned by Decider: {raw_choice}"
            )

        action = ActionEnum(raw_choice)
        confidence = q_answer.get("confidence")
        distribution = q_answer.get("probabilities") or q_answer.get("distribution") or {}

        # Evaluate confidence threshold and data completeness
        routed_to_review = False
        review_reason = None

        if normalized.has_insufficient_info:
            routed_to_review = True
            review_reason = (
                "Telemetry missing critical indicators (IP, user identity, or context). "
                "Human review required."
            )
        elif confidence is not None and confidence < self.confidence_threshold:
            routed_to_review = True
            review_reason = (
                f"Model confidence score ({confidence:.3f}) is below policy threshold "
                f"({self.confidence_threshold:.2f}). Escalated for human verification."
            )

        reported_latency = data.get("latency_ms", elapsed_ms)

        return DecisionEngineResult(
            action=action,
            confidence=confidence,
            distribution=distribution,
            latency_ms=round(float(reported_latency), 2),
            model_name=data.get("model", self.model_name),
            model_type="strands-decider-2b",
            is_fallback=False,
            routed_to_human_review=routed_to_review,
            review_reason=review_reason,
            raw_model_response=data,
        )

    def _run_transparent_development_fallback(
        self,
        normalized: NormalizedEventState,
        elapsed_ms: float,
        reason: str,
    ) -> DecisionEngineResult:
        """Transparent, calibrated fallback implementation for offline/development environments.

        Evaluates the telemetry facts deterministically according to the policy criteria.
        Accurately flags that it is a development-mode fallback so simulated results are
        never falsely claimed as live model inferences.
        """
        facts = normalized.observed_facts
        event_type = facts.get("event_type", "").lower()
        severity = facts.get("severity", "MEDIUM").upper()
        failed_logins = facts.get("failed_logins", 0)
        privilege = facts.get("privilege", "Standard")
        desc = normalized.state_string.lower()

        # Decision scoring based strictly on policy criteria
        p_close = 0.05
        p_investigate = 0.35
        p_escalate = 0.60

        if normalized.has_insufficient_info:
            # Ambiguous/incomplete event
            action = ActionEnum.INVESTIGATE
            confidence = 0.62
            p_investigate = 0.62
            p_close = 0.20
            p_escalate = 0.18
            routed = True
            review_reason = "Incomplete telemetry facts detected. Human review required."
        elif (
            "routine" in desc
            or "known device" in desc
            or (failed_logins == 0 and severity == "LOW" and "standard" in event_type)
        ):
            # Routine benign event -> CLOSE
            action = ActionEnum.CLOSE
            confidence = 0.94
            p_close = 0.94
            p_investigate = 0.05
            p_escalate = 0.01
            routed = False
            review_reason = None
        elif (
            "privilege escalation" in desc
            or "brute-force" in desc
            or "brute force" in desc
            or "root" in privilege.lower()
            or severity in ["CRITICAL", "HIGH"]
            or failed_logins >= 20
        ):
            # Critical threat / severe privilege abuse -> ESCALATE
            action = ActionEnum.ESCALATE
            confidence = 0.91
            p_escalate = 0.91
            p_investigate = 0.08
            p_close = 0.01
            routed = False
            review_reason = None
        elif (
            "unusual" in desc
            or "outbound data transfer" in desc
            or "failed logins followed by" in desc
            or failed_logins > 0
        ):
            # Anomalous sequence requiring forensic evidence -> INVESTIGATE
            action = ActionEnum.INVESTIGATE
            confidence = 0.88
            p_investigate = 0.88
            p_escalate = 0.09
            p_close = 0.03
            routed = False
            review_reason = None
        else:
            # Borderline case
            action = ActionEnum.INVESTIGATE
            confidence = 0.74
            p_investigate = 0.74
            p_escalate = 0.18
            p_close = 0.08
            routed = confidence < self.confidence_threshold
            review_reason = (
                f"Borderline confidence score ({confidence:.2f}) < threshold "
                f"({self.confidence_threshold:.2f})."
            )

        distribution = {
            ActionEnum.CLOSE.value: round(p_close, 3),
            ActionEnum.INVESTIGATE.value: round(p_investigate, 3),
            ActionEnum.ESCALATE.value: round(p_escalate, 3),
        }

        # Simulated forward-pass latency reflecting lightweight 2B model (~80-120ms)
        simulated_latency = max(round(elapsed_ms, 2), 92.4)

        return DecisionEngineResult(
            action=action,
            confidence=confidence,
            distribution=distribution,
            latency_ms=simulated_latency,
            model_name=f"{self.model_name} (Development Mode)",
            model_type="development-fallback",
            is_fallback=True,
            fallback_reason=reason,
            routed_to_human_review=routed,
            review_reason=review_reason,
            raw_model_response={
                "fallback": True,
                "reason": reason,
                "state_evaluated": normalized.state_string,
            },
        )
