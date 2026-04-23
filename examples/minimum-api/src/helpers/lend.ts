const USDC_DECIMALS = 6n;
const USDC_BASE_UNIT_SCALE = 10n ** USDC_DECIMALS;
const MINIMUM_TEST_LEND_AMOUNT = 10n;

export function formatUsdcAmount(baseUnits: bigint): string {
  const whole = baseUnits / USDC_BASE_UNIT_SCALE;
  const fractional = baseUnits % USDC_BASE_UNIT_SCALE;
  return `${whole}.${
    fractional.toString().padStart(Number(USDC_DECIMALS), "0")
  }`;
}

export function buildInsufficientUsdcBalanceError(
  currentBalanceBaseUnits: bigint,
  requiredAmountBaseUnits: bigint = MINIMUM_TEST_LEND_AMOUNT,
): Error {
  const shortfall = requiredAmountBaseUnits > currentBalanceBaseUnits
    ? requiredAmountBaseUnits - currentBalanceBaseUnits
    : 0n;

  return new Error(
    `Insufficient USDC for lend test: need at least ${
      formatUsdcAmount(requiredAmountBaseUnits)
    } USDC (${requiredAmountBaseUnits} base units, 6 decimals), wallet has ${
      formatUsdcAmount(currentBalanceBaseUnits)
    } USDC (${currentBalanceBaseUnits} base units), short ${
      formatUsdcAmount(shortfall)
    } USDC (${shortfall} base units)`,
  );
}

export function selectMinimumTestLendAmount(
  balanceBaseUnits: bigint,
): bigint {
  if (balanceBaseUnits < MINIMUM_TEST_LEND_AMOUNT) {
    throw buildInsufficientUsdcBalanceError(balanceBaseUnits);
  }

  return MINIMUM_TEST_LEND_AMOUNT;
}

export function appendInsufficientFundsDetails(
  error: unknown,
  currentBalanceBaseUnits: bigint,
  requestedAmountBaseUnits: bigint,
): Error {
  const baseMessage = error instanceof Error ? error.message : String(error);
  if (!baseMessage.includes("insufficient funds")) {
    return error instanceof Error ? error : new Error(baseMessage);
  }

  const details = buildInsufficientUsdcBalanceError(
    currentBalanceBaseUnits,
    requestedAmountBaseUnits,
  ).message;

  return new Error(`${baseMessage} — ${details}`);
}
