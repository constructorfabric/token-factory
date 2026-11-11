<script setup lang="ts">
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoStatusTag } from '@constructor/ui/status-tag';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { IconDownload, IconSearch } from '@/components/icons';
import PageHeader from '@/components/ui/PageHeader.vue';
import { fmtDateTime } from '@/lib/format';
import { db, tenantById } from '@/state/db';
import { session } from '@/state/session';

/** Root sees every tenant's events; a tenant sees only its own. */
const { notify } = useNotificationsStore();
const ctx = computed(() => session.current.value);
const atRoot = computed(() => ctx.value?.kind === 'root');
const query = ref('');
const events = computed(() => {
  const q = query.value.trim().toLowerCase();
  return db.audit.filter((e) => (atRoot.value || e.tenantId === ctx.value?.tenantId) && (!q || `${e.actor} ${e.action} ${e.target}`.toLowerCase().includes(q)));
});
const RESULT = { success: 'success', denied: 'warning', failed: 'error' } as const;

const sAud = useSort(() => events.value, { at: (r) => r.at, actor: (r) => r.actor, action: (r) => r.action, target: (r) => r.target, result: (r) => r.result });
</script>

<template>
  <div>
    <PageHeader title="Audit log" :description="atRoot ? 'Every change on the instance, by whom, on whose behalf, and with what result.' : 'Every change in this organization — including what support engineers did while impersonating.'">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="notify('Export as CSV or stream to your SIEM.', 'info')">
          <template #icon><IconDownload /></template>
          Export
        </GoButton>
      </template>
    </PageHeader>

    <GoInput v-model="query" size="m" placeholder="Search actor, action or target" clearable class="search">
      <template #prefix><IconSearch /></template>
    </GoInput>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sAud" k="at">When</SortHeader>
          <SortHeader :sort="sAud" k="actor">Actor</SortHeader>
          <SortHeader :sort="sAud" k="action">Action</SortHeader>
          <SortHeader :sort="sAud" k="target">Target</SortHeader>
          <GoTableCell v-if="atRoot">Tenant</GoTableCell>
          <SortHeader :sort="sAud" k="result">Result</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="e in sAud.rows.value" :key="e.id">
          <GoTableCell>{{ fmtDateTime(e.at) }}</GoTableCell>
          <GoTableCell>
            {{ e.actor }}
            <span class="sub">{{ e.actorRole }}</span>
            <GoTag v-if="e.onBehalfOf" size="s" color="orange">on behalf of {{ e.onBehalfOf }}</GoTag>
          </GoTableCell>
          <GoTableCell>{{ e.action }}</GoTableCell>
          <GoTableCell>{{ e.target }}</GoTableCell>
          <GoTableCell v-if="atRoot">{{ tenantById(e.tenantId)?.name }}</GoTableCell>
          <GoTableCell><GoStatusTag :variant="RESULT[e.result]" size="sm">{{ e.result }}</GoStatusTag></GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>
  </div>
</template>

<style scoped>
  .search {
    max-inline-size: 360px;
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
</style>
