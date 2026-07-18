# Lab 4 Starter - MCP Client and Model Integration

Use the full [Lab 4 guide](../../lab-04-mcp-client-and-inspector.md). It explains every TODO, focused test, expected output, and manual check.

You will implement five TODOs in `lab04/client.py`:

1. discover tools through a direct MCP session;
2. invoke and normalize a tool result;
3. model deterministic tool-selection policy without an API key;
4. build a bounded remote-MCP configuration; and
5. construct a privacy-aware Responses API request.

From Git Bash:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

The untouched starter is expected to report `6 failed, 1 passed`. A completed implementation reports `7 passed`. The live Responses API exercise is optional; every required behavior is testable locally.
