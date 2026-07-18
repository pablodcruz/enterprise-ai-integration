from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

from .models import IncidentDetail


class IncidentStore:
    def __init__(self, fixture_path: Path):
        payload = json.loads(fixture_path.read_text(encoding="utf-8"))
        incidents = [IncidentDetail.model_validate(item) for item in payload["incidents"]]
        self._incidents = {item.incident_id: item for item in incidents}

    def all(self) -> list[IncidentDetail]:
        return [item.model_copy(deep=True) for item in self._incidents.values()]

    def get(self, incident_id: str) -> IncidentDetail | None:
        item = self._incidents.get(incident_id)
        return item.model_copy(deep=True) if item else None

    def snapshot(self) -> dict[str, IncidentDetail]:
        return deepcopy(self._incidents)
