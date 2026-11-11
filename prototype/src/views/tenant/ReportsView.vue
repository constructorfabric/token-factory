<script setup lang="ts">
import { ownCredits, sourceLabel } from '@/state/credits';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import OwnModelsReport from '@/components/tenant/OwnModelsReport.vue';
import { IconDownload } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import UsageBlock, { type Breakdown } from '@/components/ui/UsageBlock.vue';
import { acmeByModel, acmeDaily, tenantKeyShare } from '@/data/mock';
import { fmtCredits } from '@/lib/format';
import { db, nearLimit, tenantById, unitById } from '@/state/db';

const route = useRoute();
const router = useRouter();
const tab = computed(() => (route.query.tab === 'own-models' ? 'own-models' : 'overview'));
const go = (t: string) => router.replace({ query: t === 'overview' ? {} : { tab: t } });
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId);
const tenant = computed(() => tenantById(tenantId));

// Departments and licenses share the organization's total, so the breakdowns add up.
// Mock weights: engineers use far more per head than other departments.
const WEIGHT: Record<string, number> = { 'un-eng': 3, 'un-product': 1.4, 'un-support': 0.7, 'un-finance': 0.5, 'un-sales': 0.35 };
const byDepartment = computed(() => {
  const deps = db.units.filter((u) => u.tenantId === tenantId && u.kind === 'department');
  const total = deps.reduce((t, d) => t + d.members * (WEIGHT[d.id] ?? 1), 0);
  return deps.map((d) => ({ label: d.name, value: ((tenant.value?.spend30d ?? 0) * d.members * (WEIGHT[d.id] ?? 1)) / total, hint: `${d.members} users` })).sort((a, b) => b.value - a.value);
});
const byLicense = computed(() => {
  const lics = db.licenses.filter((l) => l.tenantId === tenantId);
  const total = lics.reduce((t, l) => t + l.holders * l.limits.monthly.cost, 0);
  return lics.map((l) => ({ label: l.name, value: ((tenant.value?.spend30d ?? 0) * l.holders * l.limits.monthly.cost) / total, hint: `${l.holders} users` })).sort((a, b) => b.value - a.value);
});

// 38% of the organization's credits go to models on its own keys and deployments.
const KEY_SHARE = tenantKeyShare[tenantId] ?? 0;
const spend = computed(() => tenant.value?.spend30d ?? 0);
const breakdowns = computed<Breakdown[]>(() => [
  { title: 'By credit source', unit: 'credits', items: [{ label: 'Platform credits', value: spend.value * (1 - KEY_SHARE), hint: 'From the organization license' }, { label: ownCredits(tenantId), value: spend.value * KEY_SHARE, hint: 'Own keys and models' }] },
  { title: 'By department', unit: 'credits', items: byDepartment.value },
  { title: 'By model', unit: 'credits', items: acmeByModel },
  { title: 'By license', unit: 'credits', items: byLicense.value },
]);

// Who is about to hit a limit, in either budget: the one thing here a tenant admin acts on.
const limitHits = computed(() =>
  nearLimit(tenantId).map((h) => ({ id: h.id, name: h.user.name, unit: unitById(h.user.unitId)?.name, license: h.license.name, source: sourceLabel(h.source, tenantId), used: h.used, limit: h.limit, pct: h.pct })),
);

const sHit = useSort(() => limitHits.value, { name: (r) => r.name, unit: (r) => r.unit, lic: (r) => r.license, src: (r) => r.source, pct: (r) => r.pct });
</script>

<template>
  <div v-if="tenant">
    <PageHeader title="Reports" :description="`Platform credits and ${ownCredits(tenantId)} used across the organization, by department, model and license.`">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="notify('CSV with one row per user, model and day.', 'success', 'Export started')">
          <template #icon><IconDownload /></template>
          Export CSV
        </GoButton>
      </template>
    </PageHeader>

    <GoTabs class="tabs">
      <GoTabsItem :active="tab === 'overview'" @click="go('overview')">Overview</GoTabsItem>
      <GoTabsItem :active="tab === 'own-models'" @click="go('own-models')">Own models</GoTabsItem>
    </GoTabs>

    <OwnModelsReport v-if="tab === 'own-models'" :tenant-id="tenantId" />

    <template v-else>
    <UsageBlock :key-share="KEY_SHARE" :credits30d="tenant.spend30d" :requests30d="1_480_000" :tokens30d="tenant.tokens30d" :cache-rate="61" :blended-per1-m="8.6" :daily="acmeDaily" activity-title="Organization activity" :breakdowns="breakdowns" />

    <Card title="Near or over the weekly limit" subtitle="Users who may need a license upgrade" flush class="spaced">
      <GoTable size="sm">
        <GoTableRow header>
          <SortHeader :sort="sHit" k="name">User</SortHeader>
          <SortHeader :sort="sHit" k="unit">Unit</SortHeader>
          <SortHeader :sort="sHit" k="lic">License</SortHeader>
          <SortHeader :sort="sHit" k="src">Budget</SortHeader>
          <SortHeader :sort="sHit" k="pct">Used this week</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="r in sHit.rows.value" :key="r.id">
          <GoTableCell>{{ r.name }}</GoTableCell>
          <GoTableCell>{{ r.unit }}</GoTableCell>
          <GoTableCell>{{ r.license }}</GoTableCell>
          <GoTableCell>{{ r.source }}</GoTableCell>
          <GoTableCell><span :class="r.pct >= 100 && 'over'">{{ r.pct }}%</span> <span class="sub">{{ fmtCredits(r.used) }} of {{ fmtCredits(r.limit) }}</span></GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>
    </template>
  </div>
</template>

<style scoped>
  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .over {
    color: var(--acv-color-status-danger-strong);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
