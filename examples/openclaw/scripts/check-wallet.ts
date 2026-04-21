import { buildWalletSummary } from "../src/lib/wallet.ts";
import { loadEnv } from "../src/utils/env.ts";

async function main(): Promise<void> {
  const env = loadEnv();
  console.log(await buildWalletSummary(env));
}

main().catch((error) => {
  console.error(
    `[wallet] ${error instanceof Error ? error.message : String(error)}`,
  );
  Deno.exit(1);
});
