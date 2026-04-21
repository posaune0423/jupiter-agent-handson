import { bigintToJsonNumber, parseBaseUnits } from "../utils/amounts.ts";
import type { DemoEnv } from "../utils/env.ts";
import { jupiterFetch, withRetry } from "../utils/jupiter.ts";
import { getWallet, signBase64Transaction } from "../utils/transactions.ts";
import { DEFAULT_DCA } from "./defaults.ts";

interface CreateRecurringResponse {
  requestId: string;
  transaction?: string;
  error?: string;
}

interface ExecuteResponse {
  status: string;
  signature?: string;
  code?: number;
  error?: string;
}

export interface DcaOptions {
  amount: string;
  orders: number;
  intervalSeconds: number;
  execute: boolean;
}

export async function runDcaDemo(
  env: DemoEnv,
  options: DcaOptions,
): Promise<string> {
  if (!Number.isInteger(options.orders) || options.orders < 2) {
    throw new Error("--orders must be an integer >= 2");
  }
  if (
    !Number.isInteger(options.intervalSeconds) || options.intervalSeconds <= 0
  ) {
    throw new Error("--interval-seconds must be a positive integer");
  }

  const rawAmount = parseBaseUnits(options.amount, DEFAULT_DCA.input.decimals);
  const wallet = await getWallet(env.PRIVATE_KEY);

  const lines = [
    `[dca] Requesting recurring order transaction: ${options.amount} ${DEFAULT_DCA.input.symbol} -> ${DEFAULT_DCA.output.symbol}, ${options.orders} orders, ${options.intervalSeconds}s interval`,
  ];
  const order = await jupiterFetch<CreateRecurringResponse>(
    env,
    "/recurring/v1/createOrder",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: wallet.address,
        inputMint: DEFAULT_DCA.input.mint,
        outputMint: DEFAULT_DCA.output.mint,
        params: {
          time: {
            inAmount: bigintToJsonNumber(rawAmount),
            numberOfOrders: options.orders,
            interval: options.intervalSeconds,
            minPrice: null,
            maxPrice: null,
            startAt: null,
          },
        },
      }),
    },
  );

  if (order.error || !order.transaction) {
    throw new Error(
      `Recurring createOrder failed: ${
        order.error ?? "no transaction returned"
      }`,
    );
  }

  lines.push(
    `[dca] Recurring transaction received: requestId=${order.requestId}`,
  );

  if (!options.execute) {
    lines.push(
      "[dca] Dry run complete. Use deno task dca:execute to sign and execute a fresh order.",
    );
    return lines.join("\n");
  }

  const signedTransaction = await signBase64Transaction(
    order.transaction,
    wallet,
  );
  const result = await withRetry(() =>
    jupiterFetch<ExecuteResponse>(env, "/recurring/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signedTransaction,
        requestId: order.requestId,
      }),
    })
  );

  if (result.status !== "Success" || !result.signature) {
    throw new Error(
      `Recurring execute failed: ${result.error ?? "unknown error"}`,
    );
  }

  lines.push("[dca] Success");
  lines.push(`signature: ${result.signature}`);
  lines.push(`explorer: https://solscan.io/tx/${result.signature}`);

  return lines.join("\n");
}
