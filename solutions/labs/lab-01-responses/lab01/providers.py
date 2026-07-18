from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Callable, Protocol

from openai import OpenAI

from .models import IncidentAssessment


INSTRUCTIONS = """You classify operational incident reports.
Use only evidence present in the report. Do not invent services, symptoms, or impact.
Set requires_human_review when severity or customer impact is uncertain.
Return data that conforms exactly to the supplied schema."""


class AssessmentProvider(Protocol):
    def assess(self, report: str) -> IncidentAssessment: ...


class RecordedAssessmentProvider:
    """Loads exact input/output pairs so the lab works without paid services."""

    def __init__(self, fixture_path: Path):
        payload = json.loads(fixture_path.read_text(encoding="utf-8"))
        self._cases = {case["input"]: case["output"] for case in payload["cases"]}

    def assess(self, report: str) -> IncidentAssessment:
        try:
            recorded = self._cases[report]
        except KeyError as exc:
            raise LookupError("no recorded assessment exists for this exact input") from exc
        return IncidentAssessment.model_validate(recorded)


class OpenAIAssessmentProvider:
    """Live provider using Responses structured parsing with a Pydantic schema."""

    def __init__(self, *, model: str, client: OpenAI | None = None):
        if not model.strip():
            raise ValueError("an explicit model name is required in live mode")
        self._model = model
        self._client = client or OpenAI(max_retries=2, timeout=30.0)

    @staticmethod
    def _safety_identifier(user_reference: str) -> str:
        return hashlib.sha256(user_reference.encode("utf-8")).hexdigest()

    def assess(self, report: str, *, user_reference: str = "local-learner") -> IncidentAssessment:
        response = self._client.responses.parse(
            model=self._model,
            instructions=INSTRUCTIONS,
            input=report,
            text_format=IncidentAssessment,
            store=False,
            safety_identifier=self._safety_identifier(user_reference),
        )
        if response.output_parsed is None:
            raise RuntimeError("the model did not return a parsed incident assessment")
        return response.output_parsed

    def assess_stream(
        self,
        report: str,
        *,
        on_delta: Callable[[str], None],
        user_reference: str = "local-learner",
    ) -> IncidentAssessment:
        with self._client.responses.stream(
            model=self._model,
            instructions=INSTRUCTIONS,
            input=report,
            text_format=IncidentAssessment,
            store=False,
            safety_identifier=self._safety_identifier(user_reference),
        ) as stream:
            for event in stream:
                if event.type == "response.output_text.delta":
                    on_delta(event.delta)
            response = stream.get_final_response()
        if response.output_parsed is None:
            raise RuntimeError("the streamed response did not contain a parsed assessment")
        return response.output_parsed
