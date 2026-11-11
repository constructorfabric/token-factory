import type { Alias, Id, Model } from '@/data/types';
import { db, modelById } from '@/state/db';

/**
 * Everything about aliases that is derived rather than stored: which aliases
 * a model is in (so a model never carries its own, drifting list), and which
 * model aliases a license names.
 */

/** Models an alias may point at: the instance's own catalog, not retired, failed or unadmitted. */
export const routableModels = () => db.models.filter((m) => !m.ownerTenantId && !['retired', 'failed', 'discovered'].includes(m.state));

export const isModelAlias = (a: Alias) => !!a.family;

// ---- membership: which aliases a model serves, and in which role
export interface Membership { alias: Alias; role: 'primary' | 'candidate' | 'fallback'; position?: number }
export function membershipsOf(modelId: Id): Membership[] {
  const out: Membership[] = [];
  for (const a of db.aliases) {
    if (a.primary === modelId) out.push({ alias: a, role: 'primary' });
    if (a.candidate === modelId) out.push({ alias: a, role: 'candidate' });
    a.fallbacks.forEach((f, i) => f === modelId && out.push({ alias: a, role: 'fallback', position: i + 1 }));
  }
  return out;
}
/** The aliases whose requests this model answers in normal operation (primary or candidate). */
export const servingAliasesOf = (modelId: Id) => [...new Set(membershipsOf(modelId).filter((m) => m.role !== 'fallback').map((m) => m.alias.name))];
export const roleText = (m: Membership) => (m.role === 'primary' ? 'primary' : m.role === 'candidate' ? `candidate, ${m.alias.candidateShare ?? 0}% of traffic` : `fallback ${m.position}`);

// ---- licenses and aliases
/**
 * A license lists the model aliases its holders may call, picked like models.
 * A picked alias grants whatever model it points at now, and the next one when
 * the alias moves. Scenario aliases are never part of a license: everyone may
 * call them, and the platform routes them as the instance admin set them.
 */
export const modelAliasesIn = (ids: Id[] | undefined) => db.aliases.filter((a) => isModelAlias(a) && (ids ?? []).includes(a.id));
export const scenarioAliases = () => db.aliases.filter((a) => !isModelAlias(a));
