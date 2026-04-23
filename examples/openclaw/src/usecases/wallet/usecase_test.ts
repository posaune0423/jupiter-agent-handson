import { assertEquals } from "@std/assert";
import type { DemoEnv } from "../../utils/env.ts";
import { getWalletSummary } from "./usecase.ts";

const DEMO_ENV: DemoEnv = {
  JUPITER_API_KEY: "demo-api-key",
  PRIVATE_KEY: "demo-private-key",
  SOLANA_RPC_URL: "https://rpc.example.invalid",
};

Deno.test("getWalletSummary returns the wallet address and tracked token balances", async () => {
  const summary = await getWalletSummary(DEMO_ENV, {
    getWallet: () => Promise.resolve({ address: "wallet-1" }),
    getSolBalance: () =>
      Promise.resolve({
        symbol: "SOL",
        mint: "So11111111111111111111111111111111111111112",
        amount: "0.5",
        rawAmount: "500000000",
      }),
    getSplTokenBalance: (
      _env: Pick<DemoEnv, "SOLANA_RPC_URL">,
      owner: string,
      token: { symbol: string; mint: string },
    ) => {
      assertEquals(owner, "wallet-1");
      assertEquals(token.symbol, "USDC");
      return Promise.resolve({
        symbol: "USDC",
        mint: token.mint,
        amount: "104",
        rawAmount: "104000000",
      });
    },
  });

  assertEquals(summary.walletAddress, "wallet-1");
  assertEquals(summary.balances.length, 2);
  assertEquals(summary.balances[0].symbol, "SOL");
  assertEquals(summary.balances[1].symbol, "USDC");
});
