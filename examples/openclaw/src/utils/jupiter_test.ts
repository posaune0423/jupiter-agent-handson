import { assertEquals } from "@std/assert";
import { isRetryableJupiterError } from "./jupiter.ts";

Deno.test("isRetryableJupiterError recognizes rate limits and transient execute codes", () => {
  assertEquals(isRetryableJupiterError({ code: 429 }), true);
  assertEquals(isRetryableJupiterError({ code: "RATE_LIMITED" }), true);
  assertEquals(isRetryableJupiterError({ code: -1004 }), true);
  assertEquals(isRetryableJupiterError({ code: -2003 }), true);
});

Deno.test("isRetryableJupiterError rejects malformed or non-retryable errors", () => {
  assertEquals(isRetryableJupiterError({ code: -2 }), false);
  assertEquals(isRetryableJupiterError({ code: 400 }), false);
  assertEquals(isRetryableJupiterError({}), false);
});
