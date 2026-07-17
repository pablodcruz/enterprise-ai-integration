# Lab 3 — Build an MCP Server

## Objective

Expose the incident tools from Lab 2 through a real MCP server using Streamable HTTP.

## Scenario

Multiple AI clients need to use the same incident capabilities. Instead of building a custom integration per client, you will publish a discoverable MCP tool surface.

## Required Capabilities

- Server initialization with concise cross-tool instructions
- Tool discovery
- Tool invocation
- Structured tool results
- Streamable HTTP endpoint at `/mcp`
- Health endpoint separate from the protocol endpoint

## Requirements

1. Use an MCP SDK rather than implementing JSON-RPC framing from scratch.
2. Register all three Lab 2 tools with their schemas and annotations.
3. Preserve the same validation rules behind the MCP boundary.
4. Return structured content plus a concise human-readable result.
5. Add correlation IDs to protocol and backing-store logs.
6. Return controlled protocol errors without stack traces.
7. Run in a container with a non-root user where supported.

## Checkpoints

- The server starts from a clean environment.
- An MCP client can initialize and list tools.
- Each read tool can be called successfully.
- Invalid arguments return a schema error.
- The proposal tool still creates only a proposal.
- The health endpoint does not invoke tools.

## Break/Fix Challenge

Diagnose one seeded failure:

- Wrong protocol path
- Tool registered under the wrong name
- Output violates its declared schema
- Backing fixture cannot be found inside the container

## Deliverables

- MCP server source
- Container configuration
- Tool discovery output
- Contract tests
- Architecture diagram
- Debugging log showing the failing layer
