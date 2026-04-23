export const DEFAULT_SWAP = {
  input: "SOL",
  output: "USDC",
  amount: "0.001",
} as const;

export const DEFAULT_LEND = {
  asset: "USDC",
  amount: "1",
} as const;

export const DEFAULT_DCA = {
  input: "USDC",
  output: "SOL",
  amount: "104",
  orders: 2,
  intervalSeconds: 86_400,
} as const;
