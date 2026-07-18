from __future__ import annotations

import hashlib
import json
import uuid
from collections.abc import Callable

from .models import (
    CommentProposal,
    DraftIncidentCommentInput,
    GetIncidentInput,
    IncidentDetail,
    IncidentSummary,
    SearchIncidentsInput,
    SearchIncidentsResult,
)
from .store import IncidentStore


class IncidentNotFoundError(LookupError):
    pass


class IncidentTools:
    def __init__(self, store: IncidentStore, *, id_factory: Callable[[], str] | None = None):
        self._store = store
        self._id_factory = id_factory or (lambda: f"PROP-{uuid.uuid4().hex[:12].upper()}")

    def search_incidents(self, arguments: SearchIncidentsInput) -> SearchIncidentsResult:
        query = arguments.query.casefold()
        matches: list[IncidentSummary] = []
        for incident in self._store.all():
            searchable = f"{incident.incident_id} {incident.title} {incident.description}".casefold()
            if query not in searchable:
                continue
            if arguments.service and incident.service != arguments.service:
                continue
            if arguments.severity and incident.severity != arguments.severity:
                continue
            matches.append(
                IncidentSummary(
                    incident_id=incident.incident_id,
                    title=incident.title,
                    service=incident.service,
                    severity=incident.severity,
                    status=incident.status,
                )
            )

        matches.sort(key=lambda item: item.incident_id)
        selected = matches[: arguments.limit]
        return SearchIncidentsResult(items=selected, returned=len(selected), truncated=len(matches) > len(selected))

    def get_incident(self, arguments: GetIncidentInput) -> IncidentDetail:
        incident = self._store.get(arguments.incident_id)
        if incident is None:
            raise IncidentNotFoundError(f"incident {arguments.incident_id} was not found")
        return incident

    def draft_incident_comment(self, arguments: DraftIncidentCommentInput) -> CommentProposal:
        if self._store.get(arguments.incident_id) is None:
            raise IncidentNotFoundError(f"incident {arguments.incident_id} was not found")
        canonical = json.dumps(
            {
                "body": arguments.body.strip(),
                "incident_id": arguments.incident_id,
                "requested_by": arguments.requested_by,
            },
            sort_keys=True,
            separators=(",", ":"),
        )
        return CommentProposal(
            proposal_id=self._id_factory(),
            incident_id=arguments.incident_id,
            body=arguments.body.strip(),
            requested_by=arguments.requested_by,
            payload_hash=hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
        )


def tool_catalog() -> list[dict]:
    return [
        {
            "name": "search_incidents",
            "description": "Search synthetic incidents using bounded filters.",
            "input_schema": SearchIncidentsInput.model_json_schema(),
            "output_schema": SearchIncidentsResult.model_json_schema(),
            "annotations": {"readOnlyHint": True, "openWorldHint": False},
        },
        {
            "name": "get_incident",
            "description": "Retrieve one synthetic incident by its public incident ID.",
            "input_schema": GetIncidentInput.model_json_schema(),
            "output_schema": IncidentDetail.model_json_schema(),
            "annotations": {"readOnlyHint": True, "openWorldHint": False},
        },
        {
            "name": "draft_incident_comment",
            "description": "Create a non-executing comment proposal for later approval.",
            "input_schema": DraftIncidentCommentInput.model_json_schema(),
            "output_schema": CommentProposal.model_json_schema(),
            "annotations": {"readOnlyHint": False, "destructiveHint": False, "idempotentHint": True},
        },
    ]
