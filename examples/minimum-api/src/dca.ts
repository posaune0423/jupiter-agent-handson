/**
 * Minimum Jupiter DCA — USDC -> SOL recurring order
 *
 * Flow: POST /recurring/v1/createOrder -> sign -> POST /recurring/v1/execute
 * Jupiter handles transaction submission via /execute.
 *
 * Constraints:
 *   - min 100 USD total
 *   - min 2 orders
 *   - min 50 USD per order
 *   - Token-2022 NOT supported
 */
import { jupiterFetch, withRetry, getWallet, signBase64Transaction } from "./utils/mod.ts";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

// 104 USDC total / 2 orders = 52 USDC per order (meets 50 USD minimum)
const IN_AMOUNT = 104_000_000; // 104 USDC (6 decimals)
const NUM_ORDERS = 2;
const INTERVAL_SECONDS = 86_400; // 1 day

interface CreateOrderResponse {
  requestId: string;
  transaction: string;
  error?: string;
}

interface ExecuteResponse {
  status: string;
  signature: string;
  error?: string;
}

async function main() {
  const wallet = await getWallet();

  // Step 1: Create recurring order (unsigned transaction)
  console.log(`[dca] Creating order: ${IN_AMOUNT / 1e6} USDC -> SOL, ${NUM_ORDERS} orders, ${INTERVAL_SECONDS}s interval`);

  const order = await jupiterFetch<CreateOrderResponse>("/recurring/v1/createOrder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: wallet.address,
      inputMint: USDC_MINT,
      outputMint: SOL_MINT,
      params: {
        time: {
          inAmount: IN_AMOUNT,
          numberOfOrders: NUM_ORDERS,
          interval: INTERVAL_SECONDS,
          minPrice: null,
          maxPrice: null,
          startAt: null,
        },
      },
    }),
  });

  if (order.error || !order.transaction) {
    throw new Error(`CreateOrder failed: ${order.error ?? "no transaction returned"}`);
  }

  console.log(`[dca] Order created (requestId: ${order.requestId})`);

  // Step 2: Sign the transaction
  const signedTx = await signBase64Transaction(order.transaction, wallet);

  // Step 3: Execute — Jupiter submits the transaction
  const result = await withRetry(() =>
    jupiterFetch<ExecuteResponse>("/recurring/v1/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signedTransaction: signedTx,
        requestId: order.requestId,
      }),
    }),
  );

  if (result.status === "Success") {
    console.log(`[dca] Success!`);
    console.log(`  signature: ${result.signature}`);
    console.log(`  explorer:  https://solscan.io/tx/${result.signature}`);
  } else {
    throw new Error(`DCA execute failed: ${result.error ?? "unknown"}`);
  }
}

main().catch((err) => {
  console.error("[dca] Error:", err);
  Deno.exit(1);
});
