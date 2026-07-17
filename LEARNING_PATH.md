# Learning Path

This path is designed for technical learners who already know basic Python or JavaScript, HTTP, JSON, Git, and command-line workflows.

## Phase 1 — Reliable Model Applications

Review:

- [Model Application Foundations](review-notes/01-model-application-foundations.md)

Labs:

- [Lab 1 — Responses and Structured Output](labs/lab-01-responses-and-structured-output.md)
- [Lab 2 — Tool Contracts and Validation](labs/lab-02-tool-contracts-and-validation.md)

Exit criteria:

- Explain the difference between model instructions and application enforcement.
- Validate model output against an exact schema.
- Classify common authentication, rate-limit, timeout, and contract failures.
- Design typed tools that fail safely.

## Phase 2 — MCP Integrations

Review:

- [MCP and Tool Integration](review-notes/02-mcp-and-tool-integration.md)

Labs:

- [Lab 3 — Build an MCP Server](labs/lab-03-build-an-mcp-server.md)
- [Lab 4 — MCP Client and Inspector](labs/lab-04-mcp-client-and-inspector.md)
- [Lab 5 — MCP Authentication and Scopes](labs/lab-05-mcp-authentication-and-scopes.md)

Project:

- [Engineering Operations MCP](projects/project-01-engineering-operations-mcp.md)

Exit criteria:

- Describe the client, server, tool, resource, and backing-service responsibilities.
- Run tool discovery and invocation over Streamable HTTP.
- Connect the MCP server to an actual external API.
- Enforce identity, scopes, approval, and audit boundaries outside the model.

## Phase 3 — Agent Reliability

Review:

- [Agent Runtime, Safety, and Evaluation](review-notes/03-agent-runtime-safety-and-evaluation.md)

Labs:

- [Lab 6 — Agent State and Approvals](labs/lab-06-agent-state-and-approvals.md)
- [Lab 7 — Traces and Agent Evaluations](labs/lab-07-traces-and-agent-evaluations.md)

Project:

- [Reliable Agent Runtime](projects/project-02-reliable-agent-runtime.md)

Exit criteria:

- Persist and resume a paused agent run.
- Keep authorization and side-effect decisions in application code.
- Trace model calls, tool calls, approvals, and failures.
- Evaluate tool selection and end-to-end behavior with repeatable cases.

## Phase 4 — Retrieval Systems

Review:

- [RAG Systems and Evaluation](review-notes/04-rag-systems-and-evaluation.md)

Labs:

- [Lab 8 — Hybrid Retrieval](labs/lab-08-hybrid-retrieval.md)
- [Lab 9 — RAG Authorization and Evaluation](labs/lab-09-rag-authorization-and-evaluation.md)

Project:

- [Tenant-Aware RAG Platform](projects/project-03-tenant-aware-rag-platform.md)

Exit criteria:

- Separate ingestion, retrieval, synthesis, and evaluation.
- Compare lexical, vector, and hybrid retrieval.
- Apply authorization filters before content reaches the model.
- Measure retrieval, citation, refusal, latency, and cost behavior.

## Phase 5 — Workshop Operations

Review:

- [Cloud Operations and Live Troubleshooting](review-notes/05-cloud-operations-and-live-troubleshooting.md)

Lab:

- [Lab 10 — Multi-Service Troubleshooting](labs/lab-10-multi-service-troubleshooting.md)

Project:

- [AI Lab Reliability Platform](projects/project-04-ai-lab-reliability-platform.md)

Exit criteria:

- Bring up the training stack from a clean machine.
- Detect environmental failures before participants begin.
- Trace one request across multiple services.
- Inject, diagnose, repair, and reset representative failures.
