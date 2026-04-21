import {
  assertIsTransactionWithinSizeLimit,
  createKeyPairSignerFromBytes,
  getSignatureFromTransaction,
  getTransactionDecoder,
  getTransactionEncoder,
  type KeyPairSigner,
  signTransaction,
} from "@solana/kit";
import bs58 from "bs58";

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

function parsePrivateKey(privateKey: string): Uint8Array {
  const trimmed = privateKey.trim();
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as number[];
    return new Uint8Array(parsed);
  }
  return bs58.decode(trimmed);
}

export function getWallet(privateKey: string): Promise<KeyPairSigner> {
  return createKeyPairSignerFromBytes(parsePrivateKey(privateKey));
}

export async function signBase64Transaction(
  txBase64: string,
  wallet: KeyPairSigner,
): Promise<string> {
  const transaction = getTransactionDecoder().decode(base64ToBytes(txBase64));
  const signed = await signTransaction([wallet.keyPair], transaction);
  const signedBytes = getTransactionEncoder().encode(signed);
  return bytesToBase64(new Uint8Array(signedBytes));
}

export async function signBase64TransactionBytes(
  txBase64: string,
  wallet: KeyPairSigner,
): Promise<Uint8Array> {
  const transaction = getTransactionDecoder().decode(base64ToBytes(txBase64));
  const signed = await signTransaction([wallet.keyPair], transaction);
  assertIsTransactionWithinSizeLimit(signed);
  return new Uint8Array(getTransactionEncoder().encode(signed));
}

export async function getSignedTransactionSignature(
  txBase64: string,
  wallet: KeyPairSigner,
): Promise<string> {
  const transaction = getTransactionDecoder().decode(base64ToBytes(txBase64));
  const signed = await signTransaction([wallet.keyPair], transaction);
  return getSignatureFromTransaction(signed);
}
