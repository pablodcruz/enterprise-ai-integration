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
