from __future__ import annotations

import contextlib
import os
from typing import Annotated, Any

import uvicorn
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
from pydantic import Field
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route


mcp = FastMCP(
    "Lab 4 Demo Server",
    stateless_http=True,
    json_response=True,
    streamable_http_path="/",
)


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, openWorldHint=False), structured_output=True)
def search_incidents(
    query: Annotated[str, Field(min_length=1, max_length=120)],
    limit: Annotated[int, Field(ge=1, le=20)] = 10,
) -> dict[str, Any]:
    items = []
    if "checkout" in query.casefold():
        items.append({"incident_id": "INC-1001", "title": "Checkout timeouts", "status": "open"})
    return {"items": items[:limit], "returned": len(items[:limit])}


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, openWorldHint=False), structured_output=True)
def get_incident(incident_id: Annotated[str, Field(pattern=r"^INC-\d{4}$")]) -> dict[str, Any]:
    if incident_id != "INC-1001":
        raise ValueError(f"incident {incident_id} was not found")
    return {"incident_id": incident_id, "title": "Checkout timeouts", "status": "open"}


@mcp.tool(
    annotations=ToolAnnotations(readOnlyHint=False, destructiveHint=False, idempotentHint=True),
    structured_output=True,
)
def draft_incident_comment(
    incident_id: Annotated[str, Field(pattern=r"^INC-\d{4}$")],
    body: Annotated[str, Field(min_length=8, max_length=1000)],
    requested_by: str,
) -> dict[str, Any]:
    return {
        "proposal_id": "PROP-LAB04",
        "incident_id": incident_id,
        "body": body,
        "requested_by": requested_by,
        "status": "pending",
    }


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok"})


@contextlib.asynccontextmanager
async def lifespan(_: Starlette):
    async with mcp.session_manager.run():
        yield


app = Starlette(
    routes=[Route("/health", health), Mount("/mcp", mcp.streamable_http_app())],
    lifespan=lifespan,
)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("LAB_PORT", "8010")), log_level="warning")
