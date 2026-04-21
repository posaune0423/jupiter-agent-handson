import { parseBaseUnits } from "../utils/amounts.ts";
import type { DemoEnv } from "../utils/env.ts";
import { jupiterFetch } from "../utils/jupiter.ts";
import { sendRawTransaction } from "../utils/rpc.ts";
import {
  getWallet,
  signBase64TransactionBytes,
} from "../utils/transactions.ts";
import { DEFAULT_LEND } from "./defaults.ts";

interface DepositResponse {
  transaction?: string;
}

export interface LendOptions {
  amount: string;
  execute: boolean;
}

export async function runLendDemo(
  env: DemoEnv,
  options: LendOptions,
): Promise<string> {
  const rawAmount = parseBaseUnits(options.amount, DEFAULT_LEND.asset.decimals);
  const wallet = await getWallet(env.PRIVATE_KEY);

  const lines = [
    `[lend] Requesting Earn deposit transaction: ${options.amount} ${DEFAULT_LEND.asset.symbol}`,
  ];
  const deposit = await jupiterFetch<DepositResponse>(
    env,
    "/lend/v1/earn/deposit",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asset: DEFAULT_LEND.asset.mint,
        signer: wallet.address,
        amount: rawAmount.toString(),
      }),
    },
  );

  if (!deposit.transaction) throw new Error("Lend API returned no transaction");

  lines.push("[lend] Unsigned deposit transaction received.");

  if (!options.execute) {
    lines.push(
      "[lend] Dry run complete. Use deno task lend:execute to sign and submit a fresh transaction.",
    );
    return lines.join("\n");
  }

  const signedBytes = await signBase64TransactionBytes(
    deposit.transaction,
    wallet,
  );
  const signature = await sendRawTransaction(env, signedBytes);

  lines.push("[lend] Submitted");
  lines.push(`signature: ${signature}`);
  lines.push(`explorer: https://solscan.io/tx/${signature}`);

  return lines.join("\n");
}
