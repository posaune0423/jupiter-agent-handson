import type { DemoEnv } from "../../utils/env.ts";
import {
  createSolanaRpcRetryPolicy,
  type RetryPolicy,
  retryWithPolicy,
} from "../../utils/retry.ts";
import { formatBaseUnits } from "../../utils/amounts.ts";
import type { TokenMetadata } from "../../utils/tokens.ts";
import { TransactionExecutionError } from "../../utils/errors.ts";

interface RpcSuccess<T> {
  jsonrpc: "2.0";
  result: T;
  id: number;
}

interface RpcFailure {
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
  };
  id: number;
}

type RpcResponse<T> = RpcSuccess<T> | RpcFailure;

export class SolanaRpcError extends Error {
  readonly code?: number;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      code?: number;
      status?: number;
      retryable: boolean;
      cause?: unknown;
    },
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "SolanaRpcError";
    this.code = options.code;
    this.status = options.status;
    this.retryable = options.retryable;
  }
}

export interface TokenBalance {
  symbol: string;
  mint: string;
  amount: string;
  rawAmount: string;
}

export interface ConfirmedTransaction {
  signature: string;
}

interface SignatureStatus {
  confirmationStatus?: string | null;
  err?: unknown;
}

interface ConfirmTransactionDependencies {
  rpcCall: typeof rpcCall;
  retryPolicy: RetryPolicy;
}

let rpcRequestId = 0;

function isRetryableHttpStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}

async function rpcCall<T>(
  env: Pick<DemoEnv, "SOLANA_RPC_URL">,
  method: string,
  params: unknown[] = [],
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const policy = createSolanaRpcRetryPolicy({ label: `Solana RPC ${method}` });

  return await retryWithPolicy(async () => {
    const id = ++rpcRequestId;
    const response = await fetcher(env.SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new SolanaRpcError(
        `RPC ${method} failed with HTTP ${response.status}`,
        {
          status: response.status,
          retryable: isRetryableHttpStatus(response.status),
        },
      );
    }

    const payload = await response.json() as RpcResponse<T>;
    if ("error" in payload) {
      throw new SolanaRpcError(
        `RPC ${method} failed: ${payload.error.message}`,
        {
          code: payload.error.code,
          retryable: true,
        },
      );
    }

    return payload.result;
  }, policy);
}

export async function getSolBalance(
  env: Pick<DemoEnv, "SOLANA_RPC_URL">,
  owner: string,
): Promise<TokenBalance> {
  const lamports = await rpcCall<{ value: number }>(env, "getBalance", [owner]);
  const rawAmount = lamports.value.toString();

  return {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    rawAmount,
    amount: formatBaseUnits(BigInt(rawAmount), 9),
  };
}

export async function getSplTokenBalance(
  env: Pick<DemoEnv, "SOLANA_RPC_URL">,
  owner: string,
  token: TokenMetadata,
): Promise<TokenBalance> {
  const result = await rpcCall<{
    value: Array<{
      account: {
        data: {
          parsed: {
            info: {
              tokenAmount: {
                amount: string;
              };
            };
          };
        };
      };
    }>;
  }>(env, "getTokenAccountsByOwner", [
    owner,
    { mint: token.mint },
    { encoding: "jsonParsed" },
  ]);

  const rawAmount = result.value.reduce(
    (sum, item) =>
      sum + BigInt(item.account.data.parsed.info.tokenAmount.amount),
    0n,
  );

  return {
    symbol: token.symbol,
    mint: token.mint,
    rawAmount: rawAmount.toString(),
    amount: formatBaseUnits(rawAmount, token.decimals),
  };
}

export async function sendRawTransaction(
  env: Pick<DemoEnv, "SOLANA_RPC_URL">,
  signedTransaction: Uint8Array,
): Promise<string> {
  const encoded = btoa(String.fromCharCode(...signedTransaction));
  return await rpcCall<string>(env, "sendTransaction", [
    encoded,
    {
      encoding: "base64",
      maxRetries: 0,
      skipPreflight: true,
    },
  ]);
}

export async function confirmSubmittedTransaction(
  env: Pick<DemoEnv, "SOLANA_RPC_URL">,
  signature: string,
  dependencies?: Partial<ConfirmTransactionDependencies>,
): Promise<ConfirmedTransaction> {
  const deps: ConfirmTransactionDependencies = {
    rpcCall,
    retryPolicy: {
      ...createSolanaRpcRetryPolicy(),
      label: `Solana confirmation ${signature}`,
      maxRetries: 10,
      baseDelayMs: 500,
      maxDelayMs: 1_500,
    },
    ...dependencies,
  };

  const status = await retryWithPolicy(async () => {
    const statuses = await deps.rpcCall<{
      value: Array<
        SignatureStatus | null
      >;
    }>(env, "getSignatureStatuses", [[signature], {
      searchTransactionHistory: true,
    }]);

    const nextStatus = statuses.value[0];
    if (
      !nextStatus ||
      nextStatus.confirmationStatus === null ||
      nextStatus.confirmationStatus === undefined ||
      nextStatus.confirmationStatus === "processed"
    ) {
      throw new SolanaRpcError("Transaction confirmation pending", {
        retryable: true,
      });
    }

    return nextStatus;
  }, deps.retryPolicy);

  if (status.err) {
    const transaction = await deps.rpcCall<
      {
        meta?: {
          err?: unknown;
          logMessages?: string[] | null;
        } | null;
      } | null
    >(env, "getTransaction", [
      signature,
      {
        encoding: "json",
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      },
    ]);

    throw new TransactionExecutionError("Transaction execution failed", {
      signature,
      logs: transaction?.meta?.logMessages ?? [],
    });
  }

  return { signature };
}
