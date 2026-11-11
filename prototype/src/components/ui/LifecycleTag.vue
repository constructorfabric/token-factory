<script setup lang="ts">
import { GoStatusTag } from '@constructor/ui/status-tag';
import { computed } from 'vue';
import type { LifecycleState } from '@/data/types';

const props = defineProps<{ state: LifecycleState; ring?: string }>();

const LABELS: Record<LifecycleState, string> = {
  discovered: 'Discovered',
  verifying: 'In verification',
  verified: 'Verified',
  failed: 'Failed verification',
  approved: 'Approved',
  'rolling-out': 'Rolling out',
  ga: 'Generally available',
  deprecated: 'Deprecated',
  retired: 'Retired',
};

const variant = computed(() => {
  switch (props.state) {
    case 'ga':
    case 'verified':
    case 'approved':
      return 'success';
    case 'failed':
      return 'error';
    case 'deprecated':
      return 'warning';
    case 'retired':
      return 'disabled';
    default:
      return 'info';
  }
});
</script>

<template>
  <GoStatusTag :variant="variant" size="sm">
    {{ LABELS[state] }}<template v-if="ring"> · {{ ring }}</template>
  </GoStatusTag>
</template>
