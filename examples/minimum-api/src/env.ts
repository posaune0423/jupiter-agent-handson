import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

export const env = createEnv({
  server: {
    JUPITER_API_KEY: v.pipe(v.string(), v.minLength(1)),
    PRIVATE_KEY: v.pipe(v.string(), v.minLength(1)),
    SOLANA_RPC_URL: v.optional(
      v.pipe(v.string(), v.url()),
      "https://api.mainnet-beta.solana.com",
    ),
  },
  runtimeEnv: Deno.env.toObject(),
  emptyStringAsUndefined: true,
});
