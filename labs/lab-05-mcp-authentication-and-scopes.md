# Lab 5 - MCP Authentication and Scopes

## Why this lab exists

Tool metadata tells a model what a capability does; it does not authorize a caller to use it. Authorization must be enforced by the MCP resource server using validated identity and explicit policy, independently of the prompt.

This lab protects the synthetic incident server with bearer tokens and per-tool scopes. All required information is in this guide and the starter. An AI assistant is optional, and no external identity provider or API key is required.

**Estimated time:** 120-150 minutes

**Prerequisites:** Labs 3 and 4; basic HTTP and Python knowledge

**Required credentials:** none

**Data:** synthetic incident records only

## Learning outcomes

By the end, you will be able to:

1. distinguish an authorization server, MCP resource server, and MCP client;
2. validate JWT signature and security-relevant claims;
3. convert accepted claims into the identity type expected by the MCP SDK;
4. enforce least-privilege scope policy inside tools;
5. explain the difference between a missing/invalid credential and an under-scoped identity;
6. publish protected-resource metadata for client discovery; and
7. test authentication and authorization without logging credentials.

## Security model

Three roles participate in an OAuth-protected MCP flow:

| Role | Responsibility | Lab component |
| --- | --- | --- |
| Authorization server | authenticates/grants and issues access tokens | `LocalTokenIssuer` simulation |
| MCP resource server | validates bearer tokens and enforces authorization | `lab05.server` |
| MCP client | discovers auth requirements, obtains a token, and calls tools | `lab05.client` or Inspector |

The local issuer signs tokens with a shared HS256 secret so the exercise stays deterministic. It does not implement login, consent, client registration, key rotation, revocation, or authorization endpoints. In production, replace it with a real authorization server and validate tokens according to that system's published metadata and keys.

## Authentication versus authorization

- **Authentication:** can the server establish a valid identity from the credential?
- **Authorization:** may that established identity perform this specific operation?

The server validates the bearer token before the MCP session is created. Each tool then checks the scope it requires. Prompt text, model output, locale, and tool arguments never grant authority.

```text
request
  -> bearer token present?
  -> signature and claims valid?
  -> MCP session initialized
  -> selected tool's required scope present?
  -> tool executes or returns a controlled error
```

## Token claims used in the lab

| Claim | Meaning | Validation |
| --- | --- | --- |
| `iss` | token issuer | exact configured issuer |
| `aud` | intended resource | exact MCP resource URL |
| `sub` | subject identity | required |
| `client_id` | client identifier | copied into `AccessToken` |
| `scope` | space-delimited grants | required and parsed |
| `iat` | issued-at time | required |
| `exp` | expiration time | required and checked |

A valid signature alone is insufficient. A correctly signed token for another audience must be rejected. An expired token must be rejected. The verifier restricts acceptable algorithms instead of trusting the token header to choose one.

## Scope model

| Scope | Capability |
| --- | --- |
| `incidents:read` | `search_incidents`, `get_incident` |
| `incidents:propose` | `draft_incident_comment` |
| `incidents:write` | deliberately absent/reserved |

The proposal tool produces `status: pending`; it does not perform an external write. A token with `incidents:read` must not gain proposal access merely because a prompt asks for it.

## 401, forbidden tool errors, and HTTP 403

This lab makes an important implementation distinction:

- A missing or invalid bearer token is rejected at the HTTP boundary with **401** and a `WWW-Authenticate` challenge.
- A valid token that lacks a particular tool's scope reaches the MCP session, but that tool returns a controlled MCP error containing **`FORBIDDEN`**.

The second case is not an HTTP 403 in this training server. FastMCP's global `required_scopes` can reject an entire MCP endpoint with HTTP 403, but this lab has different scope requirements for different tools on the same endpoint. It therefore keeps global scopes empty and enforces the dynamic per-tool rule inside each tool.

In a production design, document this contract precisely. If your architecture requires HTTP 403 per capability, place capabilities behind separately protected resources/endpoints or use authorization middleware that can decide before tool execution.

## Protected-resource discovery

The server publishes:

```text
/.well-known/oauth-protected-resource/mcp
```

The document identifies the resource URL, authorization server, supported scopes, and header-based bearer method. A 401 challenge points clients to this metadata location.

Metadata helps clients discover how to authenticate. It does not replace token validation or scope enforcement.

## Starter map

| File | What is provided | What you implement |
| --- | --- | --- |
| `lab05/auth.py` | local issuer and class skeletons | JWT verifier and scope policy |
| `lab05/server.py` | metadata, bearer boundary, tools, scope calls | nothing |
| `lab05/client.py` | authenticated direct MCP call | nothing |
| `lab05/issue_token.py` | local short-lived token CLI | nothing |
| `tests/test_lab05.py` | seven unit/integration tests | nothing |

