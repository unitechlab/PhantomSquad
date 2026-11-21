/** Money is shown in gold (G). */
export function formatGold(amount: number): string {
  return `${amount.toLocaleString('en-US')} G`;
}

export function formatSigned(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}${Math.abs(amount).toLocaleString('en-US')} G`;
}

/** "Oct 31" (English) or "10月31日" (Japanese) from "2026-10-31". */
export function shortDate(date: string, lang: 'en' | 'ja' = 'en'): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (lang === 'ja') return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', timeZone: 'UTC' }).replace('/', '月') + '日';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
