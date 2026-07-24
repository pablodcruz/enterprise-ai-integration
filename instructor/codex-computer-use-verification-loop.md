# Teaching a Computer Use Verification Loop

## Session outcome

Learners will decide when Computer Use is appropriate, define a bounded GUI
task, operate one application safely, and verify the result through an
independent evidence channel.

This exercise responds to Jason Liu's AI Engineer workshop demonstrations at
00:10:10–00:17:34 and 00:27:21–00:31:59, plus his explicit security warning at
00:54:19. Jason routes work among structured plugins, browser tools, Appshots,
and Computer Use, then shows how Computer Use can finish work a connector
cannot.

The observe–decide–act–verify loop, independent evidence requirement, and
12-point rubric below are our training controls, not a claimed transcription
of Jason's method.

Official reference:
[Computer Use](https://learn.chatgpt.com/docs/computer-use)

## Audience and timing

- **Audience:** Developers, technical trainers, consultants, and operations
  teams
- **Time:** 35 minutes
- **Primary platform:** Windows
- **Format:** Decision exercise, instructor demonstration, learner practice,
  and debrief

## Learning objectives

By the end, learners can:

1. Choose between files, commands, structured integrations, browser tools, and
   Computer Use.
2. Define a Computer Use task with an application boundary and stopping rule.
3. Anticipate Windows foreground behavior.
4. Separate permission to view an app from permission to take sensitive action.
5. Verify GUI work through a deterministic source when one exists.

## Prerequisites

- ChatGPT desktop app on Windows
- ChatGPT Work or Codex
- Computer Use plugin installed and enabled
- A disposable practice repository
- Windows Notepad
- No sensitive applications open on the active desktop

In the desktop app, open **Plugins > Computer Use**, install or enable the
plugin, and review **Settings > Computer Use** before the exercise.

## Core decision

Computer Use is not the default tool for every application task. Use this
decision order:

```text
Can the task be completed and verified from a file or command?
  └─ Yes → use the file or command.

Does an authorized plugin, connector, or MCP server expose the operation?
  └─ Yes → prefer the structured integration.

Does the task depend on a rendered web interface?
  └─ Yes → prefer built-in browser tooling where practical.

Does the task require a desktop GUI or otherwise inaccessible visual state?
  └─ Yes → use Computer Use with a bounded app and verification plan.
```

Structured tools are usually more repeatable and easier to audit. Computer Use
is valuable when visual inspection or GUI interaction is genuinely part of the
task.

The workshop's Appshot demonstration at 00:16:24 is a macOS workflow. Current
OpenAI documentation says Appshots are macOS-only. On Windows, attach a
screenshot or image when visual context alone is enough; use Computer Use when
Codex must inspect or operate the live application.

## Windows operating constraint

On Windows, Computer Use operates in the active desktop session. It can move
the pointer, type, and take over the foreground while running.

Before starting:

1. Save unrelated work.
2. Close or minimize applications containing sensitive information.
3. Disable distracting notifications where practical.
4. Keep the device unlocked and connected.
5. Do not use the mouse or keyboard while the controlled flow is active unless
   you intend to interrupt it.

For longer GUI tasks, a dedicated Windows virtual machine can isolate Computer
Use from the instructor's main desktop.

## The verification loop

Use this original teaching scaffold to make the workshop's iterative working
style observable and safe:

```text
Observe → Decide → Act → Verify → Record → Repeat or stop
```

### Observe

Capture the initial application, window, and relevant visible state. Identify
what is known and what remains uncertain.

### Decide

Choose one bounded next action. State:

- Target application
- Intended change
- Apps or data that are out of scope
- Actions requiring confirmation
- Evidence that will verify success

### Act

Perform one coherent GUI change. Avoid combining unrelated actions into one
permission grant or one opaque instruction.

### Verify

Re-run the same visual flow and, where possible, inspect an independent
deterministic source such as:

- The saved file
- Command output
- A local database query
- Application logs
- A test
- A second read-only view

A screenshot proves appearance at one moment. It does not necessarily prove
that data was saved correctly or that the underlying behavior changed.

### Record

Record the action, evidence, and unresolved risk. Do not record secrets or
unnecessary personal information.

### Repeat or stop

Repeat only when the acceptance criterion is not yet met and another authorized
action can make progress. Stop when:

- The criterion is proven.
- The task needs new authorization.
- The application state is ambiguous.
- The next action could be destructive.
- The observed result contradicts the plan.

## Instructor demonstration

### Scenario

Use Computer Use to edit a synthetic practice file through Notepad, then verify
the saved content through the repository filesystem.

Create a disposable file in the practice repository before class:

```text
Incident: DEMO-001
Owner: TODO
Status: investigating
Next check: TODO
```

### Bounded prompt

```text
Use Computer Use with Windows Notepad only.

Open the practice file at [absolute path]. Change Owner to "Training Team" and
Next check to "Run the synthetic health check." Do not open or interact with
any other application. Saving the practice file is authorized; deleting,
renaming, emailing, uploading, or printing it is not.

After saving, verify the result by reading the file from the repository rather
than relying only on the visible Notepad window. Report the before state, the
change, the verification evidence, and whether the stopping condition is met.
```

### Expected result

- Computer Use requests access to Notepad if it is not already allowed.
- Only the named synthetic fields change.
- The file is saved in its original location.
- Filesystem inspection confirms the intended content.
- The agent stops without opening another application.

### Why this demonstration works

It pairs:

- A GUI action channel
- An explicit authorization boundary
- A deterministic verification channel
- A clear stopping condition

This is stronger than “open Notepad and fix the file,” which leaves target
state, permissions, and verification implicit.

## Learner exercise: diagnose the task before acting

For each scenario, choose the preferred capability and explain why:

| Scenario | Expected starting choice |
| --- | --- |
| Replace a value in a tracked JSON file | File edit and test |
| Retrieve ten authorized CRM records | Structured connector or MCP tool |
| Check whether a button overlaps text at 200% zoom | Browser tooling or Computer Use |
| Reproduce a bug in a native Windows settings dialog | Computer Use |
| Count failed test cases | Test command and parsed output |
| Copy a chart's appearance into a design critique | Image input or Computer Use |

The objective is not to avoid Computer Use. It is to use it when its visual,
interactive nature contributes evidence the narrower tools cannot provide.

## Learner exercise: write the control contract

Choose a safe GUI task and fill in:

```text
Target application:
Initial state to observe:
Authorized action:
Out-of-scope applications:
Sensitive actions requiring confirmation:
Expected visible result:
Independent verification source:
Stopping condition:
Recovery action if verification fails:
```

Partners should challenge any field that is vague, unobservable, or broader
than necessary.

## Permission and privacy checkpoint

Computer Use can process visible application content and screenshots. Before
granting access:

1. Confirm the target app is necessary.
2. Remove unrelated sensitive content from the active desktop.
3. Use synthetic or sanitized records in training.
4. Review app-access prompts rather than selecting permanent access
   automatically.
5. Distinguish app access from approval for consequential actions.
6. Do not expose secrets in screenshots, clipboard content, notifications, or
   open tabs.
7. Confirm organizational policy permits the selected data and application.
8. Preserve the same approval boundary when switching tools. A connector's
   inability to upload or send does not authorize Computer Use to do it.

Saved “always allow” decisions can be reviewed in **Settings > Computer Use**.

## Failure modes to demonstrate

### Foreground interference

The learner moves the mouse during the task, causing the wrong control to
receive input.

**Response:** Stop, inspect current state, and restart from a known checkpoint.

### Visual success without persistence

The text appears correct in Notepad but was not saved.

**Response:** Verify through the filesystem before claiming success.

### Wrong application boundary

The agent attempts to open email to share the result.

**Response:** Deny access because sharing was not authorized or required.

### Capability fallback bypasses approval

A structured integration can read a message but cannot upload the requested
file, so the agent proposes using Computer Use to complete the upload.

**Response:** Treat this as a new action and approval decision. Confirm the
exact destination, file, audience, and organizational policy before allowing
the fallback. Tool substitution does not inherit permission.

### Ambiguous destructive prompt

The task says “clean up all old files.”

**Response:** Do not proceed. Resolve exact targets and recovery requirements
first.

### Screenshot-only conclusion

The interface shows “Success,” but the downstream record did not update.

**Response:** Query the underlying record or another independent source.

## Validation rubric

Score each category from 0–2:

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Tool choice | Computer Use chosen without analysis | Some rationale | Narrowest suitable capability selected |
| App boundary | Unbounded | App named | App and excluded surfaces explicit |
| Authorization | Implicit | Some sensitive actions identified | Allowed and disallowed actions explicit |
| Verification | Visual claim only | Re-checks UI | Uses independent evidence where available |
| Stop rule | Missing | Informal | Observable repeat/stop criteria |
| Privacy | Sensitive context ignored | General caution | Concrete minimization steps applied |

A passing implementation scores at least 10/12 with no zero in Authorization,
Verification, or Privacy.

## Debrief questions

1. What did Computer Use contribute that a file or structured tool could not?
2. Which part of the prompt constrained risk most effectively?
3. Why was filesystem verification stronger than the final screenshot?
4. How does Windows foreground operation change task design?
5. When should a failed verification repeat the loop, and when should it stop?

## Source alignment

The replay supports these workshop attributions:

- 00:10:10–00:17:34: install Computer Use and Chrome capabilities, route by
  application, and use Appshots to provide rich app context.
- 00:27:21: simple GUI work may not need the most expensive reasoning setting;
  treat the named models as historical, not a permanent recipe.
- 00:28:54–00:31:59: desktop behavior, approval profiles, `AGENTS.md`, and
  organization policy all affect what the agent can do.
- 00:52:32–00:54:19: Computer Use is presented as broadly useful, followed by
  the warning that a determined agent can bypass a structured integration's
  limitation through the GUI.

Current OpenAI documentation confirms that Computer Use supports macOS and
Windows, affects state outside the project workspace, and requires the target
app to remain visible on the active Windows desktop. The explicit control
contract, independent verification, and passing rubric are our additions.
