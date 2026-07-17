# Lab 9 — RAG Authorization and Evaluation

## Objective

Add tenant-aware authorization, grounded generation, citations, refusal, and answer evaluation to the retrieval system.

## Scenario

Two synthetic organizations share a platform but must never retrieve each other's private runbooks. Public documentation remains available to both.

## Requirements

1. Associate every document with tenant and access metadata.
2. Apply permission filters before lexical and vector retrieval.
3. Verify that returned citations reference retrieved, authorized chunks.
4. Refuse or request clarification when evidence is insufficient.
5. Record retrieval IDs, scores, document versions, generation status, and latency.
6. Add tests proving cross-tenant retrieval is impossible.
7. Evaluate retrieval and answer quality separately.

## Evaluation Categories

- Directly supported answer
- Multi-source answer
- Partial coverage
- Unsupported question
- Competing similar sources
- Stale document version
- Cross-tenant leakage attempt
- Source-bypass or prompt-injection request

## Checkpoints

- Tenant A receives public and Tenant A documents only.
- Tenant B receives public and Tenant B documents only.
- Citations resolve to the indexed document version.
- Unsupported questions refuse.
- A fluent answer with a bad citation fails evaluation.

## Break/Fix Challenge

Move the authorization filter after retrieval and observe the resulting leakage evidence. Restore the boundary and add a regression test.

## Deliverables

- Authorization-aware retrieval API
- Grounded answer contract
- Citation verifier
- Retrieval and answer evaluation reports
- Security test suite
- Threat-model note
