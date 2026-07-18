from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Severity(StrEnum):
    SEV1 = "SEV1"
    SEV2 = "SEV2"
    SEV3 = "SEV3"
    SEV4 = "SEV4"


class IncidentStatus(StrEnum):
    OPEN = "open"
    MONITORING = "monitoring"
    RESOLVED = "resolved"


class SearchIncidentsInput(StrictModel):
    query: str = Field(min_length=1, max_length=120)
    service: str | None = Field(default=None, min_length=2, max_length=80)
    severity: Severity | None = None
    limit: int = Field(default=10, ge=1, le=20)


class GetIncidentInput(StrictModel):
    incident_id: str = Field(pattern=r"^INC-\d{4}$")


class DraftIncidentCommentInput(StrictModel):
    incident_id: str = Field(pattern=r"^INC-\d{4}$")
    body: str = Field(min_length=8, max_length=1000)
    requested_by: str = Field(min_length=3, max_length=80)


class IncidentSummary(StrictModel):
    incident_id: str
    title: str
    service: str
    severity: Severity
    status: IncidentStatus


class IncidentDetail(IncidentSummary):
    description: str
    customer_impact: str
    comments: list[str]


class SearchIncidentsResult(StrictModel):
    items: list[IncidentSummary]
    returned: int
    truncated: bool


class CommentProposal(StrictModel):
    proposal_id: str
    incident_id: str
    body: str
    requested_by: str
    payload_hash: str
    status: str = "pending"
