# Lab Authoring Standard

Every runnable lab in this repository must provide the same learner experience.

## Required learner assets

- Prerequisites and an estimated completion time
- Exact setup, run, test, and cleanup commands
- Starter code with bounded `TODO` markers
- Public, synthetic, or recorded fixtures
- Expected output for each major checkpoint
- Automated tests that describe the target behavior
- At least one seeded break/fix challenge
- Progressive hints that do not immediately reveal the solution
- A separately stored reference solution

## Required solution qualities

- Runs from a fresh clone with the documented commands
- Has a deterministic mode that needs no API key
- Validates data at trust boundaries
- Produces controlled errors without secrets or stack traces
- Tests happy paths, invalid inputs, and relevant failure modes
- Makes external side effects explicit and approval-gated
- Records enough sanitized context to troubleshoot a failed run

## Verification policy

Starter tests are allowed to fail at documented `TODO` checkpoints. Reference-solution tests must pass in CI. Live tests that require credentials must be opt-in and must never run against production data.
