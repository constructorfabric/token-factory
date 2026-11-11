import { tenantKeyShare } from '@/data/mock';
import { fmtCredits, fmtDate, fmtInt } from '@/lib/format';
import { db, nearLimit, tenantById } from '@/state/db';
import { activePeopleSource } from '@/state/integrations';
import { latestRelease, pendingReleases, updateAvailable } from '@/state/instance';

/**
 * What an admin should act on right now. The overview shows these as
 * "Needs attention" and the notification inbox keeps them, with older events.
 */
export interface AttentionItem { id: string; tone: 'danger' | 'warning' | 'info'; title: string; text: string; action: string; to: string }

// Mock: today is 10 November; month-to-date figures scale the last 30 days.
const DAY = 10;
const DAYS = 30;
const forecast = (soFar: number) => (soFar * DAYS) / DAY;

export function tenantAttention(tenantId: string): AttentionItem[] {
  const tenant = tenantById(tenantId);
  if (!tenant) return [];
  const base = `/t/${tenantId}`;
  const out: AttentionItem[] = [];
  if (tenant.setupDone === false) out.push({ id: 'setup', tone: 'warning', title: 'Finish setting up your organization', text: 'Connect users, add models, create licenses and set default licenses.', action: 'Continue setup', to: `${base}/setup` });
  const hits = nearLimit(tenantId);
  if (hits.length) {
    const over = hits.filter((h) => h.pct >= 100).length;
    out.push({ id: 'limits', tone: over ? 'danger' : 'warning', title: `${hits.length} ${hits.length === 1 ? 'user is' : 'users are'} near a weekly limit`, text: `${over ? `${over} already over. ` : ''}${hits.slice(0, 3).map((h) => h.user.name).join(', ')}${hits.length > 3 ? ' and others' : ''}.`, action: 'Review', to: `${base}/reports` });
  }
  for (const k of db.providerKeys.filter((x) => x.tenantId === tenantId && x.mode === 'byok' && x.status !== 'valid')) {
    out.push({ id: k.id, tone: k.status === 'invalid' ? 'danger' : 'warning', title: `${k.provider} key ${k.label} ${k.status === 'invalid' ? 'stopped working' : 'expires in 9 days'}`, text: `Models on it stop answering when it ${k.status === 'invalid' ? 'fails' : 'expires'}. Rotate it at ${k.provider}, then update it here.`, action: 'Open key', to: `${base}/keys` });
  }
  const waiting = db.models.filter((m) => m.ownerTenantId === tenantId && m.state === 'discovered');
  if (waiting.length) out.push({ id: 'models', tone: 'info', title: `${waiting.length} ${waiting.length === 1 ? 'model' : 'models'} from your keys not enabled yet`, text: `${waiting.map((m) => m.name).join(', ')}. Enable and add to a license to let users use ${waiting.length === 1 ? 'it' : 'them'}.`, action: 'Open models', to: `${base}/models?tab=own` });
  const licenses = db.licenses.filter((l) => l.tenantId === tenantId);
  for (const m of db.models.filter((x) => x.state === 'deprecated' && x.retiresOn)) {
    const inUse = licenses.filter((l) => l.allowedModels.includes(m.id));
    if (inUse.length) out.push({ id: m.id, tone: 'warning', title: `${m.name} retires ${fmtDate(m.retiresOn!)}`, text: `Still allowed in ${inUse.map((l) => l.name).join(', ')}. Move users to a newer model before then.`, action: 'Open licenses', to: `${base}/licenses` });
  }
  const source = activePeopleSource(tenantId);
  const last = source?.history[0];
  if (source && (source.status === 'paused' || (last && last.result === 'failed'))) out.push({ id: 'sync', tone: 'danger', title: `${source.name} ${source.status === 'paused' ? 'is paused' : 'sync failed'}`, text: 'Users and units are not updated until it runs again.', action: 'Open integration', to: `${base}/settings?section=integrations` });
  const holders = licenses.reduce((s, l) => s + l.holders, 0);
  if (tenant.seats && holders / tenant.seats >= 0.9) out.push({ id: 'seats', tone: 'warning', title: 'Seats almost used up', text: `${fmtInt(holders)} of ${fmtInt(tenant.seats)} taken.`, action: 'Request seats', to: `${base}/settings?section=license` });
  const platformSoFar = (tenant.spend30d * (1 - (tenantKeyShare[tenantId] ?? 0)) * DAY) / DAYS;
  if (tenant.budget30d && forecast(platformSoFar) / tenant.budget30d >= 0.9) out.push({ id: 'credits', tone: 'warning', title: 'Platform credits may run out this month', text: `Heading for ${fmtCredits(forecast(platformSoFar))} of ${fmtCredits(tenant.budget30d)}.`, action: 'Open license', to: `${base}/settings?section=license` });
  return out;
}

