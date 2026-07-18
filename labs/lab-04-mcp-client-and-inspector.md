# Lab 4 - MCP Client, Inspector, and Model Integration

## Why this lab exists

An MCP server starting successfully does not prove that a client can initialize it, discover its tools, or use their results. A successful protocol call also does not prove that a model will choose the right tool. This lab tests those layers separately before composing them.

You can complete every required milestone from the Markdown guide and starter code. An AI assistant is optional. Official documentation is linked for deeper study, not required to discover missing assignment details.

**Estimated time:** 90-120 minutes

**Prerequisite:** Labs 1-3, Python environment installed from `requirements/labs.txt`

**Required credentials:** none

**Optional credentials:** an OpenAI API key for the final live extension only

## Learning outcomes

By the end, you will be able to:

1. initialize a Streamable HTTP MCP session before sending protocol operations;
2. discover tools and invoke them without involving a model;
3. distinguish protocol failures from model tool-selection failures;
4. constrain a remote MCP integration with `allowed_tools` and approval policy;
5. test a Responses API request without spending tokens or exposing a server; and
6. explain why a hosted API cannot call a localhost-only MCP endpoint.

## The three layers

| Layer | Question | Lab mechanism |
| --- | --- | --- |
| MCP transport and protocol | Can the client reach, initialize, list, and call? | `DirectMCPClient` plus the local demo server |
| Selection policy | Should this request use a tool, no tool, or be refused? | deterministic `RecordedModelClient` |
| Hosted model integration | Is the imported surface bounded and privacy-aware? | `OpenAIRemoteMCPClient` plus a fake SDK client |

Debug in that order. If discovery fails, changing a model prompt will not repair the transport.

## Architecture and request sequence

```text
Direct path (required, local)
CLI/test -> Streamable HTTP client -> ClientSession.initialize
         -> tools/list or tools/call -> local demo MCP server

Recorded path (required, local)
prompt -> deterministic policy -> trace with selected_tool/status

Live path (optional, hosted)
prompt -> Responses API -> reachable HTTPS MCP server -> approved tool call
```

The demo server exposes only synthetic incident data and a proposal tool. `draft_incident_comment` returns `status: pending`; it performs no external write.

## Starter map

| File | What is provided | What you implement |
| --- | --- | --- |
| `lab04/demo_server.py` | complete local MCP server with three tools | nothing |
| `lab04/cli.py` | recorded, inspect, and optional live commands | nothing |
| `lab04/client.py` | types, constructors, safety defaults, five TODOs | all five TODOs |
| `tests/test_lab04.py` | seven executable acceptance tests | nothing |

Do not edit the tests during the exercise. A failing focused test is feedback about the corresponding TODO.

## Setup

From the repository root, create and populate the virtual environment if you have not already done so.

Git Bash:

```bash
python -m venv .venv
./.venv/Scripts/python.exe -m pip install --no-cache-dir -r requirements/labs.txt
cd labs/starters/lab-04-mcp-client
```

PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --no-cache-dir -r requirements\labs.txt
Set-Location labs\starters\lab-04-mcp-client
```

Run the baseline from the starter directory:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

Expected untouched-starter summary:

```text
6 failed, 1 passed
```

The passing test confirms that local HTTP is rejected for hosted remote MCP. The six failures mark unimplemented behavior, not broken setup.

## Milestone 1 - Initialize, discover, and call directly

Open `lab04/client.py` and implement TODOs 1 and 2.

### Protocol rule

The lifecycle is:

1. open `streamable_http_client(server_url)`;
2. create `ClientSession(read, write)`;
3. call `await session.initialize()`;
4. call `list_tools()` or `call_tool()`; and
5. let both async context managers close the connection.

Use this analogous pattern. Adapt it rather than copying a completed method:

```python
async with streamable_http_client(url) as (read_stream, write_stream, _):
    async with ClientSession(read_stream, write_stream) as session:
        await session.initialize()
        response = await session.list_tools()
