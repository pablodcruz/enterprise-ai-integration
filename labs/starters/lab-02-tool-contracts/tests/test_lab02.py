import json
from pathlib import Path

from lab02.models import DraftIncidentCommentInput, SearchIncidentsInput
from lab02.tools import IncidentTools


FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "incidents.json"


def load_tools() -> IncidentTools:
    return IncidentTools(json.loads(FIXTURE.read_text(encoding="utf-8"))["incidents"])


def test_search_returns_only_matching_items() -> None:
    result = load_tools().search_incidents(SearchIncidentsInput(query="checkout", limit=1))
    assert result["returned"] == 1
    assert result["items"][0]["incident_id"] == "INC-1001"


def test_draft_does_not_mutate_incident() -> None:
    tools = load_tools()
    before = json.dumps(tools.incidents, sort_keys=True)
    proposal = tools.draft_incident_comment(
        DraftIncidentCommentInput(
            incident_id="INC-1001",
            body="Investigating deployment correlation.",
            requested_by="learner@example.test",
        )
    )
    assert proposal["status"] == "pending"
    assert len(proposal["payload_hash"]) == 64
    assert json.dumps(tools.incidents, sort_keys=True) == before
