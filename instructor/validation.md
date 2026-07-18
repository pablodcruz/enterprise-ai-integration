# Lab Validation Record

This record captures clean-path learner walkthroughs in addition to automated reference-solution tests. A walkthrough follows the public lab guide and starter without copying from the corresponding solution.

## Lab 3 — Build an MCP Server

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
| Docker’s client error is unclear to a first-time learner when Docker Desktop is stopped | Added an explicit troubleshooting entry and recovery action |

### Exit assessment

The core Python, ASGI, Streamable HTTP, discovery, schema-validation, structured-tool, and non-root container paths are reproducible from the learner guide.
