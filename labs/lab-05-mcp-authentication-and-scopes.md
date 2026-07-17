# Lab 5 — MCP Authentication and Scopes

## Objective

Protect the MCP server with token validation and per-tool scopes, then diagnose common authentication and authorization failures.

## Scenario

Read and write capabilities must not be available to every caller. The server will publish protected-resource metadata, validate access tokens, and enforce scopes independently of the model.

## Scope Model

| Scope | Capability |
| --- | --- |
| `incidents:read` | Search and retrieve incidents |
| `incidents:propose` | Create a comment proposal |
| `incidents:write` | Reserved for a later approval-gated integration |

## Requirements

1. Run a local OAuth-compatible identity provider or deterministic token issuer for the lab.
2. Publish protected-resource metadata.
3. Validate issuer, audience, expiration, and signature.
4. Declare per-tool security requirements.
5. Return an authentication challenge for missing credentials.
6. Distinguish 401 from 403 behavior.
7. Never authorize based on prompt text, locale, or client hints.
8. Redact access tokens from logs and traces.

## Test Matrix

- No token
- Malformed token
- Expired token
- Wrong audience
- Read-only token calling a read tool
- Read-only token calling the proposal tool
- Proposal-scoped token calling the proposal tool

## Break/Fix Challenge

The token signature is valid, but the server returns 403. Use the claims and tool policy to determine whether the audience, scope, or resource ownership is incorrect.

## Deliverables

- Identity-provider or token-issuer configuration
- Protected-resource metadata
- Scope enforcement code
- Authentication test matrix
- Sanitized failure evidence
- Explanation of authentication versus authorization
