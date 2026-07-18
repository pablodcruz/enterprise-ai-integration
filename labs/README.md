# Hands-on Labs

The labs move from focused protocol exercises to multi-service troubleshooting. Labs 1–5 include runnable starter kits and verified reference solutions; later lab implementations will be added with their corresponding capstone phases.

## How to Use the Labs

For every lab:

1. Read the objective, scenario, and architecture before running commands.
2. Create your work in a separate learner directory or repository.
3. Preserve a short debugging log containing the symptom, evidence, hypothesis, action, and result.
4. Complete every checkpoint and deliverable.
5. Attempt the break/fix challenge without looking at the reference solution.

Set up the shared Python environment and run all verified solutions by following [Testing Labs 1–5](../TESTING.md).

## Sequence

| Lab | Topic | Main skill |
| --- | --- | --- |
| 1 | [Responses and Structured Output](lab-01-responses-and-structured-output.md) | Exact model output contracts and API failure handling |
| 2 | [Tool Contracts and Validation](lab-02-tool-contracts-and-validation.md) | Application-owned schemas, validation, and idempotency |
| 3 | [Build an MCP Server](lab-03-build-an-mcp-server.md) | Tool discovery and invocation over Streamable HTTP |
| 4 | [MCP Client and Inspector](lab-04-mcp-client-and-inspector.md) | Protocol debugging and Responses API integration |
| 5 | [MCP Authentication and Scopes](lab-05-mcp-authentication-and-scopes.md) | OAuth metadata, tokens, scopes, and authorization failures |
| 6 | [Agent State and Approvals](lab-06-agent-state-and-approvals.md) | Pausing, approving, rejecting, and resuming runs |
| 7 | [Traces and Agent Evaluations](lab-07-traces-and-agent-evaluations.md) | Observable execution and workflow regression tests |
| 8 | [Hybrid Retrieval](lab-08-hybrid-retrieval.md) | Lexical, vector, and fused retrieval |
| 9 | [RAG Authorization and Evaluation](lab-09-rag-authorization-and-evaluation.md) | Permission filtering, citations, refusals, and quality metrics |
| 10 | [Multi-Service Troubleshooting](lab-10-multi-service-troubleshooting.md) | Health checks, correlation IDs, fault isolation, and reset |

## Deliverable Standard

Every learner lab submission should include:

- A README describing the result.
- The exact run and test commands.
- Sanitized evidence of successful execution.
- A debugging log containing at least one failure.
- A short explanation of the relevant security boundary.
- A note identifying what remains prototype-grade.

## Instructor Guidance

- Demonstrate the expected behavior before exposing implementation details.
- Make failure paths visible and normal.
- Ask learners to predict the next protocol message or service call.
- Separate model behavior from application, network, identity, and data failures.
- Keep a deterministic recorded path for classes without external credentials.

The detailed delivery plan for the implemented sequence is in the [Labs 1–5 Instructor Guide](../instructor/labs-01-05.md).
