# Lab 2 — Tool Contracts and Validation

## Objective

Design and implement application-owned tools with narrow schemas, deterministic validation, and safe retry behavior.

## Scenario

The triage application needs access to a synthetic incident store. The model may search incidents, read one incident, and propose a comment, but it must not receive an unrestricted database or HTTP capability.

## Tools

Implement:

- `search_incidents(query, status, limit)` — read-only
- `get_incident(incident_id)` — read-only
- `propose_comment(incident_id, body)` — creates a proposal but performs no external write

## Requirements

1. Define machine-readable input and output schemas.
2. Reject unexpected fields and invalid enum values.
3. Cap query, body, and result sizes.
4. Normalize internal records into stable public results.
5. Add read-only and side-effect metadata.
6. Assign an idempotency key to every proposal.
7. Return typed not-found, validation, and dependency errors.
8. Keep the tool layer independent of a model so it can be tested directly.

## Checkpoints

- Tools run against a deterministic local fixture.
- Invalid arguments fail before reaching the store.
- Search cannot return more than the configured maximum.
- Repeating the same proposal key does not create a duplicate.
- The tool output contains no internal-only fields.

## Break/Fix Challenge

Fix a deliberately broad tool named `call_incident_api(method, path, body)` by replacing it with narrow, permission-friendly operations.

## Deliverables

- Tool definitions and schemas
- Store adapter
- Unit and contract tests
- Permission table explaining each tool
- Debugging log
- Short explanation: why are narrow tools easier to evaluate and authorize?

## Learner Workflow

**Estimated time:** 75–90 minutes

**Prerequisite:** Complete Lab 1 and review the narrow-tool design section of the MCP notes.

```powershell
Push-Location labs\starters\lab-02-tool-contracts
..\..\..\.venv\Scripts\python.exe -m pytest -q
```

The two starter tests initially fail. Implement bounded search and a proposal-only comment tool. The proposal must not alter the fixture or append a comment.

Verify the reference implementation:

```powershell
Pop-Location
Push-Location solutions\labs\lab-02-tool-contracts
..\..\..\.venv\Scripts\python.exe -m pytest -q
..\..\..\.venv\Scripts\python.exe -m lab02.cli
Pop-Location
```

Expected solution result: `6 passed`. The CLI prints bounded search results and a `pending` proposal with a 64-character payload hash.

## Progressive Hints

<details><summary>Hint 1: Search</summary>
Normalize the query, filter only declared fields, sort deterministically, then slice to the validated limit. Report whether additional matches were truncated.
</details>

<details><summary>Hint 2: Canonical proposal</summary>
Trim the body, serialize only approved fields with sorted keys and compact separators, then hash the canonical bytes with SHA-256.
</details>

<details><summary>Hint 3: Side effects</summary>
A draft tool returns intent for later review. It must not share an implementation path that mutates the incident store.
</details>
