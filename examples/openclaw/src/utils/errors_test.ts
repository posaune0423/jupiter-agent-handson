import { assertEquals, assertInstanceOf } from "@std/assert";
import {
  ExternalServiceError,
  formatErrorMessage,
  RetryExhaustedError,
  TransactionExecutionError,
  ValidationError,
} from "./errors.ts";

Deno.test("formatErrorMessage keeps validation errors concise for CLI output", () => {
  const error = new ValidationError("--orders must be an integer >= 2");

  assertEquals(formatErrorMessage(error), "--orders must be an integer >= 2");
});

Deno.test("ExternalServiceError preserves service context and cause", () => {
  const error = new ExternalServiceError(
    "Jupiter Swap API",
    "order request failed",
    new Error("rate limited"),
  );

  assertEquals(
    formatErrorMessage(error),
    "Jupiter Swap API: order request failed",
  );
  assertInstanceOf(error.cause, Error);
});

Deno.test("RetryExhaustedError retains the last retryable failure", () => {
  const cause = new Error("still failing");
  const error = new RetryExhaustedError("Jupiter execute", 4, cause);

  assertEquals(error.attempts, 4);
  assertEquals(
    formatErrorMessage(error),
    "Jupiter execute failed after 4 attempts",
  );
  assertInstanceOf(error.cause, Error);
});

Deno.test("TransactionExecutionError includes signature and logs when present", () => {
  const error = new TransactionExecutionError("transaction failed", {
    signature: "demo-signature",
    logs: ["Program log: insufficient funds"],
  });

  assertEquals(
    formatErrorMessage(error),
    "transaction failed (signature: demo-signature)",
  );
  assertEquals(error.logs, ["Program log: insufficient funds"]);
});
