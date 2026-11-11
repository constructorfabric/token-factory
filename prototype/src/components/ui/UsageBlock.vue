<script setup lang="ts">
import { ownCredits } from '@/state/credits';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { computed, ref } from 'vue';
import BarList from '@/components/charts/BarList.vue';
import DayHeatmap from '@/components/charts/DayHeatmap.vue';
import Card from '@/components/ui/Card.vue';
import StatTile from '@/components/ui/StatTile.vue';
import { fmtCompact, fmtCredits, fmtInt } from '@/lib/format';

/**
 * The one way usage is shown, for a user, a tenant or the whole instance:
 * a period switch that every figure follows, headline tiles, a year of daily
 * activity, and breakdowns. All amounts in AI credits; values come in USD and
 * are converted by `fmtCredits`, like everywhere else.
 */
export interface Breakdown {
  title: string;
  items: { label: string; value: number; hint?: string; source?: 'platform' | 'keys' }[];
  /** `credits` (USD in, credits shown) or `millions` (token counts in millions). */
  unit: 'credits' | 'millions';
}

const props = defineProps<{
  /** The 30-day figures; other periods scale from them. */
  credits30d: number;
  requests30d: number;
  tokens30d: number;
  cacheRate: number;
  blendedPer1M: number;
  daily: number[];
  activityTitle: string;
  breakdowns: Breakdown[];
  /** Share of the credits spent as the company's own credits (own keys and models); the rest is platform credits. */
  keyShare?: number;
  /** A user's page shows credits and requests, not token counts. */
  hideTokens?: boolean;
  /** Hidden when the page title already says "Usage". */
  hideHeading?: boolean;
}>();

const PERIODS = [
  { id: 'today', label: 'Today', days: 1, factor: 0.065 },
  { id: '7d', label: 'Last 7 days', days: 7, factor: 0.24 },
  { id: '30d', label: 'Last 30 days', days: 30, factor: 1 },
  { id: '90d', label: 'Last 90 days', days: 90, factor: 2.85 },
];
const period = ref('30d');
const current = computed(() => PERIODS.find((p) => p.id === period.value) ?? PERIODS[2]!);
const f = computed(() => current.value.factor);
const compare = computed(() => (current.value.days === 1 ? '+12% vs yesterday' : `+9% vs the previous ${current.value.days} days`));
const scaled = (b: Breakdown) => b.items.map((i) => ({ ...i, value: i.value * f.value }));
const formatFor = (b: Breakdown) => (b.unit === 'credits' ? fmtCredits : (n: number) => `${fmtCompact(n * 1e6)}`);
</script>

<template>
  <section class="usage-block">
    <div class="head">
      <h2 v-if="!hideHeading" class="title">Usage</h2>
      <span v-else />
      <GoSegmentButtonGroup v-model="period" size="s" aria-label="Period">
        <GoSegmentButton v-for="p in PERIODS" :key="p.id" :value="p.id">{{ p.label }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>

    <div class="tiles">
      <template v-if="keyShare">
        <StatTile label="Platform credits" :value="fmtCredits(credits30d * f * (1 - keyShare))" :hint="compare" />
        <StatTile :label="ownCredits()" :value="fmtCredits(credits30d * f * keyShare)" hint="Own keys and models; billed by the provider, not the platform" />
      </template>
      <StatTile v-else label="AI credits used" :value="fmtCredits(credits30d * f)" :hint="compare" />
      <StatTile label="Requests" :value="fmtCompact(requests30d * f)" :hint="current.days === 1 ? 'So far today' : `${fmtInt(Math.round((requests30d * f) / current.days))} a day on average`" />
      <StatTile v-if="!hideTokens" label="Tokens" :value="fmtCompact(tokens30d * f)" hint="Input, output and reasoning" />
      <StatTile label="Cache hit rate" :value="`${cacheRate}%`" :hint="`Saved about ${fmtCredits(credits30d * f * 0.163)}`" tone="good" />
    </div>

    <Card :title="activityTitle" subtitle="AI credits per day, last 12 months" class="spaced">
      <DayHeatmap :values="daily" end="2026-11-06" :label="activityTitle" :format="fmtCredits" />
    </Card>

    <div class="breakdowns" :class="{ breakdowns_pairs: breakdowns.length % 2 === 0 }">
      <Card v-for="b in breakdowns" :key="b.title" :title="b.title" :subtitle="`${b.unit === 'credits' ? 'AI credits' : 'Tokens'}, ${current.label.toLowerCase()}`">
        <BarList :items="scaled(b)" :format="formatFor(b)" />
      </Card>
    </div>
  </section>
</template>

<style scoped>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--acv-spacing-small);
  }

  .title {
    @mixin acv-text-subheading-1;
    margin: 0;
    color: var(--acv-color-glyph-primary);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block: var(--acv-spacing-regular);
  }

  .breakdowns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));

    &.breakdowns_pairs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    gap: var(--acv-spacing-regular);
  }
</style>
