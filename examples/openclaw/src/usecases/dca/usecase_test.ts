import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import type { DemoEnv } from "../../utils/env.ts";
import { type DcaCommandInput, executeDcaUsecase } from "./usecase.ts";
import {
  TransactionExecutionError,
  ValidationError,
} from "../../utils/errors.ts";

const DEMO_ENV: DemoEnv = {
  JUPITER_API_KEY: "demo-api-key",
  PRIVATE_KEY: "demo-private-key",
  SOLANA_RPC_URL: "https://rpc.example.invalid",
};

const VALID_INPUT: DcaCommandInput = {
  amount: "104",
  orders: 2,
  intervalSeconds: 86_400,
  execute: false,
};

Deno.test("executeDcaUsecase returns a dry-run result for a recurring order", async () => {
  const result = await executeDcaUsecase(DEMO_ENV, VALID_INPUT, {
    getWallet: () => Promise.resolve({ address: "wallet-1" }),
    recurringApi: {
      createOrder: (
        request: {
          user: string;
          params: { time: { numberOfOrders: number } };
        },
      ) => {
        assertEquals(request.user, "wallet-1");
        assertEquals(request.params.time.numberOfOrders, 2);
        return Promise.resolve({
          requestId: "dca-request-1",
          transaction: "unsigned-recurring-transaction",
        });
      },
      execute: () => {
        throw new Error("execute should not be called during dry-run");
      },
    },
    signTransaction: () => {
      throw new Error("sign should not be called during dry-run");
    },
  });

  assertEquals(result.mode, "dry-run");
  assertEquals(result.requestId, "dca-request-1");
  assertEquals(result.inputToken.symbol, "USDC");
  assertEquals(result.outputToken.symbol, "SOL");
});

Deno.test("executeDcaUsecase executes a recurring order and returns explorer metadata", async () => {
  const result = await executeDcaUsecase(
    DEMO_ENV,
    { ...VALID_INPUT, execute: true },
    {
      getWallet: () => Promise.resolve({ address: "wallet-1" }),
      recurringApi: {
        createOrder: () =>
          Promise.resolve({
            requestId: "dca-request-2",
            transaction: "unsigned-recurring-transaction",
          }),
        execute: (
          request: { requestId: string; signedTransaction: string },
        ) => {
          assertEquals(request.requestId, "dca-request-2");
          assertEquals(
            request.signedTransaction,
            "signed-recurring-transaction",
          );
          return Promise.resolve({
            status: "Success",
            signature: "dca-signature",
          });
        },
      },
      signTransaction: () => Promise.resolve("signed-recurring-transaction"),
    },
  );

  assertEquals(result.mode, "execute");
  assertEquals(result.signature, "dca-signature");
  assertStringIncludes(result.explorerUrl!, "dca-signature");
});

Deno.test("executeDcaUsecase validates recurring order constraints before calling Jupiter", async () => {
  await assertRejects(
    () =>
      executeDcaUsecase(
        DEMO_ENV,
        { ...VALID_INPUT, orders: 1 },
      ),
    ValidationError,
    "--orders must be an integer >= 2",
  );
});

Deno.test("executeDcaUsecase maps failed Jupiter execute responses to TransactionExecutionError", async () => {
  await assertRejects(
    () =>
      executeDcaUsecase(DEMO_ENV, { ...VALID_INPUT, execute: true }, {
        getWallet: () => Promise.resolve({ address: "wallet-1" }),
        recurringApi: {
          createOrder: () =>
            Promise.resolve({
              requestId: "dca-request-3",
              transaction: "unsigned-recurring-transaction",
            }),
          execute: () =>
            Promise.resolve({
              status: "Failed",
              error: "market closed",
            }),
        },
        signTransaction: () => Promise.resolve("signed-recurring-transaction"),
      }),
    TransactionExecutionError,
    "Recurring execute failed: market closed",
  );
});
