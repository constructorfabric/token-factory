<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoStatusTag } from '@constructor/ui/status-tag';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import RunBenchmarkDialog from '@/components/root/RunBenchmarkDialog.vue';
import Card from '@/components/ui/Card.vue';
import LifecycleTag from '@/components/ui/LifecycleTag.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { fmtDateTime } from '@/lib/format';
import { SCORERS, SOURCE_KINDS } from '@/data/benchCatalog';
import { benchModels, benchmarkById, setupOf, latestResult, membersOf, runsFor, runsOf, targetName } from '@/state/benchRuns';
import { db, modelById } from '@/state/db';

/** One suite or one benchmark: what it is, how every model does on it, and every run. */
const route = useRoute();
const router = useRouter();
const kind = computed<'suite' | 'benchmark'>(() => (route.params.kind === 'suites' ? 'suite' : 'benchmark'));
const id = computed(() => String(route.params.id));
const suite = computed(() => (kind.value === 'suite' ? db.suites.find((s) => s.id === id.value) : undefined));
const bench = computed(() => (kind.value === 'benchmark' ? benchmarkById(id.value) : undefined));
const name = computed(() => suite.value?.name ?? bench.value?.name);
const setup = computed(() => (bench.value ? setupOf(bench.value) : undefined));
const threshold = computed(() => suite.value?.threshold ?? bench.value?.threshold);

const results = computed(() =>
  benchModels()
    .map((m) => ({ m, last: latestResult(m.id, id.value), busy: runsOf(m.id).some((r) => r.suiteId === id.value && ['queued', 'running'].includes(r.status)) }))
    .sort((a, b) => (b.last?.score ?? -1) - (a.last?.score ?? -1)),
);
const history = computed(() => runsFor(id.value));
const RUN_TAG = { queued: 'disabled', running: 'info', passed: 'success', failed: 'error', done: 'info' } as const;

const runOpen = ref(false);
const preselect = ref<string[]>([]);
function run(modelId?: string): void {
  preselect.value = modelId ? [modelId] : [];
  runOpen.value = true;
}
const back = () => router.push(`/root/benchmarks?tab=${kind.value === 'suite' ? 'suites' : 'benchmarks'}`);
</script>

