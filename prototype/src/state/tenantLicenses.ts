import { reactive } from 'vue';
import type { Id, Model, Tenant } from '@/data/types';
import { CREDITS_PER_USD, fmtInt } from '@/lib/format';
import { db, modelById, tenantById } from '@/state/db';

/**
 * Tenant licenses: the packages a tenant is put on. The instance defines
 * them; a partner that may create tenants and deploy its own models defines
 * its own for its customers, from what its license includes plus its own
 * models. A license says what the tenant may do and which models it gets —
 * picked by hand, or by a rule that keeps matching as the catalog changes.
 * Seats, credits and term stay per tenant.
 */
export type ModelRule = 'all' | 'budget' | 'open-weight' | 'commercial' | 'families';

export interface TenantLicense {
  id: Id;
  /** 'root' for the instance's licenses, or the partner tenant that offers it. */
  ownerId: Id;
  name: string;
  description: string;
  createTenants: boolean;
  ownKeys: boolean;
  /** May deploy its own models (and so offer them in its own licenses). */
  ownModels: boolean;
  models: { mode: 'rule'; rule: ModelRule; maxOutCredits?: number; families?: string[] } | { mode: 'list'; ids: Id[] };
  /** A partner's own models, added on top of what the rule or list gives. */
  extraIds: Id[];
  /** Model aliases picked with the models (list mode): each brings the model it points at now. */
  aliasIds?: Id[];
}

export const RULES: { id: ModelRule; label: string; text: string }[] = [
  { id: 'all', label: 'Every model', text: 'Everything tenants can use, including models added later' },
  { id: 'budget', label: 'Cost-efficient', text: 'Models up to a price per 1M output tokens' },
  { id: 'open-weight', label: 'Open-weight only', text: 'Models running on our compute; nothing leaves it' },
  { id: 'commercial', label: 'Commercial APIs only', text: 'Anthropic, OpenAI, Google and other providers' },
  { id: 'families', label: 'By family', text: 'Every model of the families you pick' },
];

export const tenantLicenses = reactive<TenantLicense[]>([
  { id: 'tl-partner', ownerId: 'root', name: 'Partner', description: 'For resellers: creates its own customers, brings its own keys and deploys its own models.', createTenants: true, ownKeys: true, ownModels: true, models: { mode: 'rule', rule: 'all' }, extraIds: [] },
  { id: 'tl-enterprise', ownerId: 'root', name: 'Enterprise', description: 'Every model, and the company’s own provider keys.', createTenants: false, ownKeys: true, ownModels: false, models: { mode: 'rule', rule: 'all' }, extraIds: [] },
  { id: 'tl-team', ownerId: 'root', name: 'Team', description: 'Cost-efficient models for everyday work; no own keys.', createTenants: false, ownKeys: false, ownModels: false, models: { mode: 'rule', rule: 'budget', maxOutCredits: 1500 }, extraIds: [] },
  { id: 'tl-sovereign', ownerId: 'root', name: 'Sovereign', description: 'Open-weight models on our compute only; prompts never reach a commercial API.', createTenants: false, ownKeys: false, ownModels: false, models: { mode: 'rule', rule: 'open-weight' }, extraIds: [] },
  { id: 'tl-community', ownerId: 'root', name: 'Community', description: 'Free access for contributors and students: a few small models.', createTenants: false, ownKeys: false, ownModels: false, models: { mode: 'list', ids: ['m-gpt-oss', 'm-qwen3-coder', 'm-haiku-45'] }, extraIds: [], aliasIds: ['a-qwen'] },
  // Gcore's packages for its own customers
  { id: 'tl-gc-business', ownerId: 't-gcore-hub', name: 'Gcore AI Business', description: 'Commercial and open models, plus Gcore’s own Llama deployment.', createTenants: false, ownKeys: true, ownModels: false, models: { mode: 'rule', rule: 'all' }, extraIds: ['m-gc-llama33'] },
  { id: 'tl-gc-sovereign', ownerId: 't-gcore-hub', name: 'Gcore Sovereign Cloud', description: 'Only models hosted in Gcore’s EU data centers.', createTenants: false, ownKeys: false, ownModels: false, models: { mode: 'rule', rule: 'open-weight' }, extraIds: ['m-gc-llama33', 'm-gc-mistral'] },
]);

