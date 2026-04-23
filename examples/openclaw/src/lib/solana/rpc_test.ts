import { assertRejects } from "@std/assert";
import type { DemoEnv } from "../../utils/env.ts";
import { RetryExhaustedError } from "../../utils/errors.ts";
import { confirmSubmittedTransaction } from "./rpc.ts";

const DEMO_ENV: DemoEnv = {
  JUPITER_API_KEY: "demo-api-key",
  PRIVATE_KEY: "demo-private-key",
  SOLANA_RPC_URL: "https://rpc.example.invalid",
};

Deno.test("confirmSubmittedTransaction keeps polling while confirmationStatus is null", async () => {
  let statusCalls = 0;

  await assertRejects(
    () =>
      confirmSubmittedTransaction(DEMO_ENV, "pending-signature", {
        rpcCall: <T>(_: Pick<DemoEnv, "SOLANA_RPC_URL">, method: string) => {
          if (method === "getSignatureStatuses") {
            statusCalls++;
            return Promise.resolve({
              value: [
                {
                  confirmationStatus: null,
                  err: null,
                },
              ],
            } as T);
          }

          throw new Error(
            "getTransaction should not be called before confirmation",
          );
        },
        retryPolicy: {
          label: "Solana confirmation pending-signature",
          maxRetries: 2,
          baseDelayMs: 0,
          maxDelayMs: 0,
          shouldRetry: () => true,
          sleep: () => Promise.resolve(),
        },
      }),
    RetryExhaustedError,
    "Solana confirmation pending-signature failed after 3 attempts",
  );

  if (statusCalls !== 3) {
    throw new Error(`expected 3 status polls, got ${statusCalls}`);
  }
});
