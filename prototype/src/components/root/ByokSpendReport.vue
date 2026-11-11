<script setup lang="ts">
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed, ref } from 'vue';
import BarList from '@/components/charts/BarList.vue';
import LineChart from '@/components/charts/LineChart.vue';
import Card from '@/components/ui/Card.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import StatTile from '@/components/ui/StatTile.vue';
import { BYOK, byokDaily, type ByokLine } from '@/data/monitoring';
import { fmtCompact, fmtPct } from '@/lib/format';
import { useSort } from '@/lib/useSort';
import { periodOf, seriesFor, type PeriodId } from '@/lib/period';

/**
 * BYOK billing deep dive for the root tenant's own provider keys: what each
 * provider bills, by token type, model and tenant — so the invoice, the
 * spending and the usage structure can be read side by side.
 */
const props = withDefaults(defineProps<{ period?: PeriodId }>(), { period: '30d' });
const f = computed(() => periodOf(props.period).days / 30);
const ROOT_KEYS = BYOK.filter((l) => l.owner === 'platform');
const provider = ref('all');
const providers = [...new Set(ROOT_KEYS.map((l) => l.provider))];
const lines = computed(() => ROOT_KEYS.filter((l) => provider.value === 'all' || l.provider === provider.value));

const usdOf = (l: ByokLine) => l.tokens.reduce((s, t) => s + t.millions * t.usdPer1M, 0) * f.value;
const tokensOf = (l: ByokLine) => l.tokens.reduce((s, t) => s + t.millions, 0) * f.value;
const totals = computed(() => {
  const usd = lines.value.reduce((s, l) => s + usdOf(l), 0);
  const tokens = lines.value.reduce((s, l) => s + tokensOf(l), 0);
  const requests = lines.value.reduce((s, l) => s + l.requests, 0) * f.value;
  const cached = f.value * lines.value.reduce((s, l) => s + (l.tokens.find((t) => t.type === 'Input, cached')?.millions ?? 0), 0);
  const input = f.value * lines.value.reduce((s, l) => s + l.tokens.filter((t) => t.type.startsWith('Input')).reduce((a, t) => a + t.millions, 0), 0);
  const saved = lines.value.reduce((s, l) => { const c = l.tokens.find((t) => t.type === 'Input, cached'); const u = l.tokens.find((t) => t.type === 'Input, uncached'); return s + (c && u ? c.millions * (u.usdPer1M - c.usdPer1M) : 0); }, 0) * f.value;
  return { usd, tokens, requests, cacheRate: input ? (cached / input) * 100 : 0, saved };
});

// the daily bill of the selected provider (or all): its share of the total, with its own rhythm
const allUsd = computed(() => ROOT_KEYS.reduce((sum, l) => sum + usdOf(l), 0));
const daily = computed(() => {
  const share = totals.value.usd / (allUsd.value || 1);
  const seed = provider.value === 'all' ? 0 : providers.indexOf(provider.value) + 1;
  return seriesFor(byokDaily, props.period).map((p, i) => ({ label: p.label, value: Math.round(p.value * share * (1 + (seed ? Math.sin((i + seed * 3) / 2.5) * 0.12 : 0))) }));
});

// by token type, across the selection
const TYPES = ['Input, uncached', 'Input, cached', 'Cache write', 'Output', 'Reasoning'] as const;
const byType = computed(() => TYPES.map((type) => {
  const rows = lines.value.map((l) => l.tokens.find((t) => t.type === type)!);
  const millions = rows.reduce((s, t) => s + t.millions, 0) * f.value;
  const usd = rows.reduce((s, t) => s + t.millions * t.usdPer1M, 0) * f.value;
  return { type, millions, usd, share: totals.value.usd ? (usd / totals.value.usd) * 100 : 0 };
}));
const sType = useSort(() => byType.value, { type: (r) => r.type, millions: (r) => r.millions, usd: (r) => r.usd, share: (r) => r.share });

// by model
const byModel = computed(() => lines.value.map((l) => ({ ...l, requests: l.requests * f.value, usd: usdOf(l), tokens: tokensOf(l), perReq: usdOf(l) / (l.requests * f.value) })));
const sModel = useSort(() => byModel.value, { model: (r) => r.model, req: (r) => r.requests, tokens: (r) => r.tokens, usd: (r) => r.usd, perReq: (r) => r.perReq });

