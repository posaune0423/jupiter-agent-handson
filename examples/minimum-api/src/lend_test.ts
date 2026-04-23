import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import {
  buildInsufficientUsdcBalanceError,
  formatUsdcAmount,
  selectMinimumTestLendAmount,
} from "./helpers/lend.ts";

Deno.test("selectMinimumTestLendAmount returns the minimum viable deposit in base units", () => {
  assertEquals(selectMinimumTestLendAmount(85_084n), 10n);
});

Deno.test("selectMinimumTestLendAmount throws with exact required and missing amount when wallet is below the minimum viable deposit", () => {
  const error = assertThrows(
    () => selectMinimumTestLendAmount(9n),
  ) as Error;

  assertStringIncludes(error.message, "need at least 0.000010 USDC");
  assertStringIncludes(error.message, "wallet has 0.000009 USDC");
  assertStringIncludes(error.message, "short 0.000001 USDC");
});

Deno.test("buildInsufficientUsdcBalanceError includes UI amount and decimal-based unit details", () => {
  const error = buildInsufficientUsdcBalanceError(85_084n, 100_000n);

  assertStringIncludes(error.message, "wallet has 0.085084 USDC");
  assertStringIncludes(error.message, "need at least 0.100000 USDC");
  assertStringIncludes(error.message, "short 0.014916 USDC");
  assertStringIncludes(error.message, "85084 base units");
  assertStringIncludes(error.message, "100000 base units");
  assertStringIncludes(error.message, "0.085084 USDC");
  assertStringIncludes(error.message, "0.014916 USDC");
});

Deno.test("formatUsdcAmount renders six decimal places without trimming precision", () => {
  assertEquals(formatUsdcAmount(1n), "0.000001");
  assertEquals(formatUsdcAmount(10n), "0.000010");
  assertEquals(formatUsdcAmount(85_084n), "0.085084");
});
