window.studyQuestions = [
  {
    id: "api-001",
    topic: "model-api",
    difficulty: "foundational",
    question: "Which responsibility belongs to application code rather than a model instruction?",
    answers: [
      "Rejecting output that violates an exact schema",
      "Choosing the clearest wording for a summary",
      "Explaining a technical concept in plain language",
      "Drafting an answer from supplied evidence"
    ],
    correct: 0,
    explanation: "Instructions influence model behavior, but application code must enforce deterministic contracts such as schema validation.",
    reference: "../review-notes/01-model-application-foundations.md#instructions-are-not-enforcement"
  },
  {
    id: "api-002",
    topic: "model-api",
    difficulty: "intermediate",
    question: "A write request times out after it reaches the external service. What is the safest next action?",
    answers: [
      "Check the operation using its idempotency key or external identifier before retrying",
      "Immediately send the identical request five more times",
      "Change the prompt and retry",
      "Assume the external action did not occur"
    ],
    correct: 0,
    explanation: "A timeout can leave the result uncertain. Verify whether the side effect occurred before another attempt.",
    reference: "../review-notes/01-model-application-foundations.md#retries-and-idempotency"
  },
  {
    id: "api-003",
    topic: "model-api",
    difficulty: "intermediate",
    question: "Which evidence best distinguishes a slow model call from a slow downstream tool?",
    answers: [
      "Per-stage timing in a correlated trace",
      "The final response text",
      "The user's browser theme",
      "A larger context window"
    ],
    correct: 0,
    explanation: "A correlated trace records the duration of model and tool spans separately.",
    reference: "../review-notes/01-model-application-foundations.md#observability"
  },
  {
    id: "mcp-001",
    topic: "mcp",
    difficulty: "foundational",
    question: "What is the MCP server responsible for?",
    answers: [
      "Advertising contracts, applying policy, invoking backing services, and returning structured results",
      "Training the foundation model",
      "Storing the user's browser password",
      "Granting itself access based on model instructions"
    ],
    correct: 0,
    explanation: "The server owns the protocol surface and service-side enforcement; the model only selects from exposed capabilities.",
    reference: "../review-notes/02-mcp-and-tool-integration.md#core-responsibilities"
  },
  {
    id: "mcp-002",
    topic: "mcp",
    difficulty: "intermediate",
    question: "Why is call_external_api(method, url, headers, body) usually a poor MCP tool?",
    answers: [
      "It exposes an overly broad capability that is difficult to authorize, evaluate, and constrain",
      "MCP cannot carry JSON",
      "Models cannot select tool names",
      "HTTP services cannot be backing services"
    ],
    correct: 0,
    explanation: "Narrow tools express business intent and permit meaningful scopes, validation, approvals, and evaluation.",
    reference: "../review-notes/02-mcp-and-tool-integration.md#narrow-tools-beat-generic-proxies"
  },
  {
    id: "mcp-003",
    topic: "mcp",
    difficulty: "advanced",
    question: "An identity has issues:write, but add_issue_comment still pauses. Why?",
    answers: [
      "Authorization permits the action class, while approval is required for this exact side effect",
      "The token must always be invalid",
      "Read and write scopes are identical",
      "MCP servers cannot perform writes"
    ],
    correct: 0,
    explanation: "Authorization and approval answer different questions. An authorized action may still require explicit consent.",
    reference: "../review-notes/02-mcp-and-tool-integration.md#approval-is-different-from-authorization"
  },
  {
    id: "mcp-004",
    topic: "mcp",
    difficulty: "advanced",
    question: "A tool lists successfully, but calling it returns a GitHub 403. Which layer most likely failed?",
    answers: [
      "Backing-service authorization",
      "MCP server discovery",
      "HTML rendering",
      "Model tokenization"
    ],
    correct: 0,
    explanation: "Successful discovery proves the client can reach and initialize with the MCP server, not that the backing API credential has permission.",
    reference: "../review-notes/02-mcp-and-tool-integration.md#tool-failure-model"
  },
  {
    id: "agents-001",
    topic: "agents",
    difficulty: "foundational",
    question: "Who owns the transition from approval_required to running?",
    answers: [
      "The application runtime after verifying an approval record",
      "The model whenever it decides the user probably agrees",
      "The external API",
      "The vector database"
    ],
    correct: 0,
    explanation: "The runtime owns workflow state and must verify approval before resuming a sensitive operation.",
    reference: "../review-notes/03-agent-runtime-safety-and-evaluation.md#what-makes-a-workflow-agentic"
  },
  {
    id: "agents-002",
    topic: "agents",
    difficulty: "intermediate",
    question: "Why must a paused agent run use durable state?",
    answers: [
      "The process may restart before a human makes the approval decision",
      "Durable state makes prompts shorter",
      "It removes the need for authorization",
      "It guarantees the model is correct"
    ],
    correct: 0,
    explanation: "Approval can outlive a worker process. The proposal and run status must survive restarts and concurrent workers.",
    reference: "../review-notes/03-agent-runtime-safety-and-evaluation.md#durable-state"
  },
  {
    id: "agents-003",
    topic: "agents",
    difficulty: "advanced",
    question: "Where should validation occur for every side-effecting tool call?",
    answers: [
      "At the tool or policy boundary immediately before execution",
      "Only in the final-answer guardrail",
      "Only in the model system prompt",
      "After the external action completes"
    ],
    correct: 0,
    explanation: "Final output validation cannot undo an external action. Enforce permissions and arguments next to the side effect.",
    reference: "../review-notes/03-agent-runtime-safety-and-evaluation.md#guardrail-placement"
  },
  {
    id: "rag-001",
    topic: "rag",
    difficulty: "foundational",
    question: "Which stage should enforce tenant permissions?",
    answers: [
      "Before unauthorized chunks can enter the retrieved context",
      "After the model writes the final answer",
      "Only in the browser",
      "During embedding training"
    ],
    correct: 0,
    explanation: "Authorization must constrain retrieval so forbidden content never enters model context.",
    reference: "../review-notes/04-rag-systems-and-evaluation.md#authorization-before-retrieval"
  },
  {
    id: "rag-002",
    topic: "rag",
    difficulty: "intermediate",
    question: "When is lexical retrieval often stronger than vector retrieval?",
    answers: [
      "Queries containing exact identifiers, error codes, or product names",
      "Every semantic paraphrase",
      "When no index exists",
      "When permissions should be ignored"
    ],
    correct: 0,
    explanation: "Lexical search preserves exact term matching, which is valuable for identifiers and specialized vocabulary.",
    reference: "../review-notes/04-rag-systems-and-evaluation.md#retrieval-types"
  },
  {
    id: "rag-003",
    topic: "rag",
    difficulty: "advanced",
    question: "A source is relevant but appears at rank 8. Which metric captures how early the first relevant result appears?",
    answers: [
      "Mean reciprocal rank",
      "Token count",
      "Schema validity",
      "Request rate"
    ],
    correct: 0,
    explanation: "Mean reciprocal rank rewards systems that place the first relevant result near the top.",
    reference: "../review-notes/04-rag-systems-and-evaluation.md#evaluation-layers"
  },
  {
    id: "eval-001",
    topic: "evaluation",
    difficulty: "foundational",
    question: "Why should agent evaluation inspect tool calls as well as the final answer?",
    answers: [
      "A plausible final answer can hide unsafe or incorrect actions",
      "Tool calls are always cheaper than model calls",
      "Final answers cannot contain text",
      "Schemas eliminate all workflow errors"
    ],
    correct: 0,
    explanation: "End-to-end safety depends on the execution path, including forbidden tools, missing approvals, and incorrect order.",
    reference: "../review-notes/03-agent-runtime-safety-and-evaluation.md#agent-evaluation"
  },
  {
    id: "eval-002",
    topic: "evaluation",
    difficulty: "intermediate",
    question: "Which assertion is best handled deterministically?",
    answers: [
      "No write tool executed before approval",
      "The explanation feels empathetic",
      "The answer is stylistically elegant",
      "The response has an executive tone"
    ],
    correct: 0,
    explanation: "Tool sequence and approval state are objective trace properties. Tone and usefulness often need calibrated subjective grading.",
    reference: "../review-notes/03-agent-runtime-safety-and-evaluation.md#deterministic-and-model-based-grading"
  },
  {
    id: "eval-003",
    topic: "evaluation",
    difficulty: "advanced",
    question: "Why should retrieval metrics remain separate from answer-quality metrics?",
    answers: [
      "A fluent answer can hide missing or irrelevant evidence",
      "Retrieval never affects generation",
      "Answer graders cannot process text",
      "Only latency matters in RAG"
    ],
    correct: 0,
    explanation: "Separate metrics reveal whether a failure began in retrieval or in synthesis over otherwise adequate evidence.",
    reference: "../review-notes/04-rag-systems-and-evaluation.md#evaluation-layers"
  },
  {
    id: "ops-001",
    topic: "operations",
    difficulty: "foundational",
    question: "What does readiness mean?",
    answers: [
      "The service can currently accept its intended traffic",
      "The process exists",
      "The source code compiles somewhere",
      "Every external provider is free"
    ],
    correct: 0,
    explanation: "A live process may still be unable to serve requests because configuration, migrations, or dependencies are unavailable.",
    reference: "../review-notes/05-cloud-operations-and-live-troubleshooting.md#health-semantics"
  },
  {
    id: "ops-002",
    topic: "operations",
    difficulty: "intermediate",
    question: "Which signal best proves who approved a specific external write?",
    answers: [
      "An audit record bound to the action payload",
      "A CPU usage metric",
      "A liveness check",
      "A browser screenshot without an identifier"
    ],
    correct: 0,
    explanation: "Audit records preserve identity, decision, exact action, and outcome for governance questions.",
    reference: "../review-notes/05-cloud-operations-and-live-troubleshooting.md#observability-signals"
  },
  {
    id: "ops-003",
    topic: "operations",
    difficulty: "advanced",
    question: "Why should routine health probes avoid real model calls?",
    answers: [
      "They can create unnecessary cost, latency, quota use, and false restarts",
      "Models cannot be reached over networks",
      "Health endpoints must always return static HTML",
      "A model response reveals every secret"
    ],
    correct: 0,
    explanation: "Separate cheap health checks from intentional end-to-end smoke tests that may be billable.",
    reference: "../review-notes/05-cloud-operations-and-live-troubleshooting.md#health-semantics"
  }
];
