# Context-Rich Visual Inputs on Windows

## Instructor outcome

Teach learners how to give ChatGPT or Codex enough visual and textual context to
reason about an application state without oversharing unrelated screen content.

The central lesson is:

> Prefer the underlying source when it is available. When the state exists only
> on screen, share the complete relevant window, the important text, and a
> precise task.

## Product distinction

As of July 2026, OpenAI Appshots are available in the ChatGPT desktop app on
macOS, not Windows. An Appshot can contain:

- An image of the frontmost application window.
- Accessible text exposed by the application, potentially including text
  outside the visible scroll area.

On Windows, a normal screenshot supplies image pixels but does not
automatically add the application's accessible, off-screen text. Do not teach a
Windows screenshot as if it were an Appshot.

Official reference: [OpenAI Appshots](https://learn.chatgpt.com/docs/appshots)

## Use the richest available source

Choose context in this order:

1. Attach the actual document, image, log, exported data, or project file.
2. Use an authorized connector or plugin when the task depends on live,
   structured application data.
3. Paste the relevant text and attach a complete screenshot of the application
   window.
4. Attach a screenshot alone when the task is genuinely visual.
5. Describe the state manually only when no source can be shared.

A screenshot is usually best for layout, visible errors, settings, diagrams,
and before-and-after comparisons. It is weaker for long documents, exact data,
source code, tables, and content outside the captured area.

## Closest Windows workflow

### Capture the application window

1. Bring the relevant window to the front.
2. Remove or hide notifications, unrelated tabs, credentials, customer data,
   and other sensitive content.
3. Press `Alt+PrtScn` to copy the active window, then paste it into the ChatGPT
   or Codex composer with `Ctrl+V`.

Alternatively, press `Win+Shift+S`, select **Window mode**, and choose the
application window. Window mode preserves more useful context than a tight
rectangle around one error message.

Microsoft reference:
[Capture the active window](https://support.microsoft.com/en-us/office/copy-the-window-or-screen-contents)

### Add the important text

Use the application's native copy command when possible because it preserves
the exact characters. When text cannot be selected:

1. Open the screenshot in Snipping Tool.
2. Choose **Text Actions**.
3. Copy the relevant text and paste it below the image.

PowerToys Text Extractor is another OCR option. Its default shortcut is
`Win+Shift+T`. Proofread OCR output before relying on it.

Microsoft reference:
[PowerToys Text Extractor](https://learn.microsoft.com/en-us/windows/powertoys/text-extractor)

### Ask a grounded question

Use this prompt pattern:

```text
This is the complete [application] window showing [state].

The relevant text is:
[paste exact text]

Inspect: [specific region, message, or behavior]
Goal: [decision, explanation, draft, or implementation]
Constraints: [what must not change]

If the supplied context is insufficient, identify the missing source instead
of guessing.
```

For multiple images, label them `Before`, `After`, `Expected`, or `Actual` and
state exactly how they should be compared.

## Demonstration: context quality ladder

Use one realistic application error for all three rounds.

### Round 1 — vague description

```text
This app is broken. What should I do?
```

Observe the number of assumptions and follow-up questions.

### Round 2 — cropped screenshot

Attach only a tight crop of the error dialog.

```text
Explain this error.
```

Observe what surrounding application state is still missing.

### Round 3 — window plus exact text

Attach the full relevant window, paste the exact error and nearby configuration,
and use the grounded prompt pattern.

Compare the three rounds on:

- Correct use of evidence
- Unsupported assumptions
- Number of follow-up questions
- Specificity of the proposed next step
- Time required to reach a useful answer

## Misconceptions to correct

- **"A bigger screenshot is always better."** Capture the complete relevant
  window, not the entire desktop or unrelated applications.
- **"OCR is the same as application data."** OCR can misread characters and
  does not recover structure or hidden state.
- **"An image explains the task."** The learner must still identify the
  relevant area, desired outcome, and constraints.
- **"Sharing a screenshot is harmless."** Screen captures can expose names,
  account identifiers, tabs, notifications, tokens, customer information, and
  off-screen context in products that collect accessibility text.
- **"Appshots work on Windows."** Current OpenAI documentation limits Appshots
  to macOS. Windows users can approximate the workflow, but the inputs are not
  equivalent.

## Privacy checkpoint

Before sharing any screen context, ask:

1. Does this task require the information being shown?
2. Can I attach a sanitized source or reproduce the issue with synthetic data?
3. Are secrets, personal data, customer data, notifications, or unrelated tabs
   visible?
4. If OCR or accessibility text is included, could it expose more text than I
   intended?
5. Does my organization permit this data to be processed by the selected
   product and workspace?

## Suggested 20-minute delivery

- 3 minutes: Explain screenshots versus Appshots versus source attachments.
- 5 minutes: Demonstrate the Windows capture-and-text workflow.
- 7 minutes: Run the three-round context quality comparison.
- 3 minutes: Review privacy and data-minimization decisions.
- 2 minutes: Learners rewrite one vague visual prompt using the template.

## Debrief questions

1. Which additional context changed the answer most?
2. When would the original file be more useful than any screenshot?
3. What information was visible but unnecessary?
4. How could the workflow be standardized for a team?
5. What evidence would show that richer context reduced search or rework?

## Consultant implementation idea

Document this as a small repeatable evaluation rather than an unsupported claim
that richer context is always better. Record:

- Input type used
- Time to a useful response
- Number of clarification turns
- Number of unsupported assumptions
- Whether external search was necessary
- Whether the final result was accepted without correction

This produces defensible evidence for a training recommendation and gives teams
a way to improve their own prompting workflow.
