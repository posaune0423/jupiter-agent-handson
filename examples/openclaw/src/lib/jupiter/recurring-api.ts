import type { DemoEnv } from "../../utils/env.ts";
import { bigintToJsonNumber } from "../../utils/amounts.ts";
import { createJupiterClient, type JupiterClient } from "./client.ts";

export interface RecurringCreateOrderRequest {
  user: string;
  inputMint: string;
  outputMint: string;
  params: {
    time: {
      inAmount: bigint | number;
      numberOfOrders: number;
      interval: number;
      minPrice: null;
      maxPrice: null;
      startAt: null;
    };
  };
}

export interface RecurringCreateOrderResponse {
  requestId: string;
  transaction?: string;
  error?: string;
}

export interface RecurringExecuteRequest {
  signedTransaction: string;
  requestId: string;
}

export interface RecurringExecuteResponse {
  status: string;
  signature?: string;
  code?: number;
  error?: string;
}

export interface RecurringApi {
  createOrder(
    request: RecurringCreateOrderRequest,
  ): Promise<RecurringCreateOrderResponse>;
  execute(request: RecurringExecuteRequest): Promise<RecurringExecuteResponse>;
}

export function createRecurringApi(
  env: Pick<DemoEnv, "JUPITER_API_KEY">,
  client: JupiterClient = createJupiterClient(env),
): RecurringApi {
  return {
    createOrder: async (request) =>
      await client.request<RecurringCreateOrderResponse>(
        "/recurring/v1/createOrder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...request,
            params: {
              time: {
                ...request.params.time,
                inAmount: typeof request.params.time.inAmount === "bigint"
                  ? bigintToJsonNumber(request.params.time.inAmount)
                  : request.params.time.inAmount,
              },
            },
          }),
        },
      ),
    execute: async (request) =>
      await client.request<RecurringExecuteResponse>("/recurring/v1/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
  };
}
