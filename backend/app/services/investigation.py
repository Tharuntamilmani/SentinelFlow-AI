"""Read-only synthetic investigation tools for SentinelFlow AI.
Enriches security events with forensic evidence without executing any destructive actions.
"""

from __future__ import annotations

from typing import Any, Dict, List
from backend.app.models.schemas import ActionEnum


def lookup_ip_reputation(ip: str | None) -> Dict[str, Any]:
    """Synthetic Threat Intelligence lookup for IP address."""
    if not ip or ip in ["UNKNOWN_IP", "None"]:
        return {
            "queried_ip": ip,
            "status": "UNRESOLVED",
            "risk_score": 0,
            "category": "Unknown",
            "is_vpn_tor": False,
        }

    # Deterministic synthetic IP threat heuristics
    if ip.startswith("185.220.") or ip.startswith("45.33."):
        return {
            "queried_ip": ip,
            "status": "MALICIOUS",
            "risk_score": 92,
            "asn": "AS9009 (Anonymous Relay Networks)",
            "country": "Seychelles",
            "category": "Tor Exit Node / Anonymizer",
            "is_vpn_tor": True,
            "reported_abuse_count_30d": 142,
        }
    elif ip.startswith("203.0.113."):
        return {
            "queried_ip": ip,
            "status": "SUSPICIOUS",
            "risk_score": 68,
            "asn": "AS64512 (Offshore Cloud Hosting)",
            "country": "Panama",
            "category": "Unregistered VPS / Bulletproof Hosting",
            "is_vpn_tor": False,
            "reported_abuse_count_30d": 19,
        }
    elif ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172.16."):
        return {
            "queried_ip": ip,
            "status": "BENIGN_INTERNAL",
            "risk_score": 5,
            "asn": "Private Corporate Subnet",
            "country": "Internal Network",
            "category": "Trusted RFC1918 Address",
            "is_vpn_tor": False,
            "reported_abuse_count_30d": 0,
        }
    else:
        return {
            "queried_ip": ip,
            "status": "NEUTRAL",
            "risk_score": 25,
            "asn": "AS15169 (Public ISP)",
            "country": "United States",
            "category": "Standard Residential / Commercial IP",
            "is_vpn_tor": False,
            "reported_abuse_count_30d": 1,
        }


def lookup_user_profile(username: str | None) -> Dict[str, Any]:
    """Synthetic Identity Directory (IAM / Okta) lookup."""
    if not username or username in ["UNKNOWN_USER", "None"]:
        return {
            "username": username,
            "status": "UNKNOWN",
            "department": "Unknown",
            "mfa_active": False,
            "role": "Unknown",
        }

    if "admin" in username.lower() or "svc" in username.lower():
        return {
            "username": username,
            "status": "ACTIVE_SERVICE_ACCOUNT",
            "department": "Cloud Infrastructure & DevOps",
            "mfa_active": False,
            "role": "Privileged Service Principal",
            "typical_activity_window": "24/7 Automated cron",
            "critical_asset_access": True,
        }
    elif "alice" in username.lower():
        return {
            "username": username,
            "status": "ACTIVE_EMPLOYEE",
            "department": "Engineering - Frontend",
            "mfa_active": True,
            "role": "Standard Engineer",
            "typical_activity_window": "09:00 - 18:00 CET",
            "critical_asset_access": False,
        }
    else:
        return {
            "username": username,
            "status": "ACTIVE_EMPLOYEE",
            "department": "Operations",
            "mfa_active": True,
            "role": "General Staff",
            "typical_activity_window": "08:00 - 17:00 EST",
            "critical_asset_access": False,
        }


