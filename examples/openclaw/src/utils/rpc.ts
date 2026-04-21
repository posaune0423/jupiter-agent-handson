import type { DemoEnv } from "./env.ts";
import type { TokenMetadata } from "./tokens.ts";
import { formatBaseUnits } from "./amounts.ts";

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

let rpcRequestId = 0;

async function rpcCall<T>(
  env: Pick<DemoEnv, "SOLANA_RPC_URL">,
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const id = ++rpcRequestId;
  const response = await fetch(env.SOLANA_RPC_URL, {
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
    throw new Error(`RPC ${method} failed with HTTP ${response.status}`);
  }

  const payload = await response.json() as RpcResponse<T>;
  if ("error" in payload) {
    throw new Error(`RPC ${method} failed: ${payload.error.message}`);
  }

  return payload.result;
}

export interface TokenBalance {
  symbol: string;
  mint: string;
  amount: string;
  rawAmount: string;
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
