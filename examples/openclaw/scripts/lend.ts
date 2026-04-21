import { DEFAULT_LEND, runLendDemo } from "../src/lib/mod.ts";
import { getArg, getBooleanArg, parseArgs } from "../src/utils/cli.ts";
import { loadEnv } from "../src/utils/env.ts";

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const env = loadEnv();
  console.log(
    await runLendDemo(env, {
      amount: getArg(args, "amount", DEFAULT_LEND.amount),
      execute: getBooleanArg(args, "execute"),
    }),
  );
}

main().catch((error) => {
  console.error(
    `[lend] ${error instanceof Error ? error.message : String(error)}`,
  );
  Deno.exit(1);
});
