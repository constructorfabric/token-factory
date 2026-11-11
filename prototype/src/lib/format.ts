const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const money = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const moneyCents = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat('en');

export const fmtCompact = (n: number) => compact.format(n);
export const fmtMoney = (n: number) => (Math.abs(n) < 100 ? moneyCents.format(n) : money.format(n));
export const fmtInt = (n: number) => integer.format(n);
export const fmtPct = (n: number, digits = 0) => `${n.toFixed(digits)}%`;
export const fmtPrice = (n: number) => (n === 0 ? 'Included' : `$${n.toFixed(2)}`);
export const fmtContext = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${Math.round(n / 1000)}K`);

export function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const minutes = Math.round((Date.parse('2026-11-06T10:00:00Z') - Date.parse(iso)) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function percentOf(used: number, limit: number): number {
  return limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
}

/**
 * AI credits, the unit users are metered in (PRD G.0; PR #7 "AI credits").
 * The demo stores money and converts at 1 credit = $0.01 — an assumption for
 * the mock, since neither document fixes the rate.
 */
export const CREDITS_PER_USD = 100;
export const toCredits = (usd: number) => Math.round(usd * CREDITS_PER_USD);
export const fmtCredits = (usd: number) => `${compact.format(toCredits(usd))} credits`;
/** A model price per 1M tokens, in AI credits. */
export const fmtCreditPrice = (usd: number) => `${toCredits(usd)}`;
