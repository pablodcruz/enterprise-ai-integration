# Teaching Bounded Thread Collaboration

## Session outcome

Learners will distinguish persistent workstream threads from delegated
subagents, divide a complex Codex task into independent subtasks, and
consolidate evidence without creating shared-write conflicts.

The finalized AI Engineer replay clarifies Jason Liu's pattern. At
00:06:02–00:07:23 and 00:34:23–00:35:35, he treats named, pinned threads as
durable project teammates. At 00:55:46–00:58:55, a monitor thread creates or
routes issues to other visible threads while subagents remain background
helpers. At 01:07:42–01:08:53, he demonstrates listing, renaming, pinning, and
messaging threads.

Current OpenAI documentation uses **subagent**, **agent thread**, and **primary
thread** for delegated-agent workflows. This guide keeps that terminology and
labels Jason's independent pinned-chat pattern as **workstream threads**.

Official reference:
[Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## Audience and timing

- **Audience:** Developers, technical leads, trainers, and consultants
- **Time:** 40 minutes
- **Format:** Decomposition exercise, parallel read-only demonstration,
  consolidation, and debrief

## Learning objectives

By the end, learners can:

1. Recognize work that benefits from parallel agent threads.
2. Choose between a persistent workstream thread and a bounded subagent.
3. Write a bounded subtask or cross-thread message with a concrete result
   contract.
4. Keep requirements and decisions with the accountable owner.
5. Prevent multiple agents from editing the same files.
6. Consolidate evidence without accepting summaries uncritically.
7. Decide when parallelism costs more than it saves.

## Prerequisites

- A Codex surface that supports subagent workflows
- A safe repository with tests and documentation
- A task containing at least two genuinely independent questions
- Enough token and time allowance for multiple agents

Subagent workflows consume more tokens than comparable single-agent work.
Parallelism should improve speed, evidence coverage, or context quality—not
merely make the workflow look sophisticated.

## Two collaboration shapes

| Shape | Best use | Context lifetime | Visibility | Accountability |
| --- | --- | --- | --- | --- |
| Workstream thread | A project or issue that benefits from a durable, named home | Persists across steering and scheduled wake-ups | Visible and pin-able | The workstream thread owns its outcome |
| Subagent | A bounded, independent investigation inside a larger task | Returns a compact result to the caller | Usually background | The primary thread owns synthesis and completion |

A workstream thread is not automatically a subagent, and a named thread does
not create filesystem isolation. Choose the shape based on lifespan,
discoverability, context reuse, and ownership.

### Cross-thread message contract

When one workstream thread asks another for help, include:

```text
Request:
Why this thread owns it:
Relevant context or evidence:
Actions allowed:
Required response:
Deadline or next check:
Stopping condition:
```

The receiving thread should report evidence and blockers. It should not infer
permission for unrelated external actions.

## Primary-thread responsibility

Keep these items in the primary thread:

- The user outcome
- Constraints and authorization boundaries
- Definition of done
- Decisions that affect the whole task
- Conflicts between sources or recommendations
- The final consolidated result
- Completion evidence

Delegate noisy or bounded investigation:

- Repository exploration
- Test-gap analysis
- Documentation comparison
- Log analysis
- Independent source review
- Focused security or maintainability checks

This limits context pollution: raw logs and exploratory dead ends remain in
agent threads while the primary thread receives compact evidence.

## Decomposition test

A subtask is a good delegation candidate when all answers are “yes”:

1. Can it be described without relying on unstated context?
2. Does it have a concrete output?
3. Can it run independently of the other subtasks?
4. Can evidence be checked after it returns?
5. Can it avoid writing the same files as another active agent?
6. Will parallel execution materially improve speed, coverage, or context
   quality?

If several subtasks depend on one another, run them sequentially. If the task is
small, keep it in the primary thread.

## Subtask contract

Give each agent:

```text
Question:
Scope:
Authoritative sources:
Actions allowed:
Actions prohibited:
Required evidence:
Output format:
Stopping condition:
```

Example:

```text
Question: Which documented lab claims are not covered by automated tests?
Scope: labs/ and the corresponding starter tests only.
Authoritative sources: Lab instructions and current test files.
Actions allowed: Read files and run existing tests.
Actions prohibited: Do not edit files, install dependencies, or use the network.
Required evidence: Cite every gap with a file path and the nearest relevant
heading or test name.
Output format: A table with claim, existing coverage, missing coverage, and
recommended test.
Stopping condition: Every lab claim has been mapped or explicitly marked
unclear.
```

## Instructor demonstration

### Scenario

Review a training repository for release readiness.

The primary thread owns this contract:

```text
Determine whether the training repository is ready for instructor delivery.
Review documentation accuracy, test coverage, and learner safety. Do not edit
files during investigation. Consolidate evidence, resolve conflicts, and
produce a prioritized remediation plan.
```

### Delegation

Ask Codex to create three independent agent threads:

1. **Documentation agent**
   - Compare learner instructions with actual files and commands.
   - Return mismatches with file references.
2. **Testing agent**
   - Run or inspect the relevant tests.
   - Map documented outcomes to test coverage.
3. **Safety agent**
   - Review credentials, permissions, cleanup steps, and destructive-action
     boundaries.
   - Return concrete risks and evidence.

All three agents are read-only for the investigation phase.

### Primary-thread prompt

```text
Use three bounded subagents in parallel: documentation accuracy, test coverage,
and learner safety. Keep all agents read-only. Require file-based evidence and
a compact result table from each one. Wait for all required results.

In the primary thread, compare their findings, identify contradictions or
duplicates, and produce one prioritized remediation plan. Do not edit until I
approve the consolidated plan.
```

### Expected behavior

- Each agent has one named responsibility.
- Agents do not make overlapping edits.
- The primary thread waits for required evidence.
- Returned summaries include inspectable references.
- Conflicts are resolved in the primary thread.
- No implementation begins before consolidation and approval.

## Consolidation protocol

Do not concatenate agent summaries and call that synthesis. For every returned
finding:

1. Confirm it is in scope.
2. Check the cited evidence.
3. Identify duplicates across agents.
4. Surface contradictory conclusions.
5. Rank the finding against the primary goal.
6. Record whether it is accepted, rejected, or needs more evidence.
7. Assign one owner if implementation follows.

Use this table:

| Finding | Agent | Evidence | Primary-thread decision | Priority | Owner |
| --- | --- | --- | --- | --- | --- |

The primary agent remains accountable for the final conclusion.

## Manager-thread simulation

This second demonstration mirrors the workshop pattern without requiring live
customer systems.

Prepare two synthetic feedback cards:

- “Export fails when the filename contains an emoji.”
- “The onboarding email link opens a 404.”

Use three durable workstream threads:

1. **Feedback monitor** reads the cards and owns routing.
2. **Export issue** owns reproduction evidence for export failures.
3. **Onboarding issue** owns link and content evidence.

The monitor should:

1. List the available workstream threads.
2. Route each card to the matching thread with the cross-thread contract.
3. Create a new issue thread only when no existing owner fits.
4. Record the destination and avoid duplicate ownership.
5. Request a compact status update.
6. Stop after both cards have one accountable owner.

This demonstrates the monitor-to-workstream pattern from 00:55:46–00:58:55.
Keep all evidence synthetic and all actions read-only.

## Write coordination

### Safest default

Use parallel agents for investigation, then let one owner implement the
consolidated plan.

### Parallel writes

Use parallel writing only when:

- File ownership is disjoint.
- Interfaces between changes are already defined.
- Each agent has a separate checkout or worktree where needed.
- Integration and testing ownership is explicit.

Current OpenAI guidance recommends worktrees for parallel coding chats so each
chat has an isolated checkout. Even with worktrees, integration conflicts and
behavioral incompatibilities still require primary-thread review.

### Shared workspace warning

Agents sharing one workspace can see one another's changes immediately. Do not
assign two active agents to modify the same files. A later write can overwrite,
invalidate, or silently depend on another agent's incomplete work.

## Learner exercise 1: delegate or retain

Classify each task:

| Task | Expected choice |
| --- | --- |
| Find every outdated URL in 20 independent Markdown files | Parallel read-heavy delegation |
| Change one function and its tightly coupled tests | One owner, sequential work |
| Review security, accessibility, and performance of one feature | Parallel specialist reviews, primary consolidation |
| Rename a public API across the repository | One coordinated plan; partitioned writes only with explicit ownership |
| Explain a ten-line error trace | Primary thread |
| Compare four independent vendor documents | Parallel source review |

Learners must explain the independence boundary and evidence contract, not just
choose “parallel” or “single.”

## Learner exercise 2: repair a weak delegation

Weak prompt:

```text
Spawn some agents and improve the repository.
```

Problems:

- No outcome
- No subtask boundaries
- No source hierarchy
- No write ownership
- No result contract
- No stopping condition
- No consolidation rule

Rewrite it using the subtask contract and primary-thread prompt pattern.

## Learner exercise 3: resolve disagreement

Give two agent results:

- The documentation agent says a command is valid because it appears in the
  README.
- The testing agent says the command fails in a clean environment.

Ask learners to resolve the conflict. Expected approach:

1. Treat execution in the correct clean environment as stronger evidence of
   runtime behavior.
2. Inspect whether the test environment matches the documented prerequisites.
3. Reproduce the command under the stated conditions.
4. Update the final decision, not merely average the two opinions.

## Validation rubric

Score each category from 0–2:

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Decomposition | Tasks overlap or depend on each other | Partial separation | Independent bounded questions |
| Contracts | Vague requests | Some scope or output detail | Scope, evidence, output, and stop rule explicit |
| Write safety | Shared files edited concurrently | Ownership informal | Read-only phase or disjoint ownership enforced |
| Evidence | Unsupported summaries | Some references | Inspectable evidence for every material finding |
| Consolidation | Results concatenated | Findings grouped | Evidence checked and conflicts resolved |
| Efficiency | Parallelism adds overhead only | Benefit unclear | Material speed, coverage, or context benefit |

A passing implementation scores at least 10/12 with no zero in Write safety,
Evidence, or Consolidation.

## Common misconceptions

- **“More agents produce a better answer.”** More agents increase cost and
  coordination. Use them only for meaningful independent work.
- **“Agent summaries are authoritative.”** Summaries are claims until their
  evidence is inspected.
- **“The primary agent can delegate accountability.”** The primary thread still
  owns decisions and completion.
- **“Worktrees eliminate all conflicts.”** They isolate files; they do not
  resolve incompatible designs or integration behavior.
- **“Every specialist should implement its own recommendations.”** A read-only
  review phase followed by consolidated ownership is often safer.
- **“Every visible thread is a subagent.”** Jason's pinned workstream threads
  are durable project homes; a subagent is a bounded delegate whose result
  returns to an accountable primary thread.

## Debrief questions

1. Which subtask benefited most from isolation?
2. What information had to remain in the primary thread?
3. Which evidence changed the consolidated decision?
4. Where could write conflicts have occurred?
5. Did parallelism save enough time or context to justify its cost?
6. When would a separate independent chat be better than a delegated subagent?

## Source alignment

The replay supports these workshop attributions:

- 00:06:08: threads can be listed, renamed, and messaged.
- 00:34:23–00:35:35: named project threads act like recurring teammates and can
  be woken by scheduled messages.
- 00:55:46–00:58:55: a monitor thread creates or routes work to visible issue
  threads; subagents are described as a different, background mechanism.
- 01:07:42–01:08:53: one thread organizes other threads and splits slide work
  into three named acts.

The bounded contracts, read-only investigation phase, evidence consolidation,
write-ownership rules, and worktree guidance are our safety and instructional
additions. They are grounded in current OpenAI subagent and worktree
documentation, not claimed as verbatim workshop procedures.