// by tenant
const byTenant = computed(() => {
  const m = new Map<string, number>();
  for (const l of lines.value) for (const t of l.byTenant) m.set(t.tenant, (m.get(t.tenant) ?? 0) + usdOf(l) * t.share);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, hint: `${fmtPct((value / (totals.value.usd || 1)) * 100, 0)} of the selection` }));
});
const usd = (n: number) => `$${n.toLocaleString('en', { maximumFractionDigits: n < 100 ? 2 : 0 })}`;
</script>

<template>
  <div class="byok">
    <div class="toolbar">
      <GoSelect v-model="provider" size="m" aria-label="Provider" class="select">
        <GoSelectOption value="all">All providers</GoSelectOption>
        <GoSelectOption v-for="p in providers" :key="p" :value="p">{{ p }}</GoSelectOption>
      </GoSelect>
          </div>

    <div class="tiles">
      <StatTile label="Billed by providers" :value="usd(totals.usd)" :hint="provider === 'all' ? `${providers.length} providers` : provider" />
      <StatTile label="Requests" :value="fmtCompact(totals.requests)" :hint="`${usd(totals.usd / (totals.requests || 1))} per request on average`" />
      <StatTile label="Tokens" :value="fmtCompact(totals.tokens * 1e6)" :hint="`${usd(totals.usd / (totals.tokens || 1))} per 1M on average`" />
      <StatTile label="Cache hit rate" :value="fmtPct(totals.cacheRate, 0)" :hint="`Saved ${usd(totals.saved)} on input`" tone="good" />
    </div>

    <Card :title="period === 'today' ? 'Provider bill per hour' : 'Provider bill per day'" :subtitle="`${provider === 'all' ? 'All providers' : provider} · USD, ${periodOf(period).label.toLowerCase()}`" class="spaced">
      <LineChart :key="`${provider}-${period}`" :points="daily" :label="`${provider === 'all' ? 'All providers' : provider}, bill per day`" :format="(n) => usd(n)" />
    </Card>

    <Card title="By token type" subtitle="Where the bill comes from" flush class="spaced">
      <GoTable size="sm">
        <GoTableRow header>
          <SortHeader :sort="sType" k="type">Token type</SortHeader>
          <SortHeader :sort="sType" k="millions">Tokens</SortHeader>
          <SortHeader :sort="sType" k="usd">Provider bill</SortHeader>
          <SortHeader :sort="sType" k="share">Share of bill</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="r in sType.rows.value" :key="r.type">
          <GoTableCell>{{ r.type }}</GoTableCell>
          <GoTableCell>{{ fmtCompact(r.millions * 1e6) }}</GoTableCell>
          <GoTableCell>{{ usd(r.usd) }}</GoTableCell>
          <GoTableCell>{{ fmtPct(r.share, 1) }}</GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <div class="two spaced">
      <Card title="By model" subtitle="Requests, tokens and what each costs" flush>
        <GoTable size="sm">
          <GoTableRow header>
            <SortHeader :sort="sModel" k="model">Model</SortHeader>
            <SortHeader :sort="sModel" k="req">Requests</SortHeader>
            <SortHeader :sort="sModel" k="perReq">Per request</SortHeader>
            <SortHeader :sort="sModel" k="usd">Provider bill</SortHeader>
          </GoTableRow>
          <GoTableRow v-for="m in sModel.rows.value" :key="m.model">
            <GoTableCell>{{ m.model }}<span class="sub">{{ m.provider }} · {{ m.key }}</span></GoTableCell>
            <GoTableCell>{{ fmtCompact(m.requests) }}</GoTableCell>
            <GoTableCell>{{ usd(m.perReq) }}</GoTableCell>
            <GoTableCell>{{ usd(m.usd) }}</GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>
      <Card title="By tenant" subtitle="Provider bill attributed to who used it">
        <BarList :items="byTenant" :format="(n) => usd(n)" />
      </Card>
    </div>
  </div>
</template>

<style scoped>
  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .select {
    inline-size: 220px;
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