There are only two TODOs, but both are security-sensitive. Make the behavior small, explicit, and fail closed.

## Setup

From the repository root, install the pinned lab dependencies if needed.

Git Bash:

```bash
python -m venv .venv
./.venv/Scripts/python.exe -m pip install --no-cache-dir -r requirements/labs.txt
cd labs/starters/lab-05-mcp-auth
```

PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --no-cache-dir -r requirements\labs.txt
Set-Location labs\starters\lab-05-mcp-auth
```

Run the untouched baseline:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

Expected:

```text
6 failed, 1 passed
```

The passing test proves that the server can publish metadata and challenge an unauthenticated request before your verifier is complete. The failures correspond to the two TODOs and their end-to-end consequences.

## Milestone 1 - Verify signature and claims

Implement TODO 1 in `JWTTokenVerifier.verify_token`.

Use `jwt.decode` with:

- `self.secret` as the verification key;
- `algorithms=["HS256"]` as an explicit allowlist;
- `issuer=self.issuer`;
- `audience=self.audience`; and
- required claims `exp`, `iat`, `iss`, `aud`, `sub`, and `scope`.

Use this analogous pattern:

```python
try:
    claims = jwt.decode(
        compact_token,
        verification_key,
        algorithms=["HS256"],
        issuer=expected_issuer,
        audience=expected_audience,
        options={"require": ["exp", "iat", "iss", "aud", "sub", "scope"]},
    )
except jwt.PyJWTError:
    return None
```

Do not log `compact_token` in the exception path.

For accepted claims:

1. split the space-delimited `scope` string;
2. discard empty entries; and
3. return `AccessToken` with the original token, client ID, scopes, expiration, resource, subject, and claims.

An analogous conversion is:

```python
AccessToken(
    token=compact_token,
    client_id=claims.get("client_id", "unknown-client"),
    scopes=parsed_scopes,
    expires_at=claims["exp"],
    resource=expected_audience,
    subject=claims["sub"],
    claims=claims,
)
```

Run the verifier tests:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab05.py::test_verifier_accepts_valid_claims \
  tests/test_lab05.py::test_verifier_rejects_wrong_audience_expired_and_malformed_tokens
```

Expected: `2 passed`.

Notice what the negative test covers: wrong resource audience, expiration, and malformed compact syntax. You could extend it with wrong issuer, missing claim, and invalid signature cases.

## Milestone 2 - Enforce per-tool scopes

Implement TODO 2 in `ScopePolicy.require`.

The contract is:

```text
access_token is None
  -> raise PermissionError containing UNAUTHENTICATED

required_scope absent from access_token.scopes
  -> raise PermissionError containing FORBIDDEN and the missing scope

scope present
  -> return the AccessToken unchanged
```

Run:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab05.py::test_scope_policy_distinguishes_missing_under_scoped_and_allowed
```

Expected: `1 passed`.

Returning the accepted token lets the tool use validated identity data, such as `subject`, without decoding the raw JWT again.

## Milestone 3 - Inspect discovery and the 401 challenge

This behavior is already implemented, but you should verify and explain it:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab05.py::test_metadata_is_discoverable_and_missing_token_receives_401
```

Expected: `1 passed`.

The test confirms all of the following:

- the metadata path is public;
- `resource` matches the MCP URL;
- supported scopes include read and propose;
- the unauthenticated MCP request receives 401; and
- `WWW-Authenticate` points toward protected-resource metadata.

## Milestone 4 - Exercise authorization end to end

The final three tests launch a real MCP server subprocess and use real signed tokens over Streamable HTTP.

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider \
  tests/test_lab05.py::test_read_scoped_token_can_call_read_tool \
  tests/test_lab05.py::test_read_scoped_token_is_forbidden_from_proposal_tool \
  tests/test_lab05.py::test_proposal_scoped_token_can_create_nonexecuting_proposal
```

Expected: `3 passed`.

The matrix proves:

| Identity | Tool | Expected result |
| --- | --- | --- |
| read-scoped | search | success; subject returned |
| read-scoped | proposal | MCP error containing `FORBIDDEN` |
| proposal-scoped | proposal | success with `status: pending` |

## Milestone 5 - Complete verification

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

Expected:

```text
7 passed
```

No test requires an OpenAI key, external identity provider, Docker service, or public endpoint.

## Manual inspection in Git Bash

Use two terminals in the starter directory.

Terminal 1:

```bash
export LAB_TOKEN_SECRET="local-training-secret-change-me-before-use"
../../../.venv/Scripts/python.exe -m lab05.server
```

Terminal 2 - inspect public metadata without a token:

```bash
curl -s http://127.0.0.1:8020/.well-known/oauth-protected-resource/mcp
```

Expected JSON fields:

```json
{
  "resource": "http://127.0.0.1:8020/mcp",
  "authorization_servers": ["http://127.0.0.1:8020/"],
  "scopes_supported": ["incidents:read", "incidents:propose"],
  "bearer_methods_supported": ["header"]
}
```

Inspect the challenge without exposing a token:

```bash
curl -i http://127.0.0.1:8020/mcp
```

Expected status: `401 Unauthorized`, with a `WWW-Authenticate: Bearer ...` header.

Issue a read-scoped token into a variable:

```bash
export LAB_TOKEN_SECRET="local-training-secret-change-me-before-use"
token="$(../../../.venv/Scripts/python.exe -m lab05.issue_token \
  --subject learner@example.test --scopes incidents:read)"
