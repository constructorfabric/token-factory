<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoInput } from '@constructor/ui/input';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoStatusTag } from '@constructor/ui/status-tag';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IconPlus, IconSearch } from '@/components/icons';
import BarList from '@/components/charts/BarList.vue';
import BenchCompare from '@/components/root/BenchCompare.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import { fmtDateTime } from '@/lib/format';
import { useSort } from '@/lib/useSort';
import { BENCHMARKS, benchModels, latestResult, membersOf, recentRuns, runsFor, targetName } from '@/state/benchRuns';
import { db, modelById } from '@/state/db';

/**
 * Benchmarks: an overview (who leads on what, and what ran lately), the
 * suites (groups of benchmarks with a pass threshold, which alias gates
 * read), and the individual benchmarks, in a suite or standalone.
 */
const route = useRoute();
const router = useRouter();
const tab = computed(() => (['suites', 'benchmarks', 'compare'].includes(String(route.query.tab)) ? String(route.query.tab) : 'overview'));
const go = (t: string) => router.replace({ query: t === 'overview' ? {} : { tab: t } });

// ---- overview
const target = ref('b-coding');
const targetThreshold = computed(() => db.suites.find((s) => s.id === target.value)?.threshold ?? BENCHMARKS.find((b) => b.id === target.value)?.threshold);
const leaderboard = computed(() =>
  benchModels()
    .map((m) => ({ m, score: latestResult(m.id, target.value)?.score }))
    .filter((x) => x.score !== undefined)
    .map((x) => ({ label: x.m.name, value: x.score!, hint: `${Math.round(x.m.priceOut * 100)} credits per 1M out` }))
    .sort((a, b) => b.value - a.value),
);
const recent = computed(() => recentRuns(14));
const RUN_TAG = { queued: 'disabled', running: 'info', passed: 'success', failed: 'error', done: 'info' } as const;

// ---- suites
const passing = (suiteId: string, threshold: number) => benchModels().filter((m) => (m.scores[suiteId] ?? -1) >= threshold).length;
const lastRun = (id: string) => runsFor(id)[0];
const sSuite = useSort(() => db.suites, { name: (r) => r.name, n: (r) => membersOf(r.id).length, thr: (r) => r.threshold, pass: (r) => passing(r.id, r.threshold), owner: (r) => r.owner, last: (r) => lastRun(r.id)?.at ?? '' });

// ---- benchmarks
const query = ref('');
const scope = ref<'all' | 'in-suite' | 'standalone'>('all');
const benches = computed(() => {
  const q = query.value.trim().toLowerCase();
  return BENCHMARKS.filter((b) => (scope.value === 'all' || (scope.value === 'standalone' ? !b.suiteIds.length : b.suiteIds.length > 0)) && (!q || `${b.name} ${b.description} ${b.metric}`.toLowerCase().includes(q)));
});
const sBench = useSort(() => benches.value, { name: (r) => r.name, part: (r) => r.suiteIds.map(targetName).join(), src: (r) => r.source, cases: (r) => r.cases, thr: (r) => r.threshold ?? -1, last: (r) => lastRun(r.id)?.at ?? '' });

const create = (kind: 'suite' | 'benchmark') => router.push(kind === 'suite' ? '/root/benchmarks/suites/new' : '/root/benchmarks/benchmarks/new');
const open = (kind: 'suites' | 'benchmarks', id: string) => router.push(`/root/benchmarks/${kind}/${id}`);
</script>

