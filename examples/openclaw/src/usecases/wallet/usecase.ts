import type { DemoEnv } from "../../utils/env.ts";
import { TOKENS } from "../../utils/tokens.ts";
import {
  getSolBalance,
  getSplTokenBalance,
  type TokenBalance,
} from "../../lib/solana/rpc.ts";
import { type DemoWallet, getWallet } from "../../lib/solana/wallet.ts";

export interface WalletSummary {
  walletAddress: string;
  balances: TokenBalance[];
}

export interface WalletUsecaseDependencies {
  getWallet: (privateKey: string) => Promise<DemoWallet>;
  getSolBalance: (
    env: Pick<DemoEnv, "SOLANA_RPC_URL">,
    owner: string,
  ) => Promise<TokenBalance>;
  getSplTokenBalance: (
    env: Pick<DemoEnv, "SOLANA_RPC_URL">,
    owner: string,
    token: typeof TOKENS.USDC,
  ) => Promise<TokenBalance>;
}

const defaultDependencies: WalletUsecaseDependencies = {
  getWallet,
  getSolBalance,
  getSplTokenBalance,
};

export async function getWalletSummary(
  env: DemoEnv,
  dependencies: Partial<WalletUsecaseDependencies> = {},
): Promise<WalletSummary> {
  const deps = { ...defaultDependencies, ...dependencies };
  const wallet = await deps.getWallet(env.PRIVATE_KEY);

  const [solBalance, usdcBalance] = await Promise.all([
    deps.getSolBalance(env, wallet.address),
    deps.getSplTokenBalance(env, wallet.address, TOKENS.USDC),
  ]);

  return {
    walletAddress: wallet.address,
    balances: [solBalance, usdcBalance],
  };
}
