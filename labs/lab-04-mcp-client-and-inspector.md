# Lab 4 — MCP Client and Inspector

## Objective

Test the MCP server independently, then connect it to a model client and inspect model-selected tool calls.

## Scenario

The MCP server starts successfully, but that does not prove a model client can discover and use it correctly. You will test the protocol first and model behavior second.

## Tasks

1. Start the MCP server from Lab 3.
2. Use MCP Inspector or an SDK client to initialize the connection.
3. List tools and inspect the raw schemas.
4. Call each tool directly with valid and invalid arguments.
5. Connect the remote MCP server to a Responses API client.
6. Constrain the imported tool set.
7. Run requests that require zero, one, and multiple tool calls.

## Requirements

- Keep direct protocol tests independent from model tests.
- Record sanitized request and result evidence.
- Configure a maximum tool-call count.
- Demonstrate a no-tool answer.
- Demonstrate that a forbidden tool is unavailable.
- Capture model, tool, and final statuses in one trace.

## Checkpoints

- Inspector lists the expected tool names and schemas.
- Direct calls work without a model.
- The model selects `search_incidents` for a search request.
- The model does not call a tool for a conceptual question.
- The proposal tool returns a proposal rather than performing a write.

## Break/Fix Challenge

Given the symptom "the model says no tools are available," determine whether the cause is network reachability, MCP initialization, tool filtering, or tool metadata.

## Deliverables

- Inspector evidence
- Client code
- Three sanitized traces
- Tool-selection test cases
- Troubleshooting table mapping symptoms to protocol stages
