import type { DemoEnv } from "../utils/env.ts";
import { getSolBalance, getSplTokenBalance } from "../utils/rpc.ts";
import { TOKENS } from "../utils/tokens.ts";
import { getWallet } from "../utils/transactions.ts";

export async function buildWalletSummary(env: DemoEnv): Promise<string> {
  const wallet = await getWallet(env.PRIVATE_KEY);
  const address = wallet.address;
  const [solBalance, usdcBalance] = await Promise.all([
    getSolBalance(env, address),
    getSplTokenBalance(env, address, TOKENS.USDC),
  ]);

  return [
    "# OpenClaw Jupiter Wallet",
    "",
    `Address: ${address}`,
    `SOL: ${solBalance.amount} (${solBalance.rawAmount} lamports)`,
    `USDC: ${usdcBalance.amount} (${usdcBalance.rawAmount} base units)`,
  ].join("\n");
}
