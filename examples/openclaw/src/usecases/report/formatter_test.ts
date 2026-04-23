import { assertStringIncludes } from "@std/assert";
import { formatPositionReport } from "./formatter.ts";

Deno.test("formatPositionReport renders a markdown report from PositionReportViewModel", () => {
  const report = formatPositionReport({
    walletAddress: "DemoWallet111111111111111111111111111111111",
    generatedAt: "2026-04-22T00:00:00.000Z",
    balances: [
      {
        symbol: "SOL",
        amount: "0.25",
        mint: "So11111111111111111111111111111111111111112",
      },
      {
        symbol: "USDC",
        amount: "104",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      },
    ],
    defaults: {
      swap: "0.001 SOL -> USDC",
      lend: "1 USDC Earn deposit",
      dca: "104 USDC -> SOL / 2 orders / 86400s",
    },
  });

  assertStringIncludes(report, "# OpenClaw Jupiter Demo Report");
  assertStringIncludes(
    report,
    "Wallet: `DemoWallet111111111111111111111111111111111`",
  );
  assertStringIncludes(report, "| SOL | 0.25 |");
  assertStringIncludes(report, "- Swap: 0.001 SOL -> USDC");
  assertStringIncludes(
    report,
    "- DCA/Recurring: 104 USDC -> SOL / 2 orders / 86400s",
  );
});
