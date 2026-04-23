import type { DemoEnv } from "../../utils/env.ts";
import { createJupiterClient, type JupiterClient } from "./client.ts";

export interface LendDepositRequest {
  asset: string;
  signer: string;
  amount: string;
}

export interface LendDepositResponse {
  transaction?: string;
}

export interface LendApi {
  createDepositTransaction(
    request: LendDepositRequest,
  ): Promise<LendDepositResponse>;
}

export function createLendApi(
  env: Pick<DemoEnv, "JUPITER_API_KEY">,
  client: JupiterClient = createJupiterClient(env),
): LendApi {
  return {
    createDepositTransaction: async (request) =>
      await client.request<LendDepositResponse>("/lend/v1/earn/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
  };
}
