<script setup lang="ts">
import { GoStatusTag } from '@constructor/ui/status-tag';
import type { Model } from '@/data/types';
import { fmtDate } from '@/lib/format';

/**
 * A platform model's lifecycle as a customer sees it. Verification, approval
 * and rollout rings are the platform's business; a customer sees only whether
 * the model is available, in preview while it rolls out, or on its way out.
 */
defineProps<{ model: Model }>();
</script>

<template>
  <GoStatusTag v-if="model.state === 'deprecated'" variant="warning" size="sm">Deprecated<template v-if="model.retiresOn"> · retires {{ fmtDate(model.retiresOn) }}</template></GoStatusTag>
  <GoStatusTag v-else-if="model.state === 'rolling-out'" variant="info" size="sm">Preview</GoStatusTag>
  <GoStatusTag v-else variant="success" size="sm">Available</GoStatusTag>
</template>
