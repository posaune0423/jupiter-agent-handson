import {
  assertIsTransactionWithinSizeLimit,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  getSignatureFromTransaction,
  getTransactionDecoder,
  getTransactionEncoder,
  type KeyPairSigner,
  sendTransactionWithoutConfirmingFactory,
  signTransaction as solanaSignTransaction,
} from "@solana/kit";
import bs58 from "bs58";
import { env } from "../env.ts";
import { confirmSubmittedTransaction, type RpcRequest } from "./tx_confirm.ts";

interface JsonRpcFailure {
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface JsonRpcSuccess<T> {
  result: T;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function createRpcRequest<T>(
  method: string,
  params: unknown[],
): Promise<T> {
  const res = await fetch(env.SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!res.ok) {
    throw new Error(`RPC ${method} failed with HTTP ${res.status}`);
  }

  const body = await res.json() as JsonRpcSuccess<T> | JsonRpcFailure;
  if ("error" in body) {
    throw new Error(
      `RPC ${method} failed: ${body.error.message} (code: ${body.error.code})`,
    );
  }

  return body.result;
}

/** Restore KeyPairSigner from base58-encoded PRIVATE_KEY env var. */
export function getWallet(): Promise<KeyPairSigner> {
  const secretKey = bs58.decode(env.PRIVATE_KEY);
  return createKeyPairSignerFromBytes(secretKey);
}

/** Deserialize base64 tx, sign with wallet, return signed base64. */
export async function signBase64Transaction(
  txBase64: string,
  wallet: KeyPairSigner,
): Promise<string> {
  const txBytes = base64ToBytes(txBase64);
  const tx = getTransactionDecoder().decode(txBytes);

  const signed = await solanaSignTransaction([wallet.keyPair], tx);

  const signedBytes = getTransactionEncoder().encode(signed);
  return bytesToBase64(new Uint8Array(signedBytes));
}
/** Sign, send, and confirm tx result on RPC — returns transaction signature string. */
export async function signAndSend(
  txBase64: string,
  wallet: KeyPairSigner,
): Promise<string> {
  const txBytes = base64ToBytes(txBase64);
  const tx = getTransactionDecoder().decode(txBytes);

  const signed = await solanaSignTransaction([wallet.keyPair], tx);
  assertIsTransactionWithinSizeLimit(signed);

  const rpc = createSolanaRpc(env.SOLANA_RPC_URL);
  const sendTx = sendTransactionWithoutConfirmingFactory({ rpc });
  await sendTx(signed, { commitment: "confirmed", skipPreflight: true });

  const signature = getSignatureFromTransaction(signed);
  await confirmSubmittedTransaction(signature, createRpcRequest);

  return signature;
}
