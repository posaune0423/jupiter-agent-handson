import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import {
  buildInsufficientUsdcBalanceError,
  formatUsdcAmount,
  getMinimumTestDcaConfig,
} from "./dca.ts";

Deno.test("getMinimumTestDcaConfig returns the protocol minimum valid DCA size", () => {
  const config = getMinimumTestDcaConfig(100_000_000n);

  assertEquals(config.inAmountBaseUnits, 100_000_000n);
  assertEquals(config.numberOfOrders, 2);
  assertEquals(config.intervalSeconds, 86_400);
});

Deno.test("getMinimumTestDcaConfig throws with exact shortfall when wallet balance is below protocol minimum", () => {
  const error = assertThrows(
    () => getMinimumTestDcaConfig(85_074n),
  ) as Error;

  assertStringIncludes(error.message, "need at least 100.000000 USDC");
  assertStringIncludes(error.message, "wallet has 0.085074 USDC");
  assertStringIncludes(error.message, "short 99.914926 USDC");
  assertStringIncludes(error.message, "99914926 base units");
});

Deno.test("buildInsufficientUsdcBalanceError includes UI amount and unit details", () => {
  const error = buildInsufficientUsdcBalanceError(85_074n, 100_000_000n);

  assertStringIncludes(error.message, "need at least 100.000000 USDC");
  assertStringIncludes(error.message, "wallet has 0.085074 USDC");
  assertStringIncludes(error.message, "short 99.914926 USDC");
  assertStringIncludes(error.message, "6 decimals");
});

Deno.test("formatUsdcAmount renders six decimal places", () => {
  assertEquals(formatUsdcAmount(1n), "0.000001");
  assertEquals(formatUsdcAmount(100_000_000n), "100.000000");
});
