# Teaching Codex Goals with Editable Scope

## Session outcome

Learners will convert a broad, long-running request into:

- A concise active goal
- A reviewable `GOAL.md` containing detailed and editable scope
- A definition of done based on evidence
- A work log that distinguishes progress from completion
- A safe method for steering the goal while it runs

This exercise implements the `GOAL.md` pattern Jason Liu demonstrates in the
AI Engineer workshop at 00:40:12–00:41:45. He uses Goal mode as a verifier,
keeps editable scope in a file, and suggests a work log or `state.md` for long
runs. At 00:44:35–00:45:10, he also recommends giving Codex the messy source
request and letting it help draft the goal.

The completion contract, evidence taxonomy, permission checks, and final audit
below are our training controls. They make the demonstrated pattern teachable
and testable; they should not be attributed to Jason unless separately stated.

Official reference:
[Long-running work](https://learn.chatgpt.com/docs/long-running-work)

## Audience and timing

- **Audience:** Developers, technical trainers, consultants, and team leads
- **Time:** 30 minutes
- **Format:** Demonstration followed by individual practice and debrief

## Prerequisites

- ChatGPT desktop app, Codex CLI, or Codex IDE extension with Goal mode
- A safe practice repository
- Permission to create or edit a Markdown file
- A task that requires multiple work cycles or external waiting

Do not use production credentials, customer data, or an irreversible external
workflow for this exercise.

## Mental model

```text
Active goal = concise completion contract
GOAL.md     = editable detail, evidence, and shared scope
Work log    = current-state record
Audit       = proof that the contract is satisfied
```

The active goal should remain short enough to evaluate repeatedly. Supporting
detail belongs in a file that the learner and agent can both inspect and edit.

## Demonstration scenario

Use this realistic prompt:

```text
Watch a live technical workshop. When the replay and captions become
available, analyze the ideas, verify product claims, and turn the useful
workflows into original training material.
```

Ask learners why this cannot be completed in one immediate response. Expected
answers include:

- The source is still changing.
- Captions may not be finalized.
- Product claims require separate verification.
- “Training material” does not define required artifacts.
- No evidence currently defines acceptable completion.

## Exercise 1: Write the completion contract

Rewrite the request using three fields:

| Field | Learner question |
| --- | --- |
| Outcome | What must exist when the work is finished? |
| Constraints | What sources, boundaries, or approaches must be respected? |
| Verification | What evidence proves the outcome is complete? |

Example:

```text
Monitor the supplied workshop until a finalized replay or captions are
available. Produce original timestamped notes, verify current Codex claims
against official sources, implement at least one reusable instructor exercise,
and validate every artifact against the definition of done in GOAL.md. Do not
republish the complete transcript.
```

### Checkpoint

The goal must name an outcome and verification evidence. “Watch the video” or
“research the topic” is an activity, not a completion contract.

## Exercise 2: Create the living goal file

Create `GOAL.md` with these sections:

```markdown
# Goal

## Active objective

## Working agreement

## Scope inbox

## Planned deliverables

## Source-handling rule

## Definition of done

## Work log
```

### Required content

- **Active objective:** The human-readable purpose of the work
- **Working agreement:** How edits and status updates will be handled
- **Scope inbox:** New outcomes or constraints the user can add while work runs
- **Planned deliverables:** Named artifacts, not vague intentions
- **Source-handling rule:** Attribution, privacy, copyright, or retention limits
- **Definition of done:** Observable conditions for completion
- **Work log:** Dated evidence and decisions

### Checkpoint

Exchange files with a partner. The partner should be able to answer:

1. What is the current objective?
2. Where should new scope be added?
3. What deliverables are required?
4. What source restrictions apply?
5. What evidence is still missing?

If any answer is unclear, revise the file.

## Exercise 3: Start and steer Goal mode

In the ChatGPT desktop app, Codex CLI, or Codex IDE extension:

1. Enter `/goal`.
2. Use the concise completion contract as the goal.
3. Point the goal to `GOAL.md` as its detailed, editable source of scope.
4. While work runs, add one meaningful item to **Scope inbox**.
5. Ask Codex to re-read `GOAL.md`, explain the impact, and update its plan.

According to current OpenAI guidance, follow-up messages can add context or
adjust constraints while a goal runs. They do not silently expand permissions,
sandbox access, or authorization.

### Checkpoint

The agent should preserve the original objective, incorporate the added scope,
and identify any new dependency or verification requirement. It should not
declare earlier work complete merely because one intermediate artifact exists.

## Exercise 4: Record evidence, not activity

Classify each proposed work-log entry:

| Entry | Evidence or activity? |
| --- | --- |
| “Researched captions” | Activity; too vague |
| “Replay reports `was_live=True`; English captions contain cues through 01:14:46” | Evidence |
| “Started instructor guide” | Activity |
| “Instructor guide contains timing, prerequisites, learner checkpoints, and validation criteria” | Evidence |
| “Everything looks good” | Unsupported conclusion |
| “All Markdown links resolve and every definition-of-done item maps to an inspected artifact” | Evidence, if the inspection is recorded |

Rewrite activity-only entries so they report current state and authoritative
evidence.

## Exercise 5: Run a completion audit

Before completing the goal, build this table:

| Requirement | Authoritative evidence | Result |
| --- | --- | --- |
| Source event ended | Replay metadata | Proven / missing |
| Captions reviewed | Final cue range and analysis record | Proven / missing |
| Timestamped synthesis | Review-note sections with timestamps | Proven / missing |
| Product claims verified | Evidence table with official sources | Proven / missing |
| Training workflow implemented | Instructor or lab artifact | Proven / missing |
| Implementation validated | Tests or documented review checklist | Proven / missing |
| Remaining opportunities recorded | Prioritized backlog | Proven / missing |

The goal is complete only when every required row is proven. “No obvious
problems” is not proof.

## Facilitator demonstration

Use the repository's [GOAL.md](../GOAL.md) as the worked example:

1. Show the difference between the concise active objective and detailed scope.
2. Trace the work log from a rolling live-caption limitation to the finalized
   replay evidence.
3. Show how workshop claims are kept separate from current product
   verification and our recommendations.
4. Open the implementation backlog and distinguish completed artifacts from
   opportunities that still need a runnable lab.
5. Ask learners to audit one definition-of-done item against the actual file.

## Common misconceptions

- **“The goal file replaces the active goal.”** The active goal controls the
  current run; the file carries longer, editable detail.
- **“Any new user idea belongs in scope automatically.”** Record material
  changes explicitly and surface new authorization or risk.
- **“A work log should narrate everything the agent tried.”** Keep decisions,
  evidence, blockers, and meaningful state changes.
- **“Progress means the goal is almost complete.”** Completion depends on the
  definition of done, not perceived effort.
- **“A goal grants broader access.”** Goal mode keeps the existing permission
  and sandbox boundaries.
- **“The agent should stop when an external source is unavailable.”** It should
  make safe, aligned progress where possible and keep the actual completion
  condition intact.

## Debrief questions

1. Which details belong in the active goal, and which belong in `GOAL.md`?
2. How does the scope inbox change collaboration with the agent?
3. What makes a work-log entry trustworthy?
4. Which definition-of-done item was hardest to prove?
5. When should a new request become a separate goal instead of added scope?

## Validation checklist

- [ ] The active goal states an outcome.
- [ ] Constraints and source rules are explicit.
- [ ] `GOAL.md` has an editable scope inbox.
- [ ] Deliverables are named.
- [ ] Every definition-of-done item is observable.
- [ ] Work-log entries report evidence or decisions.
- [ ] Added scope is acknowledged and incorporated.
- [ ] Permissions are not silently broadened.
- [ ] The final audit maps every requirement to authoritative evidence.

## Source alignment

The replay supports these workshop attributions:

- 00:40:12: a Goal supplies a verifier that keeps working toward a finish line.
- 00:41:16–00:41:45: detailed scope can live in `GOAL.md`, the user can edit it
  while work runs, and a work log or `state.md` can preserve longer-run state.
- 00:44:35–00:45:10: a long, imperfect voice request can be source material for
  Codex to organize into a goal or workflow.

Our additions are the structured scope inbox, evidence-versus-activity
classification, explicit permission rule, requirement-by-requirement
completion table, and validation checklist. They answer the workshop's
verification theme without claiming to reproduce Jason's exact internal files.
