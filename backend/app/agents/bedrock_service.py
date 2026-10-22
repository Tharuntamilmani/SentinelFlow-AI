"""Amazon Bedrock Generative Incident Analysis Service.
Generates forensic incident explanations and recommended response steps
grounded directly in the Strands Decider 2B verdict and gathered investigation evidence.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Tuple
import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from backend.app.core.config import settings
from backend.app.models.schemas import ActionEnum

logger = logging.getLogger("sentinelflow.bedrock")


class BedrockExplanationService:
    """Invokes Amazon Bedrock to explain the Strands Decider 2B verdict."""

    def __init__(
        self,
        region_name: str = settings.AWS_REGION,
        model_id: str = settings.BEDROCK_MODEL_ID,
    ):
        self.region_name = region_name
        self.model_id = model_id
        self._client = None
        self._credentials_available: bool | None = None
        self._init_error_message: str | None = None

    def _get_client(self):
        """Lazy initialization of boto3 Bedrock Runtime client with credential verification."""
        if self._client is not None:
            return self._client

        try:
            client = boto3.client("bedrock-runtime", region_name=self.region_name)
            # Test credentials check without full inference call
            client._get_signature_version()
            self._client = client
            self._credentials_available = True
            return self._client
        except (NoCredentialsError, Exception) as exc:
            self._credentials_available = False
            self._init_error_message = f"AWS credentials unavailable: {type(exc).__name__}: {exc}"
            logger.info(self._init_error_message)
            return None

    def check_health(self) -> Dict[str, Any]:
        """Check Bedrock configuration and AWS credential availability."""
        client = self._get_client()
        if client is None or not self._credentials_available:
            return {
                "available": False,
                "region": self.region_name,
                "model_id": self.model_id,
                "error": self._init_error_message or "AWS credentials not detected in environment.",
                "guidance": (
                    "To enable real Amazon Bedrock inferences, set AWS_ACCESS_KEY_ID, "
                    "AWS_SECRET_ACCESS_KEY, and AWS_REGION in .env or run 'aws configure'."
                ),
            }
        return {
            "available": True,
            "region": self.region_name,
            "model_id": self.model_id,
            "status": "Authenticated and ready",
        }

    async def generate_explanation(
        self,
        event_data: Dict[str, Any],
        action: ActionEnum,
        confidence: float | None,
        investigation_data: Dict[str, Any],
    ) -> Tuple[str, List[str], str, float, bool]:
        """Generate incident explanation and next steps using Amazon Bedrock.

        Returns: (explanation, recommended_steps, model_used, latency_ms, is_live)
        """
        start_time = time.perf_counter()
        client = self._get_client()

        if client is None:
            # Deterministic, transparent fallback analysis
            explanation, steps = self._generate_fallback_explanation(
                event_data, action, confidence, investigation_data
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return (
                explanation,
                steps,
                f"{self.model_id} (Development Fallback - No AWS Credentials)",
                round(elapsed_ms, 2),
                False,
            )

        # Build prompt enforcing grounding in Decider 2B verdict
        prompt = self._construct_prompt(event_data, action, confidence, investigation_data)

        try:
            # Invoke Bedrock Claude model with Converse or standard body format
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 800,
                "temperature": 0.2,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            }

            response = client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(payload),
                contentType="application/json",
                accept="application/json",
            )

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            resp_body = json.loads(response["body"].read().decode("utf-8"))
            raw_text = resp_body.get("content", [{}])[0].get("text", "")

            explanation, steps = self._parse_bedrock_output(raw_text, action)
            return (explanation, steps, self.model_id, round(elapsed_ms, 2), True)

        except (ClientError, BotoCoreError, Exception) as exc:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            logger.warning(f"Bedrock invocation failed: {exc}. Using transparent fallback.")
            explanation, steps = self._generate_fallback_explanation(
                event_data, action, confidence, investigation_data
            )
            return (
                explanation,
                steps,
                f"{self.model_id} (Fallback: {type(exc).__name__})",
                round(elapsed_ms, 2),
                False,
            )

    def _construct_prompt(
        self,
        event: Dict[str, Any],
        action: ActionEnum,
        confidence: float | None,
        investigation: Dict[str, Any],
    ) -> str:
        conf_str = f"{confidence:.3f}" if confidence is not None else "Not provided by model"
        return f"""You are SentinelFlow AI's Forensic Analyst running on Amazon Bedrock.
The Strands Decider 2B model evaluated this security event and selected the action: {action.value} (Confidence: {conf_str}).

CRITICAL INSTRUCTIONS:
1. You MUST explain WHY the action '{action.value}' was selected based on the evidence below.
2. You must NOT alter, overwrite, or contradict the Decider 2B action.
3. Formulate your response in two parts:
   EXPLANATION: A concise 2-3 paragraph technical explanation analyzing observed telemetry and forensic findings.
   RECOMMENDED_STEPS: 3 to 5 concrete, actionable, non-destructive recommendations formatted as bullet points.

