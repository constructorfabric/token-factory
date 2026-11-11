<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoInput } from '@constructor/ui/input';
import { IconSearch } from '@/components/icons';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { fmtAgo, fmtDate } from '@/lib/format';
import { ROOT_TENANT_ID } from '@/data/mock';
import { markAllRead, markRead, noticesFor, type Notice } from '@/state/inbox';

/**
 * Every notification of this admin: what needs attention now, then older
 * events by day. The overview's "Needs attention" opens this page.
 */
const route = useRoute();
const router = useRouter();
const scope = String(route.params.tenantId ?? ROOT_TENANT_ID);

type Filter = 'all' | 'unread' | 'attention';
const filter = ref<Filter>(route.query.filter === 'attention' ? 'attention' : 'all');
const query = ref('');
const all = computed(() => noticesFor(scope).filter((n) => !query.value.trim() || `${n.title} ${n.text}`.toLowerCase().includes(query.value.trim().toLowerCase())));
const count = (f: Filter) => all.value.filter((n) => f === 'all' || (f === 'unread' ? !n.read : n.live)).length;
const shown = computed(() => all.value.filter((n) => filter.value === 'all' || (filter.value === 'unread' ? !n.read : n.live)));

// Needs attention first, then each day, newest first.
const TODAY = '2026-11-10';
const dayOf = (iso: string) => iso.slice(0, 10);
const dayLabel = (d: string) => (d === TODAY ? 'Today' : d === '2026-11-09' ? 'Yesterday' : fmtDate(d));
const groups = computed(() => {
  const out: { label: string; items: typeof shown.value }[] = [];
  const live = shown.value.filter((n) => n.live);
  if (live.length) out.push({ label: 'Needs attention', items: live });
  for (const n of shown.value.filter((x) => !x.live)) {
    const label = dayLabel(dayOf(n.at));
    const g = out.find((x) => x.label === label) ?? out[out.push({ label, items: [] }) - 1]!;
    g.items.push(n);
  }
  return out;
});

function act(n: Notice): void {
  markRead(scope, n.id);
  if (n.to) void router.push(n.to);
}
</script>

<template>
  <div>
    <PageHeader title="Notifications" description="What needs you now, and what happened before.">
      <template #actions>
        <GoButton variant="secondary" size="m" :disabled="!count('unread')" @click="markAllRead(scope)">Mark all as read</GoButton>
      </template>
    </PageHeader>

    <div class="toolbar">
      <GoInput v-model="query" size="m" placeholder="Search notifications" clearable class="search">
        <template #prefix><IconSearch /></template>
      </GoInput>
      <GoSegmentButtonGroup v-model="filter" size="s" aria-label="Show">
        <GoSegmentButton value="all">All {{ count('all') }}</GoSegmentButton>
        <GoSegmentButton value="unread">Unread {{ count('unread') }}</GoSegmentButton>
        <GoSegmentButton value="attention">Needs attention {{ count('attention') }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>

    <Card v-for="g in groups" :key="g.label" :title="g.label" flush class="group">
      <ul class="list">
        <li v-for="n in g.items" :key="n.id" class="item" :class="[`item_${n.tone}`, { item_unread: !n.read }]">
          <span class="dot" :class="{ dot_on: !n.read }" aria-hidden="true" />
          <div class="item-text">
            <span class="item-title">{{ n.title }}</span>
            <span class="sub">{{ n.text }}</span>
          </div>
          <span class="when">{{ n.live ? 'Open' : fmtAgo(n.at) }}</span>
          <GoButton v-if="n.action" variant="secondary" size="s" @click="act(n)">{{ n.action }}</GoButton>
          <GoButton v-else-if="!n.read" variant="ghost" size="s" @click="markRead(scope, n.id)">Mark as read</GoButton>
        </li>
      </ul>
    </Card>
    <p v-if="!groups.length" class="sub">{{ query.trim() ? `Nothing matches “${query.trim()}”.` : 'Nothing here.' }}</p>
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

  .group + .group {
    margin-block-start: var(--acv-spacing-regular);
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border-block-start: var(--acv-border-light);
    border-inline-start: 3px solid transparent;

    &.item_danger {
      border-inline-start-color: var(--acv-color-status-danger-strong);
    }

    &.item_warning {
      border-inline-start-color: var(--acv-color-status-warning-strong, #d97706);
    }

    &.item_info {
      border-inline-start-color: var(--acv-color-decoration-blue-intense);
    }
  }

  .dot {
    flex: none;
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;

    &.dot_on {
      background: var(--acv-color-glyph-brand);
    }
  }

  .item-text {
    display: grid;
    flex: 1;
    min-inline-size: 0;
  }

  .item-title {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-primary);
  }

  .item_unread .item-title {
    @mixin acv-text-ui-body-2-medium;
  }

  .when {
    @mixin acv-text-ui-caption-1;
    flex: none;
    color: var(--acv-color-glyph-tertiary);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
