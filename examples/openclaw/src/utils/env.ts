export interface DemoEnv {
  JUPITER_API_KEY: string;
  PRIVATE_KEY: string;
  SOLANA_RPC_URL: string;
}

const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadEnv(): DemoEnv {
  const rpcUrl = Deno.env.get("SOLANA_RPC_URL")?.trim() || DEFAULT_RPC_URL;
  try {
    new URL(rpcUrl);
  } catch {
    throw new Error("SOLANA_RPC_URL must be a valid URL");
  }

  return {
    JUPITER_API_KEY: requireEnv("JUPITER_API_KEY"),
    PRIVATE_KEY: requireEnv("PRIVATE_KEY"),
    SOLANA_RPC_URL: rpcUrl,
  };
}
