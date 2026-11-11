import type { Id, LifecycleState, Model } from '@/data/types';
import { fmtDate } from '@/lib/format';
import { db, modelById, record } from '@/state/db';
import { enabledRings, type RingId } from '@/state/rollout';
import { missingCaps } from '@/data/capabilities';

/**
 * The moves a model can make between lifecycle stages, and what each one
 * checks and changes. The Lifecycle board and the model page offer the same
 * moves; admission (discovered → verifying → verified or failed) runs by
 * itself and has no manual move, except retrying a failed one.
 */
export interface Move {
  id: 'retry' | 'approve' | 'reject' | 'start' | 'next' | 'rollback' | 'ga' | 'deprecate' | 'undeprecate' | 'retire';
  label: string;
  hint: string;
  to: LifecycleState;
  ring?: RingId;
  /** Why the move cannot be made now; the move is shown, disabled. */
  blocked?: string;
  danger?: boolean;
}

const TODAY = '2026-11-11';
const admissionPassed = (m: Model) => !m.admission || Object.values(m.admission).every((s) => s?.status === 'passed' || s?.status === 'skipped');
/** GPUs a self-hosted model still lacks to serve (FR-C14). */
export function gpuShortfall(m: Model): number {
  if (!m.gpusRequired || m.hosting === 'commercial') return 0;
  const free = db.clusters.filter((c) => c.status !== 'offline' && c.kind === 'on-prem').reduce((s, c) => s + c.gpus - c.gpusUsed, 0);
  return Math.max(0, m.gpusRequired - free);
}
const ringsFor = (m: Model) => enabledRings(m.ownerTenantId ?? 'root');
/** Aliases where the model waits as the candidate: its rollout moves their traffic share. */
const candidateOf = (m: Model) => db.aliases.filter((a) => a.candidate === m.id);

export function movesFor(m: Model): Move[] {
  const rings = ringsFor(m);
  switch (m.state) {
    case 'failed':
      return [{ id: 'retry', label: 'Retry admission', hint: 'Runs again from the failed stage', to: 'verifying' }];
    case 'verified':
      return [
        { id: 'approve', label: 'Approve', hint: 'Ready to roll out', to: 'approved', blocked: admissionPassed(m) ? undefined : 'Admission has not passed every stage' },
        { id: 'reject', label: 'Reject', hint: 'Back to failed; it serves no one', to: 'failed', danger: true },
      ];
    case 'approved': {
      const first = rings[0];
      const short = gpuShortfall(m);
      const blocked = !first ? 'Enable a ring under Settings → Model rollout' : short ? `Needs ${m.gpusRequired} GPUs; ${short} more must be freed first` : undefined;
      return [{ id: 'start', label: first ? `Start rollout: ${first.name} (${first.share}%)` : 'Start rollout', hint: first ? `${first.share}% of the traffic the model is waiting for; soaks ${first.soakDays} days` : 'No ring is enabled', to: 'rolling-out', ring: first?.id, blocked }];
    }
    case 'rolling-out': {
      const i = rings.findIndex((r) => r.id === m.ring);
      const next = rings[i + 1];
      const out: Move[] = [];
      if (next) out.push({ id: 'next', label: `Next ring: ${next.name} (${next.share}%)`, hint: `${next.share}% of the traffic${next.soakDays ? `; soaks ${next.soakDays} days` : ''}`, to: 'rolling-out', ring: next.id });
      else {
        const short = candidateOf(m).map((a) => ({ a, miss: missingCaps(m, a.requiredCapabilities) })).find((x) => x.miss.length);
        out.push({ id: 'ga', label: 'Make generally available', hint: 'Serves everyone its licenses allow; aliases waiting on it switch to it', to: 'ga', blocked: short ? `${short.a.name} needs ${short.miss.join(', ')}, which it lacks` : undefined });
      }
      out.push({ id: 'rollback', label: 'Roll back', hint: 'Traffic returns to the current model; back to approved', to: 'approved', danger: true });
      return out;
    }
    case 'ga':
      return [{ id: 'deprecate', label: 'Deprecate…', hint: 'Set a retire date and a replacement; users are told', to: 'deprecated', danger: true }];
    case 'deprecated': {
      const early = !!m.retiresOn && m.retiresOn > TODAY;
      return [
        { id: 'retire', label: early ? `Retire now (planned ${fmtDate(m.retiresOn!)})` : 'Retire', hint: 'Requests naming it get 404 with the model to use instead', to: 'retired', danger: true },
        { id: 'undeprecate', label: 'Cancel deprecation', hint: 'Back to generally available', to: 'ga' },
      ];
    }
    default:
      return [];
  }
}

export function applyMove(m: Model, move: Move, opts: { retiresOn?: string; replacementId?: Id } = {}): string {
  const rings = ringsFor(m);
  const share = (id?: RingId) => rings.find((r) => r.id === id)?.share ?? 0;
  let message = '';
  switch (move.id) {
    case 'retry':
      m.state = 'verifying';
      Object.values(m.admission ?? {}).forEach((s) => s && s.status === 'failed' && (s.status = 'running'));
      message = 'Admission restarted from the failed stage.';
      break;
    case 'approve':
      m.state = 'approved';
      message = 'Approved. Start the rollout when you are ready.';
      break;
    case 'reject':
      m.state = 'failed';
      message = 'Rejected. It stays in the catalog, serving no one.';
      break;
    case 'start':
    case 'next':
      m.state = 'rolling-out';
      m.ring = move.ring;
      candidateOf(m).forEach((a) => (a.candidateShare = share(move.ring)));
      message = `${rings.find((r) => r.id === move.ring)?.name}: ${share(move.ring)}% of the traffic it is waiting for now goes to it.`;
      break;
    case 'rollback':
      m.state = 'approved';
      m.ring = undefined;
      candidateOf(m).forEach((a) => (a.candidateShare = 0));
      message = 'Rolled back. All traffic is on the current model again, within a minute.';
      break;
    case 'ga':
      m.state = 'ga';
      m.ring = undefined;
      candidateOf(m).forEach((a) => {
        a.primary = m.id;
        a.candidate = undefined;
        a.candidateShare = undefined;
      });
      message = 'Generally available. Aliases waiting on it now point at it.';
      break;
    case 'deprecate':
      m.state = 'deprecated';
      m.retiresOn = opts.retiresOn;
      m.replacementId = opts.replacementId;
      message = `Deprecated. Retires ${fmtDate(opts.retiresOn ?? TODAY)}${opts.replacementId ? `; ${modelById(opts.replacementId)?.name} replaces it` : ''}. Tenant admins are notified.`;
      break;
    case 'undeprecate':
      m.state = 'ga';
      m.retiresOn = undefined;
      m.replacementId = undefined;
      message = 'Deprecation cancelled. Tenant admins are told it stays.';
      break;
    case 'retire':
      m.state = 'retired';
      message = 'Retired. Requests naming it get 404 with the model to use instead.';
      break;
  }
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `${move.label.replace('…', '')}: ${m.name}`, target: m.name, tenantId: m.ownerTenantId ?? 'root' });
  return message;
}
