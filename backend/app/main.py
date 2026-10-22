"""Main FastAPI application entrypoint for SentinelFlow AI.
Configures CORS, lifespan events, database table initialization, and API routes.
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
import sys
from pathlib import Path

# Ensure project root is in sys.path
_current_file = Path(__file__).resolve()
_project_root = _current_file.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from backend.app.api.endpoints import router as api_router
from backend.app.core.config import settings
from backend.app.core.database import AsyncSessionLocal, init_db
from backend.app.decision.engine import PolicyClassificationDecider
from backend.app.models.models import (
    DecisionAuditModel,
    InvestigationModel,
    SecurityEventModel,
)
from backend.app.models.schemas import EventStatusEnum, SeverityEnum
from backend.app.services.investigation import run_investigation

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sentinelflow.main")


async def seed_initial_synthetic_events():
    """Seed the database with benchmark synthetic events A-F if database is empty."""
    async with AsyncSessionLocal() as db:
        count_res = await db.execute(select(func.count(SecurityEventModel.id)))
        count = count_res.scalar_one() or 0
        if count > 0:
            logger.info(f"Database already contains {count} events. Skipping seed.")
            return

        json_path = os.path.join("backend", "data", "synthetic_events.json")
        if not os.path.exists(json_path):
            logger.warning(f"Synthetic events file not found at {json_path}")
            return

        with open(json_path, "r", encoding="utf-8") as f:
            events = json.load(f)

        decider = PolicyClassificationDecider()
        logger.info(f"Seeding {len(events)} synthetic events into database...")

        for evt in events:
            # Execute decision engine and investigation for each seed event
            decision_res, normalized = await decider.decide(evt)
            inv_res = run_investigation(evt, decision_res.action)

            initial_status = (
                EventStatusEnum.PENDING_REVIEW.value
                if decision_res.routed_to_human_review
                else EventStatusEnum.PROCESSED.value
            )

            event_model = SecurityEventModel(
                event_id=evt["event_id"],
                timestamp=evt.get("timestamp", "2026-10-22T08:30:00Z"),
                event_type=evt["event_type"],
                severity=evt.get("severity", SeverityEnum.MEDIUM).upper(),
                username=evt.get("username"),
                source_ip=evt.get("source_ip"),
                device=evt.get("device"),
                location=evt.get("location"),
                failed_login_count=evt.get("failed_login_count", 0),
                privilege_level=evt.get("privilege_level", "Standard"),
                event_description=evt["event_description"],
                raw_payload=evt,
                normalized_state=normalized.state_string,
                status=initial_status,
            )
            db.add(event_model)
            await db.flush()

            audit_model = DecisionAuditModel(
                event_id=event_model.id,
                action=decision_res.action.value,
                confidence=decision_res.confidence,
                distribution=decision_res.distribution,
                latency_ms=decision_res.latency_ms,
                model_name=decision_res.model_name,
                model_type=decision_res.model_type,
                is_fallback=decision_res.is_fallback,
                fallback_reason=decision_res.fallback_reason,
                routed_to_human_review=decision_res.routed_to_human_review,
                review_reason=decision_res.review_reason,
                explanation=(
                    f"SentinelFlow Decider 2B classified this event as {decision_res.action.value} "
                    f"with confidence {decision_res.confidence:.2f}. "
                    f"Evidence aligns with policy criteria for {decision_res.action.value}."
                ),
                recommended_steps=[
                    "Validate telemetry integrity in SIEM stream.",
                    f"Follow standard operating procedure for {decision_res.action.value}.",
                    "Preserve immutable audit log for compliance review.",
                ],
                bedrock_model_used="anthropic.claude-3-5-sonnet-20241022-v2:0 (Synthetic Seed)",
                bedrock_latency_ms=1240.0,
            )
            db.add(audit_model)

            inv_model = InvestigationModel(
                event_id=event_model.id,
                tools_invoked=inv_res["tools_invoked"],
                ip_reputation=inv_res["ip_reputation"],
                user_profile=inv_res["user_profile"],
                device_posture=inv_res["device_posture"],
                threat_intel_match=inv_res["threat_intel_match"],
                forensic_summary=inv_res["forensic_summary"],
            )
            db.add(inv_model)

        await db.commit()
        logger.info("Synthetic events successfully seeded.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager: initialize DB tables and seed benchmark events."""
    logger.info("Initializing SentinelFlow AI database tables...")
    await init_db()
    await seed_initial_synthetic_events()
    yield
    logger.info("SentinelFlow AI backend shutdown cleanly.")


app = FastAPI(
    title="SentinelFlow AI — Autonomous Security Decision Agent",
    description=(
        "Production-grade Security Triage Agent powered by Strands Decider 2B and Amazon Bedrock. "
        "Implements the Policy Classification Decision Pattern to categorize events into "
        "CLOSE, INVESTIGATE, or ESCALATE with calibrated confidence and human review routing."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core API endpoints
app.include_router(api_router)


@app.get("/", summary="Root Health Ping")
async def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": "/api/health",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "path": request.url.path,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
