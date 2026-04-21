import { bigintToJsonNumber, parseBaseUnits } from "../utils/amounts.ts";
import type { DemoEnv } from "../utils/env.ts";
import { jupiterFetch, withRetry } from "../utils/jupiter.ts";
import { resolveToken } from "../utils/tokens.ts";
import { getWallet, signBase64Transaction } from "../utils/transactions.ts";

interface OrderResponse {
  transaction?: string | null;
  requestId: string;
  error?: string;
  inAmount?: string;
  outAmount?: string;
}

interface ExecuteResponse {
  status: string;
  signature?: string;
  code?: number;
  inputAmountResult?: string;
  outputAmountResult?: string;
  error?: string;
}

export interface SwapOptions {
  input: string;
  output: string;
  amount: string;
  execute: boolean;
}

export async function runSwapDemo(
  env: DemoEnv,
  options: SwapOptions,
): Promise<string> {
  const input = resolveToken(options.input);
  const output = resolveToken(options.output);
  const rawAmount = parseBaseUnits(options.amount, input.decimals);
  const wallet = await getWallet(env.PRIVATE_KEY);

  const params = new URLSearchParams({
    inputMint: input.mint,
    outputMint: output.mint,
    amount: bigintToJsonNumber(rawAmount).toString(),
    taker: wallet.address,
  });

  const lines = [
    `[swap] Requesting order: ${options.amount} ${input.symbol} -> ${output.symbol}`,
  ];
  const order = await jupiterFetch<OrderResponse>(
    env,
    `/swap/v2/order?${params}`,
  );
  if (order.error || !order.transaction) {
    throw new Error(
      `Swap order failed: ${order.error ?? "no transaction returned"}`,
    );
  }

  lines.push(`[swap] Order received: requestId=${order.requestId}`);
  lines.push(
    "[swap] Dry run complete. Use deno task swap:execute to sign and execute a fresh order.",
  );

  if (!options.execute) return lines.join("\n");

  const signedTransaction = await signBase64Transaction(
    order.transaction,
    wallet,
  );
  const result = await withRetry(() =>
    jupiterFetch<ExecuteResponse>(env, "/swap/v2/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signedTransaction,
        requestId: order.requestId,
      }),
    })
  );

  if (result.status !== "Success" || !result.signature) {
    throw new Error(`Swap execute failed: ${result.error ?? "unknown error"}`);
  }

  lines.push("[swap] Success");
  lines.push(`signature: ${result.signature}`);
  lines.push(`explorer: https://solscan.io/tx/${result.signature}`);
  if (result.inputAmountResult) {
    lines.push(`inputAmountResult: ${result.inputAmountResult}`);
  }
  if (result.outputAmountResult) {
    lines.push(`outputAmountResult: ${result.outputAmountResult}`);
  }

  return lines.join("\n");
}
