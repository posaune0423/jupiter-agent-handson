import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import type { DemoEnv } from "../../utils/env.ts";
import { executeSwapUsecase, type SwapCommandInput } from "./usecase.ts";
import {
  TransactionExecutionError,
  ValidationError,
} from "../../utils/errors.ts";

const DEMO_ENV: DemoEnv = {
  JUPITER_API_KEY: "demo-api-key",
  PRIVATE_KEY: "demo-private-key",
  SOLANA_RPC_URL: "https://rpc.example.invalid",
};

const VALID_INPUT: SwapCommandInput = {
  input: "SOL",
  output: "USDC",
  amount: "0.001",
  execute: false,
};

Deno.test("executeSwapUsecase returns a dry-run result with resolved tokens and request id", async () => {
  const result = await executeSwapUsecase(DEMO_ENV, VALID_INPUT, {
    getWallet: () => Promise.resolve({ address: "wallet-1" }),
    resolveToken: (alias: string) =>
      alias === "SOL"
        ? {
          symbol: "SOL",
          mint: "So11111111111111111111111111111111111111112",
          decimals: 9,
        }
        : {
          symbol: "USDC",
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          decimals: 6,
        },
    swapApi: {
      order: (request: { amount: string; taker: string }) => {
        assertEquals(request.amount, "1000000");
        assertEquals(request.taker, "wallet-1");
        return Promise.resolve({
          requestId: "swap-request-1",
          transaction: "unsigned-transaction",
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
  assertEquals(result.requestId, "swap-request-1");
  assertEquals(result.inputToken.symbol, "SOL");
  assertEquals(result.outputToken.symbol, "USDC");
});

Deno.test("executeSwapUsecase executes a signed Jupiter order and returns explorer metadata", async () => {
  const result = await executeSwapUsecase(
    DEMO_ENV,
    { ...VALID_INPUT, execute: true },
    {
      getWallet: () => Promise.resolve({ address: "wallet-1" }),
      resolveToken: (alias: string) =>
        alias === "SOL"
          ? {
            symbol: "SOL",
            mint: "So11111111111111111111111111111111111111112",
            decimals: 9,
          }
          : {
            symbol: "USDC",
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            decimals: 6,
          },
      swapApi: {
        order: () =>
          Promise.resolve({
            requestId: "swap-request-2",
            transaction: "unsigned-transaction",
          }),
        execute: (
          request: { requestId: string; signedTransaction: string },
        ) => {
          assertEquals(request.requestId, "swap-request-2");
          assertEquals(request.signedTransaction, "signed-transaction");
          return Promise.resolve({
            status: "Success",
            signature: "swap-signature",
            inputAmountResult: "1000000",
            outputAmountResult: "150000",
          });
        },
      },
      signTransaction: () => Promise.resolve("signed-transaction"),
    },
  );

  assertEquals(result.mode, "execute");
  assertEquals(result.signature, "swap-signature");
  assertStringIncludes(result.explorerUrl!, "swap-signature");
  assertEquals(result.outputAmountResult, "150000");
});

Deno.test("executeSwapUsecase rejects invalid token amounts before calling Jupiter", async () => {
  await assertRejects(
    () =>
      executeSwapUsecase(
        DEMO_ENV,
        { ...VALID_INPUT, amount: "0.0000000001" },
      ),
    ValidationError,
    "Token supports at most 9 decimal places",
  );
});

Deno.test("executeSwapUsecase maps failed execute responses to TransactionExecutionError", async () => {
  await assertRejects(
    () =>
      executeSwapUsecase(DEMO_ENV, { ...VALID_INPUT, execute: true }, {
        getWallet: () => Promise.resolve({ address: "wallet-1" }),
        resolveToken: (alias: string) =>
          alias === "SOL"
            ? {
              symbol: "SOL",
              mint: "So11111111111111111111111111111111111111112",
              decimals: 9,
            }
            : {
              symbol: "USDC",
              mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              decimals: 6,
            },
        swapApi: {
          order: () =>
            Promise.resolve({
              requestId: "swap-request-3",
              transaction: "unsigned-transaction",
            }),
          execute: () =>
            Promise.resolve({
              status: "Failed",
              error: "route expired",
            }),
        },
        signTransaction: () => Promise.resolve("signed-transaction"),
      }),
    TransactionExecutionError,
    "Swap execute failed: route expired",
  );
});