export function rootAttention(): AttentionItem[] {
  const out: AttentionItem[] = [];
  if (updateAvailable()) {
    const rel = latestRelease();
    const security = pendingReleases().some((r) => r.kind === 'security');
    out.push({ id: `update-${rel.version}`, tone: security ? 'warning' : 'info', title: `Token Factory ${rel.version} is available`, text: `${rel.summary}.${security ? ' Includes a security fix.' : ''}`, action: 'Open updates', to: '/root/settings?section=updates' });
  }
  const tenants = db.tenants.filter((t) => t.tier !== 'root');
  const platformOf = (t: (typeof tenants)[number]) => (t.spend30d * (1 - (tenantKeyShare[t.id] ?? (t.byok ? 0.25 : 0))) * DAY) / DAYS;
  for (const t of tenants.filter((x) => x.budget30d && forecast(platformOf(x)) / x.budget30d >= 0.9)) {
    out.push({ id: `budget-${t.id}`, tone: forecast(platformOf(t)) > t.budget30d ? 'danger' : 'warning', title: `${t.name} will run out of platform credits`, text: `Heading for ${fmtCredits(forecast(platformOf(t)))} of ${fmtCredits(t.budget30d)} this month.`, action: 'Open tenant', to: `/root/tenants/${t.id}` });
  }
  for (const t of tenants.filter((x) => x.setupDone === false)) {
    out.push({ id: `setup-${t.id}`, tone: 'info', title: `${t.name} is not set up yet`, text: `Waiting for ${t.admin} to finish the setup wizard.`, action: 'Open tenant', to: `/root/tenants/${t.id}` });
  }
  const decide = db.models.filter((m) => ['discovered', 'verifying', 'failed', 'verified'].includes(m.state));
  if (decide.length) out.push({ id: 'admission', tone: 'warning', title: `${decide.length} ${decide.length === 1 ? 'model waits' : 'models wait'} for an admission decision`, text: `${decide.slice(0, 3).map((m) => m.name).join(', ')}${decide.length > 3 ? ' and others' : ''}.`, action: 'Open lifecycle', to: '/root/lifecycle' });
  for (const m of db.models.filter((x) => x.state === 'deprecated' && x.retiresOn)) {
    const using = tenants.filter((t) => db.licenses.some((l) => l.tenantId === t.id && l.allowedModels.includes(m.id)));
    out.push({ id: m.id, tone: 'warning', title: `${m.name} retires ${fmtDate(m.retiresOn!)}`, text: using.length ? `Still in licenses of ${using.map((t) => t.name).join(', ')}.` : 'No tenant uses it any more.', action: 'Open lifecycle', to: '/root/lifecycle' });
  }
  for (const c of db.clusters.filter((x) => x.status === 'degraded')) {
    out.push({ id: c.id, tone: 'danger', title: `${c.name} is degraded`, text: `${c.location}. Deployments on it may answer slowly or fail over.`, action: 'Open deployments', to: '/root/deployments' });
  }
  return out;
}
