# Codex Workstreams, Threads, Memory, and Computer Use

## Source and evidence status

This is an original synthesis of
[Full Workshop: Setting Yourself Up for Success — Jason Liu, OpenAI
Codex](https://www.youtube.com/watch?v=il1c1a2FufU), published by AI Engineer
on July 24, 2026.

The YouTube premiere ended with a replay duration of 1:15:02. The complete
English automatic-caption track was reviewed from its first cue at 00:00:01
through its final cue at 01:14:46. Captions were collected temporarily for
analysis and were not committed to this repository.

Timestamps identify the workshop evidence; summaries are paraphrases unless
explicitly labeled as a quotation. Product behavior is verified separately
because workshop demonstrations and model names can age quickly.

Companion sources by Jason Liu:

- [Codex-maxxing](https://jxnl.co/writing/2026/05/10/codex-maxxing/)
- [Three Ways Codex Can Use a Computer](https://jxnl.co/writing/2026/06/16/three-ways-codex-can-use-a-computer/)
- [Two kinds of scheduled work in Codex](https://jxnl.co/writing/2026/06/28/two-kinds-of-scheduled-work-in-codex/)
- [Six levels of complexity in a Codex morning brief](https://jxnl.co/writing/2026/05/18/six-levels-of-complexity-of-an-ai-powered-morning-brief-with-codex/)

## Executive synthesis

The workshop's central idea is that Codex can be treated as a persistent work
environment rather than a sequence of isolated prompts. Jason organizes the
system into three acts:

1. **Bring context in:** use voice, Appshots, plugins, skills, and an explicit
   memory vault.
2. **Work with context:** keep durable, named threads; let threads coordinate;
   use goals and scheduled wake-ups to keep work moving.
3. **Take actions out:** draft or act through files, connectors, browsers,
   Computer Use, and reviewable artifacts.

The compounding mechanism is not a single feature. It is a loop in which the
agent reads durable context, acts through the narrowest useful capability,
verifies what changed, writes important learning back to a reviewable surface,
and wakes again only while a stopping condition remains unmet.

Our training version adds controls the workshop mentions but does not always
formalize: authorization boundaries, source hierarchy, independent
verification, write ownership, privacy minimization, and explicit stopping
rules.

## Timestamped workshop map

| Time | Workshop idea or demonstration | Evidence type | Training interpretation |
| --- | --- | --- | --- |
| 00:01:09–00:02:05 | Long-running app building, evaluation loops, Computer Use, and operational work are presented as Codex use cases. | Speaker framing | Teach a work system, not a list of prompts. |
| 00:03:37–00:04:46 | Jason describes very long threads, voice input, Appshots, and investing in personal memory. | Speaker experience | Rich context and durable state reduce repeated onboarding. |
| 00:06:02–00:07:23 | Pinned threads are compared to teammates; threads can be listed, renamed, and messaged; automations can wake them. | Demonstration and speaker claim | Separate persistent workstream threads from short-lived subagents. |
| 00:08:00–00:10:10 | Voice, skills, plugins, Computer Use, and the Chrome extension are introduced as different input and action channels. | Speaker guidance | Route by fidelity and task shape; do not treat every channel as interchangeable. |
| 00:12:26–00:15:37 | Memory and reusable skills are described through an employee-onboarding analogy. Skills can be improved as recurring failure patterns become known. | Speaker pattern | Store required team rules in reviewable files; turn repeated procedures into tested skills. |
| 00:16:24–00:17:34 | An Appshot carries an image plus app context that can be more actionable than a plain screenshot. | Demonstration | On macOS, use an Appshot when available; on Windows, use image attachments or Computer Use because Appshots are not currently available there. |
| 00:18:40–00:24:12 | A personal monorepo/vault holds projects, people, instructions, and reusable workflows; Git diffs are used as a memory-review surface. | Demonstration | Treat the vault as explicit, inspectable working memory, not an unquestioned source of truth. |
| 00:27:21–00:33:52 | Model effort, permissions, auto-review, organizational policy, and Computer Use behavior are discussed. | Speaker preference and caveat | Keep model choices time-stamped; permissions and app policy remain independent controls. |
| 00:34:23–00:40:06 | Project threads, a chief-of-staff thread, monitoring threads, and scheduled “heartbeats” maintain workstreams. | Demonstration | Use a recurring message when the next run needs the same thread; use a fresh scheduled task when it does not. |
| 00:40:12–00:41:45 | Goal mode supplies a verifier; `GOAL.md` carries editable scope; a work log or `state.md` can record longer runs. | Demonstration | Pair the active goal with an observable definition of done and a requirement-by-requirement audit. |
| 00:42:38–00:49:41 | Remote steering, connector-based briefs, project/person files, and “remember this next time” habits are shown. | Demonstration | Durable context should be deliberately written, reviewed, and corrected. |
| 00:50:00–00:54:19 | Codex produces and revises messages, documents, spreadsheets, slides, and visual artifacts. Computer Use can bypass a structured integration's limitation. | Demonstration and security warning | A fallback action channel must not bypass the user's approval boundary. |
| 00:55:46–00:58:55 | A monitor thread creates or routes work to issue threads; pinned threads act as visible workstream hubs while subagents remain background helpers. | Demonstration | Teach manager threads, workstream threads, and subagents as distinct coordination shapes. |
| 01:00:00–01:04:30 | The vault emphasizes project and people pages; memory improves through use, failures, and recorded corrections. | Speaker experience | Begin with a small schema and promote only durable, useful facts. |
| 01:07:42–01:14:15 | Threads list and message other threads; Jason demonstrates splitting slide work by act, discusses model changes, reduces heartbeat noise, and varies schedules. | Demonstration and speaker preference | Bound recurrence by cadence, material-change filters, escalation rules, and a stop condition. |

## Workflow catalog

### 1. Context-rich handoff

**Workshop basis:** 00:04:00–00:04:46 and 00:16:24–00:17:34.

1. Choose the lowest-friction input that preserves the needed context.
2. Use voice for intent and nuance.
3. Use an Appshot on macOS when the frontmost app is the specification.
4. Use an image attachment on Windows for visual-only context.
5. Use Computer Use only when Codex must inspect or operate the live interface.
6. Remove unrelated sensitive content before capture.

### 2. Reviewable memory vault

**Workshop basis:** 00:18:40–00:24:12 and 01:00:00–01:04:30.

1. Keep the vault in a version-controlled repository.
2. Start with `projects/`, `people/`, `notes/`, and a small open-loops file.
3. Put operating rules in `AGENTS.md`.
4. Read relevant vault context before acting.
5. Write back only material decisions, commitments, preferences, and state.
6. Review the Git diff; correct unsupported or overly broad memory.
7. Never use the vault for secrets or as the only copy of required policy.

### 3. Persistent workstream threads

**Workshop basis:** 00:06:02–00:07:23, 00:34:23–00:35:35, and
00:55:46–00:58:55.

1. Give each durable workstream a named, pinned thread.
2. Keep the project's outcome, decisions, and current state in that thread.
3. Use bounded subagents for noisy, independent investigation.
4. Use a manager or monitor thread to route new evidence to the right
   workstream.
5. Require thread-to-thread messages to contain a concrete request, evidence,
   and stopping condition.
6. Keep one owner accountable for synthesis and external actions.

### 4. Editable goal and verifier loop

**Workshop basis:** 00:40:12–00:41:45 and 00:44:35–00:45:10.

1. Convert the desired outcome into a concise active goal.
2. Put detailed, user-editable scope in `GOAL.md`.
3. State constraints and observable completion evidence.
4. Maintain a work log or state file during long runs.
5. Re-read the goal after steering or compaction.
6. Verify each definition-of-done item before declaring completion.

### 5. Scheduled heartbeat

**Workshop basis:** 00:35:06–00:40:06 and 01:12:48–01:14:15.

1. Decide whether each run needs the existing thread's context.
2. If yes, schedule a message to that thread; if no, use a fresh scheduled
   task.
3. Define the evidence to inspect on each run.
4. Report only material changes; use a minimal no-change response.
5. Escalate consequential or ambiguous actions to the user.
6. Stop when the terminal condition is met.
7. Adjust cadence to the actual work window instead of polling forever.

### 6. Capability routing and Computer Use

**Workshop basis:** 00:10:10–00:17:34, 00:27:21–00:31:59, and
00:52:32–00:54:19.

1. Prefer files and deterministic commands when sufficient.
2. Prefer an authorized structured integration when it exposes the operation.
3. Use browser tooling for rendered or authenticated web flows.
4. Use Computer Use for native apps or otherwise inaccessible GUI state.
5. Name the target app, allowed action, excluded surfaces, confirmation
   boundary, and verification source.
6. Do not let Computer Use turn an integration limitation into implicit
   permission to upload, send, purchase, publish, or change an account.
7. Verify through an independent source when possible.

### 7. Artifact review loop

**Workshop basis:** 00:50:00–00:52:32.

1. Produce a reviewable artifact such as a document, slide deck, spreadsheet,
   or small web page.
2. Render or open the artifact in a shared visual surface.
3. Anchor feedback to the visible object.
4. Apply one coherent revision.
5. Re-render and inspect the affected state.
6. Preserve the source artifact and verification evidence.

## Evidence and verification table

| Claim or pattern | Workshop evidence | Current verification | Disposition |
| --- | --- | --- | --- |
| Codex Computer Use can operate desktop GUIs on macOS and Windows. | 00:10:10; 00:28:54 | OpenAI's [Computer Use documentation](https://learn.chatgpt.com/docs/computer-use) confirms both platforms and says Windows requires the target app on the active desktop. | Verified current capability |
| Appshots provide richer app context than a plain screenshot. | 00:16:24 | OpenAI's [Appshots documentation](https://learn.chatgpt.com/docs/appshots) says an Appshot can include the visible image and app-provided text, including some off-screen text. It is currently macOS-only. | Verified with Windows limitation |
| A file-backed vault can serve as shared, reviewable memory. | 00:18:40–00:24:12 | This is Jason's workflow, corroborated by his *Codex-maxxing* essay. OpenAI's [Memories documentation](https://learn.chatgpt.com/docs/customization/memories) distinguishes product memory from required instructions. | Speaker pattern; safe when reviewed |
| Pinned independent threads can list, rename, and message other threads. | 00:06:08; 01:07:42 | Observed in the workshop. OpenAI's public [Subagents documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) establishes delegated agent threads but does not make every workshop coordination pattern a general subagent guarantee. | Demonstrated; terminology qualified |
| Goal mode can persist long-running work while the user steers it. | 00:40:12–00:41:45 | OpenAI's [Long-running work documentation](https://learn.chatgpt.com/docs/long-running-work) recommends outcome, constraints, and verification criteria and describes steering. | Verified current capability |
| Scheduled messages should reuse a thread when the next check needs its history. | 00:35:06–00:40:06 | Corroborated by Jason's *Two kinds of scheduled work in Codex*. | Speaker workflow; verify UI at delivery time |
| Computer Use may complete the “last mile” when a connector cannot. | 00:39:32; 00:54:19 | Demonstrated by the speaker, who also raises the security concern. OpenAI warns that Computer Use can affect state outside the project workspace. | Valid only with explicit authorization |
| Voice is about three times faster than typing. | 00:08:00 | No primary evidence reviewed for this specific ratio. | Unverified speaker claim; do not teach as fact |
| Lower reasoning is often sufficient for simple GUI work; highest reasoning is not always best. | 00:27:21; 01:11:29 | Useful speaker preference, but model names, defaults, and performance change. | Teach task-based selection, not a fixed model recipe |
| Long threads can remain useful after repeated compaction. | 00:03:37; 01:01:40 | Speaker experience; no quantitative guarantee established in the reviewed official material. | Do not promise a duration or message count |

## Safety and organizational prerequisites

- Use synthetic or sanitized data in training.
- Confirm workspace policy permits each connector, app, and data source.
- Treat app access, tool permission, and approval for a consequential action as
  separate decisions.
- Keep sending, publishing, purchasing, uploading, account changes, and
  security settings behind explicit approval unless the user has clearly
  authorized the exact action.
- Restrict a monitor's scope, cadence, notification threshold, and lifespan.
- Review vault diffs for false inferences, stale facts, sensitive content, and
  over-retention.
- Use worktrees or disjoint ownership for parallel writes; a named thread does
  not itself isolate a filesystem.
- Recheck current product documentation before teaching UI paths or model
  names.

## Implementation backlog

| Priority | Deliverable | Status | Verification |
| --- | --- | --- | --- |
| P0 | Timestamped workshop synthesis and evidence table | Complete | Complete caption range reviewed; every major section above has workshop timestamps |
| P0 | [Goal and editable-scope exercise](../instructor/codex-goals-and-editable-scope.md) | Complete | Used by this goal; includes completion contract, work log, steering, audit, and rubric |
| P0 | [Bounded thread-collaboration exercise](../instructor/codex-bounded-thread-collaboration.md) | Complete | Distinguishes independent workstream threads from subagents and adds evidence/write controls |
| P0 | [Computer Use verification-loop exercise](../instructor/codex-computer-use-verification-loop.md) | Complete | Windows constraints, authorization boundary, independent verification, stop rules, and rubric documented |
| P1 | [Memory-vault and bounded-heartbeat lab](../instructor/codex-memory-vault-and-bounded-heartbeat.md) | Complete | Disposable fixture passed a two-cycle dry run; source retention, diff scope, state correction, and stop behavior were asserted |
| P1 | Morning-brief maturity lab | Backlog | Progress from one connector query to drafts and reviewed durable memory without sending |
| P1 | Thread-manager simulation | Backlog | Route two synthetic issues to existing/new workstream threads and verify no duplicate ownership |
| P2 | Artifact annotation lab | Backlog | Revise a slide or webpage from anchored feedback and compare two renders |
| P2 | Skill self-improvement evaluation | Backlog | Seed a recurring failure, update a practice skill, and show improved performance on a held-out case |

## Review questions

1. Which context belongs in the active goal, `GOAL.md`, `AGENTS.md`, a skill,
   a vault note, or product memory?
2. How is a pinned workstream thread different from a delegated subagent?
3. When should a recurring job use a fresh scheduled task rather than the same
   thread?
4. Why can Computer Use be both a useful fallback and a policy risk?
5. What independent evidence proves a GUI action persisted?
6. What should a heartbeat report when nothing material changed?
7. Which facts are important enough to write back to a memory vault?

## Teaching prompts

- Ask learners to turn a messy voice request into an outcome, constraints, and
  verification contract without deleting its nuance.
- Give learners a vault containing team policy, preferences, transient
  observations, and secrets; ask where each item should live.
- Present one monitor, three workstreams, and two subagent tasks; ask learners
  to assign ownership and communication boundaries.
- Compare a structured connector with Computer Use for the same action and
  identify which authorization checks must survive the fallback.
- Give a heartbeat that says “never stop” and ask learners to replace it with a
  cadence, material-change threshold, escalation condition, and finish line.
