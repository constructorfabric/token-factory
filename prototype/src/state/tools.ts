import { reactive } from 'vue';
import * as data from '@/data/tools';
import type { Assignment, AssignmentLevel, Id, User } from '@/data/types';
import { db, unitById } from './db';

/** The Phase 2 registries, reactive like the rest of the demo's data. */
export const tools = reactive({
  mcpServers: structuredClone(data.mcpServers),
  skills: structuredClone(data.skills),
  skillSets: structuredClone(data.skillSets),
  assignments: structuredClone(data.assignments),
  /** Recommendations a user declined (ORG-06): theirs to decide, no reason asked. */
  declined: {} as Record<Id, Id[]>,
  /** Recommendations a user accepted. */
  accepted: {} as Record<Id, Id[]>,
});

export const PLATFORM_MCP = 'mcp-tf';

const RANK: Record<Exclude<AssignmentLevel, 'blocked'>, number> = { available: 1, recommended: 2, required: 3 };

export interface RuleStep {
  scope: string;
  level: AssignmentLevel;
  setBy: string;
  applied: boolean;
  why: string;
}

export interface Effective {
  kind: 'mcp' | 'skillset';
  itemId: Id;
  level: AssignmentLevel;
  /** For an MCP server that came with a skill set (ORG-09). */
  via?: Id;
  steps: RuleStep[];
}

/** The chain of scopes a user inherits from: tenant first, own unit last. */
export function scopeChain(user: User): { unitId: Id | null; name: string }[] {
  const units: { unitId: Id | null; name: string }[] = [];
  let unit = unitById(user.unitId);
  while (unit) {
    units.unshift({ unitId: unit.id, name: unit.name });
    unit = unitById(unit.parentId);
  }
  return [{ unitId: null, name: 'Tenant' }, ...units];
}

/**
 * ORG-01..ORG-09 precedence: rules are inherited downward; a lower level may
 * tighten (available → recommended → required, or anything → blocked) but
 * never loosen; a block set higher up cannot be lifted below.
 */
export function effectiveFor(user: User): Effective[] {
  const result = new Map<string, Effective>();
  // Every user has the platform's own MCP server; no tenant rule can remove it.
  result.set('mcp:mcp-tf', { kind: 'mcp', itemId: PLATFORM_MCP, level: 'required', steps: [{ scope: 'Platform', level: 'required', setBy: 'Token Factory', applied: true, why: 'Part of the platform for every user' }] });
  for (const scope of scopeChain(user)) {
    const rules = tools.assignments.filter((a) => a.tenantId === user.tenantId && a.unitId === scope.unitId);
    for (const rule of rules) apply(result, rule, scope.name);
  }

  // A skill set brings the MCP servers its skills require, at its own level.
  for (const e of [...result.values()].filter((x) => x.kind === 'skillset' && x.level !== 'blocked')) {
    for (const mcpId of requiredMcp(e.itemId)) {
      const key = `mcp:${mcpId}`;
      const existing = result.get(key);
      if (existing?.level === 'blocked') continue;
      if (!existing || RANK[existing.level] < RANK[e.level as keyof typeof RANK]) {
        result.set(key, { kind: 'mcp', itemId: mcpId, level: e.level, via: e.itemId, steps: [...(existing?.steps ?? []), { scope: 'Skill set', level: e.level, setBy: '—', applied: true, why: `Required by ${setName(e.itemId)}` }] });
      }
    }
  }
  return [...result.values()];
}

function apply(result: Map<string, Effective>, rule: Assignment, scope: string): void {
  const key = `${rule.kind}:${rule.itemId}`;
  const current = result.get(key);
  const step = (applied: boolean, why: string): RuleStep => ({ scope, level: rule.level, setBy: rule.setBy, applied, why });
  if (!current) {
    result.set(key, { kind: rule.kind, itemId: rule.itemId, level: rule.level, steps: [step(true, 'First rule for this item')] });
    return;
  }
  if (current.level === 'blocked') {
    current.steps.push(step(false, 'Blocked higher up — a block cannot be lifted below'));
  } else if (rule.level === 'blocked' || RANK[rule.level] > RANK[current.level]) {
    current.level = rule.level;
    current.steps.push(step(true, 'Tightens the inherited rule'));
  } else {
    current.steps.push(step(false, 'Would loosen the inherited rule — ignored'));
  }
}

export function requiredMcp(skillSetId: Id): Id[] {
  const set = tools.skillSets.find((s) => s.id === skillSetId);
  const ids = new Set<Id>();
  for (const skillId of set?.skills ?? []) for (const m of tools.skills.find((s) => s.id === skillId)?.requiresMcp ?? []) ids.add(m);
  return [...ids];
}

export const setName = (id: Id) => tools.skillSets.find((s) => s.id === id)?.name ?? id;
export const mcpName = (id: Id) => tools.mcpServers.find((s) => s.id === id)?.name ?? id;
export const itemName = (kind: 'mcp' | 'skillset', id: Id) => (kind === 'mcp' ? mcpName(id) : setName(id));

/** Users an assignment at this scope reaches: the unit and every unit below it. */
export function reach(tenantId: Id, unitId: Id | null): number {
  if (unitId === null) return db.tenants.find((t) => t.id === tenantId)?.users ?? 0;
  return db.units.find((u) => u.id === unitId)?.members ?? 0;
}
