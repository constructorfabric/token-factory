<script setup lang="ts">
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoStatusTag } from '@constructor/ui/status-tag';
import { IconArrowUpRightFromSquare } from '@/components/icons';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import ByokSpendReport from '@/components/root/ByokSpendReport.vue';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { ref } from 'vue';
import { PERIODS, periodOf, seriesFor, type PeriodId } from '@/lib/period';
import HostedUtilization from '@/components/root/HostedUtilization.vue';
import LineChart from '@/components/charts/LineChart.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatTile from '@/components/ui/StatTile.vue';
import { errorRate, latencyP95 } from '@/data/mock';
import { fmtPct } from '@/lib/format';
import { db } from '@/state/db';

const route = useRoute();
const router = useRouter();
const tab = computed(() => (['byok', 'hosted'].includes(String(route.query.tab)) ? String(route.query.tab) : 'overview'));
const go = (t: string) => router.replace({ query: t === 'overview' ? {} : { tab: t } });

const period = ref<PeriodId>('30d');
const current = computed(() => periodOf(period.value));
const latency = computed(() => seriesFor(latencyP95, period.value, true));
const errors = computed(() => seriesFor(errorRate, period.value, true));
// Mock: the 30-day figures shift a little with the window.
const STATS = { today: { avail: '99.99%', p95: '1.7 s', err: '0.31%', fo: 4 }, '7d': { avail: '99.98%', p95: '1.8 s', err: '0.38%', fo: 38 }, '30d': { avail: '99.97%', p95: '1.9 s', err: '0.42%', fo: 151 }, '90d': { avail: '99.95%', p95: '2.0 s', err: '0.47%', fo: 412 } } as const;
const stats = computed(() => STATS[period.value]);

const providers = computed(() => {
  const seen = new Map<string, { provider: string; uptime: number; p50: number; models: number }>();
  for (const m of db.models.filter((x) => x.uptime30d > 0 && !x.ownerTenantId)) {
    const row = seen.get(m.provider) ?? { provider: m.provider, uptime: 100, p50: 0, models: 0 };
    row.uptime = Math.min(row.uptime, m.uptime30d);
    row.p50 = Math.max(row.p50, m.p50Ms);
    row.models += 1;
    seen.set(m.provider, row);
  }
  return [...seen.values()];
});

// PRD FR-I2.1 basic alerts, plus break-glass and backup from §6.5 / FR-A6.
const alerts = [
  { level: 'warning', what: 'Gcore Amsterdam GPU pool degraded — 2 of 16 GPUs unhealthy', since: '42 min', owner: 'Gcore ticket #88213', to: '/root/monitoring?tab=hosted', action: 'Open hosted models' },
  { level: 'warning', what: 'Globex Retail at 100% of its monthly budget — requests throttled', since: '3 d', owner: 'Tenant notified', to: '/root/tenants/t-globex', action: 'Open tenant' },
  { level: 'info', what: 'Break-glass account signed in', since: '5 d', owner: 'Reviewed by Lena Fischer', to: '/root/audit', action: 'Open audit log' },
  { level: 'success', what: 'Nightly backup of configuration and metering store', since: '6 h', owner: 'Last run succeeded', to: '/root/settings?section=data', action: 'Open retention' },
] as const;
// The p0 observability stack named in PR #7 (replacing Prometheus, Grafana and Loki).
const TOOLING = ['Perses dashboards', 'Victoria Logs', 'Victoria Traces', 'Langfuse'];
const VARIANT = { warning: 'warning', info: 'info', success: 'success' } as const;

const sProv = useSort(() => providers.value, { p: (r) => r.provider, n: (r) => r.models, up: (r) => r.uptime, p50: (r) => r.p50 });
</script>

<template>
  <div>
    <PageHeader title="Monitoring" description="Is the gateway answering, how fast, and which providers and pools are healthy.">
      <template #actions>
        <GoButton v-for="t in TOOLING" :key="t" variant="secondary" size="s">
          <template #icon><IconArrowUpRightFromSquare /></template>
          {{ t }}
        </GoButton>
      </template>
    </PageHeader>

    <div class="mon-head">
    <GoTabs class="mon-tabs">
      <GoTabsItem :active="tab === 'overview'" @click="go('overview')">Overview</GoTabsItem>
      <GoTabsItem :active="tab === 'byok'" @click="go('byok')">BYOK billing</GoTabsItem>
      <GoTabsItem :active="tab === 'hosted'" @click="go('hosted')">Hosted models</GoTabsItem>
    </GoTabs>
      <GoSegmentButtonGroup v-model="period" size="s" aria-label="Period">
        <GoSegmentButton v-for="p in PERIODS" :key="p.id" :value="p.id">{{ p.label }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>
    <ByokSpendReport v-if="tab === 'byok'" :period="period" />
    <HostedUtilization v-else-if="tab === 'hosted'" :period="period" />
    <template v-else>
    <div class="tiles">
      <StatTile label="Gateway availability" :value="stats.avail" :hint="`${current.label} · SLO 99.9%`" tone="good" />
      <StatTile label="p95 latency to first token" :value="stats.p95" :hint="`${current.label} · SLO 2.5 s`" tone="good" />
      <StatTile label="Error rate" :value="stats.err" :hint="`${current.label} · 5xx from providers and engines`" />
      <StatTile label="Failovers" :value="String(stats.fo)" :hint="`${current.label} · served by a fallback model`" />
    </div>

    <div class="grid">
      <Card title="p95 latency, ms" :subtitle="current.label"><LineChart :key="period" :points="latency" label="p95 latency" :format="(n) => `${n}`" :height="160" /></Card>
      <Card title="Errors, basis points of requests" :subtitle="current.label"><LineChart :key="period" :points="errors" label="Error rate" :format="(n) => `${n}`" :height="160" /></Card>
    </div>

    <div class="grid">
      <Card title="Providers and pools" flush>
        <GoTable size="sm">
          <GoTableRow header>
            <SortHeader :sort="sProv" k="p">Provider</SortHeader>
            <SortHeader :sort="sProv" k="n">Models</SortHeader>
            <SortHeader :sort="sProv" k="up">Worst uptime 30d</SortHeader>
            <SortHeader :sort="sProv" k="p50">Slowest p50</SortHeader>
          </GoTableRow>
          <GoTableRow v-for="p in sProv.rows.value" :key="p.provider">
            <GoTableCell>{{ p.provider }}</GoTableCell>
            <GoTableCell>{{ p.models }}</GoTableCell>
            <GoTableCell>{{ fmtPct(p.uptime, 2) }}</GoTableCell>
            <GoTableCell>{{ p.p50 }} ms</GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>
      <Card title="Alerts" flush>
        <template #actions><GoButton variant="ghost" size="s" @click="router.push('/root/notifications')">Show all alerts</GoButton></template>
        <GoTable size="sm">
          <GoTableRow v-for="a in alerts" :key="a.what" class="alert-row" @click="router.push(a.to)">
            <GoTableCell><GoStatusTag :variant="VARIANT[a.level]" size="sm">{{ a.level }}</GoStatusTag></GoTableCell>
            <GoTableCell><span class="alert-link">{{ a.what }}</span><span class="sub">{{ a.owner }} · {{ a.action }}</span></GoTableCell>
            <GoTableCell>{{ a.since }}</GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>
    </div>
    </template>
  </div>
</template>

<style scoped>
  .alert-row {
    cursor: pointer;
  }

  .alert-link {
    color: var(--acv-color-glyph-brand);
  }

  .mon-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
