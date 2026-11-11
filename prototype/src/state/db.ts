import { reactive } from 'vue';
import * as mock from '@/data/mock';
import type { ApiKey, AuditEvent, Id, License, LicenseRequest, LimitPeriod, Model, ProviderKey, Unit, User } from '@/data/types';

/**
 * The demo's data, made reactive so that what a role changes on one screen
 * is what the next screen shows. Nothing is persisted: a reload starts clean,
 * which is what a demo wants.
 */
export const db = reactive({
  tenants: structuredClone(mock.tenants),
  models: structuredClone(mock.models),
  aliases: structuredClone(mock.aliases),
  clusters: structuredClone(mock.clusters),
  deployments: structuredClone(mock.deployments),
  guardrails: structuredClone(mock.guardrails),
  suites: structuredClone(mock.suites),
  runs: structuredClone(mock.benchmarkRuns),
  audit: structuredClone(mock.audit),
  units: structuredClone(mock.units),
  licenses: structuredClone(mock.licenses),
  users: structuredClone(mock.users),
  providerKeys: structuredClone(mock.providerKeys),
  apiKeys: structuredClone(mock.apiKeys),
  licenseRequests: structuredClone(mock.licenseRequests),
});

export function byId<T extends { id: Id }>(list: T[], id: Id | null | undefined): T | undefined {
  return id ? list.find((item) => item.id === id) : undefined;
}

export const tenantById = (id: Id | undefined) => byId(db.tenants, id);
/** Where a tenant's own pages live: the instance tenant's are inside the root console. */
export const tenantBase = (id: Id) => (id === 'root' ? '/root' : `/t/${id}`);
export const modelById = (id: Id | undefined) => byId(db.models, id);
export const licenseById = (id: Id | null | undefined) => byId(db.licenses, id);
export const unitById = (id: Id | null | undefined) => byId(db.units, id);

/** The license a unit hands down: its own default, or the nearest ancestor's. */
export function effectiveUnitLicense(unit: Unit | undefined): { license?: License; from?: Unit } {
  let current = unit;
  while (current) {
    if (current.defaultLicenseId) return { license: licenseById(current.defaultLicenseId), from: current };
    current = unitById(current.parentId);
  }
  return {};
}

/** A user's seat: an explicit override wins, otherwise the unit's default. */
export function effectiveUserLicense(user: User): { license?: License; source: 'override' | 'unit'; from?: Unit } {
  if (user.licenseOverrideId) return { license: licenseById(user.licenseOverrideId), source: 'override' };
  const { license, from } = effectiveUnitLicense(unitById(user.unitId));
  return { license, source: 'unit', from };
}

export type CreditSource = 'platform' | 'keys';
/** Models the tenant brings (own keys, own deployments) draw the company's own credits ("Acme-own credits", see state/credits.ts); the rest draw platform credits. */
export const creditSource = (m?: Model): CreditSource => (m?.ownerTenantId ? 'keys' : 'platform');

/** Mock: the share of a user's credits spent on the company's own models, steady per user. */
function keyShare(u: User): number {
  const lic = effectiveUserLicense(u).license;
  if (!lic?.keyLimits.monthly) return 0;
  const h = [...u.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return 0.18 + (h % 23) / 100;
}
/** A user's credits in one period, split by where they come from. */
export function splitUsage(u: User, period: LimitPeriod): Record<CreditSource, number> {
  const total = u.usage[period].cost;
  const keys = total * keyShare(u);
  return { platform: total - keys, keys };
}

/** Users at 80% or more of a weekly limit, once per budget they are close to. */
export function nearLimit(tenantId: Id): { id: string; user: User; license: License; source: CreditSource; used: number; limit: number; pct: number }[] {
  return db.users
    .filter((u) => u.tenantId === tenantId)
    .flatMap((u) => {
      const license = effectiveUserLicense(u).license;
      if (!license) return [];
      const used = splitUsage(u, 'weekly');
      const limit: Record<CreditSource, number> = { platform: license.platformAllowed ? license.limits.weekly.cost : 0, keys: license.keyLimits.weekly };
      return (['platform', 'keys'] as const)
        .filter((s) => limit[s] && used[s] / limit[s] >= 0.8)
        .map((s) => ({ id: `${u.id}-${s}`, user: u, license, source: s, used: used[s], limit: limit[s], pct: Math.round((used[s] / limit[s]) * 100) }));
    });
}

/** A user asks for another license; it waits for their manager or a license manager. */
export function requestLicense(user: User, licenseId: Id, reason: string): LicenseRequest {
  const req: LicenseRequest = { id: `lr-${Date.now()}`, tenantId: user.tenantId, userId: user.id, fromLicenseId: effectiveUserLicense(user).license?.id, licenseId, reason, at: new Date().toISOString(), status: 'pending' };
  db.licenseRequests.unshift(req);
  return req;
}

/** Approving sets the license for that user (a personal override); declining keeps theirs. */
export function decideRequest(req: LicenseRequest, approve: boolean, by: string, note?: string): void {
  req.status = approve ? 'approved' : 'declined';
  req.decidedBy = by;
  req.decidedAt = new Date().toISOString();
  req.note = note || undefined;
  const user = db.users.find((u) => u.id === req.userId);
  if (approve && user) user.licenseOverrideId = req.licenseId;
}

/** Who decides a user's request: the manager above them, else a license manager. */
export function approverFor(user: User): string {
  let at = unitById(user.unitId);
  while (at && at.manager === user.name) at = unitById(at.parentId);
  return at?.manager ?? 'a license manager';
}

export function record(event: Omit<AuditEvent, 'id' | 'at' | 'ip' | 'result'> & Partial<Pick<AuditEvent, 'result'>>): void {
  db.audit.unshift({
    id: `e-${Date.now()}`,
    at: new Date().toISOString(),
    ip: '10.12.4.18',
    result: 'success',
    ...event,
  });
}

export function addApiKey(key: Omit<ApiKey, 'id' | 'createdAt' | 'lastUsed' | 'spend30d' | 'status' | 'prefix'>): ApiKey {
  const created: ApiKey = {
    ...key,
    id: `ak-${Date.now()}`,
    prefix: `cai-sk-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString().slice(0, 10),
    lastUsed: null,
    spend30d: 0,
    status: 'active',
  };
  db.apiKeys.unshift(created);
  return created;
}

/** A new key's secret, kept in memory for this session only so the next steps can
 *  prefill it; the server would store only its hash. */
export const freshSecrets = reactive<Record<Id, string>>({});

export function addProviderKey(key: Omit<ProviderKey, 'id' | 'addedAt' | 'status'>): void {
  db.providerKeys.unshift({ ...key, id: `k-${Date.now()}`, addedAt: new Date().toISOString().slice(0, 10), status: 'valid' });
}
