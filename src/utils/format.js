export function fmt(n, decimals = 0) {
  const v = Number(n);
  if (!isFinite(v)) return '-';
  const fixed = v.toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${withDots},${dec}` : withDots;
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
}
