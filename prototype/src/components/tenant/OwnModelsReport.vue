<script setup lang="ts">
import { ownCredits } from '@/state/credits';
import { GoMessage } from '@constructor/ui/message';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed, ref } from 'vue';
import BarList from '@/components/charts/BarList.vue';
import DayHeatmap from '@/components/charts/DayHeatmap.vue';
import Card from '@/components/ui/Card.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import StatTile from '@/components/ui/StatTile.vue';
import { ownModelReports } from '@/data/mock';
import { fmtCompact, fmtInt, fmtPct } from '@/lib/format';
import { useSort } from '@/lib/useSort';
import { modelById } from '@/state/db';

/**
 * The tenant's own models — its deployment and its BYOK model — in more
 * detail than the overview: every token type, latency, errors, who uses it,
 * and GPU time where the tenant runs the model itself.
 */
const props = defineProps<{ tenantId: string }>();
const reports = computed(() => ownModelReports.filter((r) => modelById(r.modelId)?.ownerTenantId === props.tenantId));
const selected = ref(reports.value[0]?.modelId ?? '');
const report = computed(() => reports.value.find((r) => r.modelId === selected.value));
const model = computed(() => modelById(selected.value));

const PERIODS = [
  { id: 'today', label: 'Today', days: 1, factor: 0.065 },
  { id: '7d', label: 'Last 7 days', days: 7, factor: 0.24 },
  { id: '30d', label: 'Last 30 days', days: 30, factor: 1 },
  { id: '90d', label: 'Last 90 days', days: 90, factor: 2.85 },
];
const period = ref('30d');
const current = computed(() => PERIODS.find((p) => p.id === period.value) ?? PERIODS[2]!);
const f = computed(() => current.value.factor);

const rows = computed(() => {
  const r = report.value;
  if (!r) return [];
  const total = r.tokens.reduce((s, t) => s + t.millions, 0);
  return r.tokens.map((t) => ({ ...t, tokens: t.millions * 1e6 * f.value, share: total ? (t.millions / total) * 100 : 0, credits: t.millions * t.creditsPer1M * f.value }));
});
const totalTokens = computed(() => rows.value.reduce((s, t) => s + t.tokens, 0));
const totalCredits = computed(() => rows.value.reduce((s, t) => s + t.credits, 0));
const sort = useSort(() => rows.value, { type: (r) => r.type, tokens: (r) => r.tokens, share: (r) => r.share, price: (r) => r.creditsPer1M, credits: (r) => r.credits });
const byUnit = computed(() => (report.value?.byUnit ?? []).map((u) => ({ ...u, value: u.value * f.value })));
</script>

<template>
  <div v-if="report && model" class="own-models">
    <div class="head">
      <GoSegmentButtonGroup v-model="selected" size="s" aria-label="Model">
        <GoSegmentButton v-for="r in reports" :key="r.modelId" :value="r.modelId">{{ modelById(r.modelId)?.name }}</GoSegmentButton>
      </GoSegmentButtonGroup>
      <GoSegmentButtonGroup v-model="period" size="s" aria-label="Period">
        <GoSegmentButton v-for="p in PERIODS" :key="p.id" :value="p.id">{{ p.label }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>

    <GoMessage variant="info" rounded class="notice">
      {{ report.billing === 'byok' ? `Billed by your provider — ${model.provider}` : `Runs on your own GPUs — ${report.gpu?.gpu}` }}
      <template #addition>{{ report.billing === 'byok' ? `Holders spend ${ownCredits(tenantId)} here at the price you set, against the ${ownCredits(tenantId)} limits of their license; Token Factory meters every call.` : `${report.gpu?.replicas} replica · ${fmtInt(Math.round((report.gpu?.hours ?? 0) * f))} GPU hours · ${report.gpu?.utilization}% average utilization in this period.` }}</template>
    </GoMessage>

    <div class="tiles">
      <StatTile label="Requests" :value="fmtCompact(report.requests * f)" :hint="current.days === 1 ? 'So far today' : `${fmtInt(Math.round((report.requests * f) / current.days))} a day on average`" />
      <StatTile label="Tokens" :value="fmtCompact(totalTokens)" hint="All token types" />
      <StatTile :label="ownCredits(tenantId)" :value="`${fmtCompact(totalCredits)} credits`" hint="At the price you set" />
      <StatTile label="Latency p50 / p95" :value="`${report.p50Ms} / ${fmtInt(report.p95Ms)} ms`" :hint="`First token in ${report.ttftMs} ms`" />
      <StatTile label="Throughput" :value="`${report.tps} tok/s`" hint="Per request, median" />
      <StatTile label="Errors" :value="fmtPct(report.errorRate, 2)" :hint="`Availability ${fmtPct(report.availability, 1)}`" :tone="report.errorRate > 0.4 ? 'warn' : 'good'" />
    </div>

    <Card title="Tokens by type" :subtitle="`${current.label}, with the AI credit price of each type`" flush class="spaced">
      <GoTable size="sm">
        <GoTableRow header>
          <SortHeader :sort="sort" k="type">Token type</SortHeader>
          <SortHeader :sort="sort" k="tokens">Tokens</SortHeader>
          <SortHeader :sort="sort" k="share">Share</SortHeader>
          <SortHeader :sort="sort" k="price">Credits per 1M</SortHeader>
          <SortHeader :sort="sort" k="credits">AI credits</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="t in sort.rows.value" :key="t.type">
          <GoTableCell>{{ t.type }}<span v-if="t.note" class="sub">{{ t.note }}</span></GoTableCell>
          <GoTableCell>{{ fmtCompact(t.tokens) }}</GoTableCell>
          <GoTableCell>{{ fmtPct(t.share, 1) }}</GoTableCell>
          <GoTableCell>{{ fmtInt(t.creditsPer1M) }}</GoTableCell>
          <GoTableCell>{{ fmtCompact(t.credits) }}</GoTableCell>
        </GoTableRow>
        <GoTableRow>
          <GoTableCell><strong>Total</strong></GoTableCell>
          <GoTableCell><strong>{{ fmtCompact(totalTokens) }}</strong></GoTableCell>
          <GoTableCell>100%</GoTableCell>
          <GoTableCell />
          <GoTableCell><strong>{{ fmtCompact(totalCredits) }}</strong></GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <div class="grid">
      <Card title="Activity" subtitle="Requests per day, last 12 months">
        <DayHeatmap :values="report.daily" end="2026-11-06" label="Requests per day" :format="(n) => `${fmtCompact(n)} requests`" />
      </Card>
      <Card title="Who uses it" :subtitle="`Thousands of requests, ${current.label.toLowerCase()}`">
        <BarList :items="byUnit" :format="(n) => `${fmtCompact(n * 1000)}`" />
      </Card>
    </div>
  </div>
  <p v-else class="empty">This organization has no models of its own yet. Add one under Models.</p>
</template>

<style scoped>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .notice {
    margin-block-end: var(--acv-spacing-regular);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block: var(--acv-spacing-regular);
  }

  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .empty {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
