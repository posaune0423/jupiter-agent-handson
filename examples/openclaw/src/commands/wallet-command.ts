import { loadEnv } from "../utils/env.ts";
import {
  formatErrorMessage,
  TransactionExecutionError,
} from "../utils/errors.ts";
import { getWalletSummary } from "../usecases/wallet/usecase.ts";

function formatWalletSummary(
  summary: Awaited<ReturnType<typeof getWalletSummary>>,
): string {
  const [solBalance, usdcBalance] = summary.balances;

  return [
    "# OpenClaw Jupiter Wallet",
    "",
    `Address: ${summary.walletAddress}`,
    `SOL: ${solBalance.amount} (${solBalance.rawAmount} lamports)`,
    `USDC: ${usdcBalance.amount} (${usdcBalance.rawAmount} base units)`,
  ].join("\n");
}

function printError(error: unknown): never {
  console.error(`[wallet] ${formatErrorMessage(error)}`);
  if (error instanceof TransactionExecutionError && error.logs.length > 0) {
    for (const line of error.logs) console.error(line);
  }
  Deno.exit(1);
}

export async function runWalletCommand(): Promise<void> {
  try {
    const env = loadEnv();
    const summary = await getWalletSummary(env);
    console.log(formatWalletSummary(summary));
  } catch (error) {
    printError(error);
  }
}
