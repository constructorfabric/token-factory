<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IconEllipsisVertical, IconRefresh, IconSearch } from '@/components/icons';
import PageHeader from '@/components/ui/PageHeader.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import type { Unit } from '@/data/types';
import { fmtAgo, fmtInt } from '@/lib/format';
import { useSort } from '@/lib/useSort';
import { db, effectiveUnitLicense, unitById, tenantBase } from '@/state/db';
import { activePeopleSource } from '@/state/integrations';

/**
 * The organization as its users source holds it: departments and teams in a
 * table like the tenants list. Structure is read-only here; what a tenant
 * decides per unit is set on the unit's own page.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId ?? 'root');
const source = computed(() => activePeopleSource(tenantId));

const query = ref('');

// The company itself is the root row; departments and teams sit beneath it.
const units = computed(() => db.units.filter((u) => u.tenantId === tenantId));
const rows = computed(() => {
  const q = query.value.trim().toLowerCase();
  const matches = (u: Unit) => !q || `${u.name} ${u.manager}`.toLowerCase().includes(q);
  const out: { unit: Unit; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const u of units.value.filter((x) => x.parentId === parent)) {
      const below = (id: string): boolean => units.value.some((c) => c.parentId === id && (matches(c) || below(c.id)));
      const childMatch = below(u.id);
      if (matches(u) || childMatch) out.push({ unit: u, depth });
      walk(u.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
});

const sort = useSort(() => rows.value, {
  name: (r) => r.unit.name,
  manager: (r) => r.unit.manager,
  members: (r) => r.unit.members,
  lic: (r) => effectiveUnitLicense(r.unit).license?.name,
});
const unitLink = (u: Unit) => `${tenantBase(tenantId)}/organization/${u.id}`;

function sync(): void {
  notify(source.value ? `Synchronized with ${source.value.name}: no changes.` : 'No users source is connected. Connect one in Settings → Integrations.', source.value ? 'success' : 'warning', 'Organization sync');
}
</script>

<template>
  <div>
    <PageHeader title="Departments" :description="source ? `Departments and teams from ${source.name}, synced ${fmtAgo(source.lastSync ?? null)}.` : 'No users source connected — connect one in Settings → Integrations.'">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="sync">
          <template #icon><IconRefresh /></template>
          Sync now
        </GoButton>
      </template>
    </PageHeader>

    <div class="toolbar">
      <GoInput v-model="query" size="m" placeholder="Search units or managers" clearable class="search">
        <template #prefix><IconSearch /></template>
      </GoInput>
    </div>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sort" k="name">Unit</SortHeader>
          <SortHeader :sort="sort" k="manager">Manager</SortHeader>
          <SortHeader :sort="sort" k="members">Users</SortHeader>
          <SortHeader :sort="sort" k="lic">Default license</SortHeader>
          <GoTableCell width="56" />
        </GoTableRow>
        <GoTableRow v-for="{ unit: u, depth } in sort.rows.value" :key="u.id">
          <GoTableCell>
            <div class="name" :class="{ name_nested: !sort.key.value && depth > 0 }" :style="{ marginInlineStart: `${sort.key.value ? 0 : Math.max(depth - 1, 0) * 24}px` }">
              <GoTableName :is="RouterLink" :to="unitLink(u)">{{ u.name }}</GoTableName>
              <span class="sub">{{ u.parentId ? `Parent: ${unitById(u.parentId)?.name}` : 'Whole organization' }}</span>
            </div>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ u.manager }}</span>
          </GoTableCell>
          <GoTableCell>{{ fmtInt(u.members) }}</GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ effectiveUnitLicense(u).license?.name ?? '—' }}</span>
            <span class="sub">{{ u.defaultLicenseId ? 'Set for this unit' : `Inherited from ${effectiveUnitLicense(u).from?.name ?? '—'}` }}</span>
          </GoTableCell>
          <GoTableCell>
            <GoDropdownMenuPopover :expand-icon="false" aria-label="Unit actions" position="bottom-right">
              <template #icon><IconEllipsisVertical /></template>
              <GoDropdownMenuItem @select="router.push(unitLink(u))">Open unit</GoDropdownMenuItem>
              <GoDropdownMenuItem @select="router.push(`${unitLink(u)}?tab=settings`)">Set default license</GoDropdownMenuItem>
            </GoDropdownMenuPopover>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>
    <p class="note">Structure comes from the users source and cannot be edited here.</p>
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

  .search {
    max-inline-size: 360px;
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow: visible;
  }

  .name {
    display: flex;
    flex-direction: column;

    &.name_nested {
      padding-inline-start: var(--acv-spacing-large);
      border-inline-start: 2px solid var(--acv-color-border-light);
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

  .note {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) 0 0;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
