from pathlib import Path

import pytest
from pydantic import ValidationError

from lab02.models import DraftIncidentCommentInput, GetIncidentInput, SearchIncidentsInput
from lab02.store import IncidentStore
from lab02.tools import IncidentNotFoundError, IncidentTools, tool_catalog


FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "incidents.json"


@pytest.fixture
def tools() -> IncidentTools:
    return IncidentTools(IncidentStore(FIXTURE), id_factory=lambda: "PROP-TEST000001")


def test_input_contract_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        SearchIncidentsInput(query="checkout", arbitrary_url="https://example.test")


def test_search_applies_filters_and_bounded_limit(tools: IncidentTools) -> None:
    result = tools.search_incidents(SearchIncidentsInput(query="checkout", service="checkout", limit=1))
    assert result.returned == 1
    assert result.truncated is True
    assert result.items[0].service == "checkout"


def test_limit_above_contract_is_rejected() -> None:
    with pytest.raises(ValidationError):
        SearchIncidentsInput(query="checkout", limit=1000)


def test_missing_incident_returns_controlled_domain_error(tools: IncidentTools) -> None:
    with pytest.raises(IncidentNotFoundError, match="INC-9999"):
        tools.get_incident(GetIncidentInput(incident_id="INC-9999"))


def test_draft_creates_proposal_without_mutating_incident(tools: IncidentTools) -> None:
    before = tools.get_incident(GetIncidentInput(incident_id="INC-1001"))
    proposal = tools.draft_incident_comment(
        DraftIncidentCommentInput(
            incident_id="INC-1001",
            body="Investigating the deployment correlation.",
            requested_by="learner@example.test",
        )
    )
    after = tools.get_incident(GetIncidentInput(incident_id="INC-1001"))
    assert proposal.status == "pending"
    assert len(proposal.payload_hash) == 64
    assert after.comments == before.comments


def test_tool_catalog_contains_only_narrow_capabilities() -> None:
    names = {tool["name"] for tool in tool_catalog()}
    assert names == {"search_incidents", "get_incident", "draft_incident_comment"}
    assert "url" not in str(tool_catalog()).lower()
