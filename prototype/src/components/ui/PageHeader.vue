<script setup lang="ts">
import { GoSubheader } from '@constructor/ui/subheader';

defineProps<{
  title: string;
  description?: string;
  back?: boolean;
}>();
defineEmits<{ back: [] }>();
</script>

<template>
  <header class="page-header">
    <GoSubheader :level="1" size="l" :back-button="back" @back="$emit('back')">
      {{ title }}
      <template #end><slot name="actions" /></template>
    </GoSubheader>
    <p v-if="description" class="description">{{ description }}</p>
    <slot />
  </header>
</template>

<style scoped>
  .page-header {
    margin-block-end: var(--acv-spacing-large);
  }


  .description {
    @mixin acv-text-ui-body-2;
    max-inline-size: 880px;
    margin: var(--acv-spacing-x-small) 0 0;
    color: var(--acv-color-glyph-secondary);
  }
</style>
