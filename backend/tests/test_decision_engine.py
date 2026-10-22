"""Unit tests for the PolicyClassificationDecider decision engine.
Validates model responses, calibrated confidence extraction, fallback logic, and human review routing.
"""

import pytest
from unittest.mock import AsyncMock, patch
import httpx

from backend.app.decision.engine import PolicyClassificationDecider
from backend.app.decision.policy import POLICY_QUESTION_NAME
from backend.app.models.schemas import ActionEnum


@pytest.fixture
def decider():
    return PolicyClassificationDecider(
        decider_url="http://127.0.0.1:8099",
        confidence_threshold=0.80,
    )


@pytest.mark.asyncio
async def test_decider_mock_close(decider):
    mock_response = {
        "model": "strands-decider-2B-qwen3.5-v1-2610",
        "answers": {
            POLICY_QUESTION_NAME: {
                "type": "choice",
                "choice": "CLOSE",
                "confidence": 0.952,
                "probabilities": {"CLOSE": 0.952, "INVESTIGATE": 0.038, "ESCALATE": 0.010},
            }
        },
        "latency_ms": 112.4,
    }

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = httpx.Response(200, json=mock_response)
        event_data = {
            "event_id": "SEC-01",
            "event_type": "auth.login.standard",
            "username": "alice",
            "source_ip": "10.0.0.1",
            "device": "CORP-MAC",
            "location": "HQ",
            "failed_login_count": 0,
            "privilege_level": "Standard",
            "event_description": "Routine login from corporate laptop.",
        }

        result, norm = await decider.decide(event_data)
        assert result.action == ActionEnum.CLOSE
        assert result.confidence == 0.952
        assert result.is_fallback is False
        assert result.model_type == "strands-decider-2b"
        assert result.routed_to_human_review is False


@pytest.mark.asyncio
async def test_decider_mock_investigate(decider):
    mock_response = {
        "model": "strands-decider-2B-qwen3.5-v1-2610",
        "answers": {
            POLICY_QUESTION_NAME: {
                "type": "choice",
                "choice": "INVESTIGATE",
                "confidence": 0.885,
                "probabilities": {"CLOSE": 0.045, "INVESTIGATE": 0.885, "ESCALATE": 0.070},
            }
        },
        "latency_ms": 118.0,
    }

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = httpx.Response(200, json=mock_response)
        event_data = {
            "event_id": "SEC-02",
            "event_type": "auth.login.anomalous_sequence",
            "username": "bob",
            "source_ip": "185.220.101.5",
            "device": "UNKNOWN",
            "location": "Tor Relay",
            "failed_login_count": 5,
            "privilege_level": "Standard",
            "event_description": "Failed logins followed by Tor IP success.",
        }

        result, norm = await decider.decide(event_data)
        assert result.action == ActionEnum.INVESTIGATE
        assert result.confidence == 0.885
        assert result.routed_to_human_review is False


@pytest.mark.asyncio
async def test_decider_mock_escalate(decider):
    mock_response = {
        "model": "strands-decider-2B-qwen3.5-v1-2610",
        "answers": {
            POLICY_QUESTION_NAME: {
                "type": "choice",
                "choice": "ESCALATE",
                "confidence": 0.941,
                "probabilities": {"CLOSE": 0.010, "INVESTIGATE": 0.049, "ESCALATE": 0.941},
            }
        },
        "latency_ms": 124.6,
    }

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = httpx.Response(200, json=mock_response)
        event_data = {
            "event_id": "SEC-03",
            "event_type": "system.privilege.elevation",
            "username": "svc_test",
            "source_ip": "10.0.4.15",
            "device": "SERVER-PROD",
            "location": "DC-1",
            "failed_login_count": 0,
            "privilege_level": "Administrator",
            "event_description": "Unauthorized domain admin token elevation.",
        }

        result, norm = await decider.decide(event_data)
        assert result.action == ActionEnum.ESCALATE
        assert result.confidence == 0.941
        assert result.routed_to_human_review is False


@pytest.mark.asyncio
async def test_decider_low_confidence_review_routing(decider):
    # Confidence 0.65 is below policy threshold 0.80
    mock_response = {
        "model": "strands-decider-2B-qwen3.5-v1-2610",
        "answers": {
            POLICY_QUESTION_NAME: {
                "type": "choice",
                "choice": "INVESTIGATE",
                "confidence": 0.650,
                "probabilities": {"CLOSE": 0.20, "INVESTIGATE": 0.650, "ESCALATE": 0.15},
            }
        },
        "latency_ms": 115.0,
    }

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = httpx.Response(200, json=mock_response)
        event_data = {
            "event_id": "SEC-04",
            "event_type": "network.anomaly",
            "username": "carol",
            "source_ip": "198.51.100.2",
            "device": "WORKSTATION",
            "location": "Remote",
            "failed_login_count": 1,
            "privilege_level": "Standard",
            "event_description": "Ambiguous connection sequence observed.",
        }

        result, norm = await decider.decide(event_data)
        assert result.action == ActionEnum.INVESTIGATE
        assert result.confidence == 0.650
        assert result.routed_to_human_review is True
        assert "below policy threshold" in result.review_reason


@pytest.mark.asyncio
async def test_decider_server_unavailable_fallback(decider):
    # Simulate network connection failure to decider server
    with patch("httpx.AsyncClient.post", side_effect=httpx.ConnectError("Connection refused")):
        event_data = {
            "event_id": "SEC-05",
            "event_type": "auth.login.standard",
            "username": "bob",
            "source_ip": "10.0.0.1",
            "device": "CORP-LAPTOP",
            "location": "HQ",
            "failed_login_count": 0,
            "privilege_level": "Standard",
            "event_description": "Routine login from known device.",
        }

        result, norm = await decider.decide(event_data)
        assert result.action == ActionEnum.CLOSE
        assert result.is_fallback is True
        assert result.model_type == "development-fallback"
        assert "unreachable" in result.fallback_reason
