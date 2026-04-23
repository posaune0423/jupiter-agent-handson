import type { DemoEnv } from "../../utils/env.ts";
import {
  DEFAULT_DCA,
  DEFAULT_LEND,
  DEFAULT_SWAP,
} from "../../config/demo-defaults.ts";
import { getWalletSummary, type WalletSummary } from "../wallet/usecase.ts";
import type { PositionReportViewModel } from "./formatter.ts";

export interface ReportUsecaseDependencies {
  now: () => Date;
  getWalletSummary: (env: DemoEnv) => Promise<WalletSummary>;
}

const defaultDependencies: ReportUsecaseDependencies = {
  now: () => new Date(),
  getWalletSummary,
};

export async function buildPositionReportViewModel(
  env: DemoEnv,
  dependencies: Partial<ReportUsecaseDependencies> = {},
): Promise<PositionReportViewModel> {
  const deps = { ...defaultDependencies, ...dependencies };
  const summary = await deps.getWalletSummary(env);

  return {
    walletAddress: summary.walletAddress,
    generatedAt: deps.now().toISOString(),
    balances: summary.balances.map((balance) => ({
      symbol: balance.symbol,
      mint: balance.mint,
      amount: balance.amount,
    })),
    defaults: {
      swap:
        `${DEFAULT_SWAP.amount} ${DEFAULT_SWAP.input} -> ${DEFAULT_SWAP.output}`,
      lend: `${DEFAULT_LEND.amount} ${DEFAULT_LEND.asset} Earn deposit`,
      dca:
        `${DEFAULT_DCA.amount} ${DEFAULT_DCA.input} -> ${DEFAULT_DCA.output} / ${DEFAULT_DCA.orders} orders / ${DEFAULT_DCA.intervalSeconds}s`,
    },
  };
}
