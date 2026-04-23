import { assertEquals } from "@std/assert";
import type { DemoEnv } from "../../utils/env.ts";
import { buildPositionReportViewModel } from "./usecase.ts";

const DEMO_ENV: DemoEnv = {
  JUPITER_API_KEY: "demo-api-key",
  PRIVATE_KEY: "demo-private-key",
  SOLANA_RPC_URL: "https://rpc.example.invalid",
};

Deno.test("buildPositionReportViewModel combines wallet balances with demo defaults", async () => {
  const report = await buildPositionReportViewModel(DEMO_ENV, {
    now: () => new Date("2026-04-23T00:00:00.000Z"),
    getWalletSummary: () =>
      Promise.resolve({
        walletAddress: "wallet-1",
        balances: [
          {
            symbol: "SOL",
            mint: "So11111111111111111111111111111111111111112",
            amount: "0.5",
            rawAmount: "500000000",
          },
          {
            symbol: "USDC",
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "104",
            rawAmount: "104000000",
          },
        ],
      }),
  });

  assertEquals(report.walletAddress, "wallet-1");
  assertEquals(report.generatedAt, "2026-04-23T00:00:00.000Z");
  assertEquals(report.defaults.swap, "0.001 SOL -> USDC");
  assertEquals(report.defaults.lend, "1 USDC Earn deposit");
});
