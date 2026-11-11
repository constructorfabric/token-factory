import type { Point } from '@/data/types';

/** The periods every usage and monitoring view offers, and how a 30-day mock scales to each. */
export const PERIODS = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
] as const;
export type PeriodId = (typeof PERIODS)[number]['id'];
export const periodOf = (id: PeriodId) => PERIODS.find((p) => p.id === id) ?? PERIODS[2];

/**
 * A daily series cut to the period: today as 24 hourly points, a week or a
 * month as days, 90 days by repeating the month's shape.
 */
export function seriesFor(daily: Point[], id: PeriodId, perHour = false): Point[] {
  if (id === 'today') {
    const last = daily[daily.length - 1]?.value ?? 0;
    return Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, '0')}:00`, value: Math.round((perHour ? last : last / 24) * (0.35 + 1.3 * Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)))) }));
  }
  const days = periodOf(id).days;
  if (days <= daily.length) return daily.slice(-days);
  return Array.from({ length: days }, (_, i) => {
    const src = daily[i % daily.length]!;
    const d = new Date(Date.UTC(2026, 10, 10 - (days - 1 - i)));
    return { label: d.toISOString().slice(5, 10), value: Math.round(src.value * (0.85 + (i / days) * 0.2)) };
  });
}
