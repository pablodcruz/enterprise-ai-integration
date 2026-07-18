export type ProjectErrorCode =
  | "INVALID_ARGUMENT"
  | "REPOSITORY_NOT_ALLOWED"
  | "RESOURCE_NOT_FOUND"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_FAILURE";

export class ProjectError extends Error {
  constructor(
    readonly code: ProjectErrorCode,
    message: string,
    readonly retryable = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProjectError";
  }
}

export function publicError(error: unknown): {
  code: ProjectErrorCode;
  message: string;
  retryable: boolean;
} {
  if (error instanceof ProjectError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }

  // Internal exception text can contain filesystem paths, tokens, or upstream
  // response fragments. The public boundary therefore returns a stable error.
  return {
    code: "UPSTREAM_FAILURE",
    message: "The GitHub read operation could not be completed.",
    retryable: false,
  };
}
