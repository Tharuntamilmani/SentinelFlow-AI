"""Pydantic schemas for data validation, API requests, and structured responses.
Follows Strands Decider 2B and Amazon Bedrock specifications.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ActionEnum(str, Enum):
    CLOSE = "CLOSE"
    INVESTIGATE = "INVESTIGATE"
    ESCALATE = "ESCALATE"


class SeverityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class EventStatusEnum(str, Enum):
    PROCESSED = "PROCESSED"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    OVERRIDDEN = "OVERRIDDEN"


class SecurityEventInput(BaseModel):
    """Input payload accepted for security event ingestion."""

    event_id: Optional[str] = Field(
        default=None,
        description="Optional unique identifier for the event. Auto-generated if omitted.",
        examples=["SEC-2026-1001"],
    )
    timestamp: Optional[str] = Field(
        default=None,
        description="ISO timestamp or event timestamp string. Auto-populated if omitted.",
    )
    event_type: str = Field(
        ...,
        description="Type category of the security event",
        examples=["auth.login.anomalous_sequence", "system.privilege.elevation"],
    )
    severity: Optional[SeverityEnum] = Field(
        default=SeverityEnum.MEDIUM,
        description="Initial severity classification",
    )
    username: Optional[str] = Field(
        default=None,
        description="Subject username or account identifier",
        examples=["alice.smith", "admin_svc"],
    )
    source_ip: Optional[str] = Field(
        default=None,
        description="Originating IPv4 or IPv6 address",
        examples=["185.220.101.5", "10.0.4.15"],
    )
    device: Optional[str] = Field(
        default=None,
        description="Hostname or device identifier",
        examples=["DESKTOP-CORP-902", "SERVER-PROD-01"],
    )
    location: Optional[str] = Field(
        default=None,
        description="Geographic location or data center",
        examples=["Frankfurt, Germany", "Unknown"],
    )
    failed_login_count: int = Field(
        default=0,
        ge=0,
        description="Number of failed attempts prior to or during the event",
    )
    privilege_level: str = Field(
        default="Standard",
        description="Current user privilege level",
        examples=["Standard", "Administrator", "Root", "ServiceAccount"],
    )
    event_description: str = Field(
        ...,
        description="Observed facts and factual security log description",
        examples=["Multiple failed SSH logins followed by successful key auth from unknown IP."],
    )
    raw_metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional contextual key-value signals from telemetry",
    )


class NormalizedEventState(BaseModel):
    """Normalized state representation formatted for Strands Decider 2B."""

    event_id: str
    state_string: str
    observed_facts: Dict[str, Any]
    has_insufficient_info: bool


class DecisionAuditRead(BaseModel):
    """Decision output and audit log details."""

    id: str
    action: ActionEnum
    confidence: Optional[float] = None
    distribution: Optional[Dict[str, float]] = None
    latency_ms: float
    model_name: str
    model_type: str
    is_fallback: bool
    fallback_reason: Optional[str] = None
    routed_to_human_review: bool
    review_reason: Optional[str] = None
    human_verdict: Optional[str] = None
    human_reviewer: Optional[str] = None
    human_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    explanation: Optional[str] = None
    recommended_steps: List[str] = Field(default_factory=list)
    bedrock_model_used: Optional[str] = None
    bedrock_latency_ms: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvestigationRead(BaseModel):
    """Investigation enrichment details."""

    id: str
    tools_invoked: List[str]
    ip_reputation: Optional[Dict[str, Any]] = None
    user_profile: Optional[Dict[str, Any]] = None
    device_posture: Optional[Dict[str, Any]] = None
    threat_intel_match: Optional[Dict[str, Any]] = None
    forensic_summary: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SecurityEventDetail(BaseModel):
    """Complete security event record with associated decision audit and investigation."""

    id: str
    event_id: str
    timestamp: str
    event_type: str
    severity: str
    username: Optional[str] = None
    source_ip: Optional[str] = None
    device: Optional[str] = None
    location: Optional[str] = None
    failed_login_count: int
    privilege_level: str
    event_description: str
    raw_payload: Dict[str, Any]
    normalized_state: str
    status: EventStatusEnum
    created_at: datetime
    decision: Optional[DecisionAuditRead] = None
    investigation: Optional[InvestigationRead] = None

    model_config = ConfigDict(from_attributes=True)


class SecurityEventSummary(BaseModel):
    """Concise item for list views and tables."""

    id: str
    event_id: str
    timestamp: str
    event_type: str
    severity: str
    username: Optional[str] = None
    source_ip: Optional[str] = None
    action: Optional[ActionEnum] = None
    confidence: Optional[float] = None
    latency_ms: Optional[float] = None
    model_type: Optional[str] = None
    status: EventStatusEnum
    created_at: datetime


class HumanReviewSubmission(BaseModel):
    """Request payload for an analyst reviewing a pending or flagged event."""

    verdict: str = Field(..., description="'APPROVED' to endorse, or 'OVERRIDDEN' to modify action")
    new_action: Optional[ActionEnum] = Field(
        default=None,
        description="Required if verdict is 'OVERRIDDEN' (CLOSE, INVESTIGATE, or ESCALATE)",
    )
    reviewer: str = Field(
        default="SecOps Analyst",
        description="Analyst identity or handle submitting the review",
    )
    notes: str = Field(
        ...,
        description="Justification and notes for the review audit trail",
    )


class StatsResponse(BaseModel):
    """Aggregated dashboard metrics."""

    total_events: int
    close_count: int
    investigate_count: int
    escalate_count: int
    pending_reviews: int
    approved_reviews: int
    overridden_reviews: int
    avg_decision_latency_ms: float
    avg_confidence: Optional[float] = None
    model_status: str
    bedrock_status: str
    severity_breakdown: Dict[str, int]


class EvaluationMetrics(BaseModel):
    """Performance metrics comparing Strands Decider 2B vs Baseline."""

    model_name: str
    baseline_name: str
    sample_size: int
    accuracy: float
    baseline_accuracy: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    avg_latency_ms: float
    baseline_avg_latency_ms: float
    human_review_rate: float
    invalid_output_rate: float
    confusion_matrix: Dict[str, Dict[str, int]]
    sample_cases: List[Dict[str, Any]]
