import { describe, expect, it } from "vitest";

import { createUseCases } from "../test-helpers.js";

const repository = { owner: "acme", repository: "engineering-sandbox" };

describe("Phase 2 read-tool contracts", () => {
  it("returns selected issue fields and labels repository content as untrusted", async () => {
    const result = await createUseCases().getIssue.execute(
      { ...repository, issueNumber: 101 },
      "req_issue",
    );

    expect(result.issue).toMatchObject({
      number: 101,
      author: "incident-bot",
      commentsCount: 6,
      contentTrust: "untrusted_repository_content",
    });
    expect(result.issue.bodyExcerpt).toContain("Checkout latency");
    expect(result.issue).not.toHaveProperty("body");
  });

  it("returns a stable not-found error for a missing issue", async () => {
    await expect(
      createUseCases().getIssue.execute(
        { ...repository, issueNumber: 999 },
        "req_missing_issue",
      ),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", retryable: false });
  });

  it("filters and paginates relevant pull requests", async () => {
    const tools = createUseCases();
    const first = await tools.listPullRequests.execute(
      { ...repository, query: "checkout", state: "all", page: 1, pageSize: 1 },
      "req_pr_1",
    );
    const second = await tools.listPullRequests.execute(
      { ...repository, query: "checkout", state: "all", page: 2, pageSize: 1 },
      "req_pr_2",
    );

    expect(first.items.map((item) => item.number)).toEqual([210]);
    expect(first.pageInfo).toEqual({ page: 1, pageSize: 1, returned: 1, hasNextPage: true });
    expect(second.items.map((item) => item.number)).toEqual([209]);
    expect(second.pageInfo.hasNextPage).toBe(false);
  });

  it("rejects pagination that exceeds the shared bounds", async () => {
    await expect(
      createUseCases().listPullRequests.execute(
        { ...repository, page: 1, pageSize: 21 },
        "req_invalid_page",
      ),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
  });

  it("normalizes provider workflow states", async () => {
    const result = await createUseCases().getWorkflowStatus.execute(
      { ...repository, workflow: "deploy-checkout", page: 1, pageSize: 10 },
      "req_runs",
    );

    expect(result.items.map(({ runId, status }) => ({ runId, status }))).toEqual([
      { runId: 5004, status: "failed" },
      { runId: 5002, status: "succeeded" },
    ]);
  });

  it("filters workflow runs by normalized status and reports the next page", async () => {
    const result = await createUseCases().getWorkflowStatus.execute(
      { ...repository, status: "all", page: 1, pageSize: 1 },
      "req_run_page",
    );

    expect(result.items[0]).toMatchObject({ runId: 5004, status: "failed" });
    expect(result.pageInfo.hasNextPage).toBe(true);
  });

  it("returns only failed jobs and failed steps", async () => {
    const result = await createUseCases().listFailedWorkflowJobs.execute(
      { ...repository, runId: 5004, page: 1, pageSize: 1 },
      "req_jobs",
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ jobId: 7003, status: "failed" });
    expect(result.items[0]?.failedSteps).toEqual([
      { number: 2, name: "Verify checkout health", conclusion: "failure" },
    ]);
    expect(result.pageInfo.hasNextPage).toBe(true);
  });

  it("distinguishes an unknown workflow run from a run with no failed jobs", async () => {
    const tools = createUseCases();
    const successfulRun = await tools.listFailedWorkflowJobs.execute(
      { ...repository, runId: 5002 },
      "req_successful_run",
    );
    expect(successfulRun.items).toEqual([]);

    await expect(
      tools.listFailedWorkflowJobs.execute(
        { ...repository, runId: 9999 },
        "req_missing_run",
      ),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
  });
});
