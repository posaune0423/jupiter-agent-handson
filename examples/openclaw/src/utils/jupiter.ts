import type { DemoEnv } from "./env.ts";

const BASE_URL = "https://api.jup.ag";
const RETRYABLE_CODES = new Set<number>([
  -1,
  -1000,
  -1001,
  -1004,
  -2000,
  -2001,
  -2003,
  -2004,
]);

export interface JupiterErrorShape {
  code?: string | number;
  message?: string;
  retryable?: boolean;
}

export class JupiterApiError extends Error {
  readonly code: string | number;
  readonly retryable: boolean;

  constructor(message: string, code: string | number, retryable: boolean) {
    super(message);
    this.name = "JupiterApiError";
    this.code = code;
    this.retryable = retryable;
  }
}

export function isRetryableJupiterError(error: JupiterErrorShape): boolean {
  if (error.retryable === true) return true;
  if (error.code === 429 || error.code === "RATE_LIMITED") return true;
  return typeof error.code === "number" && RETRYABLE_CODES.has(error.code);
}

export async function jupiterFetch<T>(
  env: Pick<DemoEnv, "JUPITER_API_KEY">,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "x-api-key": env.JUPITER_API_KEY,
      ...init?.headers,
    },
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 10;
    throw new JupiterApiError(
      `Rate limited by Jupiter API; retry after ${retryAfter}s`,
      "RATE_LIMITED",
      true,
    );
  }

  if (!res.ok) {
    const raw = await res.text();
    let body: Record<string, unknown> = {
      message: raw || `HTTP_${res.status}`,
    };
    try {
      body = raw ? JSON.parse(raw) as Record<string, unknown> : body;
    } catch {
      // Keep text fallback for non-JSON errors.
    }

    const code = (body.code as string | number | undefined) ?? res.status;
    const message = (body.error as string | undefined) ??
      (body.message as string | undefined) ??
      `HTTP_${res.status}`;
    throw new JupiterApiError(message, code, isRetryableJupiterError({ code }));
  }

  return await res.json() as T;
}

export async function withRetry<T>(
  action: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      const shape = error as JupiterErrorShape;
      if (!isRetryableJupiterError(shape) || attempt === maxRetries) {
        throw error;
      }

      const delayMs = Math.min(1_000 * 2 ** attempt, 10_000);
      console.warn(
        `[retry] attempt ${
          attempt + 1
        }/${maxRetries}; waiting ${delayMs}ms (code: ${shape.code})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Retry exhausted: all attempts failed");
}
