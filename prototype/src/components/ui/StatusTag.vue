<script setup lang="ts">
import { GoStatusTag } from '@constructor/ui/status-tag';
import { GoTag } from '@constructor/ui/tag';

/**
 * GoStatusTag, except for a finished state (disabled, revoked, stopped): the
 * kit's `disabled` variant draws a dashed circle that reads as "in progress",
 * so a finished state is a plain neutral tag instead.
 */
defineProps<{ variant: 'success' | 'warning' | 'error' | 'info' | 'disabled'; size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' }>();
</script>

<template>
  <GoTag v-if="variant === 'disabled'" size="s" color="neutral"><slot /></GoTag>
  <GoStatusTag v-else :variant="variant" :size="size ?? 'sm'"><slot /></GoStatusTag>
</template>
