<script setup lang="ts">
import ClassCostTable from '@/components/ui/ClassCostTable.vue';
import { TOKEN_CLASSES, costByClass, pricesOf } from '@/data/tokenClasses';
import { statsFor } from '@/data/modelStats';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogConfirm, GoDialogWindow } from '@constructor/ui/dialog';
import { GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoStatusTag } from '@constructor/ui/status-tag';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IconEllipsisVertical, IconKey, IconPlus } from '@/components/icons';
import AddByokModelDialog from '@/components/tenant/AddByokModelDialog.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { fmtCompact, fmtCreditPrice, fmtDate } from '@/lib/format';
import { ownCredits } from '@/state/credits';
import type { ProviderKey } from '@/data/types';
import { addProviderKey, db, record, tenantById } from '@/state/db';
import { session } from '@/state/session';

const route = useRoute();
const { notify } = useNotificationsStore();
// Also embedded in the root console (Providers › Model APIs) for the root tenant's own keys.
const props = defineProps<{ embeddedTenantId?: string }>();
const tenantId = props.embeddedTenantId ?? String(route.params.tenantId);
const isRoot = tenantId === 'root';
const keys = computed(() => db.providerKeys.filter((k) => k.tenantId === tenantId && k.mode === 'byok'));
const STATUS = { valid: 'success', expiring: 'warning', invalid: 'error' } as const;
// Each key owns the models added through it.
const modelsOf = (k: ProviderKey) => db.models.filter((m) => m.providerKeyId === k.id);
const modelCount = (k: ProviderKey) => modelsOf(k).length;

const addModelsOpen = ref(false);
const addModelsKey = ref<string>();
function addModels(k?: ProviderKey): void {
  addModelsKey.value = k?.id;
  addModelsOpen.value = true;
}

const open = ref(false);
const form = reactive({ provider: 'Anthropic', label: '', endpoint: '', secret: '' });
const ENDPOINTS: Record<string, string> = { Anthropic: 'api.anthropic.com', OpenAI: 'api.openai.com', 'Azure OpenAI': 'your-resource.openai.azure.com', 'AWS Bedrock': 'bedrock-runtime.eu-central-1.amazonaws.com', 'Google Vertex AI': 'europe-west4-aiplatform.googleapis.com', 'OpenAI-compatible endpoint': 'https://llm.internal.example/v1' };

function add(): void {
  if (!form.label || !form.secret) return;
  addProviderKey({ tenantId, provider: form.provider, label: form.label, mode: 'byok', endpoint: form.endpoint || ENDPOINTS[form.provider] || '', hint: `••••${form.secret.slice(-4)}`, addedBy: session.current.value?.person ?? '' });
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantById(tenantId)?.name : undefined, action: 'Added BYOK key', target: `${form.provider} (${form.label})`, tenantId });
  notify(`Key validated against ${form.provider}. Now pick the models to offer through it.`, 'success', 'Key added');
  Object.assign(form, { provider: 'Anthropic', label: '', endpoint: '', secret: '' });
  open.value = false;
  addModels(db.providerKeys[0]);
}

