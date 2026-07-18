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
    instructions="Search synthetic incidents and create non-executing comment proposals.",
    stateless_http=True,
    json_response=True,
    streamable_http_path="/",
)


@mcp.tool(
    description="Search synthetic incidents with bounded filters.",
    annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, openWorldHint=False),
    structured_output=True,
)
def search_incidents(
    query: Annotated[str, Field(min_length=1, max_length=120)],
    service_name: Annotated[str | None, Field(min_length=2, max_length=80)] = None,
    limit: Annotated[int, Field(ge=1, le=20)] = 10,
) -> dict[str, Any]:
    return service.search(query=query, service=service_name, limit=limit)


@mcp.tool(
    description="Retrieve one synthetic incident by its incident ID.",
    annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, openWorldHint=False),
    structured_output=True,
)
def get_incident(incident_id: Annotated[str, Field(pattern=r"^INC-\d{4}$")]) -> dict[str, Any]:
    return service.get(incident_id)


@mcp.tool(
    description="Create a comment proposal without changing the incident.",
    annotations=ToolAnnotations(
        readOnlyHint=False,
        destructiveHint=False,
        idempotentHint=True,
        openWorldHint=False,
    ),
    structured_output=True,
)
def draft_incident_comment(
    incident_id: Annotated[str, Field(pattern=r"^INC-\d{4}$")],
    body: Annotated[str, Field(min_length=8, max_length=1000)],
    requested_by: Annotated[str, Field(min_length=3, max_length=80)],
) -> dict[str, Any]:
    return service.draft_comment(incident_id=incident_id, body=body, requested_by=requested_by)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "incident-operations-mcp"})


async def readiness(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ready", "fixture_loaded": True})


@contextlib.asynccontextmanager
async def lifespan(_: Starlette):
    async with mcp.session_manager.run():
        yield


app = Starlette(
    routes=[
        Route("/health", health),
        Route("/ready", readiness),
        Mount("/mcp", app=mcp.streamable_http_app()),
    ],
    lifespan=lifespan,
)


def main() -> None:
    uvicorn.run(
        app,
        host=os.getenv("LAB_HOST", "127.0.0.1"),
        port=int(os.getenv("LAB_PORT", "8000")),
        log_level="info",
    )


if __name__ == "__main__":
    main()
