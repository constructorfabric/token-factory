<script setup lang="ts">
import { CAPABILITIES, MODALITIES, capLabel, profileOf } from '@/data/capabilities';
import type { Capability, Modality } from '@/data/types';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { servingAliasesOf } from '@/state/aliases';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoInput } from '@constructor/ui/input';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { IconPlus, IconSearch } from '@/components/icons';
import LifecycleTag from '@/components/ui/LifecycleTag.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { Model } from '@/data/types';
import { fmtContext, fmtPct, fmtCreditPrice } from '@/lib/format';
import { db } from '@/state/db';
import { connectedProviders } from '@/state/compute';
import AddByokModelDialog from '@/components/tenant/AddByokModelDialog.vue';

const router = useRouter();

const query = ref('');
const hosting = ref<'all' | 'open' | 'commercial'>('all');
const cap = ref<string>('');
const models = computed(() =>
  db.models.filter((m) => {
    if (m.ownerTenantId) return false;
    if (hosting.value === 'open' && m.hosting === 'commercial') return false;
    if (hosting.value === 'commercial' && m.hosting !== 'commercial') return false;
    if (cap.value.startsWith('in:') && !profileOf(m).input.includes(cap.value.slice(3) as Modality)) return false;
    if (cap.value && !cap.value.startsWith('in:') && !m.capabilities.includes(cap.value as Capability)) return false;
    const q = query.value.trim().toLowerCase();
    return !q || `${m.name} ${m.provider} ${m.family} ${m.hfId ?? ''}`.toLowerCase().includes(q);
  }),
);

const HOSTING: Record<Model['hosting'], string> = { commercial: 'Commercial API', 'self-hosted': 'Self-hosted', 'gpu-provider': 'Gcore', 'tenant-byok': 'Tenant key', 'tenant-own': 'Tenant deployment' };

// "Add model": from one of the instance's provider keys, or deployed on connected compute —
// the same flows as Providers → Model APIs and Providers → Compute.
const pickOpen = ref(false);
const rootKeys = computed(() => db.providerKeys.filter((k) => k.tenantId === 'root' && k.mode === 'byok'));
const modelsOn = (keyId: string) => db.models.filter((m) => m.providerKeyId === keyId).length;
const addOpen = ref(false);
const addKey = ref<string>();
function fromKey(keyId: string): void {
  pickOpen.value = false;
  addKey.value = keyId;
  addOpen.value = true;
}
function deployOn(providerId: string): void {
  pickOpen.value = false;
  void router.push(`/root/deployments/new?provider=${providerId}`);
}

const sMod = useSort(() => models.value, { name: (r) => r.name, family: (r) => r.family, hosting: (r) => r.hosting, context: (r) => r.context, price: (r) => r.priceOut, uptime: (r) => r.uptime30d, state: (r) => r.state });
</script>

