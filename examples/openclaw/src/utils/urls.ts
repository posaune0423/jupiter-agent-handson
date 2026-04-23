export function buildSolscanTransactionUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}
