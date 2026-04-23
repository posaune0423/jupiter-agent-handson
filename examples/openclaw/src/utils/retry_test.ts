import { assertEquals, assertRejects } from "@std/assert";
import { RetryExhaustedError, ValidationError } from "./errors.ts";
import { retryWithPolicy } from "./retry.ts";

Deno.test("retryWithPolicy retries retryable failures until success", async () => {
  let attempts = 0;

  const result = await retryWithPolicy(
    () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`transient-${attempts}`);
      }
      return Promise.resolve("ok");
    },
    {
      label: "Jupiter execute",
      maxRetries: 3,
      baseDelayMs: 0,
      maxDelayMs: 0,
      shouldRetry: () => true,
      sleep: () => Promise.resolve(),
    },
  );

  assertEquals(result, "ok");
  assertEquals(attempts, 3);
});

Deno.test("retryWithPolicy throws RetryExhaustedError after the last retryable failure", async () => {
  let attempts = 0;

  await assertRejects(
    () =>
      retryWithPolicy(
        () => {
          attempts++;
          throw new Error("rate limited");
        },
        {
          label: "Jupiter execute",
          maxRetries: 2,
          baseDelayMs: 0,
          maxDelayMs: 0,
          shouldRetry: () => true,
          sleep: () => Promise.resolve(),
        },
      ),
    RetryExhaustedError,
    "Jupiter execute failed after 3 attempts",
  );

  assertEquals(attempts, 3);
});

Deno.test("retryWithPolicy does not retry non-retryable errors", async () => {
  let attempts = 0;

  await assertRejects(
    () =>
      retryWithPolicy(
        () => {
          attempts++;
          throw new ValidationError("invalid amount");
        },
        {
          label: "Jupiter execute",
          maxRetries: 5,
          baseDelayMs: 0,
          maxDelayMs: 0,
          shouldRetry: (error: unknown) => !(error instanceof ValidationError),
          sleep: () => Promise.resolve(),
        },
      ),
    ValidationError,
    "invalid amount",
  );

  assertEquals(attempts, 1);
});
