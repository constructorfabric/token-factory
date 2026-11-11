<script setup lang="ts">
import { GoTableCell } from '@constructor/ui/table';
import { computed } from 'vue';
import { IconArrowUpArrowDown, IconSortDown, IconSortUp } from '@/components/icons';
import type { Sorter } from '@/lib/useSort';

/** A header cell that sorts its table by `k`; announces the order via aria-sort. */
const props = defineProps<{ sort: Sorter<unknown>; k: string; width?: string }>();
const active = computed(() => props.sort.key.value === props.k);
const ariaSort = computed(() => (active.value ? (props.sort.dir.value === 'asc' ? 'ascending' : 'descending') : 'none'));
</script>

<template>
  <GoTableCell :width="width" :aria-sort="ariaSort">
    <button type="button" class="sort-header" :class="active && 'sort-header_active'" @click="sort.toggle(k)">
      <slot />
      <IconSortUp v-if="active && sort.dir.value === 'asc'" class="icon" aria-hidden="true" />
      <IconSortDown v-else-if="active" class="icon" aria-hidden="true" />
      <IconArrowUpArrowDown v-else class="icon icon_idle" aria-hidden="true" />
    </button>
  </GoTableCell>
</template>

<style scoped>
  .sort-header {
    display: inline-flex;
    align-items: center;
    gap: var(--acv-spacing-xx-small);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;

    &:hover .icon_idle {
      opacity: 1;
    }

    &.sort-header_active {
      color: var(--acv-color-glyph-primary);
    }
  }

  .icon {
    --icon-size: var(--acv-icon-size-xs);
    flex: none;
  }

  .icon_idle {
    opacity: 0.35;
  }
</style>
