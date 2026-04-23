import type { DemoEnv } from "../../utils/env.ts";
import {
  createJupiterRetryPolicy,
  retryWithPolicy,
} from "../../utils/retry.ts";

const JUPITER_BASE_URL = "https://api.jup.ag";

export class JupiterClientError extends Error {
  readonly code?: string | number;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      code?: string | number;
      status?: number;
      retryable: boolean;
      cause?: unknown;
    },
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "JupiterClientError";
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

export interface JupiterClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

export function createJupiterClient(
  env: Pick<DemoEnv, "JUPITER_API_KEY">,
  fetcher: typeof fetch = fetch,
): JupiterClient {
  return {
    request: async <T>(path: string, init?: RequestInit): Promise<T> => {
      const policy = createJupiterRetryPolicy({
        label: `Jupiter request ${path}`,
      });

      return await retryWithPolicy(async () => {
        const response = await fetcher(`${JUPITER_BASE_URL}${path}`, {
          ...init,
          headers: {
            "x-api-key": env.JUPITER_API_KEY,
            ...init?.headers,
          },
        });

        if (response.status === 429) {
          throw new JupiterClientError("Rate limited by Jupiter API", {
            code: "RATE_LIMITED",
            status: response.status,
            retryable: true,
          });
        }

        if (!response.ok) {
          const raw = await response.text();
          let payload: Record<string, unknown> = raw
            ? { message: raw }
            : { message: `HTTP_${response.status}` };

          try {
            payload = raw
              ? JSON.parse(raw) as Record<string, unknown>
              : payload;
          } catch {
            // Keep the raw body fallback for non-JSON responses.
          }

          throw new JupiterClientError(
            (payload.error as string | undefined) ??
              (payload.message as string | undefined) ??
              `HTTP_${response.status}`,
            {
              code: payload.code as string | number | undefined,
              status: response.status,
              retryable: isRetryableStatus(response.status),
            },
          );
        }

        return await response.json() as T;
      }, policy);
    },
  };
}
