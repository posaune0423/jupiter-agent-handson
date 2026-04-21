import { assertEquals, assertThrows } from "@std/assert";
import { parseArgs } from "./cli.ts";

Deno.test("parseArgs supports --key value, --key=value, and boolean flags", () => {
  assertEquals(parseArgs(["--amount", "0.01", "--input=SOL", "--execute"]), {
    amount: "0.01",
    input: "SOL",
    execute: "true",
  });
});

Deno.test("parseArgs rejects positional arguments to keep demo commands explicit", () => {
  assertThrows(
    () => parseArgs(["swap", "--amount", "1"]),
    Error,
    "Unexpected positional argument",
  );
});
