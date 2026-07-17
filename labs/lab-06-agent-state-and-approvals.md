# Lab 6 — Agent State and Approvals

## Objective

Build a model-driven workflow that pauses before an external write and resumes only after a verified approval.

## Scenario

Extend the MCP integration with a sandbox write tool, `add_incident_comment`. The agent can decide that a comment would help, but the runtime must pause before the side effect.

## Required States

```text
running
approval_required
completed
rejected
failed
cancelled
```

## Requirements

1. Persist run state in a database.
2. Store the exact proposed tool name and canonicalized arguments.
3. Bind approval to run ID, user, payload hash, expiration, and audit ID.
4. Reject modified, expired, or replayed approvals.
5. Resume safely after a process restart.
6. Add an idempotency key to the external write.
7. Record the external operation identifier.
8. Apply a maximum model-turn and tool-call limit.

## Checkpoints

- A read-only workflow completes without approval.
- A write workflow pauses with no external mutation.
- Approval resumes the same action exactly once.
- Rejection produces no mutation.
- Restarting the application does not lose the pending run.
- Approval replay is rejected.

## Break/Fix Challenge

Simulate a timeout after the external system receives the write. Repair the workflow so it verifies the idempotency result rather than blindly repeating the action.

## Deliverables

- State machine and database schema
- Approval API or CLI
- Audit records for approved and rejected runs
- Tests for restart, replay, mutation, and timeout behavior
- Sequence diagram
