import json
from pathlib import Path

from .models import DraftIncidentCommentInput, SearchIncidentsInput
from .store import IncidentStore
from .tools import IncidentTools


def main() -> int:
    fixture = Path(__file__).resolve().parents[1] / "fixtures" / "incidents.json"
    tools = IncidentTools(IncidentStore(fixture), id_factory=lambda: "PROP-DEMO0001")
    search = tools.search_incidents(SearchIncidentsInput(query="checkout", limit=5))
    proposal = tools.draft_incident_comment(
        DraftIncidentCommentInput(
            incident_id="INC-1001",
            body="Investigating deployment correlation; no change has been applied.",
            requested_by="learner@example.test",
        )
    )
    print(json.dumps({"search": search.model_dump(mode="json"), "proposal": proposal.model_dump()}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