def lookup_device_posture(device: str | None) -> Dict[str, Any]:
    """Synthetic Endpoint Detection and Response (EDR) posture lookup."""
    if not device or device in ["UNKNOWN_DEVICE", "None"]:
        return {
            "device": device,
            "managed": False,
            "edr_running": False,
            "compliance": "NON_COMPLIANT",
        }

    if "CORP" in device:
        return {
            "device": device,
            "managed": True,
            "edr_agent": "Active (CrowdStrike Falcon v7.14)",
            "os": "macOS 15.1 Sequoia",
            "disk_encryption": "FileVault Enabled",
            "compliance": "COMPLIANT",
        }
    elif "PROD" in device:
        return {
            "device": device,
            "managed": True,
            "edr_agent": "Active (AWS GuardDuty & SSM Agent)",
            "os": "Amazon Linux 2023",
            "disk_encryption": "EBS Volume KMS Encrypted",
            "compliance": "COMPLIANT",
        }
    else:
        return {
            "device": device,
            "managed": False,
            "edr_agent": "Not Installed",
            "os": "Unknown Linux/Unix",
            "disk_encryption": "Unverified",
            "compliance": "UNKNOWN_HOST",
        }


def correlate_threat_intel(event_type: str, facts: Dict[str, Any]) -> Dict[str, Any]:
    """Maps security event facts to MITRE ATT&CK techniques."""
    etype = event_type.lower()
    desc = facts.get("event_description", "").lower()

    if "privilege" in etype or "privilege" in desc or "sudo" in desc:
        return {
            "framework": "MITRE ATT&CK",
            "tactic": "Privilege Escalation (TA0004)",
            "technique_id": "T1548",
            "technique_name": "Abuse Elevation Control Mechanism",
            "severity_assessment": "HIGH",
        }
    elif "brute" in etype or "brute" in desc or facts.get("failed_login_count", 0) > 10:
        return {
            "framework": "MITRE ATT&CK",
            "tactic": "Credential Access (TA0006)",
            "technique_id": "T1110.001",
            "technique_name": "Brute Force: Password Guessing",
            "severity_assessment": "HIGH",
        }
    elif "outbound" in desc or "exfiltration" in desc or "transfer" in desc:
        return {
            "framework": "MITRE ATT&CK",
            "tactic": "Exfiltration (TA0010)",
            "technique_id": "T1048.003",
            "technique_name": "Exfiltration Over Alternative Protocol - Unencrypted/SFTP",
            "severity_assessment": "MEDIUM",
        }
    elif "login" in etype or "auth" in etype:
        return {
            "framework": "MITRE ATT&CK",
            "tactic": "Initial Access (TA0001)",
            "technique_id": "T1078.004",
            "technique_name": "Valid Accounts: Cloud Accounts",
            "severity_assessment": "LOW",
        }
    else:
        return {
            "framework": "MITRE ATT&CK",
            "tactic": "Discovery (TA0007)",
            "technique_id": "T1082",
            "technique_name": "System Information Discovery",
            "severity_assessment": "LOW",
        }


def run_investigation(event_data: Dict[str, Any], action: ActionEnum) -> Dict[str, Any]:
    """Execute non-destructive read-only forensic investigation tools."""
    ip = event_data.get("source_ip")
    user = event_data.get("username")
    device = event_data.get("device")
    event_type = event_data.get("event_type", "unknown")

    tools_invoked = [
        "threat_intel_ip_lookup",
        "iam_directory_user_profile",
        "edr_device_posture_check",
        "mitre_attack_correlation",
    ]

    ip_info = lookup_ip_reputation(ip)
    user_info = lookup_user_profile(user)
    device_info = lookup_device_posture(device)
    threat_intel = correlate_threat_intel(event_type, event_data)

    # Forensic summary synthesis
    lines = [
        f"Investigation initiated for action '{action.value}' on event '{event_data.get('event_id')}':",
        f"- IP Threat Assessment: {ip_info['status']} (Risk Score: {ip_info['risk_score']}/100, ASN: {ip_info.get('asn', 'N/A')})",
        f"- Identity Context: {user_info['status']} for user '{user}' (MFA: {user_info.get('mfa_active', 'Unknown')})",
        f"- Endpoint Posture: {device_info.get('compliance', 'Unknown')} on {device_info.get('device', 'Unknown')}",
        f"- MITRE ATT&CK Mapping: {threat_intel['technique_id']} - {threat_intel['technique_name']} ({threat_intel['tactic']})",
    ]

    return {
        "tools_invoked": tools_invoked,
        "ip_reputation": ip_info,
        "user_profile": user_info,
        "device_posture": device_info,
        "threat_intel_match": threat_intel,
        "forensic_summary": "\n".join(lines),
    }
