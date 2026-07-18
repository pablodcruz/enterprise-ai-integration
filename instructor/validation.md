# Lab Validation Record

This record captures clean-path learner walkthroughs in addition to automated reference-solution tests. A walkthrough follows the public lab guide and starter without importing from the corresponding solution.

## Lab 3 - Build an MCP Server

**Validated:** July 18, 2026
**Environment:** Windows, Python 3.12 virtual environment, Docker Desktop 29.6.1, deterministic synthetic fixture

### Results

| Check | Result |
| --- | --- |
| Untouched starter baseline | Six intentional failures, matching the guide |
| Transport-settings milestone | Passed |
| Tool discovery and annotation milestone | Passed |
| Structured invocation milestone | Passed |
| Invalid-input and missing-record failures | Passed |
| Health and readiness ASGI routes | Passed |
| Complete starter acceptance suite | Six passed |
| Live HTTP health and readiness probes | Passed |
| Direct MCP initialization and tool listing | Passed; exactly three expected tools |
| Direct `search_incidents` call | Passed; returned `INC-1001` with a request ID |
| Browser Inspector | Previously verified on the same workstation |
| Container build and runtime identity | Passed; image ran as `uid=10001(labuser)` and served healthy endpoints |

### Friction and action taken

| Observation | Action |
| --- | --- |
| A copied learner workspace can contain local Python bytecode caches | Added a starter `.dockerignore` so caches and tests do not enter the container context |
| Docker's client error is unclear to a first-time learner when Docker Desktop is stopped | Added an explicit troubleshooting entry and recovery action |

### Exit assessment

The core Python, ASGI, Streamable HTTP, discovery, schema-validation, structured-tool, and non-root container paths are reproducible from the learner guide.

## Lab 4 - MCP Client, Inspector, and Model Integration

**Validated:** July 18, 2026
**Environment:** Windows, Python 3.12 virtual environment, local Streamable HTTP subprocess, fake Responses SDK client

### Results

| Check | Result |
| --- | --- |
| Untouched starter baseline | Six intentional failures and one pass, matching the guide |
| Direct initialize/list/call milestone | Passed against a real local MCP subprocess |
| Recorded tool/no-tool/refused/blocked policy milestone | Three focused tests passed |
| Remote MCP allowlist and approval milestone | Two focused tests passed |
| Mocked Responses request milestone | Passed without API key or network call |
| Complete learner-copy suite | Seven passed |
| Reference-solution suite | Seven passed |
| Hosted localhost rejection | Passed with the documented reachable-HTTPS error |

### Friction and action taken

| Observation | Action |
| --- | --- |
| The previous starter did not include enough runnable infrastructure | Added a complete demo server, CLI, and seven acceptance tests |
| Protocol behavior and model behavior were easy to conflate | Organized the guide and code into direct, recorded, and optional live paths |
| A live API test would require credentials and public hosting | Made the required request test use an injected fake client; kept live mode optional |

### Exit assessment

A learner can complete all five TODOs using the guide, run each milestone independently, and prove the protocol and bounded Responses request without credentials.

## Lab 5 - MCP Authentication and Scopes

**Validated:** July 18, 2026
**Environment:** Windows, Python 3.12 virtual environment, local signed JWTs, authenticated Streamable HTTP subprocess

### Results

| Check | Result |
| --- | --- |
| Untouched starter baseline | Six intentional failures and one pass, matching the guide |
| Valid JWT conversion milestone | Passed |
| Wrong-audience, expired, and malformed rejection milestone | Passed |
| Missing, under-scoped, and allowed policy milestone | Passed |
| Protected-resource metadata and 401 challenge | Passed against a real server subprocess |
| Read-scoped search | Passed; validated subject reached the tool |
| Read-scoped proposal attempt | Passed; controlled MCP `FORBIDDEN` error returned |
| Proposal-scoped non-executing proposal | Passed with `status: pending` |
| Complete learner-copy suite | Seven passed |
| Reference-solution suite | Seven passed |

### Friction and action taken

| Observation | Action |
| --- | --- |
| The old starter contained only two disconnected TODOs | Added the complete local issuer, server, client, token CLI, metadata route, and integration harness |
| Generated metadata did not advertise the per-tool scopes | Added an explicit protected-resource metadata route listing read and propose scopes |
| "401 versus 403" could overstate the SDK behavior | Documented that missing/invalid tokens receive HTTP 401 while dynamic per-tool denial is a controlled MCP `FORBIDDEN` error, not HTTP 403 |

### Exit assessment

A learner can implement the two security decisions from the guide and verify discovery, authentication, and least-privilege authorization end to end without external credentials. The local issuer's production limitations and the HTTP-status distinction are explicit.
