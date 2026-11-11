<script setup lang="ts">
/** One headline number. A number this important is a tile, not a chart. */
defineProps<{ label: string; value: string; hint?: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }>();
</script>

<template>
  <div class="stat-tile" :class="tone && `stat-tile_${tone}`">
    <span class="label">{{ label }}</span>
    <span class="value">{{ value }}</span>
    <span v-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
  .stat-tile {
    display: flex;
    flex-direction: column;
    gap: var(--acv-spacing-xx-small);
    padding: var(--acv-spacing-regular) var(--acv-spacing-medium);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);

    &.stat-tile_warn .hint {
      color: var(--acv-color-status-warning-strong);
    }

    &.stat-tile_bad .hint {
      color: var(--acv-color-status-danger-strong);
    }

    &.stat-tile_good .hint {
      color: var(--acv-color-status-success-strong);
    }
  }

  .label {
    @mixin acv-text-ui-caption-1-medium;
    color: var(--acv-color-glyph-secondary);
  }

  .value {
    @mixin acv-text-heading-3;
    color: var(--acv-color-glyph-primary);
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