```

For discovery, convert each returned Pydantic tool object into a JSON-compatible dictionary with `model_dump(mode="json")`.

For invocation:

- call `session.call_tool(name, arguments=arguments)`;
- if `result.isError` is true, raise a useful `RuntimeError`;
- prefer `result.structuredContent` when present;
- otherwise parse the first `TextContent` item as JSON; and
- fail clearly if neither representation exists.

Run only this milestone:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab04.py::test_direct_client_lists_and_calls_tools
```

Expected:

```text
1 passed
```

This test starts a real subprocess server on a free port. It proves discovery and invocation across the actual MCP transport, not through a mocked function.

## Milestone 2 - Make selection policy observable

Implement TODO 3 in `RecordedModelClient.run`. This is a deterministic teaching model, not an attempt to imitate a language model.

Return a `RecordedTrace` for each case:

| Prompt signal | Selected tool | Status |
| --- | --- | --- |
| contains `explain` or `what is` | none | `completed` |
| contains `delete` | none | `refused` |
| contains `comment` | `draft_incident_comment` | `tool_selected` |
| other search-like request | `search_incidents` | `tool_selected` |
| selected tool absent from `allowed_tools` | none | `blocked` |

Why include no-tool and refusal cases? Good tool evaluation does not measure only whether a desired call occurs. It also checks whether unnecessary or unavailable capabilities stay unused.

Run the focused policy tests:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab04.py::test_recorded_client_has_no_tool_case \
  tests/test_lab04.py::test_recorded_client_refuses_capability_that_does_not_exist \
  tests/test_lab04.py::test_allowed_tools_blocks_unimported_capability
```

Expected: `3 passed`.

You can also inspect a trace manually:

```bash
../../../.venv/Scripts/python.exe -m lab04.cli \
  --mode recorded --prompt "Find the checkout incident"
```

Expected shape:

```json
{
  "prompt": "Find the checkout incident",
  "selected_tool": "search_incidents",
  "arguments": {"query": "checkout", "limit": 5},
  "status": "tool_selected",
  "final_text": "Selected search_incidents."
}
```

## Milestone 3 - Bound the imported MCP surface

Implement TODO 4, `build_remote_mcp_config`.

The function must:

- reject URLs that do not start with `https://`;
- reject an empty allowlist;
- use `type: "mcp"`;
- use a stable label and useful description;
- preserve exactly the requested `allowed_tools`; and
- set `require_approval` to `"always"` for this training workflow.

An analogous configuration looks like this:

```python
{
    "type": "mcp",
    "server_label": "bounded_service",
    "server_url": "https://example.test/mcp",
    "allowed_tools": ["read_one_thing"],
    "require_approval": "always",
}
```

An allowlist is a capability boundary, not merely a performance option. Do not import a write tool when the task only needs search. Approval is a second control; it does not replace least privilege.

Run:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab04.py::test_remote_config_filters_tools_and_requires_approval \
  tests/test_lab04.py::test_live_remote_mcp_rejects_local_http_url
```

Expected: `2 passed`.

## Milestone 4 - Build a testable Responses request

Implement TODO 5 in `OpenAIRemoteMCPClient.run`.

Call `self.client.responses.create` with:

- `model=self.model`;
- `input=prompt`;
- `tools=[self.tool_config()]`;
- `max_tool_calls=3`;
- `store=False`; and
- `safety_identifier` set to the hexadecimal SHA-256 digest of `user_reference`.

Then return `response.to_dict()`.

The safety identifier must be a stable pseudonymous value, not an email address or other direct identifier. Hashing in this lab demonstrates the interface shape; production pseudonymization should follow your organization's privacy and threat model.

The acceptance test injects a fake SDK client and inspects the exact request. It performs no network call and needs no API key.

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab04.py::test_live_request_is_bounded_and_privacy_aware
```

Expected: `1 passed`.

## Milestone 5 - Complete verification

Run all Lab 4 tests:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

Expected:

```text
7 passed
```

## Milestone 6 - Manual protocol inspection

Use two Git Bash terminals in the starter directory.

Terminal 1:

```bash
../../../.venv/Scripts/python.exe -m lab04.demo_server
```

Terminal 2:

```bash
../../../.venv/Scripts/python.exe -m lab04.cli --mode inspect
```

Expected output includes:

