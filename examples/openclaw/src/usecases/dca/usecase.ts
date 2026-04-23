import { DEFAULT_DCA } from "../../config/demo-defaults.ts";
import {
  createRecurringApi,
  type RecurringApi,
  type RecurringCreateOrderRequest,
  type RecurringCreateOrderResponse,
  type RecurringExecuteResponse,
} from "../../lib/jupiter/recurring-api.ts";
import { signBase64Transaction } from "../../lib/solana/transactions.ts";
import { type DemoWallet, getWallet } from "../../lib/solana/wallet.ts";
import { parseBaseUnits } from "../../utils/amounts.ts";
import type { DemoEnv } from "../../utils/env.ts";
import {
  ExternalServiceError,
  TransactionExecutionError,
  ValidationError,
} from "../../utils/errors.ts";
import { resolveToken, type TokenMetadata } from "../../utils/tokens.ts";
import { buildSolscanTransactionUrl } from "../../utils/urls.ts";

export interface DcaCommandInput {
  amount?: string;
  orders?: number;
  intervalSeconds?: number;
  execute: boolean;
}

export interface DcaResult {
  mode: "dry-run" | "execute";
  requestId: string;
  inputToken: TokenMetadata;
  outputToken: TokenMetadata;
  displayAmount: string;
  rawAmount: string;
  orders: number;
  intervalSeconds: number;
  signature?: string;
  explorerUrl?: string;
}

export interface DcaUsecaseDependencies {
  getWallet: (privateKey: string) => Promise<DemoWallet>;
  parseBaseUnits: (amount: string, decimals: number) => bigint;
  signTransaction: (txBase64: string, wallet: DemoWallet) => Promise<string>;
  recurringApi: RecurringApi;
}

function createDefaultDependencies(env: DemoEnv): DcaUsecaseDependencies {
  return {
    getWallet,
    parseBaseUnits,
    signTransaction: signBase64Transaction,
    recurringApi: createRecurringApi(env),
  };
}

function validateAmount(
  amount: string,
  decimals: number,
  parseAmount: (amount: string, decimals: number) => bigint,
): bigint {
  try {
    return parseAmount(amount, decimals);
  } catch (error) {
    throw new ValidationError(
      error instanceof Error ? error.message : String(error),
    );
  }
}

function validateDcaInputs(orders: number, intervalSeconds: number): void {
  if (!Number.isInteger(orders) || orders < 2) {
    throw new ValidationError("--orders must be an integer >= 2");
  }
  if (!Number.isInteger(intervalSeconds) || intervalSeconds <= 0) {
    throw new ValidationError("--interval-seconds must be a positive integer");
  }
}

function ensureRecurringTransaction(
  order: RecurringCreateOrderResponse,
): string {
  if (order.error) {
    throw new ExternalServiceError(
      "Jupiter Recurring API",
      `createOrder failed: ${order.error}`,
    );
  }
  if (!order.transaction) {
    throw new ExternalServiceError(
      "Jupiter Recurring API",
      "createOrder failed: no transaction returned",
    );
  }
  return order.transaction;
}

function ensureExecuteSuccess(
  result: RecurringExecuteResponse,
): { signature: string } {
  if (result.status !== "Success" || !result.signature) {
    throw new TransactionExecutionError(
      `Recurring execute failed: ${result.error ?? "unknown error"}`,
    );
  }
  return { signature: result.signature };
}

export async function executeDcaUsecase(
  env: DemoEnv,
  input: DcaCommandInput,
  dependencies: Partial<DcaUsecaseDependencies> = {},
): Promise<DcaResult> {
  const deps = { ...createDefaultDependencies(env), ...dependencies };
  const inputToken = resolveToken(DEFAULT_DCA.input);
  const outputToken = resolveToken(DEFAULT_DCA.output);
  const displayAmount = input.amount ?? DEFAULT_DCA.amount;
  const orders = input.orders ?? DEFAULT_DCA.orders;
  const intervalSeconds = input.intervalSeconds ?? DEFAULT_DCA.intervalSeconds;

  validateDcaInputs(orders, intervalSeconds);

  const rawAmount = validateAmount(
    displayAmount,
    inputToken.decimals,
    deps.parseBaseUnits,
  );
  const wallet = await deps.getWallet(env.PRIVATE_KEY);

  let order: RecurringCreateOrderResponse;
  try {
    const request: RecurringCreateOrderRequest = {
      user: wallet.address,
      inputMint: inputToken.mint,
      outputMint: outputToken.mint,
      params: {
        time: {
          inAmount: rawAmount,
          numberOfOrders: orders,
          interval: intervalSeconds,
          minPrice: null,
          maxPrice: null,
          startAt: null,
        },
      },
    };
    order = await deps.recurringApi.createOrder(request);
  } catch (error) {
    throw new ExternalServiceError(
      "Jupiter Recurring API",
      "createOrder request failed",
      error,
    );
  }

  const transaction = ensureRecurringTransaction(order);

  if (!input.execute) {
    return {
      mode: "dry-run",
      requestId: order.requestId,
      inputToken,
      outputToken,
      displayAmount,
      rawAmount: rawAmount.toString(),
      orders,
      intervalSeconds,
    };
  }

  const signedTransaction = await deps.signTransaction(transaction, wallet);
  let result: RecurringExecuteResponse;
  try {
    result = await deps.recurringApi.execute({
      signedTransaction,
      requestId: order.requestId,
    });
  } catch (error) {
    throw new ExternalServiceError(
      "Jupiter Recurring API",
      "execute request failed",
      error,
    );
  }

  const { signature } = ensureExecuteSuccess(result);
  return {
    mode: "execute",
    requestId: order.requestId,
    inputToken,
    outputToken,
    displayAmount,
    rawAmount: rawAmount.toString(),
    orders,
    intervalSeconds,
    signature,
    explorerUrl: buildSolscanTransactionUrl(signature),
  };
}
