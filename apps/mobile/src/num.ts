/** Parse a text field into a number; empty or junk becomes NaN so callers can show a clear message. */
export function num(s: string): number {
  const n = Number(s.trim());
  return s.trim() === "" ? NaN : n;
}

export function fmt(n: number, digits = 1): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "-";
}
