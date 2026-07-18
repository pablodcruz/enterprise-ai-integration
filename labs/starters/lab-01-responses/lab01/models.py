from pydantic import BaseModel


class IncidentAssessment(BaseModel):
    """TODO: replace loose fields with a strict, constrained contract."""

    summary: str
    affected_service: str
    severity: str
    customer_impact: str
    evidence: list[str]
    requires_human_review: bool