const ASSIGNED: Record<Id, Id> = { 't-gcore-hub': 'tl-partner', 't-acme': 'tl-enterprise', 't-initech': 'tl-enterprise', 't-globex': 'tl-team', 't-umbrella': 'tl-team', 't-contributors': 'tl-community', 't-students': 'tl-community', 't-northwind': 'tl-gc-business', 't-helix': 'tl-gc-sovereign' };
for (const t of db.tenants) if (!t.licenseTypeId && ASSIGNED[t.id]) t.licenseTypeId = ASSIGNED[t.id];

export const tenantLicenseById = (id?: Id) => tenantLicenses.find((l) => l.id === id);
export const licenseOfTenant = (t?: Tenant) => tenantLicenseById(t?.licenseTypeId);
/** The licenses a tenant under this parent can be put on. */
export const licensesOfferedBy = (ownerId: Id) => tenantLicenses.filter((l) => l.ownerId === ownerId);
export const tenantsOn = (l: TenantLicense) => db.tenants.filter((t) => t.licenseTypeId === l.id);
/** A partner may offer its own licenses when its license lets it create tenants and deploy models. */
export const offersLicenses = (t?: Tenant) => !!licenseOfTenant(t)?.createTenants && !!licenseOfTenant(t)?.ownModels;

const OPEN: Model['hosting'][] = ['self-hosted', 'gpu-provider'];
const usable = (m: Model) => ['ga', 'rolling-out', 'deprecated'].includes(m.state);
/** What a license's owner can put into it: the instance catalog, or the partner's own license. */
export function poolFor(ownerId: Id): Model[] {
  if (ownerId === 'root') return db.models.filter((m) => !m.ownerTenantId && usable(m));
  const own = licenseOfTenant(tenantById(ownerId));
  return own ? modelsOf(own) : [];
}
export const ownModelsOf = (tenantId: Id) => db.models.filter((m) => m.ownerTenantId === tenantId && m.hosting === 'tenant-own' && usable(m));

export function matches(l: Pick<TenantLicense, 'models'>, m: Model): boolean {
  const s = l.models;
  if (s.mode === 'list') return s.ids.includes(m.id);
  if (s.rule === 'budget') return m.priceOut * CREDITS_PER_USD <= (s.maxOutCredits ?? 0);
  if (s.rule === 'open-weight') return OPEN.includes(m.hosting);
  if (s.rule === 'commercial') return m.hosting === 'commercial';
  if (s.rule === 'families') return (s.families ?? []).includes(m.family);
  return true;
}
export function modelsOf(l: TenantLicense): Model[] {
  const base = poolFor(l.ownerId).filter((m) => matches(l, m));
  const viaAlias = aliasesOf(l).map((a) => modelById(a.primary)).filter((m): m is Model => !!m);
  const extra = db.models.filter((m) => l.extraIds.includes(m.id));
  return [...new Set([...base, ...viaAlias, ...extra])];
}
export const aliasesOf = (l: Pick<TenantLicense, 'aliasIds'>) => db.aliases.filter((a) => (l.aliasIds ?? []).includes(a.id));
export function ruleText(l: Pick<TenantLicense, 'models'>): string {
  const s = l.models;
  if (s.mode === 'list') return 'Picked models';
  if (s.rule === 'budget') return `Up to ${fmtInt(s.maxOutCredits ?? 0)} credits per 1M output tokens`;
  if (s.rule === 'families') return `Families: ${(s.families ?? []).join(', ') || 'none'}`;
  return RULES.find((r) => r.id === s.rule)!.label;
}
