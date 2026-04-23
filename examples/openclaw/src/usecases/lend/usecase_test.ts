import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import type { DemoEnv } from "../../utils/env.ts";
import { TransactionExecutionError } from "../../utils/errors.ts";
import { executeLendUsecase, type LendCommandInput } from "./usecase.ts";

const DEMO_ENV: DemoEnv = {
  JUPITER_API_KEY: "demo-api-key",
  PRIVATE_KEY: "demo-private-key",
  SOLANA_RPC_URL: "https://rpc.example.invalid",
};

const VALID_INPUT: LendCommandInput = {
  amount: "1",
  execute: false,
};

Deno.test("executeLendUsecase returns a dry-run result with the unsigned deposit transaction", async () => {
  const result = await executeLendUsecase(DEMO_ENV, VALID_INPUT, {
    getWallet: () => Promise.resolve({ address: "wallet-1" }),
    lendApi: {
      createDepositTransaction: (
        request: { amount: string; signer: string },
      ) => {
        assertEquals(request.amount, "1000000");
        assertEquals(request.signer, "wallet-1");
        return Promise.resolve({ transaction: "unsigned-deposit-transaction" });
      },
    },
    signTransactionBytes: () => {
      throw new Error("sign should not be called during dry-run");
    },
    sendAndConfirmTransaction: () => {
      throw new Error("send should not be called during dry-run");
    },
  });

  assertEquals(result.mode, "dry-run");
  assertEquals(result.asset.symbol, "USDC");
  assertEquals(result.transaction, "unsigned-deposit-transaction");
});

Deno.test("executeLendUsecase signs and confirms the deposit transaction in execute mode", async () => {
  const result = await executeLendUsecase(
    DEMO_ENV,
    { ...VALID_INPUT, execute: true },
    {
      getWallet: () => Promise.resolve({ address: "wallet-1" }),
      lendApi: {
        createDepositTransaction: () =>
          Promise.resolve({
            transaction: "unsigned-deposit-transaction",
          }),
      },
      signTransactionBytes: () => Promise.resolve(new Uint8Array([1, 2, 3])),
      sendAndConfirmTransaction: (
        env: Pick<DemoEnv, "SOLANA_RPC_URL">,
        bytes: Uint8Array,
      ) => {
        assertEquals(env.SOLANA_RPC_URL, DEMO_ENV.SOLANA_RPC_URL);
        assertEquals(Array.from(bytes), [1, 2, 3]);
        return Promise.resolve({ signature: "lend-signature" });
      },
    },
  );

  assertEquals(result.mode, "execute");
  assertEquals(result.signature, "lend-signature");
  assertStringIncludes(result.explorerUrl!, "lend-signature");
});

Deno.test("executeLendUsecase maps confirmation failures to TransactionExecutionError", async () => {
  await assertRejects(
    () =>
      executeLendUsecase(DEMO_ENV, { ...VALID_INPUT, execute: true }, {
        getWallet: () => Promise.resolve({ address: "wallet-1" }),
        lendApi: {
          createDepositTransaction: () =>
            Promise.resolve({
              transaction: "unsigned-deposit-transaction",
            }),
        },
        signTransactionBytes: () => Promise.resolve(new Uint8Array([1, 2, 3])),
        sendAndConfirmTransaction: () => {
          throw new TransactionExecutionError("confirmation failed", {
            signature: "lend-signature",
            logs: ["Program log: insufficient funds"],
          });
        },
      }),
    TransactionExecutionError,
    "confirmation failed",
  );
});