```json
{
  "tool_names": [
    "search_incidents",
    "get_incident",
    "draft_incident_comment"
  ],
  "search": {
    "items": [
      {
        "incident_id": "INC-1001",
        "title": "Checkout timeouts",
        "status": "open"
      }
    ],
    "returned": 1
  }
}
```

Stop the server with Ctrl+C.

You may also use MCP Inspector against `http://127.0.0.1:8010/mcp`. Inspector is useful for visually examining schemas, but the SDK test remains the reproducible acceptance evidence.

## Optional extension - Hosted Responses API

This extension is deliberately not part of the passing criteria.

The Responses API runs on hosted infrastructure and cannot reach `127.0.0.1` on your laptop. You need a deliberately deployed or securely tunneled HTTPS MCP server. Review its authentication, data exposure, logs, and shutdown procedure before making it reachable.

Set credentials only in your shell, never in source control:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="an-explicit-model-available-to-your-project"
../../../.venv/Scripts/python.exe -m lab04.cli \
  --mode live \
  --server-url "https://your-controlled-test-host.example/mcp" \
  --prompt "Find the checkout incident"
```

The lab intentionally does not hard-code a model name. Model availability changes and should be selected explicitly for the project and evaluation date.

## Break/fix challenge

Symptom: the model reports that no tools are available.

Diagnose the earliest failing layer:

| Observation | Likely layer | First check |
| --- | --- | --- |
| health endpoint fails | reachability | host, port, process, TLS |
| initialization fails | transport/protocol | exact MCP URL and Streamable HTTP support |
| direct list omits a tool | server registration | decorators and startup imports |
| direct list works, hosted import fails | hosted reachability/auth | public HTTPS URL and credentials |
| imported list is smaller than expected | client filtering | `allowed_tools` |
| tools exist but wrong one is selected | model/prompt/tool metadata | traces and evaluation cases |

Write down the observation that rules out each earlier layer. Do not jump directly to prompt changes.

## Progressive hints

<details>
<summary>Hint 1 - Async nesting</summary>

Both the transport and session are async context managers. Initialize inside the session block before listing or calling.
</details>

<details>
<summary>Hint 2 - Result normalization</summary>

Check `isError` first. Then prefer `structuredContent`; otherwise accept JSON text from a `TextContent` item.
</details>

<details>
<summary>Hint 3 - Recorded policy</summary>

Normalize the prompt with `casefold()`. Handle no-tool and delete cases before choosing between comment and search.
</details>

<details>
<summary>Hint 4 - Configuration</summary>

Return a new list with `list(allowed_tools)` so the caller's exact bounded surface is represented in the request.
</details>

<details>
<summary>Hint 5 - Safety identifier</summary>

Use `hashlib.sha256(user_reference.encode("utf-8")).hexdigest()`.
</details>

## Troubleshooting

| Symptom | Cause | Resolution |
| --- | --- | --- |
| `command not found` in Git Bash | Windows path typed with backslashes | use `../../../.venv/Scripts/python.exe` |
| connection refused | demo server is not running or wrong port | start it and confirm `/health` |
| tool call before initialization | missing lifecycle step | call `await session.initialize()` first |
| JSON decode error | text fallback is not JSON | inspect content type and prefer structured content |
| local URL rejected in live mode | expected safety validation | use local URL only for direct inspect mode |
| API key error during required tests | accidentally used live client | required tests inject a fake and need no key |

## Deliverables

- completed `lab04/client.py`;
- `7 passed` test output;
- one direct inspection result;
- recorded traces for a tool, no-tool, blocked, and refused case; and
- a short explanation of why protocol and model behavior are tested independently.

Do not commit API keys, tokens, tunnel URLs containing credentials, or unsanitized traces.

## Reflection questions

1. Which test proves the server works without a model?
2. Why are both `allowed_tools` and approval useful?
3. What does `max_tool_calls` bound, and what does it not bound?
4. Why is a no-tool evaluation case necessary?
5. What changes when the MCP server moves from localhost to a reachable HTTPS deployment?

## Further reading

- [MCP Python SDK client guide](https://py.sdk.modelcontextprotocol.io/client/)
- [OpenAI remote MCP and connectors guide](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
- [OpenAI Responses create reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
