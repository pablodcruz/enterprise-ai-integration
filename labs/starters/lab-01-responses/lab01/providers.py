from pathlib import Path

from .models import IncidentAssessment


class RecordedAssessmentProvider:
    def __init__(self, fixture_path: Path):
        self.fixture_path = fixture_path

    def assess(self, report: str) -> IncidentAssessment:
        # TODO: load an exact input/output pair and validate it with IncidentAssessment.
        raise NotImplementedError


class OpenAIAssessmentProvider:
    def __init__(self, *, model: str, client=None):
        # TODO: require an explicit model and create or accept an OpenAI client.
        self.model = model
        self.client = client

    def assess(self, report: str, *, user_reference: str = "local-learner") -> IncidentAssessment:
        # TODO: call responses.parse with text_format=IncidentAssessment and store=False.
        raise NotImplementedError
