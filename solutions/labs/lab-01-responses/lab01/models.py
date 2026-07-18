from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Severity(StrEnum):
    SEV1 = "SEV1"
    SEV2 = "SEV2"
    SEV3 = "SEV3"
    SEV4 = "SEV4"


class IncidentAssessment(BaseModel):
    """Strict contract returned by recorded and live model providers."""

    model_config = ConfigDict(extra="forbid")

    summary: str = Field(min_length=8, max_length=240)
    affected_service: str = Field(min_length=2, max_length=80)
    severity: Severity
    customer_impact: str = Field(min_length=4, max_length=300)
    evidence: list[str] = Field(min_length=1, max_length=5)
    requires_human_review: bool

    @field_validator("evidence")
    @classmethod
    def evidence_must_be_specific(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values]
        if any(len(value) < 4 for value in cleaned):
            raise ValueError("evidence entries must contain meaningful text")
        return cleaned
