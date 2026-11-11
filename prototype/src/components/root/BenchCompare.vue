<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import ItemPicker from '@/components/ui/ItemPicker.vue';
import { fmtCreditPrice } from '@/lib/format';
import { BENCHMARKS, benchModels, estimateUsd, latestResult, runsOf, startRuns, targetName } from '@/state/benchRuns';
import { db, modelById } from '@/state/db';

/**
 * Selected models against selected suites and benchmarks: the latest score
 * of each pair, pass or fail against the threshold, the best per row, an
 * optional baseline to compare against, and one button to run what is missing.
 */
const { notify } = useNotificationsStore();
const models = ref<string[]>(['m-opus-55', 'm-sonnet-55', 'm-gpt-51', 'm-glm-46', 'm-qwen3-coder']);
const targets = ref<string[]>(['b-coding', 'b-review', 'b-tools', 'b-extract', 'b-summ', 'bm-mmlu-pro', 'bm-gpqa']);
const baseline = ref('');
const show = ref<'score' | 'delta'>('score');

const modelItems = computed(() => benchModels().map((m) => ({ id: m.id, label: m.name, group: m.family, sub: m.provider, meta: m.state === 'ga' ? '' : m.state })));
const targetItems = computed(() => [
  ...db.suites.map((s) => ({ id: s.id, label: s.name, group: 'Suites', sub: s.scenario, meta: `pass at ${s.threshold}` })),
  ...BENCHMARKS.map((b) => ({ id: b.id, label: b.name, group: b.suiteIds.length ? 'Benchmarks in a suite' : 'Standalone benchmarks', sub: `${b.source} · ${b.metric}`, meta: b.threshold !== undefined ? `pass at ${b.threshold}` : '' })),
]);
const cols = computed(() => models.value.map((id) => modelById(id)).filter((m) => !!m));
const thresholdOf = (id: string) => db.suites.find((s) => s.id === id)?.threshold ?? BENCHMARKS.find((b) => b.id === id)?.threshold;
const isSuite = (id: string) => db.suites.some((s) => s.id === id);
const busy = (modelId: string, id: string) => runsOf(modelId).some((r) => r.suiteId === id && ['queued', 'running'].includes(r.status));
const score = (modelId: string, id: string) => latestResult(modelId, id)?.score;

const rows = computed(() => targets.value.map((id) => {
  const scores = cols.value.map((m) => score(m.id, id));
  const known = scores.filter((x): x is number => x !== undefined);
  return { id, name: targetName(id), suite: isSuite(id), threshold: thresholdOf(id), scores, best: known.length > 1 ? Math.max(...known) : undefined };
}));
// Per model: how many it passes, how many rows it leads, its average rank among those that ran.
const summary = computed(() => cols.value.map((m, ci) => {
  let passes = 0, gated = 0, wins = 0, rankSum = 0, ranked = 0;
  for (const r of rows.value) {
    const s = r.scores[ci];
    if (s === undefined) continue;
    if (r.threshold !== undefined) { gated++; if (s >= r.threshold) passes++; }
    if (r.best !== undefined && s === r.best) wins++;
    const known = r.scores.filter((x): x is number => x !== undefined).sort((a, b) => b - a);
    rankSum += known.indexOf(s) + 1; ranked++;
  }
  return { m, passes, gated, wins, avgRank: ranked ? rankSum / ranked : undefined, ran: ranked };
}));
const baseIdx = computed(() => cols.value.findIndex((m) => m.id === baseline.value));
const cell = (ri: number, ci: number) => {
  const r = rows.value[ri]!;
  const s = r.scores[ci];
  if (s === undefined) return { text: '', cls: 'none' };
  const pass = r.threshold === undefined ? 'neutral' : s >= r.threshold ? 'pass' : 'fail';
  if (show.value === 'delta' && baseIdx.value >= 0 && ci !== baseIdx.value) {
    const b = r.scores[baseIdx.value];
    if (b !== undefined) return { text: `${s - b > 0 ? '+' : ''}${s - b}`, cls: `${pass} ${s - b > 0 ? 'up' : s - b < 0 ? 'down' : ''}` };
  }
  return { text: String(s), cls: pass };
};

const missing = computed(() => {
  const out: { modelId: string; id: string }[] = [];
  for (const m of cols.value) for (const id of targets.value) if (score(m.id, id) === undefined && !busy(m.id, id)) out.push({ modelId: m.id, id });
  return out;
});
function runMissing(): void {
  const byModel = new Map<string, string[]>();
  for (const x of missing.value) byModel.set(x.modelId, [...(byModel.get(x.modelId) ?? []), x.id]);
  let usd = 0;
  for (const [modelId, ids] of byModel) {
    const suites = ids.filter(isSuite);
    const benches = ids.filter((i) => !isSuite(i));
    usd += estimateUsd(suites, benches);
    startRuns(modelId, suites, 'Victor Batraev', undefined, benches);
  }
  notify(`${missing.value.length} runs queued on ${byModel.size} models, about $${usd}. Cells fill in as each finishes.`, 'info', 'Running what is missing');
}
function exportCsv(): void {
  notify(`${rows.value.length} rows × ${cols.value.length} models exported as benchmark-comparison.csv.`, 'success', 'Exported');
}
</script>