// ---- manage one key
const manageOpen = ref(false);
const managedId = ref('');
const managed = computed(() => db.providerKeys.find((k) => k.id === managedId.value));
const edit = reactive({ label: '', endpoint: '', secret: '' });
const testing = ref(false);
function openManage(k: ProviderKey): void {
  managedId.value = k.id;
  Object.assign(edit, { label: k.label, endpoint: k.endpoint, secret: '' });
  manageOpen.value = true;
}
const editChanged = computed(() => !!managed.value && (edit.label.trim() !== managed.value.label || edit.endpoint.trim() !== managed.value.endpoint || !!edit.secret));
function audit(action: string, k: ProviderKey): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantById(tenantId)?.name : undefined, action, target: `${k.provider} (${k.label})`, tenantId });
}
function saveKey(): void {
  const k = managed.value;
  if (!k || !edit.label.trim()) return;
  const rotated = !!edit.secret;
  Object.assign(k, { label: edit.label.trim(), endpoint: edit.endpoint.trim() || k.endpoint, ...(rotated ? { hint: `••••${edit.secret.slice(-4)}`, status: 'valid', addedAt: new Date().toISOString().slice(0, 10) } : {}) });
  audit(rotated ? 'Rotated BYOK key' : 'Edited BYOK key', k);
  notify(rotated ? `New secret validated against ${k.provider}. The old one stops being used now; revoke it at ${k.provider}.` : 'Saved.', 'success', rotated ? 'Key rotated' : 'Key saved');
  edit.secret = '';
}
function testKey(): void {
  const k = managed.value;
  if (!k) return;
  testing.value = true;
  setTimeout(() => {
    testing.value = false;
    notify(`${k.provider} accepted the key and listed ${modelsOf(k).length || 'its'} models.`, 'success', 'Key works');
  }, 700);
}
const removeOpen = ref(false);
function removeKey(): void {
  const k = managed.value;
  if (!k) return;
  for (const m of modelsOf(k)) m.state = 'retired';
  db.providerKeys.splice(db.providerKeys.indexOf(k), 1);
  audit('Removed BYOK key; its models retired', k);
  notify(`${k.label} removed. Its models stopped answering and left every license.`, 'success', 'Key removed');
  removeOpen.value = false;
  manageOpen.value = false;
}
// Mock usage per key, last 30 days.
// Last 30 days through a key: its models' tokens, split by class and priced per class.
const classesOf = (k: ProviderKey) => {
  const rows = TOKEN_CLASSES.map((c) => ({ ...c, millions: 0, creditsPer1M: 0, credits: 0 }));
  for (const m of modelsOf(k)) {
    const st = statsFor(m);
    costByClass(m, st.tokensIn30d / 20, st.tokensOut30d / 20, st.cacheHit).forEach((r, i) => {
      rows[i]!.millions += r.millions;
      rows[i]!.credits += r.credits;
      rows[i]!.creditsPer1M = Math.max(rows[i]!.creditsPer1M, r.creditsPer1M);
    });
  }
  return rows;
};
const usageOf = (k: ProviderKey) => ({ requests: modelsOf(k).reduce((s, m) => s + Math.round(statsFor(m).requests30d / 20), 0), credits: classesOf(k).reduce((s, r) => s + r.credits, 0) });

const sKey = useSort(() => keys.value, { provider: (r) => r.provider, models: (r) => modelCount(r), endpoint: (r) => r.endpoint, status: (r) => r.status, added: (r) => r.addedAt });
</script>

