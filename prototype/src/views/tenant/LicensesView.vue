<script setup lang="ts">
import { ownCredits, ownName } from '@/state/credits';
import { GoButton } from '@constructor/ui/button';
import { GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IconEllipsisVertical, IconPlus } from '@/components/icons';
import PageHeader from '@/components/ui/PageHeader.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import type { License } from '@/data/types';
import { fmtCredits, fmtInt, fmtPct } from '@/lib/format';
import { useSort } from '@/lib/useSort';
import { db, modelById, tenantById, tenantBase } from '@/state/db';

const route = useRoute();
const router = useRouter();
const tenantId = String(route.params.tenantId ?? 'root');
const licenses = computed(() => db.licenses.filter((l) => l.tenantId === tenantId));
// Licenses carry no seat cap; every holder takes one seat from the organization's pool.
const pool = computed(() => tenantById(tenantId)?.seats ?? 0);
const assigned = computed(() => licenses.value.reduce((n, l) => n + l.holders, 0));
const unitsUsing = (l: License) => db.units.filter((u) => u.tenantId === tenantId && u.defaultLicenseId === l.id).map((u) => u.name);
const premium = (l: License) => l.allowedModels.filter((m) => (modelById(m)?.priceOut ?? 0) >= 40).length;
const editLink = (l: License) => `${tenantBase(tenantId)}/licenses/${l.id}`;

const sort = useSort(() => licenses.value, {
  name: (r) => r.name,
  holders: (r) => r.holders,
  daily: (r) => r.limits.daily.cost,
  monthly: (r) => r.limits.monthly.cost,
  rpm: (r) => r.rpm,
  models: (r) => r.allowedModels.length,
  units: (r) => unitsUsing(r).length,
});
</script>

<template>
  <div>
    <PageHeader title="Licenses" :description="`Your seat types: which models a holder may use and how much. Limits are in platform credits and ${ownCredits(tenantId)}. Each holder takes a seat from your organization's ${fmtInt(pool)}; ${fmtInt(assigned)} are taken.`">
      <template #actions>
        <GoButton size="m" @click="router.push(`${tenantBase(tenantId)}/licenses/new`)">
          <template #icon><IconPlus /></template>
          New license
        </GoButton>
      </template>
    </PageHeader>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sort" k="name">License</SortHeader>
          <SortHeader :sort="sort" k="holders">Holders</SortHeader>
          <SortHeader :sort="sort" k="daily">Daily limit</SortHeader>
          <SortHeader :sort="sort" k="monthly">Monthly limit</SortHeader>
          <SortHeader :sort="sort" k="rpm">Requests / min</SortHeader>
          <SortHeader :sort="sort" k="models">Models</SortHeader>
          <SortHeader :sort="sort" k="units">Default for</SortHeader>
          <GoTableCell width="56" />
        </GoTableRow>
        <GoTableRow v-for="l in sort.rows.value" :key="l.id">
          <GoTableCell>
            <GoTableName :is="RouterLink" :to="editLink(l)">{{ l.name }}</GoTableName>
            <span class="sub">{{ l.description }}</span>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ fmtInt(l.holders) }}</span>
            <span class="sub">{{ fmtPct(assigned ? (l.holders / assigned) * 100 : 0, 0) }} of seats taken</span>
          </GoTableCell>
          <GoTableCell v-for="p in (['daily', 'monthly'] as const)" :key="p">
            <span class="cell-main">{{ l.platformAllowed ? fmtCredits(l.limits[p].cost) : 'No platform models' }} <span v-if="l.platformAllowed" class="src">platform</span></span>
            <span class="sub">{{ l.keyLimits[p] ? `${fmtCredits(l.keyLimits[p])} ${ownName(tenantId)}` : `No ${ownName(tenantId)} models` }}</span>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ l.platformAllowed ? l.rpm : '—' }} <span v-if="l.platformAllowed" class="src">platform</span></span>
            <span class="sub">{{ l.keyLimits.monthly ? `${l.keyRpm} ${ownName(tenantId)}` : `No ${ownName(tenantId)} models` }}</span>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ l.allowedModels.length }}</span>
            <span v-if="premium(l)" class="sub">{{ premium(l) }} premium, per-model grant</span>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ unitsUsing(l).length || '—' }}</span>
            <span v-if="unitsUsing(l).length" class="sub">{{ unitsUsing(l).join(', ') }}</span>
          </GoTableCell>
          <GoTableCell>
            <GoDropdownMenuPopover :expand-icon="false" aria-label="License actions" position="bottom-right">
              <template #icon><IconEllipsisVertical /></template>
              <GoDropdownMenuItem @select="router.push(editLink(l))">Edit license</GoDropdownMenuItem>
            </GoDropdownMenuPopover>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>
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

  .cell-main {
    display: block;
  }

  .src {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    max-inline-size: 320px;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
