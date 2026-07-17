# Enterprise AI Study Lab

A zero-dependency browser study application for MCP, agent reliability, retrieval systems, model APIs, evaluation, and operations.

## Run the App

Open [index.html](index.html) directly in a modern browser, or serve the repository locally:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/study/
```

## Study Modes

| Mode | Behavior |
| --- | --- |
| Practice | Reveals the answer and explanation after each response |
| Flashcards | Requires recall before revealing the answer |
| Smart Review | Prioritizes questions previously answered incorrectly |

Progress is stored only in browser local storage. No learner account or analytics service is used.

## Question Topics

- Model APIs
- MCP
- Agents
- RAG
- Evaluation
- Operations

## Add a Question

Edit `questions/bank.js` and add an object matching the existing schema:

```javascript
{
  id: "mcp-001",
  topic: "mcp",
  difficulty: "foundational",
  question: "Question text",
  answers: ["Correct", "Distractor", "Distractor", "Distractor"],
  correct: 0,
  explanation: "Why the answer is correct.",
  reference: "../review-notes/02-mcp-and-tool-integration.md"
}
```

Question IDs must be unique. The correct index is evaluated before answers are displayed; the initial version does not shuffle answer order so explanations remain easy to audit.