```

Configure MCP Inspector for Streamable HTTP at `http://127.0.0.1:8020/mcp` and set the Authorization header to `Bearer <token>`. Do not include the token in screenshots or copied traces.

After the exercise:

```bash
unset token
unset LAB_TOKEN_SECRET
```

Stop the server with Ctrl+C.

## Break/fix challenge

Symptom: a token has a valid signature, but access still fails.

Use this order:

| Evidence | Interpretation | Check |
| --- | --- | --- |
| HTTP 401 | authentication failed before MCP | token syntax, signature, issuer, audience, expiration |
| MCP initializes, tool returns `FORBIDDEN` | identity valid, authority insufficient | exact tool scope |
| read works, proposal fails | least privilege operating correctly | request a proposal grant only if justified |
| all tools fail after URL change | audience/resource mismatch | exact `aud` and `LAB_RESOURCE_URL` |
| metadata lists wrong scopes | discovery/config mismatch | metadata route and policy map |

Do not "fix" a scope failure by accepting any signed token or granting every scope. Determine the minimum grant required for the task.

## Progressive hints

<details>
<summary>Hint 1 - Fail closed</summary>

Catch `jwt.PyJWTError` and return `None`. Do not create an identity from partially decoded claims after any verification failure.
</details>

<details>
<summary>Hint 2 - Algorithm restriction</summary>

Pass `algorithms=["HS256"]` explicitly to `jwt.decode`; do not derive the accepted algorithm from untrusted token input.
</details>

<details>
<summary>Hint 3 - Scope parsing</summary>

The issuer stores scopes as one space-delimited string. Use a list comprehension over `claims["scope"].split()`.
</details>

<details>
<summary>Hint 4 - Policy order</summary>

Check for `None` before accessing `.scopes`. Then test membership of the exact required scope.
</details>

<details>
<summary>Hint 5 - Integration failures</summary>

If verifier unit tests pass but all authenticated calls fail, confirm the subprocess and token issuer use identical secret, issuer, and audience environment variables.
</details>

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| `command not found` in Git Bash | Windows path typed with backslashes | use forward slashes and `.exe` |
| every token receives 401 | secret/issuer/audience mismatch | compare server environment with issuer configuration |
| token expires immediately | clock/lifetime issue | use current time and a positive lifetime |
| read token cannot initialize MCP | verifier failed, not scope policy | run verifier tests and inspect only sanitized claims |
| read works but proposal returns `FORBIDDEN` | expected least privilege | use a proposal-scoped token for that tool |
| metadata returns empty scopes | wrong route is serving metadata | ensure the explicit route precedes the mounted MCP app |
| port 8020 already in use | another process is listening | stop it or set a consistent alternate `LAB_PORT` |

## Safe handling checklist

- Keep tokens short-lived.
- Never commit secrets or bearer tokens.
- Never print a token in application logs.
- Redact authorization headers in traces.
- Use synthetic subjects and data in screenshots.
- Clear shell variables after manual testing.
- Treat the local shared-secret issuer as a lab fixture only.
- Use HTTPS and a real authorization server in production.

## Deliverables

- completed `lab05/auth.py`;
- `7 passed` output;
- protected-resource metadata with no credentials;
- a sanitized test matrix showing 401, forbidden tool error, and success; and
- a short explanation of authentication, authorization, and the lab's HTTP 403 limitation.

## Reflection questions

1. Why does signature validity not prove that a token is intended for this MCP server?
2. Why is scope enforcement inside the resource server rather than in the prompt?
3. What is the security difference between 401 and the lab's controlled `FORBIDDEN` tool error?
4. What capabilities are missing from the local issuer that a production authorization server supplies?
5. How would you change the architecture if HTTP 403 were mandatory for each distinct capability?

## Further reading

- [MCP authorization specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP authorization tutorial](https://modelcontextprotocol.io/docs/tutorials/security/authorization)
- [MCP Python SDK authorization guide](https://py.sdk.modelcontextprotocol.io/authorization/)
- [OpenAI remote MCP security guidance](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
