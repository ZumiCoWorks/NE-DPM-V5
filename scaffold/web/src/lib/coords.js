export function pxToPct(x, total) {
  if (!total || total === 0) return 0;
  return (x / total) * 100;
}

export function pctToPx(pct, total) {
  return (pct / 100) * total;
}