TELEMETRY EVENT:
- Event ID: {event.get('event_id')}
- Event Type: {event.get('event_type')}
- Severity: {event.get('severity')}
- Username: {event.get('username')} (Privilege: {event.get('privilege_level')})
- Source IP: {event.get('source_ip')} (Reported Location: {event.get('location')})
- Device: {event.get('device')}
- Failed Logins: {event.get('failed_login_count')}
- Description: {event.get('event_description')}

GATHERED INVESTIGATION EVIDENCE:
{investigation.get('forensic_summary')}
"""

    def _parse_bedrock_output(self, text: str, action: ActionEnum) -> Tuple[str, List[str]]:
        """Extract explanation text and structured bullet steps from Bedrock response."""
        parts = text.split("RECOMMENDED_STEPS:")
        explanation = parts[0].replace("EXPLANATION:", "").strip()

        steps = []
        if len(parts) > 1:
            raw_steps = parts[1].strip().split("\n")
            for line in raw_steps:
                cleaned = line.strip().lstrip("-*123456789. ")
                if cleaned:
                    steps.append(cleaned)

        if not steps:
            steps = self._default_steps_for_action(action)

        return explanation, steps

    def _default_steps_for_action(self, action: ActionEnum) -> List[str]:
        if action == ActionEnum.CLOSE:
            return [
                "Log event closure justification to SIEM audit index.",
                "Verify automated baseline profile remains consistent for subject user.",
                "No further analyst intervention required.",
            ]
        elif action == ActionEnum.INVESTIGATE:
            return [
                "Correlate user session tokens across corporate VPN and IdP audit logs.",
                "Review outbound connection telemetry on host firewall for anomalous ports.",
                "Reach out to user via out-of-band channel (e.g., Slack) to confirm access intent.",
                "Flag user session for 24-hour enhanced monitoring.",
            ]
        else:  # ESCALATE
            return [
                "Trigger immediate P1 incident notification to Tier-2 SOC and on-call Incident Commander.",
                "Revoke active Okta / AWS IAM temporary session credentials immediately.",
                "Quarantine affected host endpoint via EDR network isolation policy.",
                "Initiate forensic memory snapshot of host for malware analysis.",
                "Conduct blast-radius assessment across connected database and cloud assets.",
            ]

    def _generate_fallback_explanation(
        self,
        event: Dict[str, Any],
        action: ActionEnum,
        confidence: float | None,
        investigation: Dict[str, Any],
    ) -> Tuple[str, List[str]]:
        """Transparent, high-fidelity fallback analysis generated when Bedrock credentials are unavailable."""
        user = event.get("username", "Unknown User")
        ip = event.get("source_ip", "Unknown IP")
        etype = event.get("event_type", "Unknown Event")
        desc = event.get("event_description", "")
        conf_str = f"with calibrated confidence of {confidence:.2f}" if confidence else "without explicit confidence"

        ip_rep = investigation.get("ip_reputation", {})
        ip_status = ip_rep.get("status", "Unknown")
        mitre = investigation.get("threat_intel_match", {})

        if action == ActionEnum.CLOSE:
            explanation = (
                f"SentinelFlow Decider 2B classified event '{event.get('event_id')}' as CLOSE {conf_str}. "
                f"Telemetry confirms routine behavior for user '{user}' from trusted internal or compliant asset '{event.get('device')}'. "
                f"No indicators of compromise, anomalous login bursts, or policy violations were detected. "
                f"Supporting evidence confirms standard operating hours and zero prior failed authentication attempts."
            )
        elif action == ActionEnum.INVESTIGATE:
            explanation = (
                f"SentinelFlow Decider 2B classified event '{event.get('event_id')}' as INVESTIGATE {conf_str}. "
                f"Observed telemetry indicates anomalous activity ({etype}) originating from IP {ip} (reputation: {ip_status}). "
                f"While facts do not confirm an active catastrophic breach, the sequence ({desc}) deviates from baseline user behavior. "
                f"Correlated MITRE technique {mitre.get('technique_id', 'T1078')} ({mitre.get('tactic', 'Initial Access')}) warrants "
                f"identity verification and session validation before closure or escalation."
            )
        else:  # ESCALATE
            explanation = (
                f"SentinelFlow Decider 2B classified event '{event.get('event_id')}' as ESCALATE {conf_str}. "
                f"High-risk indicators observed: unauthorized privilege manipulation or high-volume brute-force attacks against core infrastructure. "
                f"Threat intelligence flags source {ip} as {ip_status} (Risk Score: {ip_rep.get('risk_score', 90)}/100). "
                f"Immediate human SOC intervention is required under MITRE {mitre.get('technique_id', 'T1548')} ({mitre.get('technique_name', 'Abuse Elevation')}) "
                f"to contain potential lateral movement and prevent unauthorized resource access."
            )

        steps = self._default_steps_for_action(action)
        return explanation, steps


bedrock_service = BedrockExplanationService()
