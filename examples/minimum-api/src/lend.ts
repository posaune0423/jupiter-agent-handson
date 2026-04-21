/**
 * Minimum Jupiter Lend — USDC deposit to Earn pool (1 USDC)
 *
 * Flow: POST /lend/v1/earn/deposit -> sign -> send to RPC
 * Lend API returns an unsigned tx — we sign and submit ourselves.
 */
import { jupiterFetch, getWallet, signAndSend } from "./utils/mod.ts";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEPOSIT_AMOUNT = 1_000_000; // 1 USDC (6 decimals)

interface DepositResponse {
  transaction: string;
}

async function main() {
  const wallet = await getWallet();

  // Step 1: Get unsigned deposit transaction
  console.log(`[lend] Requesting deposit: ${DEPOSIT_AMOUNT} USDC (raw) to Earn`);
  const data = await jupiterFetch<DepositResponse>("/lend/v1/earn/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asset: USDC_MINT,
      signer: wallet.address,
      amount: DEPOSIT_AMOUNT.toString(),
    }),
  });

  if (!data.transaction) {
    throw new Error("No transaction returned from Lend API");
  }

  console.log("[lend] Transaction received, signing and sending...");

  // Step 2: Sign and send to RPC
  const signature = await signAndSend(data.transaction, wallet);

  console.log(`[lend] Success!`);
  console.log(`  signature: ${signature}`);
  console.log(`  explorer:  https://solscan.io/tx/${signature}`);
}

main().catch((err) => {
  console.error("[lend] Error:", err);
  Deno.exit(1);
});
