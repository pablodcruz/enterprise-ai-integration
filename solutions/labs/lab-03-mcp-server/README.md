# Lab 3 Reference Solution

The server mounts a stateless JSON Streamable HTTP MCP endpoint at `/mcp`, with health and readiness endpoints outside the protocol surface.

```powershell
..\..\..\.venv\Scripts\python.exe -m pytest -q
..\..\..\.venv\Scripts\python.exe -m lab03.server
```

In another terminal:

```powershell
curl.exe http://127.0.0.1:8000/health
npx -y @modelcontextprotocol/inspector
```

Connect the Inspector to `http://127.0.0.1:8000/mcp` using Streamable HTTP.

Container mode:

```powershell
docker build -t enterprise-ai-lab03 .
docker run --rm -p 8000:8000 -e LAB_HOST=0.0.0.0 enterprise-ai-lab03
```