<template>
  <div>
    <PageHeader title="Model catalog" description="Every model on this instance: models reached through provider keys and models deployed on your compute.">
      <template #actions>
        <GoButton size="m" @click="pickOpen = true">
          <template #icon><IconPlus /></template>
          Add model
        </GoButton>
      </template>
    </PageHeader>

    <div class="toolbar">
      <GoInput v-model="query" size="m" placeholder="Search name, family or Hugging Face ID" clearable class="search">
        <template #prefix><IconSearch /></template>
      </GoInput>
      <GoSelect v-model="cap" size="m" aria-label="Capability" class="cap-select">
        <GoSelectOption value="">Any capability</GoSelectOption>
        <GoSelectOption v-for="x in MODALITIES.filter((y) => y.id !== 'text')" :key="x.id" :value="`in:${x.id}`">Takes {{ x.label.toLowerCase() }}<template #description>Input type</template></GoSelectOption>
        <GoSelectOption v-for="c in CAPABILITIES" :key="c.id" :value="c.id">{{ c.label }}<template #description>{{ c.group }} · {{ c.hint }}</template></GoSelectOption>
      </GoSelect>
      <GoSegmentButtonGroup v-model="hosting" size="s" aria-label="Hosting">
        <GoSegmentButton value="all">All</GoSegmentButton>
        <GoSegmentButton value="open">Open-weight & Gcore</GoSegmentButton>
        <GoSegmentButton value="commercial">Commercial</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sMod" k="name">Model</SortHeader>
          <SortHeader :sort="sMod" k="family">Family</SortHeader>
          <SortHeader :sort="sMod" k="hosting">Hosting</SortHeader>
          <SortHeader :sort="sMod" k="context">Context</SortHeader>
          <SortHeader :sort="sMod" k="price">Credits per 1M, in / out</SortHeader>
          <SortHeader :sort="sMod" k="uptime">Uptime 30d</SortHeader>
          <SortHeader :sort="sMod" k="state">Model status</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="m in sMod.rows.value" :key="m.id" class="row-link" @click="router.push(`/root/models/${m.id}`)">
          <GoTableCell>
            <GoTableName :is="RouterLink" :to="`/root/models/${m.id}`">{{ m.name }}</GoTableName>
            <span class="sub">{{ m.hfId ?? m.provider }}<template v-if="m.modelLicense"> · {{ m.modelLicense }}</template></span>
            <span class="sub">{{ m.capabilities.map(capLabel).join(' · ') }}</span>
          </GoTableCell>
          <GoTableCell>
            {{ m.family }}
            <GoTag v-for="a in servingAliasesOf(m.id)" :key="a" size="s" color="blue">{{ a }}</GoTag>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ HOSTING[m.hosting] }}</span>
          </GoTableCell>
          <GoTableCell>{{ fmtContext(m.context) }}</GoTableCell>
          <GoTableCell>{{ fmtCreditPrice(m.priceIn) }} / {{ fmtCreditPrice(m.priceOut) }}</GoTableCell>
          <GoTableCell>{{ m.uptime30d ? fmtPct(m.uptime30d, 2) : '—' }}</GoTableCell>
          <GoTableCell><LifecycleTag :state="m.state" :ring="m.ring" /></GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>

    <GoDialog v-model="pickOpen" size="m">
      <GoDialogWindow title="Add a model" header-border @close="pickOpen = false">
        <h3 class="pick-group">Through a provider key</h3>
        <ul class="pick-list">
          <li v-for="k in rootKeys" :key="k.id">
            <button type="button" class="pick" :disabled="k.status === 'invalid'" @click="fromKey(k.id)">
              <span class="pick-name">{{ k.provider }}<span class="sub-inline"> · {{ k.label }}</span></span>
              <span class="sub">{{ k.endpoint }} · {{ modelsOn(k.id) }} {{ modelsOn(k.id) === 1 ? 'model' : 'models' }} added{{ k.status === 'invalid' ? ' · key not working' : '' }}</span>
            </button>
          </li>
          <li><RouterLink class="sub link" to="/root/providers?tab=apis" @click="pickOpen = false">Add a provider key</RouterLink></li>
        </ul>
        <h3 class="pick-group">Deployed on your compute</h3>
        <ul class="pick-list">
          <li v-for="p in connectedProviders()" :key="p.id">
            <button type="button" class="pick" @click="deployOn(p.id)">
              <span class="pick-name">{{ p.name }}<span class="sub-inline"> · {{ p.kind }}</span></span>
              <span class="sub">{{ p.regions.join(', ') }} · {{ p.gpus.map((g) => g.type.replace('NVIDIA ', '')).join(', ') }}</span>
            </button>
          </li>
          <li><RouterLink class="sub link" to="/root/providers" @click="pickOpen = false">Connect a compute provider</RouterLink></li>
        </ul>
      </GoDialogWindow>
    </GoDialog>
    <AddByokModelDialog v-model="addOpen" tenant-id="root" :key-id="addKey" />
  </div>
</template>

<style scoped>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .cap-select {
    min-inline-size: 200px;
    margin-inline-start: auto;
  }

  .search {
    max-inline-size: 360px;
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow-x: auto;
  }

  .row-link {
    cursor: pointer;

    &:hover {
      background: var(--acv-color-surface-secondary);
    }
  }

  .cell-main {
    display: block;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .pick-group {
    @mixin acv-text-ui-caption-1;
    margin: 0 0 var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-secondary);
    text-transform: uppercase;
  }

  .pick-list {
    display: grid;
    gap: var(--acv-spacing-small);
    margin: 0 0 var(--acv-spacing-large);
    padding: 0;
    list-style: none;
  }

  .pick {
    display: grid;
    gap: 2px;
    inline-size: 100%;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-primary);
    text-align: start;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: var(--acv-color-glyph-brand);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  .pick-name {
    @mixin acv-text-ui-body-2-medium;
    color: var(--acv-color-glyph-primary);
  }

  .sub-inline {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-tertiary);
  }

  .link {
    color: var(--acv-color-glyph-brand);
  }
</style>
