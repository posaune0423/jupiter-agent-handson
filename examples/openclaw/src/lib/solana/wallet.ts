import { createKeyPairSignerFromBytes, type KeyPairSigner } from "@solana/kit";
import bs58 from "bs58";

export interface DemoWallet {
  address: string;
}

function parsePrivateKey(privateKey: string): Uint8Array {
  const trimmed = privateKey.trim();
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as number[];
    return new Uint8Array(parsed);
  }
  return bs58.decode(trimmed);
}

export function getWallet(
  privateKey: string,
): Promise<KeyPairSigner & DemoWallet> {
  return createKeyPairSignerFromBytes(parsePrivateKey(privateKey));
}
