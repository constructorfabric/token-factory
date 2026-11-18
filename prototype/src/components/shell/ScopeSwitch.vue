<script setup lang="ts">
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { scope, type ScopeMode } from '@/state/scope';

/**
 * Switches the prototype between the whole product and the first release.
 * "Future" shows everything designed so far; "v1 · 5 Dec" hides the screens
 * the 5 December 2026 demo does not cover.
 */
function set(mode: string): void {
  scope.mode = mode as ScopeMode;
}
</script>

<template>
  <div class="scope-switch" :title="scope.mode === 'v1' ? 'Showing only what the first release covers, for the demo on 5 December 2026' : 'Showing the whole product, Stage 1 to Stage 4'">
    <span class="label">Scope</span>
    <GoSegmentButtonGroup :model-value="scope.mode" size="s" aria-label="Product scope" @update:model-value="set">
      <GoSegmentButton value="v1">v1 · 5 Dec</GoSegmentButton>
      <GoSegmentButton value="future">Future</GoSegmentButton>
    </GoSegmentButtonGroup>
  </div>
</template>

<style scoped>
  .scope-switch {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .label {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-text-secondary);
  }
</style>
