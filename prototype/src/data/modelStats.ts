import type { Model, Point } from '@/data/types';

/**
 * Mock traffic for one model: daily requests, latency, which tenants call it,
 * and failures counted by type. Aggregates only: the instance admin never sees
 * a tenant's individual requests. Deterministic per model id, so a page shows
 * the same numbers on every visit; scaled by the model's throughput, so an
 * idle or unadmitted model shows none.
 */
function rng(seedText: string): () => number {
  let a = [...seedText].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0), 7);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ModelStats {
  daily: Point[];
  requests30d: number;
  tokensIn30d: number;
  tokensOut30d: number;
  errorRate: number;
  p50Ms: number;
  p95Ms: number;
  ttftP95Ms: number;
  cacheHit: number;
  byTenant: { label: string; value: number }[];
  errorsByType: { label: string; value: number }[];
}

const TENANTS = ['Acme Corp', 'Northwind Bank', 'Initech Labs', 'Globex Retail', 'Gcore Partner Hub', 'Constructor Fabric TF'];

export function statsFor(m: Model): ModelStats {
  const r = rng(m.id);
  const perDay = Math.round(m.tps * 1800 * (0.6 + r() * 0.8));
  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 10, 10 - (29 - i)));
    const weekend = [0, 6].includes(d.getUTCDay());
    return { label: d.toISOString().slice(5, 10), value: Math.round(perDay * (weekend ? 0.45 : 1) * (0.85 + r() * 0.3) * (0.8 + (i / 30) * 0.4)) };
  });
  const requests30d = daily.reduce((s, p) => s + p.value, 0);
  const errorRate = requests30d ? 0.3 + r() * 1.6 : 0;
  const shares = TENANTS.map(() => r() ** 2);
  const sum = shares.reduce((s, x) => s + x, 0) || 1;
  const errors = Math.round((requests30d * errorRate) / 100);
  const mix = [
    ['Rate limited (429)', 0.34],
    ['Provider unavailable (503, 529)', 0.22],
    ['Context too long (400)', 0.14],
    ['Timeout (504)', 0.12],
    ['Credits limit reached (402)', 0.1],
    ['Blocked by guardrail (403)', 0.08],
  ] as const;
  return {
    daily,
    requests30d,
    tokensIn30d: requests30d * Math.round(3200 + r() * 9000),
    tokensOut30d: requests30d * Math.round(300 + r() * 900),
    errorRate,
    p50Ms: m.p50Ms,
    p95Ms: Math.round(m.p50Ms * (2.1 + r() * 0.8)),
    ttftP95Ms: Math.round(m.p50Ms * (0.6 + r() * 0.4)),
    cacheHit: requests30d ? Math.round(35 + r() * 40) : 0,
    byTenant: TENANTS.map((t, i) => ({ label: t, value: Math.round((requests30d * shares[i]!) / sum) })).filter((x) => x.value).sort((a, b) => b.value - a.value),
    errorsByType: mix.map(([label, share]) => ({ label, value: Math.round(errors * share * (0.7 + r() * 0.6)) })).filter((x) => x.value),
  };
}
