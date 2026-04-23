import type { DemoEnv } from "../../utils/env.ts";
import { createJupiterClient, type JupiterClient } from "./client.ts";

export interface SwapOrderRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  taker: string;
}

export interface SwapOrderResponse {
  requestId: string;
  transaction?: string | null;
  error?: string;
  inAmount?: string;
  outAmount?: string;
}

export interface SwapExecuteRequest {
  signedTransaction: string;
  requestId: string;
}

export interface SwapExecuteResponse {
  status: string;
  signature?: string;
  code?: number;
  inputAmountResult?: string;
  outputAmountResult?: string;
  error?: string;
}

export interface SwapApi {
  order(request: SwapOrderRequest): Promise<SwapOrderResponse>;
  execute(request: SwapExecuteRequest): Promise<SwapExecuteResponse>;
}

export function createSwapApi(
  env: Pick<DemoEnv, "JUPITER_API_KEY">,
  client: JupiterClient = createJupiterClient(env),
): SwapApi {
  return {
    order: async (request) => {
      const params = new URLSearchParams({
        inputMint: request.inputMint,
        outputMint: request.outputMint,
        amount: request.amount,
        taker: request.taker,
      });

      return await client.request<SwapOrderResponse>(
        `/swap/v2/order?${params.toString()}`,
      );
    },
    execute: async (request) =>
      await client.request<SwapExecuteResponse>("/swap/v2/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
  };
}
