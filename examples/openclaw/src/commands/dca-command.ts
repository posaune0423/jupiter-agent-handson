import {
  getBooleanArg,
  getIntegerArg,
  getStringArg,
  parseArgs,
} from "../utils/args.ts";
import { loadEnv } from "../utils/env.ts";
import {
  formatErrorMessage,
  TransactionExecutionError,
} from "../utils/errors.ts";
import { type DcaResult, executeDcaUsecase } from "../usecases/dca/usecase.ts";

function formatDcaResult(result: DcaResult): string {
  const lines = [
    `[dca] Requesting recurring order transaction: ${result.displayAmount} ${result.inputToken.symbol} -> ${result.outputToken.symbol}, ${result.orders} orders, ${result.intervalSeconds}s interval`,
    `[dca] Recurring transaction received: requestId=${result.requestId}`,
  ];

  if (result.mode === "dry-run") {
    lines.push(
      "[dca] Dry run complete. Use deno task dca:execute to sign and execute a fresh order.",
    );
    return lines.join("\n");
  }

  lines.push("[dca] Success");
  lines.push(`signature: ${result.signature}`);
  lines.push(`explorer: ${result.explorerUrl}`);
  return lines.join("\n");
}

function printError(error: unknown): never {
  console.error(`[dca] ${formatErrorMessage(error)}`);
  if (error instanceof TransactionExecutionError && error.logs.length > 0) {
    for (const line of error.logs) console.error(line);
  }
  Deno.exit(1);
}

export async function runDcaCommand(args = Deno.args): Promise<void> {
  try {
    const parsed = parseArgs(args);
    const env = loadEnv();
    const result = await executeDcaUsecase(env, {
      amount: getStringArg(parsed, "amount"),
      orders: getIntegerArg(parsed, "orders"),
      intervalSeconds: getIntegerArg(parsed, "interval-seconds"),
      execute: getBooleanArg(parsed, "execute"),
    });
    console.log(formatDcaResult(result));
  } catch (error) {
    printError(error);
  }
}
