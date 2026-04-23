import { getBooleanArg, getStringArg, parseArgs } from "../utils/args.ts";
import { loadEnv } from "../utils/env.ts";
import {
  formatErrorMessage,
  TransactionExecutionError,
} from "../utils/errors.ts";
import {
  executeLendUsecase,
  type LendResult,
} from "../usecases/lend/usecase.ts";

function formatLendResult(result: LendResult): string {
  const lines = [
    `[lend] Requesting Earn deposit transaction: ${result.displayAmount} ${result.asset.symbol}`,
    "[lend] Unsigned deposit transaction received.",
  ];

  if (result.mode === "dry-run") {
    lines.push(
      "[lend] Dry run complete. Use deno task lend:execute to sign and submit a fresh transaction.",
    );
    return lines.join("\n");
  }

  lines.push("[lend] Submitted");
  lines.push(`signature: ${result.signature}`);
  lines.push(`explorer: ${result.explorerUrl}`);
  return lines.join("\n");
}

function printError(error: unknown): never {
  console.error(`[lend] ${formatErrorMessage(error)}`);
  if (error instanceof TransactionExecutionError && error.logs.length > 0) {
    for (const line of error.logs) console.error(line);
  }
  Deno.exit(1);
}

export async function runLendCommand(args = Deno.args): Promise<void> {
  try {
    const parsed = parseArgs(args);
    const env = loadEnv();
    const result = await executeLendUsecase(env, {
      amount: getStringArg(parsed, "amount"),
      execute: getBooleanArg(parsed, "execute"),
    });
    console.log(formatLendResult(result));
  } catch (error) {
    printError(error);
  }
}
