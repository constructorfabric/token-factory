<script setup lang="ts">
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { ref } from 'vue';
import { IconRefresh } from '@/components/icons';
import LifecycleTag from '@/components/ui/LifecycleTag.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { McpServer } from '@/data/types';
import { record } from '@/state/db';
import { mcpName, requiredMcp, tools } from '@/state/tools';

const { notify } = useNotificationsStore();
const tab = ref<'mcp' | 'skills'>('mcp');

const SOURCE = { 'official-registry': 'MCP Registry', internal: 'Internal', vendor: 'Vendor' };
const RISK = { read: 'neutral', write: 'yellow', admin: 'red' } as const;
const CREDS = { shared: 'Shared service key', 'per-user-oauth': 'Each user signs in', none: 'None' };

function decide(s: McpServer, approve: boolean): void {
  s.state = approve ? 'ga' : 'failed';
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `${approve ? 'Approved' : 'Declined'} MCP server ${s.name} ${s.version}`, target: s.name, tenantId: 'root' });
  notify(approve ? `${s.name} is available to tenants. Each tenant decides who gets it.` : `${s.name} declined; the requester sees the reason.`, approve ? 'success' : 'warning');
}

const sMcp = useSort(() => tools.mcpServers.filter((s) => !s.ownerTenantId), { name: (r) => r.name, tools: (r) => r.tools.length, creds: (r) => r.credentials, risk: (r) => r.risk, state: (r) => r.state });

const sSets = useSort(() => tools.skillSets, { name: (r) => r.name, skills: (r) => r.skills.length, mcp: (r) => requiredMcp(r.id).length, tests: (r) => r.testsPassed / r.testsTotal, users: (r) => r.users, state: (r) => r.state });
</script>

<template>
  <div>
    <PageHeader title="Tools & skills" description="MCP servers and skill sets offered to tenants; every version is scanned and approved first.">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="notify('Synced with the official MCP Registry: 2 new versions discovered.', 'success')">
          <template #icon><IconRefresh /></template>
          Sync registries
        </GoButton>
      </template>
    </PageHeader>

    <GoSegmentButtonGroup v-model="tab" size="s" aria-label="Catalog" class="tabs">
      <GoSegmentButton value="mcp">MCP servers ({{ tools.mcpServers.filter((s) => !s.ownerTenantId).length }})</GoSegmentButton>
      <GoSegmentButton value="skills">Skill sets ({{ tools.skillSets.length }})</GoSegmentButton>
    </GoSegmentButtonGroup>

    <div v-if="tab === 'mcp'" class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sMcp" k="name">Server</SortHeader>
          <SortHeader :sort="sMcp" k="tools">Tools</SortHeader>
          <SortHeader :sort="sMcp" k="creds">Credentials</SortHeader>
          <SortHeader :sort="sMcp" k="risk">Verification</SortHeader>
          <SortHeader :sort="sMcp" k="state">Lifecycle</SortHeader>
          <GoTableCell width="190" />
        </GoTableRow>
        <GoTableRow v-for="s in sMcp.rows.value" :key="s.id">
          <GoTableCell>
            <GoTableName>{{ s.name }}</GoTableName>
            <span class="sub">{{ s.publisher }} · {{ SOURCE[s.source] }} · v{{ s.version }} · {{ s.transport }}</span>
          </GoTableCell>
          <GoTableCell>
            <div class="tags">
              <GoTag v-for="t in s.tools" :key="t.name" size="s" :color="RISK[t.risk]">{{ t.name }}</GoTag>
            </div>
          </GoTableCell>
          <GoTableCell>{{ CREDS[s.credentials] }}</GoTableCell>
          <GoTableCell><span class="scan" :class="`scan_${s.risk}`">{{ s.scan }}</span></GoTableCell>
          <GoTableCell><LifecycleTag :state="s.state" /></GoTableCell>
          <GoTableCell>
            <div v-if="['verified', 'approved'].includes(s.state)" class="row-actions">
              <GoButton variant="secondary" size="s" @click="decide(s, false)">Decline</GoButton>
              <GoButton size="s" @click="decide(s, true)">Approve</GoButton>
            </div>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>

    <div v-else class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sSets" k="name">Skill set</SortHeader>
          <SortHeader :sort="sSets" k="skills">Skills</SortHeader>
          <SortHeader :sort="sSets" k="mcp">Requires MCP</SortHeader>
          <SortHeader :sort="sSets" k="tests">Tests</SortHeader>
          <SortHeader :sort="sSets" k="users">Users</SortHeader>
          <SortHeader :sort="sSets" k="state">Lifecycle</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="s in sSets.rows.value" :key="s.id">
          <GoTableCell>
            <GoTableName>{{ s.name }}</GoTableName>
            <span class="sub">v{{ s.version }} · {{ s.owner }} · {{ s.description }}</span>
          </GoTableCell>
          <GoTableCell>
            <div class="tags">
              <GoTag v-for="id in s.skills" :key="id" size="s" color="neutral">{{ tools.skills.find((k) => k.id === id)?.name }}</GoTag>
            </div>
          </GoTableCell>
          <GoTableCell>{{ requiredMcp(s.id).map(mcpName).join(', ') || 'None' }}</GoTableCell>
          <GoTableCell>
            <span :class="s.testsPassed < s.testsTotal && 'warn'">{{ s.testsPassed }} / {{ s.testsTotal }}</span>
            <span v-if="s.conflicts" class="sub warn">{{ s.conflicts }} skill overlap to resolve</span>
          </GoTableCell>
          <GoTableCell>{{ s.users }}</GoTableCell>
          <GoTableCell><LifecycleTag :state="s.state" :ring="s.ring" /></GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>
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

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--acv-spacing-xx-small);
  }

  .scan {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);

    &.scan_high {
      color: var(--acv-color-status-danger-strong);
    }
  }

  .warn {
    color: var(--acv-color-status-warning-strong);
  }

  .row-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-xx-small);
  }
</style>
