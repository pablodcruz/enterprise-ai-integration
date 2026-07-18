from __future__ import annotations

import hashlib
import json
import uuid
from pathlib import Path


class IncidentService:
    def __init__(self, fixture_path: Path):
        payload = json.loads(fixture_path.read_text(encoding="utf-8"))
        self._incidents = {item["incident_id"]: item for item in payload["incidents"]}

    def search(self, *, query: str, service: str | None, limit: int) -> dict:
        normalized = query.casefold()
        matches = [
            item
            for item in self._incidents.values()
            if normalized in f"{item['incident_id']} {item['title']} {item['description']}".casefold()
            and (service is None or item["service"] == service)
        ]
        matches.sort(key=lambda item: item["incident_id"])
        selected = matches[:limit]
        return {
            "request_id": f"req_{uuid.uuid4().hex[:12]}",
            "items": [
                {key: item[key] for key in ("incident_id", "title", "service", "severity", "status")}
                for item in selected
            ],
            "returned": len(selected),
            "truncated": len(matches) > len(selected),
        }

    def get(self, incident_id: str) -> dict:
        try:
            item = self._incidents[incident_id]
        except KeyError as exc:
            raise ValueError(f"incident {incident_id} was not found") from exc
        return {"request_id": f"req_{uuid.uuid4().hex[:12]}", **item}

    def draft_comment(self, *, incident_id: str, body: str, requested_by: str) -> dict:
        if incident_id not in self._incidents:
            raise ValueError(f"incident {incident_id} was not found")
        canonical = json.dumps(
            {"body": body.strip(), "incident_id": incident_id, "requested_by": requested_by},
            sort_keys=True,
            separators=(",", ":"),
        )
        return {
            "request_id": f"req_{uuid.uuid4().hex[:12]}",
            "proposal_id": f"PROP-{uuid.uuid4().hex[:12].upper()}",
            "incident_id": incident_id,
            "body": body.strip(),
            "requested_by": requested_by,
            "payload_hash": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
            "status": "pending",
        }
