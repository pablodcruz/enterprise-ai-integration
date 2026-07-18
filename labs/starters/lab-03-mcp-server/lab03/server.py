from __future__ import annotations

import contextlib
import os
from pathlib import Path
from typing import Annotated, Any

import uvicorn
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
from pydantic import Field
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route

from .domain import IncidentService


FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "incidents.json"
service = IncidentService(FIXTURE)

mcp = FastMCP(
    "Incident Operations Lab",
    # TODO 1: add concise instructions and configure stateless JSON
    # Streamable HTTP. The MCP sub-application will be mounted at /mcp.
)


# TODO 2: register exactly these tools with constrained Annotated parameters,
# explicit structured return types, and accurate ToolAnnotations:
# - search_incidents
# - get_incident
# - draft_incident_comment
# Delegate their behavior to the provided IncidentService.


# TODO 3: implement separate health and readiness HTTP handlers.


# TODO 4: run the MCP session manager in a Starlette lifespan, mount the MCP
# sub-application at /mcp, and expose /health and /ready as ordinary routes.
# Name the resulting Starlette application `app`.


def main() -> None:
    """Run the completed ASGI application with configurable host and port."""
    # TODO 5: replace this exception with uvicorn.run(...). Read LAB_HOST and
    # LAB_PORT from the environment and use safe local-development defaults.
    raise NotImplementedError("Complete TODO 5 before starting the server")


if __name__ == "__main__":
    main()
