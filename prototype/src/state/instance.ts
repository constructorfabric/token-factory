import { reactive } from 'vue';

/**
 * The Token Factory release installed on this instance, and what the project
 * has published since. Updating is the root admin's decision.
 */
export interface Release {
  version: string;
  date: string;
  kind: 'feature' | 'security' | 'fix';
  summary: string;
  notes: string[];
}

export const RELEASES: Release[] = [
  {
    version: '1.2.0', date: '2026-11-06', kind: 'feature', summary: 'Management API keys, BYOK billing deep dive and faster MoE serving',
    notes: [
      'Management API keys with scopes per area, for automating users, licenses and reports',
      'BYOK billing by token type, model and tenant',
      'SGLang 0.5 for mixture-of-experts models: about 30% more throughput on DeepSeek and Qwen3',
      'Notifications inbox for admins, with search',
      'Fixes the quota reset for weekly limits across time zones',
    ],
  },
  {
    version: '1.1.1', date: '2026-10-21', kind: 'security', summary: 'Security fix for the gateway’s token validation',
    notes: ['Rejects API keys whose hash prefix collides with a revoked key (CVE-2026-41877)', 'Updates the bundled vLLM to 0.11.3'],
  },
  {
    version: '1.1.0', date: '2026-10-02', kind: 'feature', summary: 'Two credit types and organization sync',
    notes: ['Platform and own credits, with separate limits per license', 'User sync from Constructor Platform, BambooHR and SCIM providers', 'License requests and approvals'],
  },
];

export const instance = reactive({ version: '1.0.0', installedAt: '2026-09-15', channel: 'stable' as 'stable' | 'preview', updating: false, lastCheck: '2026-11-10T06:00:00Z' });

export const latestRelease = () => RELEASES[0]!;
/** Releases newer than the installed one, newest first. */
export const pendingReleases = () => RELEASES.filter((r) => newer(r.version, instance.version));
export const updateAvailable = () => newer(latestRelease().version, instance.version);

function newer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return false;
}

export const RELEASE_NOTES = 'https://github.com/constructorfabric/token-factory/releases';
