<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { AssignmentLevel } from '@/data/types';
import { effectiveFor, setName, tools, type Effective } from '@/state/tools';
import { useMe } from './useMe';

/**
 * The MCP servers this user's agent can use: required ones are configured
 * for them, recommended ones are theirs to take, available ones they may add.
 * Blocked servers are not shown at all.
 */
const { notify } = useNotificationsStore();
const { user } = useMe();

type Filter = 'all' | Exclude<AssignmentLevel, 'blocked'>;
const filter = ref<Filter>('all');

const declined = computed(() => (user.value ? tools.declined[user.value.id] ?? [] : []));
const added = computed(() => (user.value ? tools.accepted[user.value.id] ?? [] : []));

/** MCP servers only, with the level the user sees (a declined recommendation becomes available). */
const servers = computed(() =>
  (user.value ? effectiveFor(user.value) : [])
    .filter((e) => e.kind === 'mcp' && e.level !== 'blocked')
    .map((e) => ({ e, server: tools.mcpServers.find((s) => s.id === e.itemId), level: (e.level === 'recommended' && declined.value.includes(e.itemId) ? 'available' : e.level) as Exclude<AssignmentLevel, 'blocked'> }))
    .filter((x) => !!x.server)
    // Token Factory's own server first, then by level and name.
    .sort((a, b) => Number(b.e.itemId === 'mcp-tf') - Number(a.e.itemId === 'mcp-tf') || ORDER[a.level] - ORDER[b.level] || a.server!.name.localeCompare(b.server!.name)),
);
const ORDER = { required: 0, recommended: 1, available: 2 } as const;
const shown = computed(() => servers.value.filter((x) => filter.value === 'all' || x.level === filter.value));
const count = (f: Filter) => (f === 'all' ? servers.value.length : servers.value.filter((x) => x.level === f).length);

const LEVEL = { required: { label: 'Required', color: 'blue' }, recommended: { label: 'Recommended', color: 'mint' }, available: { label: 'Available', color: 'neutral' } } as const;
const RISK = { read: 'neutral', write: 'yellow', admin: 'red' } as const;
const CREDS = { shared: 'Shared organization credentials', 'per-user-oauth': 'You sign in once', none: 'No sign-in' };

function why(e: Effective): string {
  if (e.itemId === 'mcp-tf') return 'Part of Token Factory — every user has it';
  if (e.via) return `Needed by the skill set ${setName(e.via)}`;
  const step = [...e.steps].reverse().find((s) => s.applied);
  return step ? `${LEVEL[e.level as keyof typeof LEVEL]?.label ?? ''} for ${step.scope} · set by ${step.setBy}` : '';
}

function list(map: Record<string, string[]>): string[] {
  const id = user.value!.id;
  map[id] ??= [];
  return map[id]!;
}
function add(id: string, name: string): void {
  list(tools.accepted).push(id);
  notify(`${name} added. Your agent picks it up on its next start; sign in when it asks.`, 'success');
}
</script>

<template>
  <div>
    <PageHeader title="MCP servers" description="Catalog of the MCP servers managed by your organization. They give your agent access to company systems; required ones are already configured for you." />

    <div class="toolbar">
      <GoSegmentButtonGroup v-model="filter" size="s" aria-label="Filter">
        <GoSegmentButton value="all">All {{ count('all') }}</GoSegmentButton>
        <GoSegmentButton value="required">Required {{ count('required') }}</GoSegmentButton>
        <GoSegmentButton value="recommended">Recommended {{ count('recommended') }}</GoSegmentButton>
        <GoSegmentButton value="available">Available {{ count('available') }}</GoSegmentButton>
      </GoSegmentButtonGroup>
      <RouterLink to="/me/connect" class="setup-link">How to connect your agent</RouterLink>
    </div>

    <ul class="servers">
      <li v-for="{ e, server, level } in shown" :key="e.itemId" class="server">
        <div class="main">
          <div class="title-row">
            <span class="name">{{ server!.name }}</span>
            <GoTag size="s" :color="LEVEL[level].color" variant="strong">{{ LEVEL[level].label }}</GoTag>
            <span class="publisher">{{ server!.publisher }} · v{{ server!.version }}</span>
          </div>
          <div class="tools">
            <GoTag v-for="t in server!.tools" :key="t.name" size="s" :color="RISK[t.risk]">{{ t.name }}</GoTag>
          </div>
          <span class="why">{{ why(e) }} · {{ e.itemId === 'mcp-tf' ? 'Uses your Token Factory key' : CREDS[server!.credentials] }}</span>
        </div>
        <div class="actions">
          <template v-if="level === 'required'"><span class="state">Configured</span></template>
          <template v-else-if="added.includes(e.itemId)"><GoTag size="s" color="green">Added</GoTag></template>
          <template v-else-if="level === 'recommended'">
            <GoButton size="s" @click="add(e.itemId, server!.name)">Add</GoButton>
          </template>
          <template v-else>
            <GoButton variant="secondary" size="s" @click="add(e.itemId, server!.name)">Add</GoButton>
          </template>
        </div>
      </li>
      <li v-if="!shown.length" class="empty">Nothing here.</li>
    </ul>
  </div>
</template>

<style scoped>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--acv-spacing-regular);
  }

  .setup-link {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-brand);
  }

  .servers {
    display: grid;
    margin: 0;
    padding: 0;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    list-style: none;
  }

  .server {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--acv-spacing-regular);
    padding: var(--acv-spacing-regular) var(--acv-spacing-medium);

    & + & {
      border-block-start: var(--acv-border-light);
    }
  }

  .main {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .name {
    @mixin acv-text-subheading-3;
  }

  .publisher,
  .why {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--acv-spacing-xx-small);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-xx-small);
  }

  .state {
    @mixin acv-text-ui-caption-1-medium;
    color: var(--acv-color-status-success-strong);
  }

  .empty {
    @mixin acv-text-ui-body-2;
    padding: var(--acv-spacing-large);
    color: var(--acv-color-glyph-tertiary);
    text-align: center;
  }
</style>
