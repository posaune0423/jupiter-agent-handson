export interface TokenMetadata {
  symbol: string;
  mint: string;
  decimals: number;
}

export const TOKENS = {
  SOL: {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  USDC: {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
} as const satisfies Record<string, TokenMetadata>;

interface DirectMintMetadata {
  symbol: string;
  decimals: number;
}

export function resolveToken(
  aliasOrMint: string,
  directMintMetadata?: DirectMintMetadata,
): TokenMetadata {
  const value = aliasOrMint.trim();
  const token = TOKENS[value.toUpperCase() as keyof typeof TOKENS];
  if (token) return token;

  if (directMintMetadata) {
    return {
      symbol: directMintMetadata.symbol,
      mint: value,
      decimals: directMintMetadata.decimals,
    };
  }

  throw new Error(
    `Unknown token alias: ${aliasOrMint}. Supported aliases: SOL, USDC`,
  );
}
