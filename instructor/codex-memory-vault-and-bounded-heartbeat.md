# Teaching a Reviewable Memory Vault and Bounded Heartbeat

## Session outcome

Learners will build a small file-backed memory vault, process two synthetic
updates in the same workstream thread, review each memory diff, and stop the
recurring loop when its terminal condition is met.

The workflow is based on Jason Liu's AI Engineer workshop:

- 00:18:40–00:24:12: a personal monorepo/vault, `AGENTS.md`, and Git diffs as
  the memory-review surface
- 00:35:06–00:40:06: scheduled messages that wake the same thread
- 01:00:00–01:04:30: project and people pages as the most useful vault areas
- 01:12:48–01:14:15: low-noise responses, adjustable cadence, and loop
  scheduling

Our additions are a source field for every durable fact, a synthetic-data
boundary, an explicit no-send rule, a material-change filter, and a finite
stopping condition.

Official references:

- [Memories](https://learn.chatgpt.com/docs/customization/memories)
- [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Long-running work](https://learn.chatgpt.com/docs/long-running-work)

Speaker companion sources:

- [Codex-maxxing](https://jxnl.co/writing/2026/05/10/codex-maxxing/)
- [Two kinds of scheduled work in Codex](https://jxnl.co/writing/2026/06/28/two-kinds-of-scheduled-work-in-codex/)

## Audience and timing

- **Audience:** Technical trainers, consultants, operators, and team leads
- **Time:** 45 minutes
- **Format:** Vault setup, two manual heartbeat cycles, diff review, optional
  scheduling discussion

## Prerequisites

- Codex with access to a disposable local Git repository
- The
  [synthetic vault fixture](fixtures/codex-memory-vault/README.md)
- Permission to create and edit files in the disposable copy
- No customer, employee, email, calendar, or production-system data

Do not activate a real automation for the core lab. Manual cycles make the
state transition, review step, and stopping behavior visible before recurrence
is introduced.

## Mental model

```text
Workstream thread
  reads durable context
      ↓
inspects one authorized input
      ↓
updates only material facts
      ↓
produces a reviewable Git diff
      ↓
reports change or NO_CHANGE
      ↓
continues only if another input remains
```

The vault is an explicit, reviewable knowledge store. It is not the same as
Codex product memory, and it does not replace required repository instructions.

## Data placement rules

| Information | Surface | Reason |
| --- | --- | --- |
| Repository-wide operating rule | `AGENTS.md` | Required and reviewable |
| Current project status or decision | `projects/` | Durable workstream context |
| Stable collaborator role or stated preference | `people/` | Reusable person context |
| Unresolved commitment | `TODO.md` | Visible open loop |
| Temporary source update | `inputs/` | Evidence, not durable truth by itself |
| Personal preference recalled across eligible chats | Product memory | Optional recall layer |
| Secret, credential, or unnecessary personal detail | Nowhere in the vault | Minimize risk and retention |

Promote a source statement into durable memory only when it is relevant,
supported, and likely to matter again.

## The heartbeat contract

Use this contract for every cycle:

```text
Input boundary:
Durable files allowed to change:
Material-change rule:
Evidence required:
External actions prohibited:
Escalation condition:
No-change response:
Stopping condition:
```

For this lab:

```text
Input boundary: Process only the named file under inputs/.
Durable files allowed to change: TODO.md, projects/, and people/.
Material-change rule: Record only a new or corrected owner, date, decision,
status, explicit preference, or open loop.
Evidence required: Every new fact names its source input.
External actions prohibited: Do not send, publish, upload, schedule, or contact
anyone.
Escalation condition: Report contradictions or ambiguous identity; do not
guess.
No-change response: NO_CHANGE
Stopping condition: Both numbered input files are processed and no open
contradiction remains.
```

## Instructor setup

Copy the fixture into a disposable folder. On PowerShell:

```powershell
Copy-Item -Recurse `
  instructor/fixtures/codex-memory-vault `
  $env:TEMP/codex-memory-vault-practice
Set-Location $env:TEMP/codex-memory-vault-practice
git init
git add .
git commit -m "Create synthetic vault baseline"
```

If Git identity is not configured, skip the commit and use a file comparison
tool. Never point this lab at a real personal vault.

## Cycle 1: establish durable context

Prompt the workstream thread:

```text
Follow the local AGENTS.md and the heartbeat contract in the instructor guide.
Process inputs/01-kickoff.md only.

Update durable vault files only for supported, material facts. Cite the input
file beside every added fact. Do not send, publish, upload, schedule, or contact
anyone. Then show the Git diff, list unresolved items, and say whether the
stopping condition is met.
```

### Expected evidence

- `projects/launch-alpha.md` gains a supported owner and kickoff date.
- `people/alex-chen.md` gains a stated communication preference.
- `TODO.md` preserves the unresolved approval item.
- No fact from the second input appears.
- The response says the stopping condition is not met.

Review the diff before continuing. Reject any inferred personality trait,
unstated deadline, or external action.

## Cycle 2: correct state and stop

Prompt the same thread:

```text
Run the next heartbeat cycle. Process inputs/02-follow-up.md only under the
same contract. Update supported durable facts, show the Git diff since the
previous cycle, list unresolved items, and evaluate the stopping condition.
```

### Expected evidence

- The project launch date is updated rather than duplicated.
- Legal approval is recorded as complete with a source.
- The corresponding open loop is closed or marked complete.
- No unsupported reason for the date change is invented.
- The response says the stopping condition is met and does not propose another
  cycle.

## Diff review protocol

For each changed line, ask:

1. Is it supported by the named input?
2. Is it durable enough to keep?
3. Is it in the correct file?
4. Is it phrased as fact rather than inference?
5. Does it expose unnecessary personal or sensitive information?
6. Does it conflict with existing context?
7. Did the agent close an open loop only when evidence supported closure?

The diff is a review surface, not proof that the memory is correct.

## Optional recurrence extension

After both manual cycles pass, discuss scheduling without activating it.

Use a recurring message in the same workstream thread when the next check
depends on that thread's history. Use a fresh scheduled task when each run can
start clean. Before enabling either, define:

- Cadence and permitted time window
- Authorized sources
- Material-change threshold
- Minimal no-change response
- Escalation trigger
- External-action boundary
- Terminal condition
- Owner who reviews and disables the schedule

UI labels and scheduling capabilities can change. Verify the current Codex
surface and organizational policy at delivery time.

## Failure modes

### The vault becomes a transcript dump

**Correction:** Store decisions and durable state, not full source messages.

### Preferences become personality judgments

**Correction:** Keep only explicit, work-relevant preferences with sources.

### A heartbeat reports the same state repeatedly

**Correction:** Add a material-change filter and use the minimal no-change
response.

### The loop never ends

**Correction:** Replace “keep checking forever” with an observable terminal
condition, maximum lifespan, and human escalation point.

### An integration failure becomes permission to use another channel

**Correction:** A fallback tool does not inherit authorization to send, upload,
or publish.

### Product memory conflicts with the vault

**Correction:** Treat checked-in instructions and verified project records as
the authoritative source; correct or remove stale memory.

## Validation rubric

Score each category from 0–2:

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Source fidelity | Unsupported facts | Some sources | Every material fact has evidence |
| Placement | Facts stored arbitrarily | Mostly organized | Rules, projects, people, and open loops separated |
| Privacy | Sensitive data retained | General caution | Synthetic/minimized data boundary enforced |
| Diff review | Changes accepted blindly | Diff viewed | Every durable change evaluated |
| Recurrence | Unbounded polling | Cadence only | Cadence, no-change rule, escalation, and stop condition |
| External actions | Implicit | Some boundary | Sending, publishing, uploading, and scheduling explicitly controlled |

A passing implementation scores at least 10/12 with no zero in Source
fidelity, Privacy, or External actions.

## Debrief

1. Which source facts deserved durable storage, and which did not?
2. Why is a Git diff useful but insufficient as verification?
3. When should a correction replace a fact rather than append another version?
4. Why does the second cycle belong in the same thread?
5. What would make this workflow safe enough for real organizational data?
6. What terminal condition would bound a real monitoring workflow?

## Validation record

Validated on July 24, 2026 with a disposable copy of the synthetic fixture:

- The baseline initialized as a local Git repository.
- Cycle 1 changed only `TODO.md`, `projects/launch-alpha.md`, and
  `people/alex-chen.md`.
- The owner, kickoff, pending approval, and stated update preference all
  retained `inputs/01-kickoff.md` as evidence.
- Cycle 2 replaced the unknown launch date, recorded approval, and closed the
  matching open loop using `inputs/02-follow-up.md`.
- Cycle 2 did not rewrite unchanged person context.
- Automated assertions confirmed that no open contradiction remained and the
  stated stopping condition was met.

This was a manual two-cycle fixture dry run. It validates the lab data,
expected diffs, and stop logic; it does not claim that a real scheduled
automation or external connector was executed.
