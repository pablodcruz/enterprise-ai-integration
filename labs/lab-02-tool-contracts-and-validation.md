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
