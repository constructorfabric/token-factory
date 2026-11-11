<script setup lang="ts">
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoDialog, GoDialogConfirm, GoDialogWindow } from '@constructor/ui/dialog';
import { GoDropdownMenuDivider, GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconCopy, IconEllipsisVertical, IconPlus } from '@/components/icons';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatusTag from '@/components/ui/StatusTag.vue';
import type { ApiKey, LimitPeriod } from '@/data/types';
import { CREDITS_PER_USD, fmtAgo, fmtCredits, fmtDate } from '@/lib/format';
import { ownName } from '@/state/credits';
import { addApiKey, db, freshSecrets, modelById, record } from '@/state/db';
import { rolesOf } from '@/state/roles';
import { session } from '@/state/session';
import { useMe } from './useMe';

const router = useRouter();
const { notify } = useNotificationsStore();
const { user, seat } = useMe();
const BASE = 'https://tf.constructor.tech';

const keys = computed(() => db.apiKeys.filter((k) => k.userId === user.value?.id));
const PER: Record<LimitPeriod, string> = { daily: 'a day', weekly: 'a week', monthly: 'a month' };

// What the license allows, said once: a key without its own limit stops exactly here.
const licenseLimit = computed(() => {
  const l = seat.value.license;
  if (!l) return '';
  return `${fmtCredits(l.limits.daily.cost)} platform${l.keyLimits.daily ? ` · ${fmtCredits(l.keyLimits.daily)} ${ownName(user.value?.tenantId)}` : ''} a day`;
});

// ---- create: named for where it is used, short expiry, narrowest scope, optional own limit
const open = ref(false);
const form = reactive({ kind: 'models' as 'models' | 'management', scopes: ['usage:read'] as string[], name: '', expiry: '90', scope: 'all' as 'all' | 'some', models: [] as string[], limited: 'none' as 'none' | 'limit', credits: 1000, period: 'monthly' as LimitPeriod });
const created = ref<ApiKey | null>(null);

// ---- management keys: customer admins (and admins acting in a tenant) can automate Token Factory itself
const canManage = computed(() => (user.value ? rolesOf(user.value).includes('tenant-admin') : false) || session.current.value?.kind !== 'user');
const AREAS: { id: string; label: string; text: string; write: boolean }[] = [
  { id: 'users', label: 'Users and units', text: 'Invite, disable, assign licenses and roles', write: true },
  { id: 'licenses', label: 'Licenses and requests', text: 'Create and edit licenses, decide requests', write: true },
  { id: 'models', label: 'Models and provider keys', text: 'Enable models, add provider keys', write: true },
  { id: 'usage', label: 'Usage and reports', text: 'Read usage by user, unit, model and license', write: false },
  { id: 'audit', label: 'Audit log', text: 'Read every change and sign-in', write: false },
  { id: 'settings', label: 'Organization settings', text: 'Integrations, notifications, sign-in', write: true },
];
const levelOf = (area: string) => (form.scopes.includes(`${area}:write`) ? 'write' : form.scopes.includes(`${area}:read`) ? 'read' : 'none');
function setLevel(area: string, level: string): void {
  form.scopes = form.scopes.filter((x) => !x.startsWith(`${area}:`));
  if (level === 'read') form.scopes.push(`${area}:read`);
  if (level === 'write') form.scopes.push(`${area}:read`, `${area}:write`);
}
const scopeSummary = (k: ApiKey) => {
  const areas = AREAS.filter((a) => k.scopes?.some((x) => x.startsWith(`${a.id}:`)));
  return areas.map((a) => `${a.label}${k.scopes?.includes(`${a.id}:write`) ? ' (write)' : ''}`).join(', ');
};
const nextOpen = ref(false);

