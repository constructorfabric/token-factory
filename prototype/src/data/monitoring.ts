import type { Point } from '@/data/types';

/**
 * Monitoring mock data for the root: what BYOK traffic costs at the providers
 * against what tenants are charged in credits, by token type, model and
 * tenant; and how hosted deployments use their capacity.
 */
export interface ByokLine {
  provider: string;
  key: string;
  /** Platform key (the root's contract) or a tenant's own key. */
  owner: 'platform' | string;
  model: string;
  requests: number;
  /** Millions of tokens, last 30 days, by type; provider USD per 1M; credits charged per 1M. */
  tokens: { type: 'Input, uncached' | 'Input, cached' | 'Cache write' | 'Output' | 'Reasoning'; millions: number; usdPer1M: number; creditsPer1M: number }[];
  byTenant: { tenant: string; share: number }[];
}

const t = (inU: number, inC: number, cw: number, out: number, rs: number, p: [number, number, number, number], c: [number, number, number, number]): ByokLine['tokens'] => [
  { type: 'Input, uncached', millions: inU, usdPer1M: p[0], creditsPer1M: c[0] },
  { type: 'Input, cached', millions: inC, usdPer1M: p[1], creditsPer1M: c[1] },
  { type: 'Cache write', millions: cw, usdPer1M: p[2], creditsPer1M: c[2] },
  { type: 'Output', millions: out, usdPer1M: p[3], creditsPer1M: c[3] },
  { type: 'Reasoning', millions: rs, usdPer1M: p[3], creditsPer1M: c[3] },
];

const RAW: ByokLine[] = [
  { provider: 'Anthropic', key: 'constructor-prod', owner: 'platform', model: 'Claude Sonnet 5.5', requests: 2_140_000, tokens: t(6_120, 14_800, 1_310, 1_920, 410, [3, 0.3, 3.75, 15], [300, 30, 375, 1500]), byTenant: [{ tenant: 'Acme Corp', share: 0.46 }, { tenant: 'Northwind Bank', share: 0.29 }, { tenant: 'Initech Labs', share: 0.17 }, { tenant: 'Globex Retail', share: 0.08 }] },
  { provider: 'Anthropic', key: 'constructor-prod', owner: 'platform', model: 'Claude Opus 5.5', requests: 310_000, tokens: t(820, 2_100, 190, 260, 340, [15, 1.5, 18.75, 75], [1500, 150, 1875, 7500]), byTenant: [{ tenant: 'Acme Corp', share: 0.71 }, { tenant: 'Northwind Bank', share: 0.29 }] },
  { provider: 'Anthropic', key: 'constructor-prod', owner: 'platform', model: 'Claude Haiku 4.5', requests: 1_820_000, tokens: t(2_940, 3_100, 260, 610, 0, [1, 0.1, 1.25, 5], [100, 10, 125, 500]), byTenant: [{ tenant: 'Northwind Bank', share: 0.38 }, { tenant: 'Acme Corp', share: 0.34 }, { tenant: 'Globex Retail', share: 0.28 }] },
  { provider: 'OpenAI', key: 'constructor-openai', owner: 'platform', model: 'GPT-5.1', requests: 960_000, tokens: t(2_410, 3_650, 0, 720, 520, [2.5, 0.25, 2.5, 12], [250, 25, 250, 1200]), byTenant: [{ tenant: 'Initech Labs', share: 0.44 }, { tenant: 'Acme Corp', share: 0.36 }, { tenant: 'Gcore Partner Hub', share: 0.2 }] },
  { provider: 'Google Vertex AI', key: 'constructor-vertex', owner: 'platform', model: 'Gemini 3 Pro', requests: 120_000, tokens: t(510, 380, 0, 140, 90, [2, 0.2, 2, 10], [200, 20, 200, 1000]), byTenant: [{ tenant: 'Northwind Bank', share: 1 }] },
  { provider: 'Azure OpenAI', key: 'acme-prod-weu', owner: 'Acme Corp', model: 'GPT-5.1 (Acme Azure)', requests: 1_960_000, tokens: t(1_240, 2_100, 180, 320, 210, [2.5, 0.25, 2.5, 12], [250, 25, 250, 1200]), byTenant: [{ tenant: 'Acme Corp', share: 1 }] },
  { provider: 'OpenAI', key: 'acme-research', owner: 'Acme Corp', model: 'o4-mini (Acme OpenAI)', requests: 140_000, tokens: t(160, 220, 0, 40, 95, [1.1, 0.28, 1.1, 4.4], [110, 28, 110, 440]), byTenant: [{ tenant: 'Acme Corp', share: 1 }] },
];

// Platform keys are resold with a 20% margin; tenants' own keys are metered at cost.
export const BYOK: ByokLine[] = RAW.map((l) => (l.owner === 'platform' ? { ...l, tokens: l.tokens.map((t) => ({ ...t, creditsPer1M: Math.round(t.creditsPer1M * 1.2) })) } : l));

export const byokDaily: Point[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 12 + i));
  const weekend = [0, 6].includes(d.getUTCDay());
  return { label: d.toISOString().slice(5, 10), value: Math.round((weekend ? 2_100 : 5_400) + Math.sin(i / 3) * 600 + i * 40) };
});

export interface HostedMetrics {
  deploymentId: string;
  /** Peak sustainable output tokens per second per replica (from the benchmark run). */
  capacityTps: number;
  kvCache: number;
  gpuMemory: number;
  inFlight: number;
  maxSeqs: number;
  queueP95Ms: number;
  ttftP95Ms: number;
  ttftSloMs: number;
  errorRate: number;
  /** Utilization over the last 24 hours, percent. */
  day: number[];
}

const curve = (base: number, peak: number, seed: number) => Array.from({ length: 24 }, (_, h) => Math.round(Math.max(3, Math.min(99, base + (peak - base) * Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)) + ((h * seed) % 7) - 3))));

export const HOSTED: HostedMetrics[] = [
  { deploymentId: 'd-qwen', capacityTps: 1_700, kvCache: 88, gpuMemory: 93, inFlight: 171, maxSeqs: 192, queueP95Ms: 1_400, ttftP95Ms: 1_900, ttftSloMs: 1_500, errorRate: 0.4, day: curve(35, 96, 3) },
  { deploymentId: 'd-gptoss', capacityTps: 1_900, kvCache: 61, gpuMemory: 78, inFlight: 92, maxSeqs: 160, queueP95Ms: 120, ttftP95Ms: 520, ttftSloMs: 1_000, errorRate: 0.1, day: curve(28, 74, 5) },
  { deploymentId: 'd-deepseek', capacityTps: 1_850, kvCache: 44, gpuMemory: 71, inFlight: 58, maxSeqs: 128, queueP95Ms: 60, ttftP95Ms: 880, ttftSloMs: 1_500, errorRate: 0.2, day: curve(20, 58, 2) },
  { deploymentId: 'd-llama4', capacityTps: 2_000, kvCache: 9, gpuMemory: 52, inFlight: 6, maxSeqs: 128, queueP95Ms: 0, ttftP95Ms: 610, ttftSloMs: 1_500, errorRate: 0, day: curve(4, 18, 4) },
];
