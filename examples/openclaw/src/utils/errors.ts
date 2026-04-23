export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ExternalServiceError extends Error {
  readonly service: string;

  constructor(service: string, detail: string, cause?: unknown) {
    super(`${service}: ${detail}`, cause ? { cause } : undefined);
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

export class RetryExhaustedError extends Error {
  readonly attempts: number;

  constructor(label: string, attempts: number, cause?: unknown) {
    super(
      `${label} failed after ${attempts} attempts`,
      cause ? { cause } : undefined,
    );
    this.name = "RetryExhaustedError";
    this.attempts = attempts;
  }
}

export interface TransactionExecutionErrorOptions {
  signature?: string;
  logs?: string[];
  cause?: unknown;
}

export class TransactionExecutionError extends Error {
  readonly signature?: string;
  readonly logs: string[];

  constructor(message: string, options: TransactionExecutionErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "TransactionExecutionError";
    this.signature = options.signature;
    this.logs = options.logs ?? [];
  }
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof TransactionExecutionError && error.signature) {
    return `${error.message} (signature: ${error.signature})`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
