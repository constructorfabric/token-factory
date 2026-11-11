<script setup lang="ts">
import { GoProgressBar } from '@constructor/ui/progress-bar';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed, ref } from 'vue';
import LineChart from '@/components/charts/LineChart.vue';
import Card from '@/components/ui/Card.vue';
import StatTile from '@/components/ui/StatTile.vue';
import UsageMeter from '@/components/ui/UsageMeter.vue';
import { HOSTED } from '@/data/monitoring';
import { fmtInt, fmtPct } from '@/lib/format';
import { db, modelById } from '@/state/db';
import { periodOf, type PeriodId } from '@/lib/period';

/**
 * Hosted models against their limits: throughput against capacity, KV cache
 * and GPU memory, concurrency against the sequence limit, queueing and latency
 * against the SLO, replicas against the scaling ceiling.
 */
const props = withDefaults(defineProps<{ period?: PeriodId }>(), { period: 'today' });
const current = computed(() => periodOf(props.period));
const rows = computed(() => HOSTED.map((h) => {
  const d = db.deployments.find((x) => x.id === h.deploymentId)!;
  const capacityNow = h.capacityTps * Math.max(1, d.replicas);
  const capacityMax = h.capacityTps * d.maxReplicas;
  return { h, d, model: modelById(d.modelId), cluster: db.clusters.find((c) => c.id === d.clusterId), capacityNow, capacityMax, load: Math.round((d.tps / capacityNow) * 100), headroom: Math.max(0, Math.round(100 - (d.tps / capacityMax) * 100)) };
}));
const selectedId = ref(HOSTED[0]!.deploymentId);
const sel = computed(() => rows.value.find((r) => r.h.deploymentId === selectedId.value)!);
const dayPoints = computed(() => {
  const h = sel.value.h;
  if (props.period === 'today') return h.day.map((v, i) => ({ label: `${String(i).padStart(2, '0')}:00`, value: v }));
  const avg = h.day.reduce((s, v) => s + v, 0) / h.day.length;
  return Array.from({ length: current.value.days }, (_, i) => {
    const d = new Date(Date.UTC(2026, 10, 10 - (current.value.days - 1 - i)));
    const weekend = [0, 6].includes(d.getUTCDay());
    return { label: d.toISOString().slice(5, 10), value: Math.round(Math.min(99, avg * (weekend ? 0.55 : 1.05) * (0.9 + (i / current.value.days) * 0.2))) };
  });
});
const tone = (pct: number) => (pct >= 90 ? 'error' : pct >= 75 ? 'warning' : 'default');
const verdict = computed(() => {
  const r = sel.value;
  if (r.h.kvCache >= 85 || r.load >= 90) return { text: 'Saturated at peak: requests queue and first-token time breaks the SLO. Add a replica or raise the maximum.', tone: 'bad' };
  if (r.load < 25 && r.d.replicas > 0) return { text: 'Mostly idle: consider scaling to zero or fewer GPUs per replica.', tone: 'info' };
  return { text: 'Within limits, with room to grow.', tone: 'good' };
});
</script>

