import { parseBaseUnits } from "../utils/amounts.ts";
import { TOKENS } from "../utils/tokens.ts";

export const DEFAULT_SWAP = {
  input: TOKENS.SOL,
  output: TOKENS.USDC,
  amount: "0.001",
  get rawAmount(): bigint {
    return parseBaseUnits(this.amount, this.input.decimals);
  },
};

export const DEFAULT_LEND = {
  asset: TOKENS.USDC,
  amount: "1",
  get rawAmount(): bigint {
    return parseBaseUnits(this.amount, this.asset.decimals);
  },
};

export const DEFAULT_DCA = {
  input: TOKENS.USDC,
  output: TOKENS.SOL,
  amount: "104",
  orders: 2,
  intervalSeconds: 86_400,
  get rawAmount(): bigint {
    return parseBaseUnits(this.amount, this.input.decimals);
  },
};
