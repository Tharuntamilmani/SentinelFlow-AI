"""Unit tests for security event validation and normalization.
Validates Pydantic schemas, normalization logic, and incomplete field handling.
"""

import pytest
from pydantic import ValidationError
from backend.app.decision.policy import normalize_event_state
from backend.app.models.schemas import ActionEnum, SecurityEventInput, SeverityEnum


def test_valid_security_event_input():
    payload = {
        "event_id": "SEC-TEST-001",
        "event_type": "auth.login.standard",
        "severity": "LOW",
        "username": "test.user",
        "source_ip": "10.0.0.5",
        "device": "CORP-LAPTOP",
        "location": "New York, US",
        "failed_login_count": 0,
        "privilege_level": "Standard",
        "event_description": "Normal workstation login during regular hours.",
    }
    event_in = SecurityEventInput(**payload)
    assert event_in.event_id == "SEC-TEST-001"
    assert event_in.severity == SeverityEnum.LOW
    assert event_in.failed_login_count == 0


def test_invalid_negative_failed_logins():
    payload = {
        "event_type": "auth.login.standard",
        "event_description": "Test description",
        "failed_login_count": -5,
    }
    with pytest.raises(ValidationError):
        SecurityEventInput(**payload)


def test_missing_required_description():
    payload = {
        "event_type": "auth.login.standard",
    }
    with pytest.raises(ValidationError):
        SecurityEventInput(**payload)


def test_event_normalization_complete():
    data = {
        "event_id": "SEC-NORM-01",
        "event_type": "auth.login.standard",
        "severity": "LOW",
        "username": "bob",
        "source_ip": "192.168.1.1",
        "device": "MAC-01",
        "location": "Office",
        "failed_login_count": 0,
        "privilege_level": "Standard",
        "event_description": "User logged in successfully.",
    }
    normalized = normalize_event_state(data)
    assert "User: bob" in normalized.state_string
    assert "IP: 192.168.1.1" in normalized.state_string
    assert normalized.has_insufficient_info is False
    assert normalized.observed_facts["failed_logins"] == 0


def test_event_normalization_insufficient_info():
    data = {
        "event_id": "SEC-INCOMPLETE-01",
        "event_type": "system.audit.incomplete",
        "severity": "LOW",
        "username": None,
        "source_ip": None,
        "device": None,
        "location": None,
        "failed_login_count": 0,
        "privilege_level": "Standard",
        "event_description": "truncated",
    }
    normalized = normalize_event_state(data)
    assert normalized.has_insufficient_info is True
    assert "WARNING: INCOMPLETE_DATASET_OBSERVED" in normalized.state_string
