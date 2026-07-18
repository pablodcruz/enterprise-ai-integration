from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SearchIncidentsInput(StrictModel):
    query: str = Field(min_length=1, max_length=120)
    service: str | None = None
    limit: int = Field(default=10, ge=1, le=20)


class DraftIncidentCommentInput(StrictModel):
    incident_id: str = Field(pattern=r"^INC-\d{4}$")
    body: str = Field(min_length=8, max_length=1000)
    requested_by: str
