import type { DemoEnv } from "../utils/env.ts";
import { getSolBalance, getSplTokenBalance } from "../utils/rpc.ts";
import { TOKENS } from "../utils/tokens.ts";
import { getWallet } from "../utils/transactions.ts";
import { DEFAULT_DCA, DEFAULT_LEND, DEFAULT_SWAP } from "./defaults.ts";
import { formatPositionReport } from "./report.ts";

export async function buildPositionReport(env: DemoEnv): Promise<string> {
  const wallet = await getWallet(env.PRIVATE_KEY);
  const address = wallet.address;
  const [solBalance, usdcBalance] = await Promise.all([
    getSolBalance(env, address),
    getSplTokenBalance(env, address, TOKENS.USDC),
  ]);

  return formatPositionReport({
    walletAddress: address,
    generatedAt: new Date().toISOString(),
    balances: [solBalance, usdcBalance],
    defaults: {
      swap:
        `${DEFAULT_SWAP.amount} ${DEFAULT_SWAP.input.symbol} -> ${DEFAULT_SWAP.output.symbol}`,
      lend: `${DEFAULT_LEND.amount} ${DEFAULT_LEND.asset.symbol} Earn deposit`,
      dca:
        `${DEFAULT_DCA.amount} ${DEFAULT_DCA.input.symbol} -> ${DEFAULT_DCA.output.symbol} / ${DEFAULT_DCA.orders} orders / ${DEFAULT_DCA.intervalSeconds}s`,
    },
  });
}
