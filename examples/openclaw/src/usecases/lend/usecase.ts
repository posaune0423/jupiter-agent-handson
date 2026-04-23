import { DEFAULT_LEND } from "../../config/demo-defaults.ts";
import {
  createLendApi,
  type LendApi,
  type LendDepositResponse,
} from "../../lib/jupiter/lend-api.ts";
import {
  sendAndConfirmTransaction,
  signBase64TransactionBytes,
} from "../../lib/solana/transactions.ts";
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

export interface LendCommandInput {
  amount?: string;
  execute: boolean;
}

export interface LendResult {
  mode: "dry-run" | "execute";
  asset: TokenMetadata;
  displayAmount: string;
  rawAmount: string;
  transaction: string;
  signature?: string;
  explorerUrl?: string;
}

export interface LendUsecaseDependencies {
  getWallet: (privateKey: string) => Promise<DemoWallet>;
  parseBaseUnits: (amount: string, decimals: number) => bigint;
  lendApi: LendApi;
  signTransactionBytes: (
    txBase64: string,
    wallet: DemoWallet,
  ) => Promise<Uint8Array>;
  sendAndConfirmTransaction: (
    env: Pick<DemoEnv, "SOLANA_RPC_URL">,
    signedTransaction: Uint8Array,
  ) => Promise<{ signature: string }>;
}

function createDefaultDependencies(env: DemoEnv): LendUsecaseDependencies {
  return {
    getWallet,
    parseBaseUnits,
    lendApi: createLendApi(env),
    signTransactionBytes: signBase64TransactionBytes,
    sendAndConfirmTransaction,
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

function ensureDepositTransaction(response: LendDepositResponse): string {
  if (!response.transaction) {
    throw new ExternalServiceError(
      "Jupiter Lend API",
      "deposit request failed: no transaction returned",
    );
  }
  return response.transaction;
}

export async function executeLendUsecase(
  env: DemoEnv,
  input: LendCommandInput,
  dependencies: Partial<LendUsecaseDependencies> = {},
): Promise<LendResult> {
  const deps = { ...createDefaultDependencies(env), ...dependencies };
  const asset = resolveToken(DEFAULT_LEND.asset);
  const displayAmount = input.amount ?? DEFAULT_LEND.amount;
  const rawAmount = validateAmount(
    displayAmount,
    asset.decimals,
    deps.parseBaseUnits,
  );
  const wallet = await deps.getWallet(env.PRIVATE_KEY);

  let depositResponse: LendDepositResponse;
  try {
    depositResponse = await deps.lendApi.createDepositTransaction({
      asset: asset.mint,
      signer: wallet.address,
      amount: rawAmount.toString(),
    });
  } catch (error) {
    throw new ExternalServiceError(
      "Jupiter Lend API",
      "deposit request failed",
      error,
    );
  }

  const transaction = ensureDepositTransaction(depositResponse);

  if (!input.execute) {
    return {
      mode: "dry-run",
      asset,
      displayAmount,
      rawAmount: rawAmount.toString(),
      transaction,
    };
  }

  try {
    const signedTransaction = await deps.signTransactionBytes(
      transaction,
      wallet,
    );
    const confirmed = await deps.sendAndConfirmTransaction(
      env,
      signedTransaction,
    );

    return {
      mode: "execute",
      asset,
      displayAmount,
      rawAmount: rawAmount.toString(),
      transaction,
      signature: confirmed.signature,
      explorerUrl: buildSolscanTransactionUrl(confirmed.signature),
    };
  } catch (error) {
    if (error instanceof TransactionExecutionError) throw error;
    throw new TransactionExecutionError("Lend transaction failed", {
      cause: error,
    });
  }
}
