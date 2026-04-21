import { assertEquals, assertThrows } from "@std/assert";
import { formatBaseUnits, parseBaseUnits } from "./amounts.ts";

Deno.test("parseBaseUnits converts decimal token amounts to base units exactly", () => {
  assertEquals(parseBaseUnits("1", 6), 1_000_000n);
  assertEquals(parseBaseUnits("1.234567", 6), 1_234_567n);
  assertEquals(parseBaseUnits("0.001", 9), 1_000_000n);
});

Deno.test("parseBaseUnits rejects amounts with more precision than the token supports", () => {
  assertThrows(
    () => parseBaseUnits("1.0000001", 6),
    Error,
    "supports at most 6 decimal places",
  );
});

Deno.test("formatBaseUnits renders compact decimal token amounts", () => {
  assertEquals(formatBaseUnits(1_234_567n, 6), "1.234567");
  assertEquals(formatBaseUnits(1_000_000n, 6), "1");
  assertEquals(formatBaseUnits(1_000_000n, 9), "0.001");
  assertEquals(formatBaseUnits(42n, 0), "42");
});
