"""Integration tests for SentinelFlow AI FastAPI endpoints.
Tests complete request-response workflows, database persistence, and human review actions.
"""

import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from backend.app.core.database import Base, engine
from backend.app.main import app


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "components" in data
        assert "strands_decider_2b" in data["components"]
        assert "amazon_bedrock" in data["components"]


@pytest.mark.asyncio
async def test_create_and_get_event():
    test_id = f"SEC-TEST-{uuid.uuid4().hex[:6].upper()}"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "event_id": test_id,
            "event_type": "auth.login.standard",
            "severity": "LOW",
            "username": "diana.prince",
            "source_ip": "10.0.1.50",
            "device": "CORP-MAC-99",
            "location": "Boston, US",
            "failed_login_count": 0,
            "privilege_level": "Standard",
            "event_description": "Routine login from known corporate device during work hours.",
        }

        # 1. POST /api/events
        post_resp = await client.post("/api/events", json=payload)
        assert post_resp.status_code == 201
        created = post_resp.json()
        assert created["event_id"] == test_id
        assert "decision" in created
        assert created["decision"]["action"] in ["CLOSE", "INVESTIGATE", "ESCALATE"]
        assert "investigation" in created
        assert "explanation" in created["decision"]
        assert len(created["decision"]["recommended_steps"]) > 0

        # 2. GET /api/events/{event_id}
        get_resp = await client.get(f"/api/events/{test_id}")
        assert get_resp.status_code == 200
        retrieved = get_resp.json()
        assert retrieved["id"] == created["id"]
        assert retrieved["decision"]["action"] == created["decision"]["action"]


@pytest.mark.asyncio
async def test_list_events():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/events?limit=10")
        assert resp.status_code == 200
        events = resp.json()
        assert isinstance(events, list)


@pytest.mark.asyncio
async def test_human_review_workflow():
    test_id = f"SEC-REV-{uuid.uuid4().hex[:6].upper()}"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create an event that gets triaged
        payload = {
            "event_id": test_id,
            "event_type": "network.anomaly",
            "severity": "MEDIUM",
            "username": "test.analyst",
            "source_ip": "198.51.100.22",
            "device": "SERVER-01",
            "location": "Dallas, US",
            "failed_login_count": 2,
            "privilege_level": "Standard",
            "event_description": "Unusual outbound data transfer under investigation.",
        }
        await client.post("/api/events", json=payload)

        # Review: OVERRIDE action to ESCALATE
        review_payload = {
            "verdict": "OVERRIDDEN",
            "new_action": "ESCALATE",
            "reviewer": "Senior SOC Analyst John",
            "notes": "Verified malicious destination IP in external feed. Overriding to ESCALATE.",
        }
        rev_resp = await client.post(f"/api/events/{test_id}/review", json=review_payload)
        assert rev_resp.status_code == 200
        updated = rev_resp.json()
        assert updated["status"] == "OVERRIDDEN"
        assert updated["decision"]["action"] == "ESCALATE"
        assert updated["decision"]["human_reviewer"] == "Senior SOC Analyst John"
        assert updated["decision"]["human_verdict"] == "OVERRIDDEN"


@pytest.mark.asyncio
async def test_stats_and_evaluation_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Stats
        stats_resp = await client.get("/api/stats")
        assert stats_resp.status_code == 200
        stats = stats_resp.json()
        assert "total_events" in stats
        assert "close_count" in stats
        assert "investigate_count" in stats
        assert "escalate_count" in stats

        # Evaluation
        eval_resp = await client.get("/api/evaluation")
        assert eval_resp.status_code == 200
        ev = eval_resp.json()
        assert "accuracy" in ev
        assert "confusion_matrix" in ev
        assert "baseline_accuracy" in ev
