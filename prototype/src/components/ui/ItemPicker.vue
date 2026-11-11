<script setup lang="ts">
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoInput } from '@constructor/ui/input';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { computed, ref } from 'vue';
import { IconSearch } from '@/components/icons';

/**
 * Picking from a list that can run to tens or hundreds of items: search,
 * one item per row, grouped when groups are given, a switch to see only what
 * is picked, and select-visible / clear. With `ordered`, the picked items
 * are listed first, in order, with controls to move them.
 */
export interface PickItem { id: string; label: string; sub?: string; group?: string; meta?: string; warn?: string; disabled?: boolean; disabledReason?: string }
const props = withDefaults(defineProps<{ items: PickItem[]; ordered?: boolean; placeholder?: string; maxHeight?: number; noun?: string }>(), { ordered: false, placeholder: 'Search', maxHeight: 320, noun: 'items' });
const picked = defineModel<string[]>({ required: true });

const query = ref('');
const show = ref<'all' | 'picked'>('all');
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.items.filter((i) => (show.value === 'all' || picked.value.includes(i.id)) && (!q || `${i.label} ${i.sub ?? ''} ${i.group ?? ''} ${i.meta ?? ''}`.toLowerCase().includes(q)));
});
const groups = computed(() => {
  const out: { name: string; items: PickItem[] }[] = [];
  for (const i of visible.value) {
    const name = i.group ?? '';
    const g = out.find((x) => x.name === name) ?? out[out.push({ name, items: [] }) - 1]!;
    g.items.push(i);
  }
  return out;
});
const byId = (id: string) => props.items.find((i) => i.id === id);
function toggle(id: string, on: boolean): void {
  picked.value = on ? [...picked.value.filter((x) => x !== id), id] : picked.value.filter((x) => x !== id);
}
function selectVisible(): void {
  const add = visible.value.filter((i) => !i.disabled && !picked.value.includes(i.id)).map((i) => i.id);
  picked.value = [...picked.value, ...add];
}
function clearVisible(): void {
  const ids = new Set(visible.value.map((i) => i.id));
  picked.value = picked.value.filter((x) => !ids.has(x));
}
function move(id: string, by: number): void {
  const list = [...picked.value];
  const i = list.indexOf(id);
  const j = i + by;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j]!, list[i]!];
  picked.value = list;
}
</script>

<template>
  <div class="picker">
    <div v-if="ordered && picked.length" class="order">
      <span class="order-title">In order · {{ picked.length }}</span>
      <ol class="order-list">
        <li v-for="(id, i) in picked" :key="id" class="order-row">
          <span class="n">{{ i + 1 }}</span>
          <span class="order-label">{{ byId(id)?.label ?? id }}<span v-if="byId(id)?.warn" class="warn"> · {{ byId(id)?.warn }}</span></span>
          <button type="button" class="mini" :disabled="i === 0" :aria-label="`Move ${byId(id)?.label} up`" @click="move(id, -1)">↑</button>
          <button type="button" class="mini" :disabled="i === picked.length - 1" :aria-label="`Move ${byId(id)?.label} down`" @click="move(id, 1)">↓</button>
          <button type="button" class="mini" :aria-label="`Remove ${byId(id)?.label}`" @click="toggle(id, false)">✕</button>
        </li>
      </ol>
    </div>

    <div class="tools">
      <GoInput v-model="query" size="m" :placeholder="placeholder" clearable class="search">
        <template #prefix><IconSearch /></template>
      </GoInput>
      <GoSegmentButtonGroup v-model="show" size="s" aria-label="Show">
        <GoSegmentButton value="all">All {{ items.length }}</GoSegmentButton>
        <GoSegmentButton value="picked">Picked {{ picked.length }}</GoSegmentButton>
      </GoSegmentButtonGroup>
      <button type="button" class="link" @click="selectVisible">Select shown</button>
      <button type="button" class="link" @click="clearVisible">Clear shown</button>
    </div>

    <div class="list" :style="{ maxBlockSize: `${maxHeight}px` }">
      <template v-for="g in groups" :key="g.name">
        <div v-if="g.name" class="group">{{ g.name }} <span class="count">{{ g.items.filter((i) => picked.includes(i.id)).length }}/{{ g.items.length }}</span></div>
        <label v-for="i in g.items" :key="i.id" class="row" :class="{ row_on: picked.includes(i.id), row_off: i.disabled }">
          <GoCheckbox :model-value="picked.includes(i.id)" :disabled="i.disabled" :aria-label="i.label" @update:model-value="toggle(i.id, !!$event)" />
          <span class="main">
            <span class="label">{{ i.label }}<span v-if="ordered && picked.includes(i.id)" class="pos">{{ picked.indexOf(i.id) + 1 }}</span></span>
            <span v-if="i.sub || i.disabledReason || i.warn" class="sub">{{ i.disabled ? i.disabledReason ?? i.sub : i.sub }}<span v-if="i.warn" class="warn">{{ i.sub ? ' · ' : '' }}{{ i.warn }}</span></span>
          </span>
          <span v-if="i.meta" class="meta">{{ i.meta }}</span>
        </label>
      </template>
      <p v-if="!visible.length" class="empty">{{ show === 'picked' ? `No ${noun} picked yet.` : `No ${noun} match “${query.trim()}”.` }}</p>
    </div>
  </div>
</template>

<style scoped>
  .picker {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .search {
    flex: 1;
    min-inline-size: 200px;
  }

  .link {
    @mixin acv-text-ui-caption-1;
    padding: 0;
    border: none;
    background: none;
    color: var(--acv-color-glyph-brand);
    cursor: pointer;
  }

  .list {
    overflow-y: auto;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
  }

  .group {
    @mixin acv-text-ui-caption-1;
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    padding: 4px var(--acv-spacing-small);
    background: var(--acv-color-surface-secondary);
    color: var(--acv-color-glyph-secondary);
    text-transform: uppercase;
  }

  .count {
    text-transform: none;
    color: var(--acv-color-glyph-tertiary);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
    padding: 6px var(--acv-spacing-small);
    border-block-end: var(--acv-border-light);
    cursor: pointer;

    &:last-child {
      border-block-end: none;
    }

    &:hover {
      background: var(--acv-color-surface-secondary);
    }

    &.row_off {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  .main {
    display: grid;
    flex: 1;
    min-inline-size: 0;
  }

  .label {
    @mixin acv-text-ui-body-2;
  }

  .row_on .label {
    @mixin acv-text-ui-body-2-medium;
  }

  .pos,
  .n {
    @mixin acv-text-ui-caption-1;
    margin-inline-start: 6px;
    padding: 0 6px;
    border-radius: 8px;
    background: var(--acv-color-surface-secondary);
    color: var(--acv-color-glyph-secondary);
  }

  .n {
    margin-inline-start: 0;
  }

  .sub,
  .meta,
  .empty {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .meta {
    flex: none;
  }

  .empty {
    margin: 0;
    padding: var(--acv-spacing-small);
  }

  .warn {
    color: var(--acv-color-status-warning-strong, #b45309);
  }

  .order {
    display: grid;
    gap: 4px;
    padding: var(--acv-spacing-small);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
  }

  .order-title {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .order-list {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .order-row {
    @mixin acv-text-ui-body-2;
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .order-label {
    flex: 1;
  }

  .mini {
    inline-size: 24px;
    block-size: 24px;
    padding: 0;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-primary);
    color: var(--acv-color-glyph-secondary);
    cursor: pointer;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
</style>
