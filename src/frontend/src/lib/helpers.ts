export function formatTimestamp(ts: bigint | undefined): string {
  if (!ts) return "—";
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(ts: bigint | undefined): string {
  if (!ts) return "—";
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function tsToMs(ts: bigint): number {
  return Number(ts / 1_000_000n);
}
