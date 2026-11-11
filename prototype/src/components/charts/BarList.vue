<script setup lang="ts">
import { ownName } from '@/state/credits';
import { GoTag } from '@constructor/ui/tag';
import { computed } from 'vue';

/**
 * Ranked magnitudes as labelled horizontal bars. Every bar carries its label
 * and value as text, so identity never rests on colour and no legend is needed.
 * A model row may name its source: the platform (Constructor Platform) or the
 * company's own keys and models ("Acme-own").
 */
const props = withDefaults(
  defineProps<{
    items: { label: string; value: number; hint?: string; source?: 'platform' | 'keys' }[];
    format?: (n: number) => string;
  }>(),
  { format: (n: number) => String(n) },
);

const max = computed(() => Math.max(...props.items.map((i) => i.value), 1));
</script>

<template>
  <ul class="bar-list">
    <li v-for="item in items" :key="item.label" class="row" :title="`${item.label}: ${format(item.value)}`">
      <span class="label">
        <span class="name">{{ item.label }}</span>
        <span v-if="item.source || item.hint" class="meta">
          <GoTag v-if="item.source" size="s" :color="item.source === 'keys' ? 'blue' : 'neutral'">{{ item.source === 'keys' ? ownName() : 'Platform' }}</GoTag>
          <span v-if="item.hint" class="hint">{{ item.hint }}</span>
        </span>
      </span>
      <span class="track">
        <span class="bar" :style="{ inlineSize: `${(item.value / max) * 100}%` }" />
      </span>
      <span class="value">{{ format(item.value) }}</span>
    </li>
  </ul>
</template>

<style scoped>
  .bar-list {
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(48px, 1fr) auto;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .label {
    @mixin acv-text-ui-body-2;
    display: grid;
    min-inline-size: 0;
    color: var(--acv-color-glyph-primary);
  }

  .name {
    @mixin ellipsis;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-xx-small, 4px);
    min-inline-size: 0;
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    @mixin ellipsis;
    color: var(--acv-color-glyph-tertiary);
  }

  .track {
    block-size: 8px;
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-tertiary);
  }

  .bar {
    display: block;
    block-size: 100%;
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-decoration-blue-intense);
  }

  .value {
    @mixin acv-text-ui-body-2-medium;
    min-inline-size: 72px;
    color: var(--acv-color-glyph-primary);
    text-align: end;
  }
</style>