<template>
  <div class="hosted">
    <Card title="Deployments against their limits" :subtitle="`Now, and the busiest hour ${period === 'today' ? 'today' : current.label.toLowerCase()}`" flush>
      <GoTable size="sm">
        <GoTableRow header>
          <GoTableCell>Model</GoTableCell>
          <GoTableCell width="180">Throughput vs capacity</GoTableCell>
          <GoTableCell width="140">KV cache</GoTableCell>
          <GoTableCell width="140">Concurrency</GoTableCell>
          <GoTableCell>First token p95</GoTableCell>
          <GoTableCell>Replicas</GoTableCell>
        </GoTableRow>
        <GoTableRow v-for="r in rows" :key="r.h.deploymentId" class="row" :class="{ row_on: r.h.deploymentId === selectedId }" @click="selectedId = r.h.deploymentId">
          <GoTableCell>{{ r.model?.name }}<span class="sub">{{ r.cluster?.name }} · {{ r.d.gpusPerReplica }} GPUs × {{ r.d.replicas }}</span></GoTableCell>
          <GoTableCell><span class="cell-main">{{ fmtInt(r.d.tps) }} / {{ fmtInt(r.capacityNow) }} tok/s</span><GoProgressBar :value="Math.min(100, r.load)" :max="100" :variant="tone(r.load)" /></GoTableCell>
          <GoTableCell><span class="cell-main">{{ r.h.kvCache }}%</span><GoProgressBar :value="r.h.kvCache" :max="100" :variant="tone(r.h.kvCache)" /></GoTableCell>
          <GoTableCell><span class="cell-main">{{ r.h.inFlight }} / {{ r.h.maxSeqs }}</span><GoProgressBar :value="(r.h.inFlight / r.h.maxSeqs) * 100" :max="100" :variant="tone((r.h.inFlight / r.h.maxSeqs) * 100)" /></GoTableCell>
          <GoTableCell><span :class="{ over: r.h.ttftP95Ms > r.h.ttftSloMs }">{{ fmtInt(r.h.ttftP95Ms) }} ms</span><span class="sub">SLO {{ fmtInt(r.h.ttftSloMs) }} ms</span></GoTableCell>
          <GoTableCell>{{ r.d.replicas }} of {{ r.d.maxReplicas }}<span class="sub">{{ r.headroom }}% headroom at max</span></GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <h2 class="detail-title">{{ sel.model?.name }}</h2>
    <p class="verdict" :class="`verdict_${verdict.tone}`">{{ verdict.text }}</p>
    <div class="tiles">
      <StatTile label="Load now" :value="fmtPct(sel.load, 0)" :hint="`${fmtInt(sel.d.tps)} of ${fmtInt(sel.capacityNow)} tok/s`" :tone="sel.load >= 90 ? 'warn' : 'neutral'" />
      <StatTile label="Queue wait p95" :value="`${fmtInt(sel.h.queueP95Ms)} ms`" :hint="sel.h.queueP95Ms > 500 ? 'Requests wait for a slot' : 'No queueing to speak of'" :tone="sel.h.queueP95Ms > 500 ? 'warn' : 'good'" />
      <StatTile label="Errors" :value="fmtPct(sel.h.errorRate, 1)" :hint="current.label" />
      <StatTile label="GPU memory" :value="`${sel.h.gpuMemory}%`" hint="Weights + KV cache" />
    </div>
    <div class="two">
      <Card :title="period === 'today' ? 'Utilization today' : `Utilization, ${current.label.toLowerCase()}`" :subtitle="period === 'today' ? 'Share of capacity in use, per hour' : 'Average share of capacity in use, per day'">
        <LineChart :key="period" :points="dayPoints" label="Utilization" :format="(n) => `${n}%`" />
      </Card>
      <Card title="Limits" subtitle="What stops it serving more">
        <UsageMeter label="Throughput, now" :used="sel.d.tps" :limit="sel.capacityNow" :format="(n) => `${fmtInt(n)} tok/s`" />
        <UsageMeter label="Throughput, at max replicas" :used="sel.d.tps" :limit="sel.capacityMax" :format="(n) => `${fmtInt(n)} tok/s`" />
        <UsageMeter label="KV cache" :used="sel.h.kvCache" :limit="100" :format="(n) => `${n}%`" />
        <UsageMeter label="Concurrent sequences" :used="sel.h.inFlight" :limit="sel.h.maxSeqs" :format="fmtInt" />
        <UsageMeter label="Replicas" :used="sel.d.replicas" :limit="sel.d.maxReplicas" :format="fmtInt" />
        <UsageMeter label="GPUs at the provider" :used="sel.cluster?.gpusUsed ?? 0" :limit="sel.cluster?.gpus ?? 0" :format="fmtInt" />
      </Card>
    </div>
  </div>
</template>

<style scoped>
  .row {
    cursor: pointer;
  }

  .row_on {
    background: var(--acv-color-surface-secondary);
  }

  .cell-main {
    display: block;
  }

  .over {
    color: var(--acv-color-status-danger-strong);
  }

  .detail-title {
    @mixin acv-text-subheading-3;
    margin: var(--acv-spacing-large) 0 var(--acv-spacing-x-small);
  }

  .verdict {
    @mixin acv-text-ui-body-2;
    margin: 0 0 var(--acv-spacing-regular);

    &.verdict_bad {
      color: var(--acv-color-status-danger-strong);
    }

    &.verdict_good {
      color: var(--acv-color-status-success-strong, #16a34a);
    }

    &.verdict_info {
      color: var(--acv-color-glyph-secondary);
    }
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
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
