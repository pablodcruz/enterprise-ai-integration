# Lab 1 — Responses and Structured Output

## Objective

Build a small model gateway that accepts a synthetic incident description and returns an exact, validated triage object.

## Scenario

An operations team wants consistent incident summaries. Free-form output is useful to read but unreliable for automation. Your gateway must separate model generation from application validation and expose useful failure information without leaking internal details.

## What You Will Build

- A Python or TypeScript command-line application.
- A versioned instruction file.
- An exact output schema with category and severity enums.
- Recorded mode for credential-free execution.
- Live mode using a model API.
- Structured request telemetry.

Required result fields:

```json
{
  "summary": "string",
  "category": "build|deployment|network|authentication|unknown",
  "severity": "low|medium|high|critical|unknown",
  "missing_information": ["string"],
  "recommended_next_step": "string"
}
```

## Requirements

1. Reject unknown fields and missing required fields.
2. Limit input length before the model call.
3. Keep credentials outside source code and model context.
4. Record request ID, prompt version, model ID, duration, status, and token usage when available.
5. Return a controlled contract error when validation fails.
6. Support a recorded fixture that passes through the same validator.
7. Add bounded retry behavior for retryable failures only.

## Checkpoints

- A valid recorded response passes the schema.
- A malformed response fails visibly.
- An unknown enum value fails visibly.
- A live request succeeds when credentials are configured.
- No secret appears in logs or output.

## Break/Fix Challenge

Your instructor will introduce one of these failures:

- Missing API credential
- Invalid model configuration
- Unknown output field
- Simulated rate limit
- Response timeout

Use the failure category and request evidence to identify the boundary before changing code.

## Deliverables

- Source code and schema
- `.env.example`
- Recorded fixture
- Unit tests for valid and invalid contracts
- Sanitized successful run
- Debugging log for one failure
- Short explanation: why is schema validity different from answer correctness?

## Learner Workflow

**Estimated time:** 75–90 minutes

**Prerequisites:** Python 3.12, the root lab dependencies, and the Model Application Foundations review note.

From the repository root, enter the starter and run its tests:

```powershell
Push-Location labs\starters\lab-01-responses
..\..\..\.venv\Scripts\python.exe -m pytest -q
```

The initial result should contain three failures: loose extra-field handling, an unimplemented recorded provider, and an unconstrained severity. Implement the `TODO` markers until all starter tests pass.

Compare only after completing the exercise:

```powershell
Pop-Location
Push-Location solutions\labs\lab-01-responses
..\..\..\.venv\Scripts\python.exe -m pytest -q
..\..\..\.venv\Scripts\python.exe -m lab01.cli --mode recorded
Pop-Location
```

Expected solution test result: `5 passed`. The recorded CLI prints a `SEV2` assessment for the checkout incident and does not require an API key.

## Progressive Hints

<details><summary>Hint 1: Contract</summary>
Use an enum for severity, constrained fields for bounded strings and lists, and `extra="forbid"` at the trust boundary.
</details>

<details><summary>Hint 2: Recorded provider</summary>
Index the fixture by exact input and validate the selected output with the same model used by the live provider. Fail closed when no exact fixture exists.
</details>

<details><summary>Hint 3: Live provider</summary>
Use `responses.parse`, pass the Pydantic class as `text_format`, disable storage, and require the live model name through configuration.
</details>