<template>
  <div>
    <PageHeader title="Benchmarks" description="Suites group benchmarks under one pass threshold, which alias gates read; single benchmarks add evidence. Every run is kept.">
      <template #actions>
        <GoButton v-if="tab !== 'benchmarks' && tab !== 'compare'" :variant="tab === 'suites' ? 'primary' : 'secondary'" size="m" @click="create('suite')"><template #icon><IconPlus /></template>New suite</GoButton>
        <GoButton v-if="tab !== 'suites' && tab !== 'compare'" :variant="tab === 'benchmarks' ? 'primary' : 'secondary'" size="m" @click="create('benchmark')"><template #icon><IconPlus /></template>New benchmark</GoButton>
      </template>
    </PageHeader>

    <GoTabs class="tabs">
      <GoTabsItem :active="tab === 'overview'" @click="go('overview')">Overview</GoTabsItem>
      <GoTabsItem :active="tab === 'suites'" @click="go('suites')">Suites · {{ db.suites.length }}</GoTabsItem>
      <GoTabsItem :active="tab === 'benchmarks'" @click="go('benchmarks')">Benchmarks · {{ BENCHMARKS.length }}</GoTabsItem>
      <GoTabsItem :active="tab === 'compare'" @click="go('compare')">Compare</GoTabsItem>
    </GoTabs>

    <!-- Overview: who leads, and what ran lately -->
    <div v-if="tab === 'overview'" class="grid">
      <Card title="Leaderboard" :subtitle="targetThreshold !== undefined ? `Latest score per model · pass at ${targetThreshold}` : 'Latest score per model · no threshold'">
        <template #actions>
          <GoSelect v-model="target" size="m" aria-label="Suite or benchmark" class="target-select">
            <GoSelectOption v-for="s in db.suites" :key="s.id" :value="s.id">{{ s.name }}<template #description>Suite</template></GoSelectOption>
            <GoSelectOption v-for="b in BENCHMARKS" :key="b.id" :value="b.id">{{ b.name }}<template #description>Benchmark{{ b.suiteIds.length ? '' : ' · standalone' }}</template></GoSelectOption>
          </GoSelect>
        </template>
        <BarList v-if="leaderboard.length" :items="leaderboard" :format="(n) => String(n)" />
        <p v-else class="sub">No model has a result yet.</p>
        <RouterLink :to="`/root/benchmarks/${db.suites.some((s) => s.id === target) ? 'suites' : 'benchmarks'}/${target}`" class="sub link">Open {{ targetName(target) }}</RouterLink>
      </Card>

      <Card title="Recent runs" flush>
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>Model</GoTableCell>
            <GoTableCell>Suite or benchmark</GoTableCell>
            <GoTableCell>Result</GoTableCell>
          </GoTableRow>
          <GoTableRow v-for="r in recent" :key="r.id">
            <GoTableCell><RouterLink :to="`/root/models/${r.modelId}?tab=benchmarks`">{{ modelById(r.modelId)?.name }}</RouterLink><span class="sub">{{ fmtDateTime(r.at) }} · {{ r.by }}</span></GoTableCell>
            <GoTableCell><RouterLink :to="`/root/benchmarks/${r.kind === 'suite' ? 'suites' : 'benchmarks'}/${r.suiteId}`">{{ targetName(r.suiteId) }}</RouterLink><span class="sub">{{ r.kind === 'suite' ? 'Suite' : 'Benchmark' }}</span></GoTableCell>
            <GoTableCell><GoStatusTag :variant="RUN_TAG[r.status]" size="sm">{{ r.score !== undefined ? `${r.score} · ${r.status}` : r.status }}</GoStatusTag></GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>
    </div>

    <!-- Suites -->
    <Card v-else-if="tab === 'suites'" title="Suites" subtitle="Open one to edit it, run it on models, or see its history." flush>
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sSuite" k="name">Suite</SortHeader>
          <SortHeader :sort="sSuite" k="n">Benchmarks</SortHeader>
          <SortHeader :sort="sSuite" k="thr">Pass at</SortHeader>
          <SortHeader :sort="sSuite" k="pass">Models passing</SortHeader>
          <SortHeader :sort="sSuite" k="owner">Owner</SortHeader>
          <SortHeader :sort="sSuite" k="last">Last run</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="s in sSuite.rows.value" :key="s.id" class="row-link" @click="open('suites', s.id)">
          <GoTableCell><GoTableName>{{ s.name }}</GoTableName><span class="sub">{{ s.scenario }} · {{ s.version }}</span></GoTableCell>
          <GoTableCell>{{ membersOf(s.id).length }}<span class="sub">{{ s.cases }} cases</span></GoTableCell>
          <GoTableCell>≥ {{ s.threshold }}</GoTableCell>
          <GoTableCell>{{ passing(s.id, s.threshold) }} of {{ benchModels().length }}</GoTableCell>
          <GoTableCell>{{ s.owner }} <GoTag v-if="s.privateData" size="s" color="orange">private data</GoTag></GoTableCell>
          <GoTableCell>{{ lastRun(s.id) ? fmtDateTime(lastRun(s.id)!.at) : '—' }}</GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <BenchCompare v-else-if="tab === 'compare'" />

    <!-- Benchmarks -->
    <template v-else>
      <div class="toolbar">
        <GoInput v-model="query" size="m" placeholder="Search benchmarks" clearable class="search">
          <template #prefix><IconSearch /></template>
        </GoInput>
        <GoSegmentButtonGroup v-model="scope" size="s" aria-label="Show">
          <GoSegmentButton value="all">All</GoSegmentButton>
          <GoSegmentButton value="in-suite">In a suite</GoSegmentButton>
          <GoSegmentButton value="standalone">Standalone</GoSegmentButton>
        </GoSegmentButtonGroup>
      </div>
      <Card title="Benchmarks" subtitle="Open one to edit it, run it on models, or see its history." flush>
        <GoTable>
          <GoTableRow header>
            <SortHeader :sort="sBench" k="name">Benchmark</SortHeader>
            <SortHeader :sort="sBench" k="part">Part of</SortHeader>
            <SortHeader :sort="sBench" k="src">Source</SortHeader>
            <SortHeader :sort="sBench" k="cases">Cases</SortHeader>
            <SortHeader :sort="sBench" k="thr">Pass at</SortHeader>
            <SortHeader :sort="sBench" k="last">Last run</SortHeader>
          </GoTableRow>
          <GoTableRow v-for="b in sBench.rows.value" :key="b.id" class="row-link" @click="open('benchmarks', b.id)">
            <GoTableCell><GoTableName>{{ b.name }}</GoTableName><span class="sub">{{ b.description }}</span></GoTableCell>
            <GoTableCell>{{ b.suiteIds.map(targetName).join(', ') || 'Standalone' }}</GoTableCell>
            <GoTableCell><GoTag size="s" :color="b.source === 'public' ? 'blue' : 'neutral'">{{ b.source }}</GoTag></GoTableCell>
            <GoTableCell>{{ b.cases }}<span class="sub">{{ b.metric }}</span></GoTableCell>
            <GoTableCell>{{ b.threshold !== undefined ? `≥ ${b.threshold}` : '—' }}</GoTableCell>
            <GoTableCell>{{ lastRun(b.id) ? fmtDateTime(lastRun(b.id)!.at) : '—' }}</GoTableCell>
          </GoTableRow>
          <GoTableRow v-if="!benches.length"><GoTableCell :colspan="6"><span class="sub">No benchmark matches.</span></GoTableCell></GoTableRow>
        </GoTable>
      </Card>
    </template>

  </div>
</template>

<style scoped>
  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .search {
    max-inline-size: 360px;
  }

  .row-link {
    cursor: pointer;

    &:hover {
      background: var(--acv-color-surface-secondary);
    }
  }

  .target-select {
    min-inline-size: 240px;
  }

  .link {
    margin-block-start: var(--acv-spacing-small);
    color: var(--acv-color-glyph-brand);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