<template>
  <div>
    <PageHeader
      v-if="!embeddedTenantId"
      title="Provider keys"
      description="Your own provider contracts (BYOK). Add a key, then pick the models to offer through it; licenses and limits still apply."
    >
      <template #actions>
        <GoButton size="m" @click="open = true">
          <template #icon><IconPlus /></template>
          Add key
        </GoButton>
      </template>
    </PageHeader>
    <div v-else class="embedded-head">
      <span class="sub">Your contracts with model providers. Add a key, then pick the models to offer through it; they join the catalog and its lifecycle.</span>
      <GoButton size="m" @click="open = true"><template #icon><IconPlus /></template>Add key</GoButton>
    </div>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sKey" k="provider">Provider</SortHeader>
          <SortHeader :sort="sKey" k="models">Models</SortHeader>
          <SortHeader :sort="sKey" k="endpoint">Endpoint</SortHeader>
          <GoTableCell>Key</GoTableCell>
          <SortHeader :sort="sKey" k="status">Status</SortHeader>
          <SortHeader :sort="sKey" k="added">Added</SortHeader>
          <GoTableCell width="56" />
        </GoTableRow>
        <GoTableRow v-for="k in sKey.rows.value" :key="k.id">
          <GoTableCell>
            <GoTableName :is="'button'" class="name-link" @click="openManage(k)">{{ k.provider }}</GoTableName>
            <span class="sub">{{ k.label }}</span>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ modelsOf(k).length || 'None yet' }}</span>
              <RouterLink v-for="m in modelsOf(k)" :key="m.id" :to="isRoot ? `/root/models/${m.id}` : `/t/${tenantId}/models?tab=own`" class="sub link">{{ m.name }}</RouterLink>
              <a v-if="!modelsOf(k).length" href="#" class="sub link" @click.prevent="addModels(k)">Add models</a>
          </GoTableCell>
          <GoTableCell><code class="mono">{{ k.endpoint }}</code></GoTableCell>
          <GoTableCell><code class="mono">{{ k.hint }}</code></GoTableCell>
          <GoTableCell><GoStatusTag :variant="STATUS[k.status]" size="sm">{{ k.status === 'expiring' ? 'expires in 9 days' : k.status }}</GoStatusTag></GoTableCell>
          <GoTableCell>{{ fmtDate(k.addedAt) }} · {{ k.addedBy }}</GoTableCell>
          <GoTableCell>
            <GoDropdownMenuPopover :expand-icon="false" aria-label="Key actions" position="bottom-right">
              <template #icon><IconEllipsisVertical /></template>
              <GoDropdownMenuItem @select="openManage(k)">Manage key</GoDropdownMenuItem>
              <GoDropdownMenuItem :disabled="k.status === 'invalid'" @select="addModels(k)">
                <template #icon><IconPlus /></template>
                Add models
              </GoDropdownMenuItem>
            </GoDropdownMenuPopover>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>

    <AddByokModelDialog v-model="addModelsOpen" :tenant-id="tenantId" :key-id="addModelsKey" />

    <GoDialog v-model="manageOpen" size="l">
      <GoDialogWindow v-if="managed" :title="`${managed.provider} · ${managed.label}`" header-border @close="manageOpen = false">
        <div class="manage">
          <div class="facts">
            <div><span class="fact-label">Status</span><GoStatusTag :variant="STATUS[managed.status]" size="sm">{{ managed.status === 'expiring' ? 'expires in 9 days' : managed.status }}</GoStatusTag></div>
            <div><span class="fact-label">Secret</span><code class="mono">{{ managed.hint }}</code></div>
            <div><span class="fact-label">Added</span>{{ fmtDate(managed.addedAt) }} · {{ managed.addedBy }}</div>
            <div><span class="fact-label">Last 30 days</span>{{ fmtCompact(usageOf(managed).requests) }} requests · {{ fmtCompact(usageOf(managed).credits) }} {{ isRoot ? 'platform credits' : ownCredits(tenantId) }}</div>
          </div>

          <h3 class="block-title">Settings</h3>
          <div class="fields">
            <div class="two">
              <GoFormControl label="Label" label-for="mk-label"><GoInput id="mk-label" v-model="edit.label" size="m" /></GoFormControl>
              <GoFormControl label="Endpoint" label-for="mk-endpoint"><GoInput id="mk-endpoint" v-model="edit.endpoint" size="m" /></GoFormControl>
            </div>
            <GoFormControl label="Rotate the secret" label-for="mk-secret" optional :hint="`Paste a new key from ${managed.provider}; it is validated before it replaces ${managed.hint}.`">
              <GoInput id="mk-secret" v-model="edit.secret" type="password" size="m" placeholder="New API key" />
            </GoFormControl>
            <p class="sub">The provider can't be changed; add a new key for another provider.</p>
          </div>

          <h3 class="block-title">Usage by token class, last 30 days</h3>
          <ClassCostTable v-if="modelsOf(managed).length" :rows="classesOf(managed)" :unit="isRoot ? 'platform credits' : ownCredits(tenantId)" />
          <p class="sub">Cached input is billed at the cached price; cache writes only where {{ managed.provider }} charges for them.</p>

          <h3 class="block-title">Models through this key</h3>
          <GoTable size="sm">
            <GoTableRow header>
              <GoTableCell>Model</GoTableCell>
              <GoTableCell>Credits per 1M: input · cached · cache write · output</GoTableCell>
            </GoTableRow>
            <GoTableRow v-for="m in modelsOf(managed)" :key="m.id">
              <GoTableCell><RouterLink :to="isRoot ? `/root/models/${m.id}` : `/t/${tenantId}/models?tab=own`" class="link">{{ m.name }}</RouterLink></GoTableCell>
              <GoTableCell>{{ fmtCreditPrice(pricesOf(m).in) }} · {{ fmtCreditPrice(pricesOf(m).cachedIn) }} · {{ fmtCreditPrice(pricesOf(m).cacheWrite) }} · {{ fmtCreditPrice(pricesOf(m).out) }}</GoTableCell>
            </GoTableRow>
            <GoTableRow v-if="!modelsOf(managed).length"><GoTableCell><span class="sub">No models yet.</span></GoTableCell></GoTableRow>
          </GoTable>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="danger" size="m" @click="removeOpen = true">Remove key</GoButton>
            <span class="spacer" />
            <GoButton variant="secondary" size="m" @click="addModels(managed); manageOpen = false">Add models</GoButton>
            <GoButton variant="secondary" size="m" :loading="testing" @click="testKey">Test key</GoButton>
            <GoButton size="m" :disabled="!editChanged || !edit.label.trim()" @click="saveKey">Save changes</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>

    <GoDialog v-model="removeOpen" size="s">
      <GoDialogConfirm v-if="managed" :title="`Remove ${managed.label}?`" submit-text="Remove" danger :submit="removeKey" @cancel="removeOpen = false">
        {{ modelsOf(managed).length ? `${modelsOf(managed).map((m) => m.name).join(', ')} stop answering and leave every license.` : 'No models use it.' }} Revoke the key at {{ managed.provider }} too.
      </GoDialogConfirm>
    </GoDialog>

    <GoDialog v-model="open" size="m">
      <GoDialogWindow title="Add a provider key" header-border @close="open = false">
        <template #titleIcon><IconKey /></template>
        <div class="fields">
          <GoFormControl label="Provider">
            <GoSelect v-model="form.provider" size="m" aria-label="Provider">
              <GoSelectOption v-for="(_, p) in ENDPOINTS" :key="p" :value="p">{{ p }}</GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl label="Label" label-for="pk-label" required hint="How your administrators will recognize this key.">
            <GoInput id="pk-label" v-model="form.label" size="m" placeholder="acme-prod-weu" />
          </GoFormControl>
          <GoFormControl label="Endpoint" label-for="pk-endpoint" optional>
            <GoInput id="pk-endpoint" v-model="form.endpoint" size="m" :placeholder="ENDPOINTS[form.provider]" />
          </GoFormControl>
          <GoFormControl label="API key" label-for="pk-secret" required>
            <GoInput id="pk-secret" v-model="form.secret" type="password" size="m" placeholder="sk-…" />
          </GoFormControl>
          <GoMessage variant="info" rounded>
            The key is validated with one test call, then stored encrypted
            <template #addition>Spend on this key is billed by the provider to you; Token Factory still meters it so licenses and reports stay complete.</template>
          </GoMessage>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!form.label || !form.secret" @click="add">Validate and add</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
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

  .cell-main {
    display: block;
  }

  .link {
    color: var(--acv-color-glyph-brand);
  }

  .embedded-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .name-link {
    border: 0;
    padding: 0;
    background: none;
    cursor: pointer;
    text-align: start;
  }

  .manage {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);

    & > div {
      display: grid;
      gap: 2px;
    }
  }

  .fact-label {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .block-title {
    @mixin acv-text-subheading-3;
    margin: 0;
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .spacer {
    flex: 1;
  }

  .mono {
    @mixin acv-text-ui-caption-1;
    font-family: var(--acv-font-family-monospace, monospace);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
