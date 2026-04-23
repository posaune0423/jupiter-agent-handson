import {
  assertIsTransactionWithinSizeLimit,
  getTransactionDecoder,
  getTransactionEncoder,
  type KeyPairSigner,
  signTransaction,
} from "@solana/kit";
import type { DemoEnv } from "../../utils/env.ts";
import type { DemoWallet } from "./wallet.ts";
import {
  type ConfirmedTransaction,
  confirmSubmittedTransaction,
  sendRawTransaction,
} from "./rpc.ts";

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toKeyPairSigner(wallet: DemoWallet): KeyPairSigner {
  return wallet as KeyPairSigner;
}

export async function signBase64Transaction(
  txBase64: string,
  wallet: DemoWallet,
): Promise<string> {
  const transaction = getTransactionDecoder().decode(base64ToBytes(txBase64));
  const signed = await signTransaction(
    [toKeyPairSigner(wallet).keyPair],
    transaction,
  );
  const signedBytes = getTransactionEncoder().encode(signed);
  return bytesToBase64(new Uint8Array(signedBytes));
}

export async function signBase64TransactionBytes(
  txBase64: string,
  wallet: DemoWallet,
): Promise<Uint8Array> {
  const transaction = getTransactionDecoder().decode(base64ToBytes(txBase64));
  const signed = await signTransaction(
    [toKeyPairSigner(wallet).keyPair],
    transaction,
  );
  assertIsTransactionWithinSizeLimit(signed);
  return new Uint8Array(getTransactionEncoder().encode(signed));
}

export async function sendAndConfirmTransaction(
  env: Pick<DemoEnv, "SOLANA_RPC_URL">,
  signedTransaction: Uint8Array,
): Promise<ConfirmedTransaction> {
  const signature = await sendRawTransaction(env, signedTransaction);
  return await confirmSubmittedTransaction(env, signature);
}
