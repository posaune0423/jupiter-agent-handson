export interface ReportBalance {
  symbol: string;
  mint: string;
  amount: string;
}

export interface DemoDefaults {
  swap: string;
  lend: string;
  dca: string;
}

export interface PositionReport {
  walletAddress: string;
  generatedAt: string;
  balances: ReportBalance[];
  defaults: DemoDefaults;
}

export function formatPositionReport(report: PositionReport): string {
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
