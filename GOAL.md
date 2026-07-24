# Goal

## Active objective

Monitor the live AI Engineer YouTube video below until captions or a replay
transcript are available. Analyze the transcript and turn the relevant ideas
and workflows into original, practical materials for an OpenAI trainer and
consultant.

Source: [Full Workshop: Setting Yourself Up for Success — Jason Liu, OpenAI
Codex](https://www.youtube.com/watch?v=il1c1a2FufU), published by AI Engineer

Status: **Complete — replay analyzed, claims reviewed, trainer materials
implemented, and completion audit passed**

## Working agreement

- Codex should re-read this file before each work cycle on the active goal.
- User edits under **Scope inbox** become part of the goal unless they conflict
  with a stated constraint or require new authorization.
- Codex should keep **Status**, **Work log**, and deliverable progress current.
- Material changes to the objective, source, or definition of done should be
  recorded explicitly instead of silently inferred.

## Scope inbox

Add or revise scope here while the goal is active. New items should describe an
outcome, audience, or constraint rather than only naming a topic.

- Identify the video's major ideas, demonstrations, tools, and workflows.
- Separate speaker claims from our conclusions and recommendations.
- Verify time-sensitive product claims against primary documentation where
  practical.
- Translate useful ideas into repeatable OpenAI training exercises.
- Identify workflows worth implementing in this repository.
- Document limitations, safety considerations, and organizational prerequisites.
- Preserve source attribution and timestamps in the notes.

## Planned deliverables

- A timestamped, original synthesis of the video
- A catalog of demonstrated ideas and workflows
- An evidence table separating source claims, observations, and verification
- An implementation backlog prioritized by training value
- One or more reusable instructor guides or labs for selected workflows
- Validation notes for anything implemented

## Deliverable progress

| Deliverable | Artifact | Status |
| --- | --- | --- |
| Timestamped synthesis | `review-notes/06-codex-workstreams-and-computer-use.md` | Drafted from complete replay captions |
| Workflow catalog | Same review note | Drafted |
| Evidence table | Same review note | Drafted and checked against current OpenAI documentation |
| Prioritized backlog | Same review note | Drafted |
| Instructor materials | Four replay-aligned guides under `instructor/` | Revised against replay; memory-vault fixture added |
| Validation notes | Guide validation record, this work log, and final repository checks | Complete |

## Source-handling rule

Captions or a transcript may be collected for analysis when available. The
repository will contain original summaries, structured notes, brief attributed
excerpts where necessary, and timestamps—not a republished full transcript.

## Definition of done

- The live event has ended and usable captions or equivalent source material
  have been reviewed.
- Important ideas and workflows are documented with timestamps.
- Relevant current claims have been verified or clearly marked as unverified.
- High-value workflows have been converted into actionable training material.
- Selected implementations have been tested or otherwise validated.
- Remaining opportunities are recorded in a prioritized backlog.

## Completion audit

| Requirement | Evidence | Result |
| --- | --- | --- |
| Event ended and usable source reviewed | 1:15:02 replay; complete English caption track from 00:00:01 through 01:14:46 | Proven |
| Important ideas and workflows timestamped | Workshop map and seven-workflow catalog in `review-notes/06-codex-workstreams-and-computer-use.md` | Proven |
| Current claims verified or qualified | Evidence table cites current OpenAI documentation and labels speaker patterns, historical guidance, and unverified claims | Proven |
| High-value workflows made actionable | Four instructor guides cover goals, workstream/subagent boundaries, Computer Use, and memory/heartbeat loops | Proven |
| Selected implementations validated | This `GOAL.md` governed the live-to-replay run; the vault fixture passed two manual cycles; structural, link, and diff checks passed | Proven |
| Remaining opportunities prioritized | P1/P2 morning brief, manager-thread, artifact-annotation, and skill-evaluation items remain in the review-note backlog | Proven |

## Work log

- 2026-07-24: Goal created while the referenced video was reportedly live.
- 2026-07-24: Confirmed through YouTube metadata that the session is live and
  public. An English VTT caption track is available while the stream is in
  progress. The first check reported approximately 1 hour 15 minutes of elapsed
  video.
- 2026-07-24: A later check confirmed 129 concurrent viewers and no replay yet.
  The live caption endpoint exposed only a rolling segment, so it was not
  treated as a complete transcript.
- 2026-07-24: Captured the video's public description. It identifies the
  preliminary themes as memory vaults, assistant threads, cross-thread
  collaboration, Computer Use, long-running workstreams, and loop-based work.
- 2026-07-24: Created
  `review-notes/06-codex-workstreams-and-computer-use.md` with a provisional
  evidence table, workflow catalog, implementation backlog, and caption-review
  protocol. Description-derived themes remain marked provisional until the
  finalized replay is reviewed.
- 2026-07-24: Implemented
  `instructor/codex-goals-and-editable-scope.md`, a reusable 30-minute exercise
  covering goal contracts, editable scope, evidence-based work logs, steering,
  and requirement-by-requirement completion audits. It is explicitly labeled
  as a current-docs implementation pending comparison with the replay.
- 2026-07-24: Confirmed the event remained live with 100 concurrent viewers and
  no replay. Tested historical caption recovery: the live VTT manifest is
  signed to a rolling 30-second duration, and YouTube's standard timed-text
  endpoint returned no transcript. Finalized captions remain the authoritative
  source dependency.
- 2026-07-24: Implemented
  `instructor/codex-computer-use-verification-loop.md`, a Windows-oriented
  exercise covering tool choice, app boundaries, permissions, foreground
  behavior, independent verification, stopping conditions, and a 12-point
  validation rubric.
- 2026-07-24: Implemented
  `instructor/codex-bounded-thread-collaboration.md`, a reusable exercise on
  read-heavy delegation, subtask contracts, primary-thread accountability,
  evidence consolidation, write ownership, and worktree boundaries. The guide
  preserves current documented terminology until the replay clarifies the
  speaker's phrase “assistant threads.”
- 2026-07-24: Confirmed the premiere ended and a replay is available. Retrieved
  the complete English automatic-caption track temporarily for analysis. It
  contains 3,950 events, beginning at 00:00:01 and ending at 01:14:46 for a
  1:15:02 replay. The caption files were not added to the repository.
- 2026-07-24: Reviewed the complete caption track in chronological segments and
  produced a timestamped original synthesis. The three workshop acts are:
  bringing context in, working through persistent context and threads, and
  taking actions into applications and artifacts.
- 2026-07-24: Replaced the provisional review note with a replay-derived
  timeline, seven-workflow catalog, evidence table, safety prerequisites, and
  prioritized implementation backlog. Speaker claims, observed
  demonstrations, current verification, and our training recommendations are
  labeled separately.
- 2026-07-24: Revised the goals, Computer Use, and thread-collaboration
  instructor guides against the replay. Added source timestamps, clarified
  macOS-only Appshots versus Windows Computer Use, distinguished pinned
  workstream threads from subagents, and added the workshop's warning that GUI
  fallback must not bypass approval boundaries.
- 2026-07-24: Implemented
  `instructor/codex-memory-vault-and-bounded-heartbeat.md` with a fully
  synthetic vault fixture. The lab teaches source-backed memory, Git-diff
  review, material-change filtering, same-thread recurrence, external-action
  boundaries, and a finite stopping condition.
- 2026-07-24: Ran the memory-vault fixture through two manual cycles in a
  disposable temporary Git repository. Cycle 1 changed only the three allowed
  durable files. Cycle 2 assertions confirmed sourced state correction, open
  loop closure, no rewrite of unchanged person context, and satisfaction of
  the stopping condition. No real automation or connector ran.
- 2026-07-24: Completed the repository audit. Sixteen scoped files passed
  whitespace and final-newline checks, all local Markdown links resolved, the
  replay evidence and remaining backlog were present, no VTT/JSON3/full
  transcript was added to the repository, and `git diff --check` passed.
