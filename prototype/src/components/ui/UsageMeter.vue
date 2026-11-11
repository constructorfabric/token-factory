<script setup lang="ts">
import { GoProgressBar } from '@constructor/ui/progress-bar';
import { computed } from 'vue';
import { percentOf } from '@/lib/format';

/** How much of a limit is used, with the numbers written out beside the bar. */
const props = defineProps<{ label: string; used: number; limit: number; format: (n: number) => string }>();
const pct = computed(() => percentOf(props.used, props.limit));
const variant = computed(() => (pct.value >= 100 ? 'error' : pct.value >= 80 ? 'warning' : 'default'));
</script>

<template>
  <div class="usage-meter">
    <div class="row">
      <span class="label">{{ label }}</span>
      <span class="numbers">{{ format(used) }} <span class="of">of {{ format(limit) }}</span></span>
    </div>
    <GoProgressBar :value="pct" :max="100" :variant="variant" />
    <span v-if="pct >= 80" class="note">{{ pct >= 100 ? 'Limit reached — requests are throttled' : `${pct}% used` }}</span>
  </div>
</template>

<style scoped>
  .usage-meter {
    display: grid;
    gap: var(--acv-spacing-xx-small);

    & + & {
      margin-block-start: var(--acv-spacing-regular);
    }
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: var(--acv-spacing-small);
  }

  .label {
    @mixin acv-text-ui-body-2-medium;
    color: var(--acv-color-glyph-primary);
  }

  .numbers {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-primary);
  }

  .of,
  .note {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
