import { describe, expect, it } from "vitest";

import { recordedAdapter, useCase } from "../test-helpers.js";

const validInput = {
  owner: "acme",
  repository: "engineering-sandbox",
  query: "checkout",
  state: "open",
  labels: [],
  limit: 10,
};

describe("search_issues contract", () => {
  it("returns a bounded, sorted, structured projection", async () => {
    const result = await useCase().execute({ ...validInput, limit: 1 }, "req_contract");

    expect(result).toMatchObject({
      correlationId: "req_contract",
      mode: "recorded",
      repository: "acme/engineering-sandbox",
      query: "checkout",
      returned: 1,
    });
    expect(result.items[0]?.number).toBe(102);
    expect(result.items[0]).not.toHaveProperty("body");
  });

  it("applies state and label filters", async () => {
    const result = await useCase().execute(
      { ...validInput, labels: ["incident"] },
      "req_filter",
    );

    expect(result.items.map((item) => item.number)).toEqual([101]);
  });

  it("rejects oversized limits before calling the adapter", async () => {
    await expect(
      useCase().execute({ ...validInput, limit: 21 }, "req_invalid"),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
  });

  it("normalizes adapter deadlines into a retryable timeout", async () => {
    const hangingAdapter = recordedAdapter();
    hangingAdapter.searchIssues = async () => new Promise(() => undefined);

    await expect(
      useCase(hangingAdapter, 20).execute(validInput, "req_timeout"),
    ).rejects.toMatchObject({ code: "UPSTREAM_TIMEOUT", retryable: true });
  });
});
