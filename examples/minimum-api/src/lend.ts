/**
 * Minimum Jupiter Lend — USDC deposit to Earn pool
 *
 * Flow: POST /lend/v1/earn/deposit -> sign -> send to RPC
 * Lend API returns an unsigned tx — we sign and submit ourselves.
 */
import { getWallet, jupiterFetch, signAndSend } from "./utils/mod.ts";
import { env } from "./env.ts";
import {
  appendInsufficientFundsDetails,
  formatUsdcAmount,
  selectMinimumTestLendAmount,
} from "./helpers/lend.ts";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

interface TokenAccountsByOwnerResponse {
  value: Array<{
    account: {
      data: {
        parsed: {
          info: {
            tokenAmount: {
              amount: string;
            };
          };
        };
      };
    };
  }>;
}

interface DepositResponse {
  transaction: string;
}

async function getUsdcBalanceRaw(owner: string): Promise<bigint> {
  const response = await fetch(env.SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        owner,
        { mint: USDC_MINT },
        { encoding: "jsonParsed" },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `RPC getTokenAccountsByOwner failed with HTTP ${response.status}`,
    );
  }

  const payload = await response.json() as {
    result?: TokenAccountsByOwnerResponse;
    error?: { code: number; message: string };
  };

  if (payload.error) {
    throw new Error(
      `RPC getTokenAccountsByOwner failed: ${payload.error.message} (code: ${payload.error.code})`,
    );
  }

  const accounts = payload.result?.value ?? [];
  return accounts.reduce(
    (sum, account) =>
      sum + BigInt(account.account.data.parsed.info.tokenAmount.amount),
    0n,
  );
}

async function main() {
  const wallet = await getWallet();
  const usdcBalanceRaw = await getUsdcBalanceRaw(wallet.address);
  const depositAmountRaw = selectMinimumTestLendAmount(usdcBalanceRaw);

  console.log(
    `[lend] Wallet USDC balance: ${
      formatUsdcAmount(usdcBalanceRaw)
    } USDC (${usdcBalanceRaw} base units, 6 decimals)`,
  );

  // Step 1: Get unsigned deposit transaction
  console.log(
    `[lend] Requesting test deposit: ${
      formatUsdcAmount(depositAmountRaw)
    } USDC (${depositAmountRaw} base units, 6 decimals) to Earn`,
  );
  const data = await jupiterFetch<DepositResponse>("/lend/v1/earn/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asset: USDC_MINT,
      signer: wallet.address,
      amount: depositAmountRaw.toString(),
    }),
  });

  if (!data.transaction) {
    throw new Error("No transaction returned from Lend API");
  }

  console.log("[lend] Transaction received, signing and sending...");

  // Step 2: Sign and send to RPC
  const signature = await signAndSend(data.transaction, wallet).catch(
    (error) => {
      throw appendInsufficientFundsDetails(
        error,
        usdcBalanceRaw,
        depositAmountRaw,
      );
    },
  );

  console.log(`[lend] Success!`);
  console.log(`  signature: ${signature}`);
  console.log(`  explorer:  https://solscan.io/tx/${signature}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("[lend] Error:", err);
    Deno.exit(1);
  });
}
