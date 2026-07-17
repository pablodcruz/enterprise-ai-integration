# Lab 8 — Hybrid Retrieval

## Objective

Build and compare lexical, vector, and hybrid retrieval over a versioned synthetic knowledge base.

## Scenario

The corpus contains runbooks, architecture notes, and incident histories. Queries combine natural language with exact service names and error codes, making a single retrieval strategy insufficient.

## Requirements

1. Parse documents into chunks with stable document and chunk IDs.
2. Preserve source URI, version, checksum, heading, timestamps, and tenant metadata.
3. Build a lexical index.
4. Build a vector index.
5. Implement rank fusion for hybrid results.
6. Return ranked IDs, scores, and source metadata without generation.
7. Create at least 15 retrieval evaluation queries with expected sources.

## Experiments

- Compare exact error-code queries.
- Compare semantic paraphrases.
- Compare mixed identifier and natural-language queries.
- Change chunk size and observe rankings.
- Remove one index and measure the regression.

## Metrics

- Hit rate at 3 and 5
- Mean reciprocal rank
- Precision at 5
- Per-stage latency

## Break/Fix Challenge

A document is updated, but retrieval still returns the previous version. Diagnose whether ingestion, deletion, cache invalidation, or index versioning failed.

## Deliverables

- Ingestion and indexing code
- Three retrieval modes
- Versioned synthetic corpus
- Evaluation dataset and report
- Retrieval comparison notes
