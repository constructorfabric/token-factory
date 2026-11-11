<script setup lang="ts">
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed } from 'vue';
import { fmtCredits } from '@/lib/format';
import type { ClassCost } from '@/data/tokenClasses';

/** Cost by token class: tokens, the price per 1M, and the credits each class cost. */
const props = defineProps<{ rows: ClassCost[]; unit?: string }>();
const total = computed(() => props.rows.reduce((s, r) => s + r.credits, 0));
const fmtM = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}B` : n >= 1 ? `${n.toFixed(1)}M` : `${Math.round(n * 1000)}K`);
const fmtPrice = (n: number) => (n === 0 ? 'free' : n < 10 ? n.toFixed(1) : String(Math.round(n)));
</script>

<template>
  <GoTable size="sm">
    <GoTableRow header>
      <GoTableCell>Token class</GoTableCell>
      <GoTableCell>Tokens</GoTableCell>
      <GoTableCell>Credits per 1M</GoTableCell>
      <GoTableCell>Cost</GoTableCell>
      <GoTableCell>Share</GoTableCell>
    </GoTableRow>
    <GoTableRow v-for="r in rows" :key="r.id">
      <GoTableCell>{{ r.label }}</GoTableCell>
      <GoTableCell>{{ fmtM(r.millions) }}</GoTableCell>
      <GoTableCell>{{ fmtPrice(r.creditsPer1M) }}</GoTableCell>
      <GoTableCell>{{ fmtCredits(r.credits / 100) }}</GoTableCell>
      <GoTableCell>{{ total ? Math.round((r.credits / total) * 100) : 0 }}%</GoTableCell>
    </GoTableRow>
    <GoTableRow>
      <GoTableCell><strong>Total</strong></GoTableCell>
      <GoTableCell>{{ fmtM(rows.reduce((s, r) => s + r.millions, 0)) }}</GoTableCell>
      <GoTableCell />
      <GoTableCell><strong>{{ fmtCredits(total / 100) }}</strong><span v-if="unit" class="sub">{{ unit }}</span></GoTableCell>
      <GoTableCell />
    </GoTableRow>
  </GoTable>
</template>

<style scoped>
  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
