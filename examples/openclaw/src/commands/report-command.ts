import { loadEnv } from "../utils/env.ts";
import {
  formatErrorMessage,
  TransactionExecutionError,
} from "../utils/errors.ts";
import { buildPositionReportViewModel } from "../usecases/report/usecase.ts";
import { formatPositionReport } from "../usecases/report/formatter.ts";

function printError(error: unknown): never {
  console.error(`[report] ${formatErrorMessage(error)}`);
  if (error instanceof TransactionExecutionError && error.logs.length > 0) {
    for (const line of error.logs) console.error(line);
  }
  Deno.exit(1);
}

export async function runReportCommand(): Promise<void> {
  try {
    const env = loadEnv();
    const report = await buildPositionReportViewModel(env);
    console.log(formatPositionReport(report));
  } catch (error) {
    printError(error);
  }
}
