const AMOUNT_PATTERN = /^(0|[1-9]\d*)(\.\d+)?$/;

export function parseBaseUnits(amount: string, decimals: number): bigint {
  const normalized = amount.trim();
  if (!AMOUNT_PATTERN.test(normalized)) {
    throw new Error(`Invalid decimal amount: ${amount}`);
  }

  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Token supports at most ${decimals} decimal places`);
  }

  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(whole + paddedFraction);
}

export function formatBaseUnits(amount: bigint, decimals: number): string {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  if (decimals === 0) return `${negative ? "-" : ""}${absolute.toString()}`;

  const raw = absolute.toString().padStart(decimals + 1, "0");
  const whole = raw.slice(0, -decimals) || "0";
  const fraction = raw.slice(-decimals).replace(/0+$/, "");
  const formatted = fraction.length === 0 ? whole : `${whole}.${fraction}`;
  return negative ? `-${formatted}` : formatted;
}

export function bigintToJsonNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `Amount ${value.toString()} exceeds JavaScript safe integer range`,
    );
  }
  if (value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error(
      `Amount ${value.toString()} is below JavaScript safe integer range`,
    );
  }
  return Number(value);
}
