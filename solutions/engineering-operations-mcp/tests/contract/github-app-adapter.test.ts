import { describe, expect, it } from "vitest";

import { GithubAppAdapter } from "../../src/adapters/github-app-adapter.js";
import type {
  GithubApiClient,
  QueryValue,
} from "../../src/adapters/github-rest-client.js";

class FakeGithubClient implements GithubApiClient {
  readonly calls: Array<{ path: string; query: Record<string, QueryValue> }> = [];

  async get(path: string, query: Record<string, QueryValue>): Promise<unknown | undefined> {
    this.calls.push({ path, query });
    if (path === "/installation/repositories") {
      return { total_count: 1, repositories: [] };
    }
    if (path === "/search/issues" && String(query.q).includes("is:issue")) {
      return { total_count: 1, items: [githubIssue(101)] };
    }
    if (path === "/search/issues" && String(query.q).includes("is:pr")) {
      return {
        total_count: 2,
        items: [
          {
            ...githubIssue(210),
            title: "Fixes #101 checkout rollback",
            body: "Closes #101",
            draft: false,
            pull_request: { merged_at: null },
          },
        ],
      };
    }
    if (path.endsWith("/issues/101")) {
      return { ...githubIssue(101), body: "Untrusted issue body", comments: 4 };
    }
    if (path.endsWith("/actions/workflows")) {
      return { workflows: [{ id: 44, name: "deploy-checkout", path: ".github/workflows/deploy.yml" }] };
    }
    if (path.endsWith("/actions/workflows/44/runs")) {
      return {
        total_count: 1,
        workflow_runs: [
          {
            id: 5004,
            name: "deploy-checkout",
            event: "push",
            head_branch: "main",
            head_sha: "8f3c123abcd",
            status: "completed",
            conclusion: "failure",
            html_url: "https://github.test/acme/sandbox/actions/runs/5004",
            created_at: "2026-07-18T14:00:00.000Z",
            updated_at: "2026-07-18T14:08:00.000Z",
          },
        ],
      };
    }
    if (path.endsWith("/actions/runs/5004/jobs")) {
      return {
        total_count: 2,
        jobs: [
          {
            id: 7003,
            name: "deploy-production",
            conclusion: "failure",
            html_url: "https://github.test/acme/sandbox/actions/jobs/7003",
            started_at: "2026-07-18T14:03:00.000Z",
            completed_at: "2026-07-18T14:08:00.000Z",
            steps: [
              { number: 1, name: "Checkout", conclusion: "success" },
              { number: 2, name: "Verify health", conclusion: "failure" },
            ],
          },
          {
            id: 7001,
            name: "lint",
            conclusion: "success",
            html_url: "https://github.test/acme/sandbox/actions/jobs/7001",
            started_at: "2026-07-18T14:00:00.000Z",
            completed_at: "2026-07-18T14:01:00.000Z",
            steps: [{ number: 1, name: "Lint", conclusion: "success" }],
          },
        ],
      };
    }
    return undefined;
  }
}

const signal = AbortSignal.timeout(1000);

describe("GitHub App adapter", () => {
  it("projects live issue and pull-request data into the existing contracts", async () => {
    const client = new FakeGithubClient();
    const adapter = new GithubAppAdapter(client);
    await expect(adapter.ping()).resolves.toBe(true);
    const issues = await adapter.searchIssues(
      {
        repository: "acme/sandbox",
        query: "checkout",
        state: "open",
        labels: ["incident"],
        limit: 5,
      },
      signal,
    );
    const issue = await adapter.getIssue("acme/sandbox", 101, signal);
    const pullRequests = await adapter.listPullRequests(
      { repository: "acme/sandbox", query: "checkout", state: "all", page: 1, pageSize: 1 },
      signal,
    );

    expect(adapter.mode).toBe("github_app");
    expect(issues[0]).toMatchObject({ number: 101, labels: ["incident", "checkout"] });
    expect(issue).toMatchObject({
      number: 101,
      bodyExcerpt: "Untrusted issue body",
      contentTrust: "untrusted_repository_content",
    });
    expect(pullRequests).toMatchObject({
      items: [{ number: 210, relatedIssues: [101] }],
      hasNextPage: true,
    });
    expect(String(client.calls.find((call) => String(call.query.q).includes("is:issue"))?.query.q))
      .toContain("repo:acme/sandbox");
  });

  it("normalizes workflow failures and excludes successful jobs and steps", async () => {
    const adapter = new GithubAppAdapter(new FakeGithubClient());
    const runs = await adapter.listWorkflowRuns(
      {
        repository: "acme/sandbox",
        workflow: "deploy-checkout",
        status: "all",
        page: 1,
        pageSize: 10,
      },
      signal,
    );
    const jobs = await adapter.listFailedWorkflowJobs(
      { repository: "acme/sandbox", runId: 5004, page: 1, pageSize: 10 },
      signal,
    );

    expect(runs.items[0]).toMatchObject({ runId: 5004, status: "failed" });
    expect(jobs?.items).toEqual([
      expect.objectContaining({
        jobId: 7003,
        failedSteps: [{ number: 2, name: "Verify health", conclusion: "failure" }],
      }),
    ]);
  });
});

function githubIssue(number: number) {
  return {
    number,
    title: "Checkout incident",
    body: "Issue body",
    state: "open",
    labels: [{ name: "incident" }, { name: "checkout" }],
    user: { login: "octocat" },
    comments: 1,
    html_url: `https://github.test/acme/sandbox/issues/${number}`,
    created_at: "2026-07-18T13:00:00.000Z",
    updated_at: "2026-07-18T14:00:00.000Z",
  };
}
