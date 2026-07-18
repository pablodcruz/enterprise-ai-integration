import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from lab01.models import IncidentAssessment
from lab01.providers import OpenAIAssessmentProvider, RecordedAssessmentProvider


FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "recorded_assessments.json"
REPORT = "Checkout requests are timing out for EU customers; errors began after the 14:05 deployment."


def test_contract_rejects_unknown_fields() -> None:
    payload = json.loads(FIXTURE.read_text(encoding="utf-8"))["cases"][0]["output"]
    payload["secret_note"] = "must not cross the boundary"
    with pytest.raises(ValidationError):
        IncidentAssessment.model_validate(payload)


def test_recorded_provider_returns_validated_assessment() -> None:
    result = RecordedAssessmentProvider(FIXTURE).assess(REPORT)
    assert result.severity == "SEV2"
    assert result.affected_service == "checkout"
    assert result.requires_human_review is True


def test_recorded_provider_fails_closed_for_unknown_input() -> None:
    with pytest.raises(LookupError, match="no recorded assessment"):
        RecordedAssessmentProvider(FIXTURE).assess("unrecorded report")


def test_live_provider_uses_schema_and_privacy_controls() -> None:
    parsed = RecordedAssessmentProvider(FIXTURE).assess(REPORT)

    class FakeResponses:
        def __init__(self) -> None:
            self.kwargs = {}

        def parse(self, **kwargs):
            self.kwargs = kwargs
            return SimpleNamespace(output_parsed=parsed)

    responses = FakeResponses()
    client = SimpleNamespace(responses=responses)
    result = OpenAIAssessmentProvider(model="test-model", client=client).assess(REPORT, user_reference="learner-7")

    assert result == parsed
    assert responses.kwargs["text_format"] is IncidentAssessment
    assert responses.kwargs["store"] is False
    assert responses.kwargs["safety_identifier"] != "learner-7"


def test_live_provider_requires_explicit_model() -> None:
    with pytest.raises(ValueError, match="explicit model"):
        OpenAIAssessmentProvider(model="   ", client=SimpleNamespace())
