import { reactive } from 'vue';
import { db, licenseById } from '@/state/db';
import { rootAttention, tenantAttention, type AttentionItem } from '@/state/attention';

/**
 * In-app notifications for admins: what needs attention now (live, the same
 * items as the overview), license requests, support sessions, and older
 * events that are already resolved. Read state is kept for the session.
 */
export interface Notice extends Omit<AttentionItem, 'action' | 'to'> {
  at: string;
  /** Still needs acting on; resolved events stay as history. */
  live: boolean;
  action?: string;
  to?: string;
}

const NOW = '2026-11-10T08:00:00Z';
const read = reactive<Record<string, Set<string>>>({});
const readSet = (scope: string) => (read[scope] ??= new Set<string>());

// Older events: what happened, already handled.
const HISTORY: Record<string, Omit<Notice, 'live'>[]> = {
  't-acme': [
    { id: 'h-sync-partial', tone: 'warning', at: '2026-11-08T22:48:00Z', title: 'Constructor Platform sync skipped 1 user', text: 'No email address in the HR system. Fixed in the next sync.' },
    { id: 'h-azure-added', tone: 'info', at: '2026-11-05T10:12:00Z', title: 'Provider key acme-prod-weu added', text: 'Daniel Novak added an Azure OpenAI key and GPT-5.1 (Acme Azure OpenAI).', action: 'Open key', to: '/t/t-acme/keys' },
    { id: 'h-limit-li', tone: 'danger', at: '2026-11-03T15:30:00Z', title: 'Li Wei reached the weekly platform-credit limit', text: 'Requests were refused until Monday 00:00 UTC.' },
    { id: 'h-sonnet55', tone: 'info', at: '2026-11-01T09:00:00Z', title: 'Claude Sonnet 5.5 is in preview', text: 'Available to licenses that allow it; it replaces Claude Sonnet 4.5.', action: 'Open models', to: '/t/t-acme/models' },
    { id: 'h-seats', tone: 'warning', at: '2026-10-28T08:00:00Z', title: 'Seats at 85%', text: '1,190 of 1,400 seats taken. Since resolved by disabling 40 leavers.' },
  ],
  root: [
    { id: 'h-helix', tone: 'info', at: '2026-11-07T14:00:00Z', title: 'Helix Pharma created', text: 'Anna Keller was invited as tenant admin.', action: 'Open tenant', to: '/root/tenants/t-helix' },
    { id: 'h-glm47', tone: 'info', at: '2026-11-06T11:20:00Z', title: 'GLM-4.7 passed admission benchmarks', text: 'Ready to approve for the canary ring.', action: 'Open lifecycle', to: '/root/lifecycle' },
    { id: 'h-umbrella', tone: 'warning', at: '2026-11-04T09:45:00Z', title: 'Umbrella Health suspended', text: 'Contract ended; every key of the tenant is refused.' },
    { id: 'h-ams', tone: 'danger', at: '2026-11-02T03:10:00Z', title: 'Gcore GPU Cloud went offline for 18 minutes', text: 'Traffic failed over to Luxembourg. Back to degraded since 03:28.' },
    { id: 'h-backup', tone: 'info', at: '2026-11-01T02:05:00Z', title: 'Monthly restore test passed', text: 'The nightly backup was restored to staging in 14 minutes.' },
  ],
};

/** All notifications of an admin scope ('root' or a tenant id), newest first. */
export function noticesFor(scope: string): (Notice & { read: boolean })[] {
  const live: Notice[] = (scope === 'root' ? rootAttention() : tenantAttention(scope)).map((a) => ({ ...a, at: NOW, live: true }));
  const requests: Notice[] = scope === 'root' ? [] : db.licenseRequests.filter((r) => r.tenantId === scope).map((r) => {
    const u = db.users.find((x) => x.id === r.userId);
    const lic = licenseById(r.licenseId)?.name;
    return r.status === 'pending'
      ? { id: `req-${r.id}`, tone: 'info', at: r.at, live: true, title: `${u?.name} asks for ${lic}`, text: `“${r.reason}”`, action: 'Review', to: `/t/${scope}/approvals` }
      : { id: `req-${r.id}`, tone: r.status === 'approved' ? 'info' : 'warning', at: r.decidedAt ?? r.at, live: false, title: `${u?.name}’s request for ${lic} ${r.status}`, text: `By ${r.decidedBy}.${r.note ? ` “${r.note}”` : ''}` };
  });
  const support: Notice[] = scope === 'root' ? [] : db.audit.filter((e) => e.tenantId === scope && /Impersonation started/.test(e.action)).map((e) => ({ id: `sup-${e.id}`, tone: 'info', at: e.at, live: false, title: `Support session by ${e.actor}`, text: e.action.replace(/^Impersonation started\s*/, '').replace(/^\(|\)$/g, '') || 'No reason given.' }));
  const history: Notice[] = (HISTORY[scope] ?? []).map((h) => ({ ...h, live: false }));
  const seen = readSet(scope);
  return [...live, ...requests, ...support, ...history]
    .sort((a, b) => Number(b.live) - Number(a.live) || Date.parse(b.at) - Date.parse(a.at))
    .map((n) => ({ ...n, read: seen.has(n.id) }));
}

export const unreadCount = (scope: string) => noticesFor(scope).filter((n) => !n.read).length;
export const markRead = (scope: string, id: string) => readSet(scope).add(id);
export const markAllRead = (scope: string) => noticesFor(scope).forEach((n) => readSet(scope).add(n.id));
