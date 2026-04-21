import { buildPositionReport } from "../src/lib/position-report.ts";
import { loadEnv } from "../src/utils/env.ts";

async function main(): Promise<void> {
  const env = loadEnv();
  console.log(await buildPositionReport(env));
}

main().catch((error) => {
  console.error(
    `[report] ${error instanceof Error ? error.message : String(error)}`,
  );
  Deno.exit(1);
});
