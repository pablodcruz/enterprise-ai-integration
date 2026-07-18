# Lab 4 Reference Solution

Recorded mode evaluates tool-selection policy without an API key. Inspect mode exercises the MCP protocol directly. Live mode builds a Responses remote-MCP request with `allowed_tools`, `require_approval: always`, a tool-call limit, response storage disabled, and a privacy-preserving safety identifier.

Terminal 1:

```powershell
..\..\..\.venv\Scripts\python.exe -m lab04.demo_server
```

Terminal 2:

```powershell
..\..\..\.venv\Scripts\python.exe -m lab04.cli --mode inspect
..\..\..\.venv\Scripts\python.exe -m lab04.cli --mode recorded --prompt "Explain incident severity"
..\..\..\.venv\Scripts\python.exe -m pytest -q
```

The OpenAI-hosted Responses API cannot call `localhost`. Live mode requires a reachable HTTPS MCP URL, such as a deliberately configured test deployment or secure tunnel.
