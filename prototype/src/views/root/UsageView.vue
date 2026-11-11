<script setup lang="ts">
import { computed } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import UsageBlock, { type Breakdown } from '@/components/ui/UsageBlock.vue';
import { platformByModel, platformDaily } from '@/data/mock';
import { db } from '@/state/db';

const tenants = computed(() => db.tenants.filter((t) => t.tier !== 'root'));
const credits30d = computed(() => tenants.value.reduce((s, t) => s + t.spend30d, 0));
const tokens30d = computed(() => tenants.value.reduce((s, t) => s + t.tokens30d, 0));

const breakdowns = computed<Breakdown[]>(() => [
  { title: 'By tenant', unit: 'credits', items: [...tenants.value].sort((a, b) => b.spend30d - a.spend30d).filter((t) => t.spend30d > 0).map((t) => ({ label: t.name, value: t.spend30d })) },
  { title: 'By model', unit: 'credits', items: platformByModel.filter((m) => m.source === 'platform') },
]);

</script>

<template>
  <div>
    <PageHeader title="Usage" description="Platform credits used across every tenant and model on this instance." />

    <UsageBlock :credits30d="credits30d" :requests30d="3_120_000" :tokens30d="tokens30d" :cache-rate="58" :blended-per1-m="7.8" :daily="platformDaily" activity-title="Instance activity" :breakdowns="breakdowns" hide-heading />
  </div>
</template>

