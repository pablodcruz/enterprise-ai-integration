# Lab 7 — Traces and Agent Evaluations

## Objective

Instrument the agent workflow and create repeatable evaluations for tool choice, approval behavior, refusal, and recovery.

## Scenario

A successful demonstration does not prove the workflow will behave correctly across ambiguous and adversarial requests. You will turn traces into an evaluation dataset.

## Requirements

1. Trace model calls, tool calls, guardrails, approval transitions, and terminal status.
2. Propagate one correlation ID through the agent, MCP server, database, and external adapter.
3. Redact tokens and configured sensitive fields.
4. Create at least 20 evaluation cases.
5. Add deterministic assertions for tool presence, forbidden tools, status, approval, and call limits.
6. Add a documented rubric for explanation quality and appropriate uncertainty.
7. Preserve case-level results and failure evidence.

## Required Case Categories

- No-tool conceptual requests
- One-tool read requests
- Multi-tool investigations
- Approval-required writes
- Approval rejection
- Missing permission
- Backing-service failure
- Prompt injection inside tool output
- Unsupported destructive action
- Tool-loop limit

## Checkpoints

- One request can be followed across every service.
- Traces contain no access tokens.
- A regression that enables an unauthorized tool fails the evaluation suite.
- A final answer cannot hide an incorrect tool path.

## Break/Fix Challenge

Introduce a tool-description change that causes incorrect routing. Use trace comparisons to locate the regression and update the evaluation set if a new failure pattern appears.

## Deliverables

- Trace instrumentation
- Versioned evaluation dataset
- Evaluation runner
- Human-grading rubric
- Static or machine-readable report
- Analysis of at least three failing cases
