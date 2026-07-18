# Lab 1 Reference Solution

This solution separates the application contract from its providers. Recorded mode validates deterministic fixtures; live mode uses `responses.parse` with the same Pydantic model and disables response storage.

From this directory:

```powershell
..\..\..\.venv\Scripts\python.exe -m pytest -q
..\..\..\.venv\Scripts\python.exe -m lab01.cli --mode recorded
```

Live mode is optional:

```powershell
$env:OPENAI_API_KEY = "..."
$env:OPENAI_MODEL = "your-approved-model"
..\..\..\.venv\Scripts\python.exe -m lab01.cli --mode live
```

The model is deliberately not hard-coded. Live runs require the learner to choose a currently available model explicitly.
