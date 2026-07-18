# Lab 5 Reference Solution

This solution validates signed JWTs at the MCP HTTP boundary and applies least-privilege scope checks inside each tool. The included HS256 issuer is deterministic training infrastructure, not a production authorization server.

Run from this directory:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

Expected: `7 passed`.

For a manual exercise, start the server in one Git Bash terminal:

```bash
../../../.venv/Scripts/python.exe -m lab05.server
```

In a second terminal, issue a short-lived token into a shell variable:

```bash
token="$(../../../.venv/Scripts/python.exe -m lab05.issue_token --scopes incidents:read)"
```

Use it only as `Authorization: Bearer <token>` in a local MCP client or Inspector, then remove it from the shell:

```bash
unset token
```

Do not print, log, commit, or paste bearer tokens into screenshots.
