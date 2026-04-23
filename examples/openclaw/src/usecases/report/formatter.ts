export interface ReportBalanceViewModel {
  symbol: string;
  mint: string;
  amount: string;
}

export interface PositionReportViewModel {
  walletAddress: string;
  generatedAt: string;
  balances: ReportBalanceViewModel[];
  defaults: {
    swap: string;
    lend: string;
    dca: string;
  };
}

export function formatPositionReport(report: PositionReportViewModel): string {
  const balanceRows = report.balances
    .map((balance) =>
      `| ${balance.symbol} | ${balance.amount} | \`${balance.mint}\` |`
    )
    .join("\n");

  return [
    "# OpenClaw Jupiter Demo Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Wallet: \`${report.walletAddress}\``,
    "",
    "## Balances",
    "",
    "| Token | Amount | Mint |",
    "| --- | ---: | --- |",
    balanceRows,
    "",
    "## Demo Defaults",
    "",
    `- Swap: ${report.defaults.swap}`,
    `- Lend: ${report.defaults.lend}`,
    `- DCA/Recurring: ${report.defaults.dca}`,
    "",
  ].join("\n");
}
