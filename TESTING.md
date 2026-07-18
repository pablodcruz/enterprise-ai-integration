# Testing Labs 1–5

The reference solutions default to deterministic fixtures. No OpenAI API key is required for the automated suite.

## 1. Create the environment

From the repository root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --no-cache-dir -r requirements\labs.txt
```

On macOS or Linux, replace `.\.venv\Scripts\python.exe` with `./.venv/bin/python`.

## 2. Run every verified solution

```powershell
.\.venv\Scripts\python.exe scripts\test_labs.py
```

Expected final line:

```text
All 5 selected lab solution suites passed.
```

Run one lab while troubleshooting:

```powershell
.\.venv\Scripts\python.exe scripts\test_labs.py --lab 3
```

## 3. Exercise deterministic command-line flows

```powershell
Push-Location solutions\labs\lab-01-responses
..\..\..\.venv\Scripts\python.exe -m lab01.cli --mode recorded
Pop-Location

Push-Location solutions\labs\lab-02-tool-contracts
..\..\..\.venv\Scripts\python.exe -m lab02.cli
Pop-Location

Push-Location solutions\labs\lab-04-mcp-client
..\..\..\.venv\Scripts\python.exe -m lab04.cli --mode recorded --prompt "Find the checkout incident"
Pop-Location
```

Expected behaviors:

- Lab 1 prints a schema-valid `SEV2` checkout assessment.
- Lab 2 prints bounded search results and a `pending` proposal with a SHA-256 payload hash.
- Lab 4 prints a trace selecting `search_incidents` without contacting a model.

## 4. Manually inspect the MCP transport

Terminal 1:

```powershell
Set-Location solutions\labs\lab-03-mcp-server
..\..\..\.venv\Scripts\python.exe -m lab03.server
```

Terminal 2:

```powershell
curl.exe http://127.0.0.1:8000/health
npx -y @modelcontextprotocol/inspector
```

Select Streamable HTTP and connect to `http://127.0.0.1:8000/mcp`. The tool list must contain exactly:

```text
search_incidents
get_incident
draft_incident_comment
```

Call `search_incidents` with:

```json
{"query":"checkout","limit":5}
```

The result should contain incident `INC-1001` and a `request_id` beginning with `req_`.

## 5. Manually test authentication

Terminal 1:

```powershell
Set-Location solutions\labs\lab-05-mcp-auth
..\..\..\.venv\Scripts\python.exe -m lab05.server
```

Terminal 2, from the same solution directory:

```powershell
$readToken = ..\..\..\.venv\Scripts\python.exe -m lab05.issue_token --scopes incidents:read
$proposalToken = ..\..\..\.venv\Scripts\python.exe -m lab05.issue_token --scopes incidents:propose
```

Configure an MCP client with `Authorization: Bearer <token>`. Confirm:

- No token fails with HTTP 401.
- The read token can call `search_incidents`.
- The read token cannot call `draft_incident_comment`.
- The proposal token creates a `pending` proposal and performs no external write.

Treat these local tokens as secrets even though the issuer is only training infrastructure.

## 6. Optional live OpenAI checks

Live calls are not part of the default test suite.

```powershell
$env:OPENAI_API_KEY = "your-key"
$env:OPENAI_MODEL = "a-model-enabled-for-your-project"
Set-Location solutions\labs\lab-01-responses
..\..\..\.venv\Scripts\python.exe -m lab01.cli --mode live
```

Lab 4 live mode additionally needs a deliberately deployed, reachable HTTPS MCP URL. The hosted Responses API cannot reach `localhost`.

## Cleanup

Stop development servers with `Ctrl+C`. Remove tokens from the shell session:

```powershell
Remove-Variable readToken, proposalToken -ErrorAction SilentlyContinue
Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPENAI_MODEL -ErrorAction SilentlyContinue
```
