from pathlib import Path

import pytest
from pydantic import ValidationError

from lab01.models import IncidentAssessment
from lab01.providers import RecordedAssessmentProvider


FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "recorded_assessments.json"
REPORT = "Checkout requests are timing out for EU customers; errors began after the 14:05 deployment."


def test_contract_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        IncidentAssessment(
            summary="Checkout is timing out",
            affected_service="checkout",
            severity="SEV2",
            customer_impact="EU customers cannot check out",
            evidence=["timeouts"],
            requires_human_review=True,
            secret_note="must not cross the boundary",
        )


def test_recorded_provider_returns_validated_assessment() -> None:
    result = RecordedAssessmentProvider(FIXTURE).assess(REPORT)
    assert result.severity == "SEV2"


def test_contract_rejects_invalid_severity() -> None:
    with pytest.raises(ValidationError):
        IncidentAssessment(
            summary="Checkout is timing out",
            affected_service="checkout",
            severity="CRITICAL-ish",
            customer_impact="EU customers cannot check out",
            evidence=["timeouts"],
            requires_human_review=True,
        )
