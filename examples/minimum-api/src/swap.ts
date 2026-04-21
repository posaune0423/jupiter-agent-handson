/**
 * Minimum Jupiter Swap — SOL -> USDC (0.001 SOL)
 *
 * Flow: GET /swap/v2/order -> sign -> POST /swap/v2/execute
 * Jupiter handles transaction submission via /execute.
 */
import { jupiterFetch, withRetry, getWallet, signBase64Transaction } from "./utils/mod.ts";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AMOUNT_LAMPORTS = 1_000_000; // 0.001 SOL

interface OrderResponse {
  transaction: string | null;
  requestId: string;
  error?: string;
}

interface ExecuteResponse {
  status: string;
  signature: string;
  code: number;
  inputAmountResult?: string;
  outputAmountResult?: string;
  error?: string;
}

async function main() {
  const wallet = await getWallet();

  // Step 1: Get order (quote + unsigned transaction)
  const params = new URLSearchParams({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: AMOUNT_LAMPORTS.toString(),
    taker: wallet.address,
  });

  console.log(`[swap] Requesting order: ${AMOUNT_LAMPORTS} lamports SOL -> USDC`);
  const order = await jupiterFetch<OrderResponse>(`/swap/v2/order?${params}`);

  if (order.error || !order.transaction) {
    throw new Error(`Order failed: ${order.error ?? "no transaction returned"}`);
  }

  console.log(`[swap] Order received (requestId: ${order.requestId})`);

  // Step 2: Sign the transaction
  const signedTx = await signBase64Transaction(order.transaction, wallet);

  // Step 3: Execute — Jupiter submits the transaction
  const result = await withRetry(() =>
    jupiterFetch<ExecuteResponse>("/swap/v2/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signedTransaction: signedTx,
        requestId: order.requestId,
      }),
    }),
  );

  // Step 4: Report result
  if (result.status === "Success") {
    console.log(`[swap] Success!`);
    console.log(`  signature: ${result.signature}`);
    console.log(`  input:     ${result.inputAmountResult} lamports`);
    console.log(`  output:    ${result.outputAmountResult} USDC (raw)`);
    console.log(`  explorer:  https://solscan.io/tx/${result.signature}`);
  } else {
    throw Object.assign(new Error(`Swap failed: ${result.error ?? "unknown"}`), {
      code: result.code,
    });
  }
}

main().catch((err) => {
  console.error("[swap] Error:", err);
  Deno.exit(1);
});
