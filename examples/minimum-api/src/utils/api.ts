import { env } from "../env.ts";

const BASE_URL = "https://api.jup.ag";

interface JupiterError {
  code: string | number;
  message: string;
  retryable: boolean;
}

const RETRYABLE_CODES = new Set([-1, -1000, -1001, -1004, -2000, -2001, -2003, -2004]);

function isRetryable(code: string | number): boolean {
  if (code === 429 || code === "RATE_LIMITED") return true;
  if (typeof code === "number" && RETRYABLE_CODES.has(code)) return true;
  return false;
}

/**
 * Jupiter API client — auto-attaches base URL and x-api-key header.
 * Throws structured JupiterError for non-2xx responses.
 */
export async function jupiterFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "x-api-key": env.JUPITER_API_KEY,
      ...init?.headers,
    },
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 10;
    throw {
      code: "RATE_LIMITED",
      message: `Rate limited, retry after ${retryAfter}s`,
      retryable: true,
    } satisfies JupiterError;
  }

  if (!res.ok) {
    const raw = await res.text();
    let body: Record<string, unknown> = { message: raw || `HTTP_${res.status}` };
    try {
      body = raw ? JSON.parse(raw) : body;
    } catch {
      /* keep text fallback */
    }

    const code = (body.code as string | number) ?? res.status;
    throw {
      code,
      message: (body.error as string) ?? (body.message as string) ?? `HTTP_${res.status}`,
      retryable: isRetryable(code),
    } satisfies JupiterError;
  }

  return res.json();
}

/**
 * Retry wrapper with exponential backoff + jitter.
 * Only retries errors where retryable === true.
 */
export async function withRetry<T>(
  action: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (err: unknown) {
      const error = err as JupiterError;
      if (!error?.retryable || attempt === maxRetries) throw error;

      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 10_000);
      console.warn(
        `[retry] attempt ${attempt + 1}/${maxRetries} — waiting ${Math.round(delay)}ms (code: ${error.code})`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Retry exhausted");
}
