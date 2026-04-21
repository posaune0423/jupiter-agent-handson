import { DEFAULT_DCA, runDcaDemo } from "../src/lib/mod.ts";
import { getArg, getBooleanArg, parseArgs } from "../src/utils/cli.ts";
import { loadEnv } from "../src/utils/env.ts";

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const env = loadEnv();
  console.log(
    await runDcaDemo(env, {
      amount: getArg(args, "amount", DEFAULT_DCA.amount),
      orders: Number(getArg(args, "orders", DEFAULT_DCA.orders.toString())),
      intervalSeconds: Number(
        getArg(
          args,
          "interval-seconds",
          DEFAULT_DCA.intervalSeconds.toString(),
        ),
      ),
      execute: getBooleanArg(args, "execute"),
    }),
  );
}

main().catch((error) => {
  console.error(
    `[dca] ${error instanceof Error ? error.message : String(error)}`,
  );
  Deno.exit(1);
});
