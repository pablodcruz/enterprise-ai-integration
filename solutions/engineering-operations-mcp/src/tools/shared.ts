import type { z } from "zod/v4";

import { ProjectError } from "../domain/errors.js";

export function parseToolInput<T>(schema: z.ZodType<T>, rawInput: unknown): T {
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ProjectError(
      "INVALID_ARGUMENT",
      parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
      false,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}

export async function withReadTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      const error = new ProjectError(
        "UPSTREAM_TIMEOUT",
        `The recorded GitHub adapter exceeded the ${timeoutMs} ms deadline.`,
        true,
      );
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } catch (error) {
    if (error instanceof ProjectError) {
      throw error;
    }
    throw new ProjectError("UPSTREAM_FAILURE", "The recorded GitHub adapter failed.", false, {
      cause: error,
    });
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
