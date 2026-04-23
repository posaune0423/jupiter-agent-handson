import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { confirmSubmittedTransaction } from "./tx_confirm.ts";

type RpcMethod = "getSignatureStatuses" | "getTransaction";

Deno.test("confirmSubmittedTransaction resolves when the signature is confirmed successfully", async () => {
  const calls: RpcMethod[] = [];
  const rpcRequest = async <T>(method: string): Promise<T> => {
    if (method === "getSignatureStatuses") {
      calls.push("getSignatureStatuses");
      if (calls.length === 1) {
        return { value: [null] } as T;
      }

      return {
        value: [{ confirmationStatus: "confirmed", err: null }],
      } as T;
    }

    calls.push("getTransaction");
    return {
      meta: {
        err: null,
        logMessages: ["Program log: success"],
      },
    } as T;
  };

  await confirmSubmittedTransaction("success-signature", rpcRequest, {
    pollIntervalMs: 0,
    timeoutMs: 100,
  });

  assertEquals(calls, [
    "getSignatureStatuses",
    "getSignatureStatuses",
    "getTransaction",
  ]);
});

Deno.test("confirmSubmittedTransaction throws when the confirmed transaction failed on chain", async () => {
  const rpcRequest = async <T>(method: string): Promise<T> => {
    if (method === "getSignatureStatuses") {
      return {
        value: [
          {
            confirmationStatus: "confirmed",
            err: { InstructionError: [1, { Custom: 1 }] },
          },
        ],
      } as T;
    }

    return {
      meta: {
        err: { InstructionError: [1, { Custom: 1 }] },
        logMessages: [
          "Program log: Instruction: TransferChecked",
          "Program log: Error: insufficient funds",
        ],
      },
    } as T;
  };

  const error = await assertRejects(
    () =>
      confirmSubmittedTransaction("failed-signature", rpcRequest, {
        pollIntervalMs: 0,
        timeoutMs: 100,
      }),
  ) as Error;

  assertStringIncludes(error.message, "failed-signature");
  assertStringIncludes(error.message, "insufficient funds");
});
