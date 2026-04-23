interface SignatureStatus {
  confirmationStatus?: "processed" | "confirmed" | "finalized" | null;
  err: unknown;
}

interface SignatureStatusesResult {
  value: Array<SignatureStatus | null>;
}

interface TransactionMeta {
  err: unknown;
  logMessages?: string[] | null;
}

type TransactionResult = {
  meta: TransactionMeta | null;
} | null;

export type RpcRequest = <T>(method: string, params: unknown[]) => Promise<T>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isConfirmed(status: SignatureStatus | null | undefined): boolean {
  return status?.confirmationStatus === "confirmed" ||
    status?.confirmationStatus === "finalized";
}

function formatRpcError(err: unknown): string {
  if (typeof err === "string") return err;
  const encoded = JSON.stringify(err);
  return encoded ?? String(err);
}

function buildTransactionFailureError(
  signature: string,
  err: unknown,
  logMessages?: string[] | null,
): Error {
  const details = [
    `Transaction ${signature} failed`,
    `rpc err: ${formatRpcError(err)}`,
  ];
  const relevantLogs = (logMessages ?? []).filter((line) =>
    line.includes("Error:") || line.includes("failed:")
  );

  if (relevantLogs.length > 0) {
    details.push(`logs: ${relevantLogs.join(" | ")}`);
  }

  return new Error(details.join(" — "));
}

export async function confirmSubmittedTransaction(
  signature: string,
  rpcRequest: RpcRequest,
  options: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const deadline = Date.now() + timeoutMs;

  let latestStatus: SignatureStatus | null | undefined;

  while (Date.now() <= deadline) {
    const { value } = await rpcRequest<SignatureStatusesResult>(
      "getSignatureStatuses",
      [[signature], { searchTransactionHistory: true }],
    );
    latestStatus = value[0];

    if (latestStatus?.err || isConfirmed(latestStatus)) {
      break;
    }

    await sleep(pollIntervalMs);
  }

  const transaction = await rpcRequest<TransactionResult>("getTransaction", [
    signature,
    {
      encoding: "jsonParsed",
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    },
  ]);

  const transactionError = transaction?.meta?.err;
  if (transactionError || latestStatus?.err) {
    throw buildTransactionFailureError(
      signature,
      transactionError ?? latestStatus?.err,
      transaction?.meta?.logMessages,
    );
  }

  if (isConfirmed(latestStatus) || transaction?.meta?.err === null) {
    return;
  }

  throw new Error(
    `Transaction ${signature} was sent but did not reach confirmed/finalized status within ${timeoutMs}ms`,
  );
}
