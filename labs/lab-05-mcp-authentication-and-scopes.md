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

## Learner Workflow

**Estimated time:** 120–150 minutes

**Prerequisite:** Complete Labs 3 and 4 and understand bearer-token handling.

```powershell
Push-Location labs\starters\lab-05-mcp-auth
..\..\..\.venv\Scripts\python.exe -m pytest -q
```

Implement JWT verification and the scope policy. The verifier must check signature, issuer, audience, expiration, subject, and scope claims. Never print or log tokens.

Verify the solution:

```powershell
Pop-Location
Push-Location solutions\labs\lab-05-mcp-auth
..\..\..\.venv\Scripts\python.exe -m pytest -q
Pop-Location
```

Expected solution result: `7 passed`. The integration suite launches a real local MCP subprocess and proves 401 behavior, read access, forbidden proposal access, and successful proposal-scoped access.

## Progressive Hints

<details><summary>Hint 1: Verification</summary>
Restrict the JWT algorithm explicitly. Require `exp`, `iat`, `iss`, `aud`, `sub`, and `scope`; return no identity when any check fails.
</details>

<details><summary>Hint 2: 401 versus forbidden</summary>
Missing or invalid credentials fail at the HTTP boundary. A valid identity without the tool's scope fails at the tool-policy boundary with a controlled forbidden error.
</details>

<details><summary>Hint 3: Local issuer</summary>
The included issuer exists only to make the lab deterministic. Keep its secret long enough for HS256 and replace the entire issuer with a production authorization server outside the lab.
</details>
