"""Security Triage Policy Definition for Strands Decider 2B.
Defines the reusable policy classification schema, criteria descriptions, and state normalization.
"""

from __future__ import annotations

from typing import Any, Dict
from backend.app.models.schemas import ActionEnum, NormalizedEventState


# The standardized Policy Classification Schema for Strands Decider 2B
POLICY_QUESTION_NAME = "security_triage_action"
POLICY_INSTRUCTIONS = (
    "Evaluate the observed security telemetry facts against organization policy "
    "and select the required operational response action."
)

POLICY_CRITERIA = {
    ActionEnum.CLOSE.value: (
        "Low-risk or routine benign event with sufficient supporting facts. Expected normal "
        "user or system activity with zero indicators of malicious intent or policy violation."
    ),
    ActionEnum.INVESTIGATE.value: (
        "Suspicious anomaly or ambiguous event requiring additional evidence gathering, "
        "reputation lookup, user verification, or lateral movement correlation before resolution."
    ),
    ActionEnum.ESCALATE.value: (
        "High-risk security incident requiring immediate human SOC review. Active compromise, "
        "unauthorized privilege escalation, brute-force attack in progress, or unauthorized data exfiltration."
    ),
}


def normalize_event_state(data: Dict[str, Any]) -> NormalizedEventState:
    """Normalize raw event fields into a structured state string for Strands Decider 2B.

    Distinguishes observed facts from inferences. Flags missing or insufficient info.
    """
    event_id = str(data.get("event_id") or "EVT-UNKNOWN")
    event_type = str(data.get("event_type") or "unknown.event")
    severity = str(data.get("severity") or "MEDIUM").upper()
    username = data.get("username") or "UNKNOWN_USER"
    source_ip = data.get("source_ip") or "UNKNOWN_IP"
    device = data.get("device") or "UNKNOWN_DEVICE"
    location = data.get("location") or "UNKNOWN_LOCATION"
    failed_logins = int(data.get("failed_login_count") or 0)
    privilege = str(data.get("privilege_level") or "Standard")
    description = str(data.get("event_description") or "").strip()

    # Check for insufficient information
    is_missing_ip = source_ip in ["UNKNOWN_IP", "None", "", None]
    is_missing_user = username in ["UNKNOWN_USER", "None", "", None]
    is_missing_desc = len(description) < 15 or "insufficient" in description.lower() or "truncated" in description.lower()
    has_insufficient_info = (is_missing_ip and is_missing_user) or is_missing_desc

    # Structured state string formatted for optimal Decider 2B forward pass
    state_lines = [
        f"SECURITY_EVENT: {event_type} [Severity: {severity}]",
        f"OBSERVED_FACTS:",
        f"- Subject User: {username} (Privilege: {privilege})",
        f"- Originating IP: {source_ip} (Reported Location: {location})",
        f"- Endpoint Device: {device}",
        f"- Prior Failed Logins Recorded: {failed_logins}",
        f"- Telemetry Description: {description}",
    ]

    raw_meta = data.get("raw_metadata") or {}
    if raw_meta:
        meta_items = [f"{k}={v}" for k, v in raw_meta.items() if v is not None]
        if meta_items:
            state_lines.append(f"- Context Metadata: {', '.join(meta_items)}")

    if has_insufficient_info:
        state_lines.append("- Telemetry Flag: [WARNING: INCOMPLETE_DATASET_OBSERVED]")

    state_string = "\n".join(state_lines)

    observed_facts = {
        "event_type": event_type,
        "severity": severity,
        "username": username,
        "source_ip": source_ip,
        "device": device,
        "location": location,
        "failed_logins": failed_logins,
        "privilege": privilege,
        "has_insufficient_info": has_insufficient_info,
    }

    return NormalizedEventState(
        event_id=event_id,
        state_string=state_string,
        observed_facts=observed_facts,
        has_insufficient_info=has_insufficient_info,
    )
