import {
  createKeyPairSignerFromBytes,
  getTransactionDecoder,
  getTransactionEncoder,
  signTransaction as solanaSignTransaction,
  sendTransactionWithoutConfirmingFactory,
  createSolanaRpc,
  getSignatureFromTransaction,
  assertIsTransactionWithinSizeLimit,
  type KeyPairSigner,
} from "@solana/kit";
import bs58 from "bs58";
import { env } from "../env.ts";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
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

/** Sign and send tx to RPC — returns transaction signature string. */
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

  return getSignatureFromTransaction(signed);
}
