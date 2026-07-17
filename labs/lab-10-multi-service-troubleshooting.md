# Lab 10 — Multi-Service Troubleshooting

## Objective

Operate and debug the combined agent, MCP, identity, database, retrieval, and telemetry stack.

## Scenario

Learners receive the same visible client error but different underlying faults. They must use health checks, traces, logs, and configuration evidence to isolate the failing boundary.

## Required Tooling

- One-command local startup
- Preflight or doctor command
- Service readiness report
- Correlation ID search
- Fault-injection command
- Safe reset command
- Recorded mode for external-service outages

## Fault Scenarios

Implement at least eight:

1. MCP server unreachable
2. Wrong MCP path
3. Expired token
4. Missing write scope
5. Database migration missing
6. External API rate limited
7. Tool result violates schema
8. Agent reaches tool-call limit
9. Vector index is stale
10. Trace exporter unavailable

## Troubleshooting Record

For each assigned fault, capture:

```text
Expected behavior:
Observed symptom:
Request or correlation ID:
Last confirmed-good boundary:
Evidence:
Hypothesis:
Diagnostic action:
Root cause:
Repair:
Preventive control:
```

## Checkpoints

- Preflight catches configuration failures before the lab starts.
- Readiness distinguishes a running process from a usable service.
- One request can be traced across services.
- Reset restores known state without deleting source code.
- Recorded mode remains usable when live dependencies fail.

## Deliverables

- Compose or equivalent local orchestration
- Preflight, fault, and reset commands
- Health and readiness endpoints
- Structured logging and trace configuration
- Fault runbooks
- Evidence for three diagnosed failures
