<script setup lang="ts">
import { servingAliasesOf } from '@/state/aliases';
import { ownCredits } from '@/state/credits';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, reactive, ref, watchEffect } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IconPlus } from '@/components/icons';
import AddByokModelDialog from '@/components/tenant/AddByokModelDialog.vue';
import CustomerLifecycleTag from '@/components/ui/CustomerLifecycleTag.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { Model } from '@/data/types';
import { fmtContext, fmtCreditPrice } from '@/lib/format';
import { db, record, tenantById } from '@/state/db';
import { session } from '@/state/session';

const route = useRoute();
const tenantId = String(route.params.tenantId);
const tenantName = tenantById(tenantId)?.name ?? '';

const tab = ref<'platform' | 'own'>(route.query.tab === 'own' ? 'own' : 'platform');
// What the platform offers this tenant, and which of them the tenant switched on.
const enabled = reactive<Record<string, boolean>>({});
const platform = computed(() => db.models.filter((m) => !m.ownerTenantId && ['ga', 'rolling-out', 'deprecated'].includes(m.state)));
for (const m of platform.value) enabled[m.id] = !['m-mistral-l3', 'm-deepseek-v32'].includes(m.id);
const own = computed(() => db.models.filter((m) => m.ownerTenantId === tenantId));
// Own models start switched off until an administrator enables them; existing ones are on.
watchEffect(() => {
  for (const m of own.value) enabled[m.id] ??= m.state !== 'discovered';
});

function toggle(m: Model): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantName : undefined, action: `${enabled[m.id] ? 'Enabled' : 'Disabled'} model ${m.name} for the tenant`, target: m.name, tenantId });
}

// Own models come through the tenant's provider keys (BYOK).
const open = ref(false);
const keyOf = (m: Model) => db.providerKeys.find((k) => k.id === m.providerKeyId);

const sTm = useSort(() => tab.value === 'platform' ? platform.value : own.value, { name: (r) => r.name, context: (r) => r.context, price: (r) => r.priceOut, state: (r) => r.state });
</script>

<template>
  <div>
    <PageHeader title="Models" description="Platform models enabled for this organization, and models reached through your own provider keys.">
      <template #actions>
        <GoButton size="m" @click="open = true">
          <template #icon><IconPlus /></template>
          Add models from your key
        </GoButton>
      </template>
    </PageHeader>

    <GoSegmentButtonGroup v-model="tab" size="s" aria-label="Model source" class="tabs">
      <GoSegmentButton value="platform">From the platform ({{ platform.length }})</GoSegmentButton>
      <GoSegmentButton value="own">Your own ({{ own.length }})</GoSegmentButton>
    </GoSegmentButtonGroup>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sTm" k="name">Model</SortHeader>
          <SortHeader :sort="sTm" k="context">Context</SortHeader>
          <SortHeader :sort="sTm" k="price">Credits per 1M, in / out</SortHeader>
          <SortHeader v-if="tab === 'platform'" :sort="sTm" k="state">Lifecycle</SortHeader>
          <GoTableCell width="120">Enabled</GoTableCell>
        </GoTableRow>
        <GoTableRow v-for="m in sTm.rows.value" :key="m.id">
          <GoTableCell>
            <GoTableName>{{ m.name }}</GoTableName>
            <span class="sub">{{ m.provider }}<template v-if="servingAliasesOf(m.id).length"> · alias {{ servingAliasesOf(m.id).join(', ') }}</template></span>
            <RouterLink v-if="keyOf(m)" :to="`/t/${tenantId}/keys`" class="sub link">Key {{ keyOf(m)?.label }}</RouterLink>
          </GoTableCell>
          <GoTableCell>{{ fmtContext(m.context) }}</GoTableCell>
          <GoTableCell>{{ fmtCreditPrice(m.priceIn) }} / {{ fmtCreditPrice(m.priceOut) }}<span class="sub">{{ m.ownerTenantId ? ownCredits(tenantId) : 'Platform credits' }}</span></GoTableCell>
          <GoTableCell v-if="tab === 'platform'"><CustomerLifecycleTag :model="m" /></GoTableCell>
          <GoTableCell><GoToggle v-model="enabled[m.id]" size="s" :aria-label="`Enable ${m.name}`" @update:model-value="toggle(m)" /></GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>

    <AddByokModelDialog v-model="open" :tenant-id="tenantId" @added="tab = 'own'" />
  </div>
</template>

<style scoped>
  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow-x: auto;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .link {
    color: var(--acv-color-glyph-brand);
  }
</style>