<template>
  <div>
    <div class="pickers">
      <Card :title="`Models · ${models.length}`" subtitle="Columns">
        <ItemPicker v-model="models" ordered :items="modelItems" placeholder="Search models" noun="models" :max-height="220" />
      </Card>
      <Card :title="`Suites and benchmarks · ${targets.length}`" subtitle="Rows">
        <ItemPicker v-model="targets" ordered :items="targetItems" placeholder="Search suites and benchmarks" noun="benchmarks" :max-height="220" />
      </Card>
    </div>

    <Card title="Comparison" :subtitle="`Latest finished result of each pair · ${missing.length ? `${missing.length} not run yet` : 'every pair has a result'}`" flush class="spaced">
      <template #actions>
        <div class="actions">
          <GoSelect v-model="baseline" size="m" aria-label="Baseline" class="base">
            <GoSelectOption value="">No baseline</GoSelectOption>
            <GoSelectOption v-for="m in cols" :key="m.id" :value="m.id">Baseline: {{ m.name }}</GoSelectOption>
          </GoSelect>
          <GoSegmentButtonGroup v-model="show" size="s" aria-label="Show">
            <GoSegmentButton value="score">Scores</GoSegmentButton>
            <GoSegmentButton value="delta" :disabled="!baseline">Difference</GoSegmentButton>
          </GoSegmentButtonGroup>
          <GoButton variant="secondary" size="s" @click="exportCsv">Export CSV</GoButton>
          <GoButton size="s" :disabled="!missing.length" @click="runMissing">Run missing ({{ missing.length }})</GoButton>
        </div>
      </template>
      <div v-if="cols.length && rows.length" class="scroll">
        <table class="matrix">
          <thead>
            <tr>
              <th class="first">Suite or benchmark</th>
              <th>Pass at</th>
              <th v-for="m in cols" :key="m.id" :class="{ base: m.id === baseline }"><RouterLink :to="`/root/models/${m.id}?tab=benchmarks`">{{ m.name }}</RouterLink><span class="sub">{{ m.provider }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, ri) in rows" :key="r.id">
              <td class="first"><RouterLink :to="`/root/benchmarks/${r.suite ? 'suites' : 'benchmarks'}/${r.id}`">{{ r.name }}</RouterLink><span class="sub">{{ r.suite ? 'Suite' : 'Benchmark' }}</span></td>
              <td class="thr">{{ r.threshold ?? '—' }}</td>
              <td v-for="(m, ci) in cols" :key="m.id" class="cell" :class="[cell(ri, ci).cls, { best: r.best !== undefined && r.scores[ci] === r.best, base: m.id === baseline }]">
                <template v-if="r.scores[ci] !== undefined">{{ cell(ri, ci).text }}<span v-if="r.best !== undefined && r.scores[ci] === r.best" class="crown" title="Best in this row">★</span></template>
                <span v-else-if="busy(m.id, r.id)" class="sub">running…</span>
                <span v-else class="sub">not run</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="first">Passes</td><td />
              <td v-for="x in summary" :key="x.m.id" class="cell">{{ x.gated ? `${x.passes} of ${x.gated}` : '—' }}</td>
            </tr>
            <tr>
              <td class="first">Best in row</td><td />
              <td v-for="x in summary" :key="x.m.id" class="cell">{{ x.wins }}</td>
            </tr>
            <tr>
              <td class="first">Average rank</td><td />
              <td v-for="x in summary" :key="x.m.id" class="cell">{{ x.avgRank !== undefined ? x.avgRank.toFixed(1) : '—' }}<span class="sub">{{ x.ran }} of {{ rows.length }} ran</span></td>
            </tr>
            <tr>
              <td class="first">Credits per 1M, in / out</td><td />
              <td v-for="x in summary" :key="x.m.id" class="cell">{{ fmtCreditPrice(x.m.priceIn) }} / {{ fmtCreditPrice(x.m.priceOut) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p v-else class="empty">Pick at least one model and one suite or benchmark.</p>
    </Card>
  </div>
</template>

<style scoped>
  .pickers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .base {
    min-inline-size: 220px;
  }

  .scroll {
    overflow-x: auto;
  }

  .matrix {
    @mixin acv-text-ui-body-2;
    inline-size: 100%;
    border-collapse: collapse;

    & th,
    & td {
      padding: var(--acv-spacing-x-small) var(--acv-spacing-small);
      border-block-end: var(--acv-border-light);
      text-align: center;
      vertical-align: top;
    }

    & th {
      @mixin acv-text-ui-caption-1;
      color: var(--acv-color-glyph-secondary);
      font-weight: 500;
    }

    & .first {
      position: sticky;
      inset-inline-start: 0;
      min-inline-size: 220px;
      background: var(--acv-color-surface-primary);
      text-align: start;
    }

    & tfoot td {
      @mixin acv-text-ui-caption-1;
      background: var(--acv-color-surface-secondary);
    }

    & tfoot .first {
      background: var(--acv-color-surface-secondary);
    }
  }

  .thr {
    color: var(--acv-color-glyph-tertiary);
  }

  .cell {
    min-inline-size: 110px;
    font-variant-numeric: tabular-nums;

    &.pass {
      background: color-mix(in srgb, var(--acv-color-status-success-strong, #16a34a) 12%, transparent);
    }

    &.fail {
      background: color-mix(in srgb, var(--acv-color-status-danger-strong) 12%, transparent);
    }

    &.up {
      color: var(--acv-color-status-success-strong, #16a34a);
    }

    &.down {
      color: var(--acv-color-status-danger-strong);
    }

    &.best {
      font-weight: 600;
    }

    &.base {
      outline: 2px solid var(--acv-color-glyph-brand);
      outline-offset: -2px;
    }
  }

  th.base {
    color: var(--acv-color-glyph-brand);
  }

  .crown {
    margin-inline-start: 4px;
    color: var(--acv-color-status-warning-strong, #d97706);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
    font-weight: 400;
  }

  .empty {
    @mixin acv-text-ui-body-2;
    margin: 0;
    padding: var(--acv-spacing-regular);
    color: var(--acv-color-glyph-tertiary);
  }
</style>
