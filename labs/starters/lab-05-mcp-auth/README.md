# Lab 5 Starter - MCP Authentication and Scopes

Use the full [Lab 5 guide](../../lab-05-mcp-authentication-and-scopes.md). It provides the security model, analogous snippets, focused tests, manual commands, expected outputs, hints, and troubleshooting.

The server, client, local token issuer, metadata endpoint, and integration tests are provided. You implement only two security-critical TODOs in `lab05/auth.py`:

1. validate a JWT and convert valid claims into an MCP `AccessToken`; and
2. enforce a required scope while distinguishing absent identity from insufficient authority.

From Git Bash:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

The untouched starter is expected to report `6 failed, 1 passed`. A completed implementation reports `7 passed`. Use only the synthetic local issuer and data supplied by the lab.
