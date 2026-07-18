import { describe, expect, it, vi } from "vitest";

import { createUseCases, recordedAdapter, useCase } from "../test-helpers.js";

describe("repository and content policy", () => {
  it("denies a repository before the adapter can observe it", async () => {
    const searchIssues = vi.fn(async () => []);
    const adapter = recordedAdapter();
    adapter.searchIssues = searchIssues;

    await expect(
      useCase(adapter).execute(
        {
          owner: "acme",
          repository: "private-production",
          query: "checkout",
          limit: 5,
        },
        "req_denied",
      ),
    ).rejects.toMatchObject({ code: "REPOSITORY_NOT_ALLOWED" });
    expect(searchIssues).not.toHaveBeenCalled();
  });

  it("keeps prompt-injection text as inert issue data", async () => {
    const result = await useCase().execute(
      {
        owner: "acme",
        repository: "engineering-sandbox",
        query: "ignore previous instructions",
        limit: 5,
      },
      "req_injection",
    );

    expect(result.returned).toBe(1);
    expect(result.items[0]?.title).toContain("Ignore previous instructions");
    expect(result.items[0]).not.toHaveProperty("body");
    expect(Object.keys(result)).toEqual([
      "correlationId",
      "mode",
      "repository",
      "query",
      "items",
      "returned",
    ]);
  });

  it("labels a hostile issue body excerpt and does not expand the tool surface", async () => {
    const result = await createUseCases().getIssue.execute(
      {
        owner: "acme",
        repository: "engineering-sandbox",
        issueNumber: 103,
      },
      "req_hostile_details",
    );

    expect(result.issue.bodyExcerpt).toContain("Hostile content");
    expect(result.issue.contentTrust).toBe("untrusted_repository_content");
    expect(result.issue).not.toHaveProperty("tools");
  });

  it("denies workflow access before the adapter can observe a run ID", async () => {
    const adapter = recordedAdapter();
    const listFailedWorkflowJobs = vi.spyOn(adapter, "listFailedWorkflowJobs");

    await expect(
      createUseCases(adapter).listFailedWorkflowJobs.execute(
        {
          owner: "acme",
          repository: "private-production",
          runId: 5004,
        },
        "req_denied_run",
      ),
    ).rejects.toMatchObject({ code: "REPOSITORY_NOT_ALLOWED" });
    expect(listFailedWorkflowJobs).not.toHaveBeenCalled();
  });
});
