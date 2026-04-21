import { runSwapDemo } from "../src/lib/swap.ts";
import { getArg, getBooleanArg, parseArgs } from "../src/utils/cli.ts";
import { loadEnv } from "../src/utils/env.ts";

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const env = loadEnv();
  console.log(
    await runSwapDemo(env, {
      input: getArg(args, "input", "SOL"),
      output: getArg(args, "output", "USDC"),
      amount: getArg(args, "amount", "0.001"),
      execute: getBooleanArg(args, "execute"),
    }),
  );
}

main().catch((error) => {
  console.error(
    `[swap] ${error instanceof Error ? error.message : String(error)}`,
  );
  Deno.exit(1);
});
