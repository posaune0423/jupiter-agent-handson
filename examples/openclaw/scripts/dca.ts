import { DEFAULT_DCA, runDcaDemo } from "../src/lib/mod.ts";
import { getArg, getBooleanArg, parseArgs } from "../src/utils/cli.ts";
import { loadEnv } from "../src/utils/env.ts";

function safeParseInt(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const env = loadEnv();
  console.log(
    await runDcaDemo(env, {
      amount: getArg(args, "amount", DEFAULT_DCA.amount),
      orders: safeParseInt(
        getArg(args, "orders", DEFAULT_DCA.orders.toString()),
        DEFAULT_DCA.orders,
      ),
      intervalSeconds: safeParseInt(
        getArg(
          args,
          "interval-seconds",
          DEFAULT_DCA.intervalSeconds.toString(),
        ),
        DEFAULT_DCA.intervalSeconds,
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