function create(): void {
  if (!user.value || !form.name) return;
  const expires = new Date('2026-11-06');
  expires.setDate(expires.getDate() + Number(form.expiry));
  const key = addApiKey({
    userId: user.value.id, name: form.name, models: form.kind === 'management' ? [] : form.scope === 'all' ? 'license' : [...form.models], kind: form.kind, scopes: form.kind === 'management' ? [...form.scopes] : undefined, expiresAt: expires.toISOString().slice(0, 10),
    limit: form.limited === 'limit' ? { cost: form.credits / CREDITS_PER_USD, period: form.period } : null,
  });
  freshSecrets[key.id] = `${key.prefix}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  record({ actor: user.value.name, actorRole: 'User', onBehalfOf: session.impersonating.value ? `impersonated by Victor Batraev` : undefined, action: 'Created API key', target: key.name, tenantId: user.value.tenantId });
  Object.assign(form, { kind: 'models', scopes: ['usage:read'], name: '', expiry: '90', scope: 'all', models: [], limited: 'none', credits: 1000, period: 'monthly' });
  open.value = false;
  created.value = key;
  nextOpen.value = true;
}

// ---- after create: copy once, then the ways to use it, the agent first
const secret = computed(() => (created.value ? freshSecrets[created.value.id] ?? '' : ''));
const MODEL_NEXT: { id: 'agent' | 'test' | 'code'; title: string; text: string; recommended?: boolean }[] = [
  { id: 'agent', title: 'Set up your coding agent', text: 'Claude Code or Codex CLI, with this key already filled in.', recommended: true },
  { id: 'test', title: 'Test it from a terminal', text: 'One request to check the key works.' },
  { id: 'code', title: 'Use it in your code', text: 'SDKs and the API reference in Documentation.' },
];
const MANAGE_NEXT: typeof MODEL_NEXT = [
  { id: 'test', title: 'Test it from a terminal', text: 'One read request within the key’s scopes.', recommended: true },
  { id: 'code', title: 'Read the management API reference', text: 'Endpoints for users, licenses, models, usage and audit, in Documentation.' },
];
const NEXT = computed(() => (created.value?.kind === 'management' ? MANAGE_NEXT : MODEL_NEXT));
const testSnippet = computed(() => created.value?.kind === 'management' ? [
  `export TF_ADMIN_KEY="${secret.value}"`,
  '',
  `curl ${BASE}/admin/v1/usage?period=30d \\`,
  '  -H "Authorization: Bearer $TF_ADMIN_KEY"',
].join('\n') : [
  `export TF_API_KEY="${secret.value}"`,
  '',
  `curl ${BASE}/v1/chat/completions \\`,
  '  -H "Authorization: Bearer $TF_API_KEY" \\',
  '  -H "Content-Type: application/json" \\',
  `  -d '{"model": "coding-default", "messages": [{"role": "user", "content": "Say hello"}]}'`,
].join('\n'));
const showTest = ref(false);

function copy(text: string): void {
  void navigator.clipboard?.writeText(text);
  notify('Copied to the clipboard.', 'success');
}
function next(id: 'agent' | 'test' | 'code'): void {
  if (id === 'test') {
    showTest.value = true;
    return;
  }
  closeNext();
  void router.push(id === 'agent' ? `/me/connect?key=${created.value?.id}` : '/me/docs');
}
function closeNext(): void {
  nextOpen.value = false;
  showTest.value = false;
}

// ---- revoke
const revoking = ref<ApiKey | null>(null);
const confirmOpen = ref(false);
function askRevoke(k: ApiKey): void {
  revoking.value = k;
  confirmOpen.value = true;
}
function revoke(): void {
  if (!revoking.value || !user.value) return;
  revoking.value.status = 'revoked';
  delete freshSecrets[revoking.value.id];
  record({ actor: user.value.name, actorRole: 'User', action: 'Revoked API key', target: revoking.value.name, tenantId: user.value.tenantId });
  notify(`${revoking.value.name} revoked. Requests with it are refused within a minute.`, 'success');
  confirmOpen.value = false;
}

const sAk = useSort(() => keys.value, { name: (r) => r.name, exp: (r) => r.expiresAt, used: (r) => r.lastUsed, quota: (r) => r.limit?.cost ?? Infinity, status: (r) => r.status });
</script>

<template>
  <div>
    <PageHeader title="API keys" description="Keys act as you, within your license.">
      <template #actions>
        <GoButton size="m" @click="open = true">
          <template #icon><IconPlus /></template>
          Create key
        </GoButton>
      </template>
    </PageHeader>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sAk" k="name">Name</SortHeader>
          <GoTableCell>Use</GoTableCell>
          <SortHeader :sort="sAk" k="exp">Expires</SortHeader>
          <SortHeader :sort="sAk" k="used">Last used</SortHeader>
          <SortHeader :sort="sAk" k="quota">Key limit</SortHeader>
          <SortHeader :sort="sAk" k="status">Status</SortHeader>
          <GoTableCell width="56" />
        </GoTableRow>
        <GoTableRow v-for="k in sAk.rows.value" :key="k.id">
          <GoTableCell>
            <GoTableName>{{ k.name }}</GoTableName>
            <code class="sub">{{ k.prefix }}…</code>
          </GoTableCell>
          <GoTableCell v-if="k.kind === 'management'"><span class="cell-main">Management API</span><span class="sub">{{ scopeSummary(k) }}</span></GoTableCell>
          <GoTableCell v-else><span class="cell-main">Models</span><span class="sub">{{ k.models === 'license' ? 'All in my license' : k.models.map((m) => modelById(m)?.name).join(', ') }}</span></GoTableCell>
          <GoTableCell>{{ k.expiresAt ? fmtDate(k.expiresAt) : 'Never' }}</GoTableCell>
          <GoTableCell>{{ k.lastUsed ? fmtAgo(k.lastUsed) : 'Not used yet' }}</GoTableCell>
          <GoTableCell>
            <template v-if="k.limit">{{ fmtCredits(k.limit.cost) }} {{ PER[k.limit.period] }}</template>
            <template v-else>No key limit<span class="sub">License limits apply</span></template>
          </GoTableCell>
          <GoTableCell><StatusTag :variant="k.status === 'active' ? 'success' : 'disabled'">{{ k.status }}</StatusTag></GoTableCell>
          <GoTableCell>
            <GoDropdownMenuPopover v-if="k.status === 'active'" :expand-icon="false" aria-label="Key actions" position="bottom-right">
              <template #icon><IconEllipsisVertical /></template>
              <GoDropdownMenuItem v-if="k.kind !== 'management'" @select="router.push(`/me/connect?key=${k.id}`)">Set up agent with this key</GoDropdownMenuItem>
              <GoDropdownMenuDivider />
              <GoDropdownMenuItem danger @select="askRevoke(k)">Revoke</GoDropdownMenuItem>
            </GoDropdownMenuPopover>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>

    <GoDialog v-model="open" size="m">
      <GoDialogWindow title="Create API key" header-border @close="open = false">
        <div class="fields">
          <GoFormControl label="Name" label-for="key-name" required hint="Where you will use it, so you recognize it later and revoke only that place if it leaks.">
            <GoInput id="key-name" v-model="form.name" size="m" placeholder="Claude Code · laptop" />
          </GoFormControl>
          <GoFormControl label="Expires in">
            <GoSelect v-model="form.expiry" size="m" aria-label="Expires in">
              <GoSelectOption value="30">30 days</GoSelectOption>
              <GoSelectOption value="90">90 days</GoSelectOption>
              <GoSelectOption value="180">180 days (maximum set by your administrator)</GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl v-if="canManage" label="What it is for">
            <GoSegmentButtonGroup v-model="form.kind" size="s" aria-label="What it is for" wide>
              <GoSegmentButton value="models">Model access</GoSegmentButton>
              <GoSegmentButton value="management">Management API</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <template v-if="form.kind === 'management'">
            <p class="hint">Automate Token Factory itself — sync users, rotate licenses, pull usage into your BI. The key calls no models.</p>
            <div class="scopes">
              <span class="sub">Area</span><span class="sub">Access</span>
              <template v-for="a in AREAS" :key="a.id">
                <span class="scope-name">{{ a.label }}<span class="sub">{{ a.text }}</span></span>
                <GoSegmentButtonGroup :model-value="levelOf(a.id)" size="s" :aria-label="`${a.label} access`" @update:model-value="(v: string) => setLevel(a.id, v)">
                  <GoSegmentButton value="none">None</GoSegmentButton>
                  <GoSegmentButton value="read">Read</GoSegmentButton>
                  <GoSegmentButton v-if="a.write" value="write">Read and write</GoSegmentButton>
                </GoSegmentButtonGroup>
              </template>
            </div>
            <p class="hint">{{ form.scopes.length ? `${AREAS.filter((a) => levelOf(a.id) !== 'none').length} of ${AREAS.length} areas.` : 'Give it at least one area.' }} It can never do more than you can.</p>
          </template>
          <template v-else>
          <GoFormControl label="Models">
            <GoSegmentButtonGroup v-model="form.scope" size="s" aria-label="Models" wide>
              <GoSegmentButton value="all">All models in my license</GoSegmentButton>
              <GoSegmentButton value="some">Choose models</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <p v-if="form.scope === 'all'" class="hint">Includes models added to your license later.</p>
          <div v-else class="model-picks">
            <GoCheckbox v-for="m in seat.license?.allowedModels" :key="m" v-model="form.models" :value="m">
              {{ modelById(m)?.name }}<span class="sub">{{ modelById(m)?.provider }}</span>
            </GoCheckbox>
            <p class="hint">{{ form.models.length ? `${form.models.length} selected.` : 'Pick at least one.' }} Calls to any other model are refused.</p>
          </div>
          <GoFormControl label="Key limit">
            <GoSegmentButtonGroup v-model="form.limited" size="s" aria-label="Key limit" wide>
              <GoSegmentButton value="none">No key limit</GoSegmentButton>
              <GoSegmentButton value="limit">Set a limit</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <p v-if="form.limited === 'none'" class="hint">The key can use everything your license allows: {{ licenseLimit }}.</p>
          <div v-else class="limit-row">
            <GoFormControl label="Credits" label-for="key-credits">
              <GoInputNumber id="key-credits" v-model="form.credits" :min="1" :step="500" size="m" />
            </GoFormControl>
            <GoFormControl label="Resets">
              <GoSelect v-model="form.period" size="m" aria-label="Resets">
                <GoSelectOption value="daily">Every day</GoSelectOption>
                <GoSelectOption value="weekly">Every week</GoSelectOption>
                <GoSelectOption value="monthly">Every month</GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <p class="hint span">Whichever is reached first stops the key: this limit or your license ({{ licenseLimit }}). Good for a CI bot or a shared script.</p>
          </div>
          </template>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!form.name || (form.kind === 'models' && form.scope === 'some' && !form.models.length) || (form.kind === 'management' && !form.scopes.length)" @click="create">Create key</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>

    <GoDialog v-model="nextOpen" size="m" @update:model-value="(v: boolean) => !v && closeNext()">
      <GoDialogWindow :title="`${created?.name} is ready`" header-border @close="closeNext">
        <div class="fields">
          <GoMessage variant="warning" rounded>
            Copy it now — it is shown only once
            <template #addition>Keep it in a password manager or an environment variable. Never commit it; if it leaks, revoke it here.</template>
          </GoMessage>
          <div class="secret-row">
            <code class="secret">{{ secret }}</code>
            <GoButton variant="secondary" size="s" @click="copy(secret)"><template #icon><IconCopy /></template>Copy</GoButton>
          </div>
          <h3 class="next-title">Next, use it</h3>
          <button v-for="n in NEXT" :key="n.id" type="button" class="next" :class="{ next_main: n.recommended }" @click="next(n.id)">
            <span class="next-name">{{ n.title }}<span v-if="n.recommended" class="badge">Recommended</span></span>
            <span class="sub">{{ n.text }}</span>
          </button>
          <div v-if="showTest" class="test">
            <div class="test-head">
              <span class="sub">Run this; a reply means the key works.</span>
              <GoButton variant="secondary" size="s" @click="copy(testSnippet)"><template #icon><IconCopy /></template>Copy</GoButton>
            </div>
            <pre class="code"><code>{{ testSnippet }}</code></pre>
          </div>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="closeNext">Done</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>

    <GoDialog v-model="confirmOpen" size="s">
      <GoDialogConfirm :title="`Revoke ${revoking?.name}?`" submit-text="Revoke" danger :submit="revoke" @cancel="confirmOpen = false">
        Tools using this key stop working within a minute.
      </GoDialogConfirm>
    </GoDialog>
  </div>
</template>

<style scoped>
  .secret {
    @mixin acv-text-ui-body-2;
    font-family: var(--acv-font-family-monospace, monospace);
    word-break: break-all;
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow: visible;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    margin: calc(-1 * var(--acv-spacing-small)) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .model-picks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-x-small) var(--acv-spacing-regular);

    & .hint {
      grid-column: 1 / -1;
      margin: 0;
    }
  }

  .scopes {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--acv-spacing-x-small) var(--acv-spacing-regular);
    align-items: center;
  }

  .scope-name {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-primary);
  }

  .cell-main {
    display: block;
  }

  .limit-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-small);

    & .hint {
      margin: 0;
    }

    & .span {
      grid-column: 1 / -1;
    }
  }

  .secret-row {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-small);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);

    & .secret {
      flex: 1;
    }
  }

  .next-title {
    @mixin acv-text-subheading-3;
    margin: 0;
  }

  .next {
    display: grid;
    gap: 2px;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-primary);
    text-align: start;
    cursor: pointer;

    &:hover {
      background: var(--acv-color-surface-secondary);
    }

    &.next_main {
      border-color: var(--acv-color-glyph-brand);
    }
  }

  .next-name {
    @mixin acv-text-ui-body-2-medium;
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-primary);
  }

  .badge {
    @mixin acv-text-ui-caption-1;
    padding: 0 6px;
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-secondary);
    color: var(--acv-color-glyph-brand);
  }

  .test {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .test-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .code {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    padding: var(--acv-spacing-small);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
    font-family: var(--acv-font-family-monospace, monospace);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
