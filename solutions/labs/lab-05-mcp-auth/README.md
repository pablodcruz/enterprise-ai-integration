# Lab 5 Reference Solution

This solution validates signed JWTs at the MCP boundary and checks scopes again inside each tool. The included issuer is deterministic training infrastructure, not a production authorization server.

Run the suite:

```powershell
..\..\..\.venv\Scripts\python.exe -m pytest -q
```

Manual test, terminal 1:

```powershell
..\..\..\.venv\Scripts\python.exe -m lab05.server
```

Terminal 2:

```powershell
$token = ..\..\..\.venv\Scripts\python.exe -m lab05.issue_token --scopes incidents:read
```

Use the token as `Authorization: Bearer <token>` in an MCP client. Never commit it. Tokens expire after fifteen minutes by default.
