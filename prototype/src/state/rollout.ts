import { reactive } from 'vue';
import type { Id } from '@/data/types';

/**
 * How a new model reaches traffic, ring by ring. The instance sets it for the
 * models it serves; a tenant whose license lets it manage its own models sets
 * its own, for those models.
 */
export type RingId = 'canary' | 'pilot' | 'broad';
export interface Ring { id: RingId; name: string; share: number; soakDays: number; enabled: boolean }
export interface RolloutPolicy {
  rings: Ring[];
  /** Move to the next ring by itself once a ring has soaked and stayed healthy. */
  autoAdvance: boolean;
  /** Healthy: error rate at most this many points above the current model's, p95 at most this % slower. */
  maxErrorDelta: number;
  maxLatencyDelta: number;
  autoRollback: boolean;
  rollbackErrorRate: number;
  /** Broad (everyone) needs an admin to press the button even with auto-advance on. */
  approvalForBroad: boolean;
  /** The shortest notice before a deprecated model is retired. */
  noticeDays: number;
}

const ROOT_RINGS: Ring[] = [
  { id: 'canary', name: 'Canary', share: 5, soakDays: 2, enabled: true },
  { id: 'pilot', name: 'Pilot', share: 25, soakDays: 7, enabled: true },
  { id: 'broad', name: 'Broad', share: 100, soakDays: 0, enabled: true },
];
const TENANT_RINGS: Ring[] = [
  { id: 'canary', name: 'Canary', share: 10, soakDays: 3, enabled: true },
  { id: 'pilot', name: 'Pilot', share: 30, soakDays: 7, enabled: false },
  { id: 'broad', name: 'Broad', share: 100, soakDays: 0, enabled: true },
];

const policies = reactive<Record<Id, RolloutPolicy>>({});
export function policyFor(tenantId: Id): RolloutPolicy {
  if (!policies[tenantId]) {
    policies[tenantId] = {
      rings: JSON.parse(JSON.stringify(tenantId === 'root' ? ROOT_RINGS : TENANT_RINGS)),
      autoAdvance: tenantId === 'root', maxErrorDelta: 0.2, maxLatencyDelta: 15,
      autoRollback: true, rollbackErrorRate: 2, approvalForBroad: true, noticeDays: 60,
    };
  }
  return policies[tenantId]!;
}
export const enabledRings = (tenantId: Id) => policyFor(tenantId).rings.filter((r) => r.enabled);
