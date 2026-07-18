# Lab 4 Reference Solution

This solution separates three questions that are often mixed together:

- **Inspect mode:** can a normal MCP client initialize, discover tools, and invoke one?
- **Recorded mode:** does the intended tool-selection policy handle tool, no-tool, blocked, and refused cases?
- **Live mode:** can the Responses API import a deliberately bounded remote MCP surface?

Run the verified suite from this directory:

```bash
../../../.venv/Scripts/python.exe -m pytest -q -p no:cacheprovider tests
```

Expected: `7 passed`.

For manual local inspection, start the server in one terminal:

```bash
../../../.venv/Scripts/python.exe -m lab04.demo_server
```

Then run in another:

```bash
../../../.venv/Scripts/python.exe -m lab04.cli --mode inspect
../../../.venv/Scripts/python.exe -m lab04.cli --mode recorded --prompt "Explain incident severity"
```

The hosted Responses API cannot call this local HTTP endpoint. Optional live mode requires an explicitly chosen `OPENAI_MODEL`, an API key, and a deliberately deployed reachable HTTPS MCP endpoint.
