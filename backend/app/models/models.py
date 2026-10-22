"""SQLAlchemy database models for SentinelFlow AI.
Stores normalized security events, Decider 2B audit logs, Bedrock explanations, and investigation results.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SecurityEventModel(Base):
    """Normalized security event representation."""

    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(64), index=True, nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    timestamp = Column(String(64), nullable=False)
    event_type = Column(String(128), index=True, nullable=False)
    severity = Column(String(32), index=True, nullable=False, default="MEDIUM")

    # Facts observed from event
    username = Column(String(128), index=True, nullable=True)
    source_ip = Column(String(64), index=True, nullable=True)
    device = Column(String(128), nullable=True)
    location = Column(String(128), nullable=True)
    failed_login_count = Column(Integer, default=0, nullable=False)
    privilege_level = Column(String(64), default="Standard", nullable=False)
    event_description = Column(Text, nullable=False)

    # Full raw payload and normalized prompt representation
    raw_payload = Column(JSON, nullable=False)
    normalized_state = Column(Text, nullable=False)

    # Lifecycle status: PENDING_REVIEW, RESOLVED, APPROVED, OVERRIDDEN
    status = Column(String(32), index=True, default="PROCESSED", nullable=False)

    # Relationships
    decision = relationship(
        "DecisionAuditModel",
        back_populates="event",
        uselist=False,
        cascade="all, delete-orphan",
    )
    investigation = relationship(
        "InvestigationModel",
        back_populates="event",
        uselist=False,
        cascade="all, delete-orphan",
    )


class DecisionAuditModel(Base):
    """Audit record capturing the Strands Decider 2B inference and Bedrock analysis."""

    __tablename__ = "decision_audits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("security_events.id"), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Decider 2B Outputs
    action = Column(String(32), index=True, nullable=False)  # CLOSE, INVESTIGATE, ESCALATE
    confidence = Column(Float, nullable=True)  # Calibrated confidence from model (0.0 to 1.0)
    distribution = Column(JSON, nullable=True)  # Probability per action choice
    latency_ms = Column(Float, nullable=False)  # Model forward-pass latency
    model_name = Column(String(128), nullable=False)
    model_type = Column(String(64), nullable=False)  # 'strands-decider-2b' or 'development-fallback'

    # Fallback and Review Routing
    is_fallback = Column(Boolean, default=False, nullable=False)
    fallback_reason = Column(String(256), nullable=True)
    routed_to_human_review = Column(Boolean, default=False, index=True, nullable=False)
    review_reason = Column(String(256), nullable=True)

    # Human Review Outcomes
    human_verdict = Column(String(32), nullable=True)  # APPROVED or OVERRIDDEN
    human_reviewer = Column(String(128), nullable=True)
    human_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Generative Incident Analysis (Amazon Bedrock)
    explanation = Column(Text, nullable=True)
    recommended_steps = Column(JSON, default=list, nullable=False)
    bedrock_model_used = Column(String(128), nullable=True)
    bedrock_latency_ms = Column(Float, nullable=True)

    event = relationship("SecurityEventModel", back_populates="decision")


class InvestigationModel(Base):
    """Enrichment and synthetic SIEM / Threat Intel correlation data."""

    __tablename__ = "investigation_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("security_events.id"), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    tools_invoked = Column(JSON, default=list, nullable=False)
    ip_reputation = Column(JSON, nullable=True)
    user_profile = Column(JSON, nullable=True)
    device_posture = Column(JSON, nullable=True)
    threat_intel_match = Column(JSON, nullable=True)
    forensic_summary = Column(Text, nullable=False)

    event = relationship("SecurityEventModel", back_populates="investigation")
