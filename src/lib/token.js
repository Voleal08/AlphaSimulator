export function estimateTokens(text) {
  const t = (text || "").trim();
  if (!t) return 0;
  return Math.max(1, Math.ceil(t.length / 4));
}