<template>
  <div v-if="suite || bench">
    <PageHeader :title="name ?? ''" back :description="suite ? `Suite · ${suite.scenario}` : `Benchmark · ${bench?.description}`" @back="back">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="router.push(`/root/benchmarks/${kind === 'suite' ? 'suites' : 'benchmarks'}/${id}/edit`)">Edit</GoButton>
        <GoButton size="m" @click="run()">Run on models</GoButton>
      </template>
    </PageHeader>

    <div class="grid">
      <Card title="Details">
        <GoDescriptionList v-if="suite">
          <GoDescriptionListItem><template #name>Pass threshold</template><template #value>≥ {{ suite.threshold }} — alias gates read this</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Scoring</template><template #value>{{ suite.scoring }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Cases</template><template #value>{{ suite.cases }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Owner</template><template #value>{{ suite.owner }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Version</template><template #value>{{ suite.version }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Data</template><template #value><GoTag v-if="suite.privateData" size="s" color="orange">private company data</GoTag><span v-else>Public</span></template></GoDescriptionListItem>
        </GoDescriptionList>
        <GoDescriptionList v-else-if="bench">
          <GoDescriptionListItem><template #name>Source</template><template #value>{{ bench.source }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Cases</template><template #value>{{ bench.cases }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Metric</template><template #value>{{ bench.metric }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Pass threshold</template><template #value>{{ bench.threshold !== undefined ? `≥ ${bench.threshold}` : 'None — evidence, not a gate' }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Source</template><template #value>{{ SOURCE_KINDS.find((x) => x.id === setup!.origin.kind)?.label }}<span class="sub">{{ setup!.origin.format ? `${setup!.origin.format} · ` : '' }}{{ setup!.origin.ref }}{{ setup!.origin.revision ? ` @ ${setup!.origin.revision}` : '' }}{{ setup!.origin.split ? ` · ${setup!.origin.split}` : '' }}</span></template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Scorer</template><template #value>{{ SCORERS.find((x) => x.id === setup!.scorer.kind)?.label }} · {{ setup!.scorer.aggregate }}<span class="sub">{{ setup!.scorer.detail }}{{ setup!.scorer.judgeModelId ? ` · judge ${modelById(setup!.scorer.judgeModelId)?.name}` : '' }}</span></template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Task</template><template #value>Temperature {{ setup!.task.temperature }} · up to {{ setup!.task.maxTokens }} tokens · {{ setup!.task.samples }} {{ setup!.task.samples === 1 ? 'sample' : 'samples' }} per case<span class="sub">{{ setup!.task.tools === 'none' ? 'No tools' : setup!.task.tools === 'case' ? 'Tools from each case' : 'MCP servers in a sandbox' }} · {{ setup!.task.sampleSize ? `random ${setup!.task.sampleSize} cases` : 'every case' }}</span></template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Owner · version</template><template #value>{{ setup!.owner }} · {{ setup!.version }}<GoTag v-if="setup!.privateData" size="s" color="orange">private data</GoTag></template></GoDescriptionListItem>
        </GoDescriptionList>
      </Card>

      <Card v-if="suite" title="Benchmarks in this suite" :subtitle="`${membersOf(suite.id).length} benchmarks; a suite run runs them all`">
        <ul class="list">
          <li v-for="b in membersOf(suite.id)" :key="b.id"><RouterLink :to="`/root/benchmarks/benchmarks/${b.id}`">{{ b.name }}</RouterLink><span class="sub">{{ b.source }} · {{ b.cases }} cases · {{ b.metric }}</span></li>
        </ul>
      </Card>
      <Card v-else-if="bench" title="Part of" :subtitle="bench.suiteIds.length ? 'A run of any of these suites runs it too' : 'Standalone: runs only on its own'">
        <ul class="list">
          <li v-for="sid in bench.suiteIds" :key="sid"><RouterLink :to="`/root/benchmarks/suites/${sid}`">{{ targetName(sid) }}</RouterLink></li>
          <li v-if="!bench.suiteIds.length" class="sub">No suite.</li>
        </ul>
      </Card>
    </div>

    <Card title="Results by model" :subtitle="threshold !== undefined ? `Latest finished run per model · pass at ${threshold}` : 'Latest finished run per model'" flush class="spaced">
      <GoTable size="sm">
        <GoTableRow header>
          <GoTableCell>Model</GoTableCell>
          <GoTableCell>Score</GoTableCell>
          <GoTableCell>Last run</GoTableCell>
          <GoTableCell width="110" />
        </GoTableRow>
        <GoTableRow v-for="r in results" :key="r.m.id">
          <GoTableCell><RouterLink :to="`/root/models/${r.m.id}?tab=benchmarks`">{{ r.m.name }}</RouterLink> <LifecycleTag :state="r.m.state" :ring="r.m.ring" /></GoTableCell>
          <GoTableCell>
            <GoStatusTag v-if="r.last" :variant="RUN_TAG[r.last.status]" size="sm">{{ r.last.score }}</GoStatusTag>
            <span v-else class="sub">Not run</span>
          </GoTableCell>
          <GoTableCell>{{ r.last ? fmtDateTime(r.last.at) : '—' }}</GoTableCell>
          <GoTableCell>
            <span v-if="r.busy" class="sub">Running…</span>
            <GoButton v-else variant="ghost" size="s" @click="run(r.m.id)">Run</GoButton>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <Card title="History" :subtitle="`${history.length} runs, newest first`" flush class="spaced">
      <GoTable size="sm">
        <GoTableRow header>
          <GoTableCell>When</GoTableCell>
          <GoTableCell>Model</GoTableCell>
          <GoTableCell>Result</GoTableCell>
          <GoTableCell>Version</GoTableCell>
          <GoTableCell>Cost</GoTableCell>
          <GoTableCell>Started by</GoTableCell>
        </GoTableRow>
        <GoTableRow v-for="r in history" :key="r.id">
          <GoTableCell>{{ fmtDateTime(r.at) }}</GoTableCell>
          <GoTableCell>{{ modelById(r.modelId)?.name }}</GoTableCell>
          <GoTableCell><GoStatusTag :variant="RUN_TAG[r.status]" size="sm">{{ r.score !== undefined ? `${r.score} · ${r.status}` : r.status }}</GoStatusTag></GoTableCell>
          <GoTableCell>{{ r.suiteVersion }}</GoTableCell>
          <GoTableCell>${{ r.costUsd }}</GoTableCell>
          <GoTableCell>{{ r.by }}</GoTableCell>
        </GoTableRow>
        <GoTableRow v-if="!history.length"><GoTableCell :colspan="6"><span class="sub">No runs yet.</span></GoTableCell></GoTableRow>
      </GoTable>
    </Card>

    <RunBenchmarkDialog v-model="runOpen" :kind="kind" :target-id="id" :preselect="preselect" />
  </div>
</template>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .list {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
