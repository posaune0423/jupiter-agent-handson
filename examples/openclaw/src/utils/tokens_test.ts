import { assertEquals, assertThrows } from "@std/assert";
import { resolveToken } from "./tokens.ts";

Deno.test("resolveToken accepts common workshop aliases case-insensitively", () => {
  assertEquals(
    resolveToken("sol").mint,
    "So11111111111111111111111111111111111111112",
  );
  assertEquals(resolveToken("USDC").decimals, 6);
});

Deno.test("resolveToken accepts a direct mint address with explicit metadata", () => {
  assertEquals(
    resolveToken("ExampleMint111111111111111111111111111111", {
      symbol: "TEST",
      decimals: 5,
    }),
    {
      symbol: "TEST",
      mint: "ExampleMint111111111111111111111111111111",
      decimals: 5,
    },
  );
});

Deno.test("resolveToken rejects unknown aliases without explicit metadata", () => {
  assertThrows(
    () => resolveToken("BONK"),
    Error,
    "Unknown token alias",
  );
});
