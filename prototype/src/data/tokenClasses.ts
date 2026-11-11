import type { Model } from '@/data/types';
import { CREDITS_PER_USD } from '@/lib/format';

/**
 * The token classes every call is counted in (PRD FR-120) and priced by
 * (FR-121): uncached input, cached input, cache write and output. Reasoning
 * tokens count as output.
 */
export type TokenClass = 'in' | 'cachedIn' | 'cacheWrite' | 'out';
export const TOKEN_CLASSES: { id: TokenClass; label: string }[] = [
  { id: 'in', label: 'Input, uncached' },
  { id: 'cachedIn', label: 'Input, cached' },
  { id: 'cacheWrite', label: 'Cache write' },
  { id: 'out', label: 'Output' },
];

/** What providers charge for cache writes, relative to input: Anthropic bills them, OpenAI and Google do not, self-hosted is free. */
export const defaultCacheWriteFactor = (m: Pick<Model, 'provider' | 'family'>) => (/anthropic/i.test(m.provider) || m.family === 'Claude' ? 1.25 : 0);

/** USD per 1M tokens of each class; unset cache prices follow the provider's usual billing. */
export function pricesOf(m: Model): Record<TokenClass, number> {
  return {
    in: m.priceIn,
    cachedIn: m.priceCachedIn ?? m.priceIn * 0.1,
    cacheWrite: m.priceCacheWrite ?? m.priceIn * defaultCacheWriteFactor(m),
    out: m.priceOut,
  };
}

export interface ClassCost { id: TokenClass; label: string; millions: number; creditsPer1M: number; credits: number }
/** Split a model's input and output tokens into classes and price each. */
export function costByClass(m: Model, tokensIn: number, tokensOut: number, cacheHitPct: number): ClassCost[] {
  const p = pricesOf(m);
  const cached = (tokensIn * cacheHitPct) / 100;
  const millions: Record<TokenClass, number> = {
    in: (tokensIn - cached) / 1e6,
    cachedIn: cached / 1e6,
    // Prompts written to the cache: roughly a tenth of uncached input on agentic traffic.
    cacheWrite: ((tokensIn - cached) * 0.1) / 1e6,
    out: tokensOut / 1e6,
  };
  return TOKEN_CLASSES.map((c) => ({ ...c, millions: millions[c.id], creditsPer1M: p[c.id] * CREDITS_PER_USD, credits: millions[c.id] * p[c.id] * CREDITS_PER_USD }));
}
