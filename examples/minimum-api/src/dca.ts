/**
 * Minimum Jupiter DCA — USDC -> SOL recurring order
 *
 * Flow: POST /recurring/v1/createOrder -> sign -> POST /recurring/v1/execute
 * Jupiter handles transaction submission via /execute.
 */
import { env } from "./env.ts";
import {
  getWallet,
  jupiterFetch,
  signBase64Transaction,
  withRetry,
} from "./utils/mod.ts";

const USDC_DECIMALS = 6n;
const USDC_BASE_UNIT_SCALE = 10n ** USDC_DECIMALS;
const MINIMUM_TOTAL_DCA_AMOUNT = 100_000_000n; // 100 USDC total
const MINIMUM_NUMBER_OF_ORDERS = 2;
const MINIMUM_INTERVAL_SECONDS = 86_400;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

interface DcaConfig {
  inAmountBaseUnits: bigint;
  numberOfOrders: number;
  intervalSeconds: number;
}

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

export function formatUsdcAmount(baseUnits: bigint): string {
  const whole = baseUnits / USDC_BASE_UNIT_SCALE;
  const fractional = baseUnits % USDC_BASE_UNIT_SCALE;
  return `${whole}.${
    fractional.toString().padStart(Number(USDC_DECIMALS), "0")
  }`;
}

export function buildInsufficientUsdcBalanceError(
  currentBalanceBaseUnits: bigint,
  requiredAmountBaseUnits: bigint = MINIMUM_TOTAL_DCA_AMOUNT,
): Error {
  const shortfall = requiredAmountBaseUnits > currentBalanceBaseUnits
    ? requiredAmountBaseUnits - currentBalanceBaseUnits
    : 0n;

  return new Error(
    `Insufficient USDC for minimum DCA test: need at least ${
      formatUsdcAmount(requiredAmountBaseUnits)
    } USDC (${requiredAmountBaseUnits} base units, 6 decimals), wallet has ${
      formatUsdcAmount(currentBalanceBaseUnits)
    } USDC (${currentBalanceBaseUnits} base units), short ${
      formatUsdcAmount(shortfall)
    } USDC (${shortfall} base units)`,
  );
}

export function getMinimumTestDcaConfig(
  currentBalanceBaseUnits: bigint,
): DcaConfig {
  if (currentBalanceBaseUnits < MINIMUM_TOTAL_DCA_AMOUNT) {
    throw buildInsufficientUsdcBalanceError(currentBalanceBaseUnits);
  }

  return {
    inAmountBaseUnits: MINIMUM_TOTAL_DCA_AMOUNT,
    numberOfOrders: MINIMUM_NUMBER_OF_ORDERS,
    intervalSeconds: MINIMUM_INTERVAL_SECONDS,
  };
}

async function getUsdcBalanceBaseUnits(owner: string): Promise<bigint> {
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
  const usdcBalanceBaseUnits = await getUsdcBalanceBaseUnits(wallet.address);
  const dcaConfig = getMinimumTestDcaConfig(usdcBalanceBaseUnits);

  // Step 1: Create recurring order (unsigned transaction)
  console.log(
    `[dca] Wallet USDC balance: ${
      formatUsdcAmount(usdcBalanceBaseUnits)
    } USDC (${usdcBalanceBaseUnits} base units, 6 decimals)`,
  );
  console.log(
    `[dca] Creating minimum valid order: ${
      formatUsdcAmount(dcaConfig.inAmountBaseUnits)
    } USDC total, ${dcaConfig.numberOfOrders} orders, ${dcaConfig.intervalSeconds}s interval`,
  );

  const order = await jupiterFetch<CreateOrderResponse>(
    "/recurring/v1/createOrder",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: wallet.address,
        inputMint: USDC_MINT,
        outputMint: SOL_MINT,
        params: {
          time: {
            inAmount: Number(dcaConfig.inAmountBaseUnits),
            numberOfOrders: dcaConfig.numberOfOrders,
            interval: dcaConfig.intervalSeconds,
            minPrice: null,
            maxPrice: null,
            startAt: null,
          },
        },
      }),
    },
  );

  if (order.error || !order.transaction) {
    throw new Error(
      `CreateOrder failed: ${order.error ?? "no transaction returned"}`,
    );
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
    })
  );

  if (result.status === "Success") {
    console.log(`[dca] Success!`);
    console.log(`  signature: ${result.signature}`);
    console.log(`  explorer:  https://solscan.io/tx/${result.signature}`);
  } else {
    throw new Error(`DCA execute failed: ${result.error ?? "unknown"}`);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("[dca] Error:", err);
    Deno.exit(1);
  });
}
