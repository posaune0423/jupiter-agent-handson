import { RetryExhaustedError } from "./errors.ts";

const JUPITER_RETRYABLE_CODES = new Set<number>([
  -1,
  -1000,
  -1001,
  -1004,
  -2000,
  -2001,
  -2003,
  -2004,
]);

const SOLANA_RPC_RETRYABLE_CODES = new Set<number>([
  -32004,
  -32005,
  -32014,
]);

interface RetryableShape {
  code?: string | number;
  status?: number;
  retryable?: boolean;
}

export interface RetryPolicy {
  label: string;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry: (error: unknown) => boolean;
  sleep?: (delayMs: number) => Promise<void>;
}

function getRetryableShape(error: unknown): RetryableShape {
  if (typeof error !== "object" || error === null) return {};
  return error as RetryableShape;
}

export function isRetryableJupiterError(error: unknown): boolean {
  if (error instanceof TypeError) return true;

  const shape = getRetryableShape(error);
  if (shape.retryable === true) return true;
  if (
    shape.status === 429 || shape.code === 429 || shape.code === "RATE_LIMITED"
  ) {
    return true;
  }
  return typeof shape.code === "number" &&
    JUPITER_RETRYABLE_CODES.has(shape.code);
}

export function isRetryableSolanaRpcError(error: unknown): boolean {
  if (error instanceof TypeError) return true;

  const shape = getRetryableShape(error);
  if (shape.retryable === true) return true;
  if (
    shape.status !== undefined &&
    [408, 429, 500, 502, 503, 504].includes(shape.status)
  ) {
    return true;
  }
  return typeof shape.code === "number" &&
    SOLANA_RPC_RETRYABLE_CODES.has(shape.code);
}

export function createJupiterRetryPolicy(
  overrides: Partial<RetryPolicy> = {},
): RetryPolicy {
  return {
    label: "Jupiter request",
    maxRetries: overrides.maxRetries ?? 3,
    baseDelayMs: overrides.baseDelayMs ?? 1_000,
    maxDelayMs: overrides.maxDelayMs ?? 10_000,
    shouldRetry: isRetryableJupiterError,
    sleep: overrides.sleep,
  };
}

export function createSolanaRpcRetryPolicy(
  overrides: Partial<RetryPolicy> = {},
): RetryPolicy {
  return {
    label: "Solana RPC request",
    maxRetries: overrides.maxRetries ?? 2,
    baseDelayMs: overrides.baseDelayMs ?? 500,
    maxDelayMs: overrides.maxDelayMs ?? 2_000,
    shouldRetry: isRetryableSolanaRpcError,
    sleep: overrides.sleep,
  };
}

export async function retryWithPolicy<T>(
  action: () => Promise<T>,
  policy: RetryPolicy,
): Promise<T> {
  const sleep = policy.sleep ??
    ((delayMs: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, delayMs)));

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (!policy.shouldRetry(error)) {
        throw error;
      }
      if (attempt === policy.maxRetries) {
        throw new RetryExhaustedError(policy.label, attempt + 1, error);
      }

      const delayMs = Math.min(
        policy.baseDelayMs * 2 ** attempt,
        policy.maxDelayMs,
      );
      await sleep(delayMs);
    }
  }

  throw new RetryExhaustedError(policy.label, policy.maxRetries + 1);
}
