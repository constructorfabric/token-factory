<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import ItemPicker from '@/components/ui/ItemPicker.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { CATALOG, OBS_DATASETS, SCORERS, SOURCE_KINDS, type ScorerKind, type SourceKind } from '@/data/benchCatalog';
import { BENCHMARKS, benchmarkById, setupOf, type Benchmark } from '@/state/benchRuns';
import { routableModels } from '@/state/aliases';
import { db, modelById, record } from '@/state/db';

/**
 * A benchmark is a dataset, a task and a scorer. This page sets all three,
 * from any source an evaluation tool loads from: a public registry, a file,
 * a Git repository, a dataset curated from real traffic, or cases typed here.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const existing = computed(() => (route.params.id ? benchmarkById(String(route.params.id)) : undefined));
const isNew = computed(() => !existing.value);

type Case = { input: string; expected: string };
const d = ref({
  name: '', description: '', metric: '% correct', owner: 'Platform Engineering', privateData: true,
  kind: 'registry' as SourceKind, registryPick: [] as string[], revision: 'main', split: 'test',
  file: '', format: 'JSONL', inputField: 'input', expectedField: 'expected', idField: 'id',
  gitUrl: '', gitPath: 'evals/my_benchmark.py', gitRef: 'main', gitFormat: 'Inspect task', syncOnPush: true,
  obsDataset: OBS_DATASETS[0]!.id,
  cases: [{ input: '', expected: '' }] as Case[],
  system: '', template: '{{input}}', tools: 'none' as 'none' | 'case' | 'mcp', temperature: 0, maxTokens: 4096, samples: 1, sampleAll: true, sampleSize: 200,
  scorer: 'exact' as ScorerKind, scorerDetail: '', judgeModelId: 'm-opus-55', aggregate: 'mean' as 'mean' | 'pass@1' | 'pass@k' | 'win-rate',
  gated: false, threshold: 70, suiteIds: [] as string[],
});
function load(): void {
  const b = existing.value;
  if (!b) return;
  const st = setupOf(b);
  const o = st.origin;
  Object.assign(d.value, {
    name: b.name, description: b.description, metric: b.metric, owner: st.owner, privateData: st.privateData,
    kind: o.kind, registryPick: o.kind === 'registry' ? [CATALOG.find((c) => c.ref === o.ref)?.id ?? ''].filter(Boolean) : [], revision: o.revision ?? 'main', split: o.split ?? 'test',
    file: o.kind === 'upload' ? o.ref : '', gitUrl: o.kind === 'git' ? o.ref : '', gitPath: o.kind === 'git' ? (o.format ?? '').replace(/^.*: /, '') : d.value.gitPath,
    obsDataset: o.kind === 'observability' ? OBS_DATASETS.find((x) => o.ref.includes(x.name))?.id ?? OBS_DATASETS[0]!.id : d.value.obsDataset,
    system: st.task.system, template: st.task.template, tools: st.task.tools, temperature: st.task.temperature, maxTokens: st.task.maxTokens, samples: st.task.samples, sampleAll: st.task.sampleSize === null, sampleSize: st.task.sampleSize ?? 200,
    scorer: st.scorer.kind, scorerDetail: st.scorer.detail, judgeModelId: st.scorer.judgeModelId ?? 'm-opus-55', aggregate: st.scorer.aggregate,
    gated: b.threshold !== undefined, threshold: b.threshold ?? 70, suiteIds: [...b.suiteIds],
  });
}
watch(existing, load, { immediate: true });

// ---- source
// A registry benchmark is picked one at a time; the picker keeps only the latest pick.
watch(() => d.value.registryPick, (ids) => {
  if (ids.length > 1) d.value.registryPick = [ids[ids.length - 1]!];
  const c = CATALOG.find((x) => x.id === d.value.registryPick[0]);
  if (c && isNew.value) Object.assign(d.value, { name: d.value.name || c.name, metric: c.metric, scorer: c.scorer, privateData: false, description: d.value.description || `${c.category} · ${c.registry} ${c.ref}` });
});
const catalogItems = computed(() => CATALOG.map((c) => ({ id: c.id, label: c.name, group: c.category, sub: `${c.registry} · ${c.ref} · ${c.license}`, meta: `${c.cases.toLocaleString('en')} cases`, warn: c.note })));
const picked = computed(() => CATALOG.find((x) => x.id === d.value.registryPick[0]));
const obs = computed(() => OBS_DATASETS.find((x) => x.id === d.value.obsDataset)!);
const uploaded = ref(false);
function onFile(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  d.value.file = f.name;
  d.value.format = /\.csv$/i.test(f.name) ? 'CSV' : /\.parquet$/i.test(f.name) ? 'Parquet' : 'JSONL';
  uploaded.value = true;
}
const caseCount = computed(() => {
  const k = d.value.kind;
  if (k === 'registry') return picked.value?.cases ?? 0;
  if (k === 'observability') return obs.value.items;
  if (k === 'manual') return d.value.cases.filter((c) => c.input.trim()).length;
  if (k === 'upload') return d.value.file ? existing.value?.cases ?? 150 : 0;
  return existing.value?.cases ?? (d.value.gitUrl ? 120 : 0);
});
// What three cases look like after mapping, so a wrong field shows before the first run.
const preview = computed<Case[]>(() => {
  if (d.value.kind === 'manual') return d.value.cases.filter((c) => c.input.trim()).slice(0, 3);
  if (d.value.kind === 'registry' && picked.value) return [
    { input: `[${picked.value.name} case 1 from ${d.value.split}]`, expected: picked.value.scorer === 'choice' ? 'C' : picked.value.scorer === 'unit-tests' ? 'tests: 14 must pass' : '42' },
    { input: `[${picked.value.name} case 2]`, expected: picked.value.scorer === 'choice' ? 'A' : '…' },
  ];
  if (d.value.kind === 'observability') return [{ input: 'Kunde fragt nach Rückerstattung für Bestellung …', expected: 'Freundliche Antwort mit Rückerstattungsschritten …' }, { input: 'Customer cannot reset password …', expected: 'Steps to reset, link to help article …' }];
  if (d.value.kind === 'upload' && d.value.file) return [1, 2].map((n) => ({ input: `row ${n} of ${d.value.file} → "${d.value.inputField}"`, expected: `row ${n} → "${d.value.expectedField}"` }));
  return [];
});
const SCORER_HINT: Record<ScorerKind, string> = { exact: 'Normalisation, e.g. lowercase', choice: 'Letters, e.g. A–D', regex: 'Pattern, e.g. ^\\d{4}-\\d{2}$', 'json-schema': 'Schema file or URL', numeric: 'Tolerance, e.g. 0.01', 'unit-tests': 'Container image · command · timeout', rules: 'Rule set', judge: 'Rubric: what a 5 and a 1 look like', pairwise: 'Baseline model and criteria', human: 'Reviewer group and sample size' };
const scorerHint = (k: ScorerKind) => SCORER_HINT[k];
const judges = computed(() => routableModels().filter((m) => m.capabilities.includes('reasoning')));

// ---- save
const sourceOk = computed(() => {
  const v = d.value;
  return v.kind === 'registry' ? !!picked.value : v.kind === 'upload' ? !!v.file : v.kind === 'git' ? /^(https:\/\/|git@|[\w.-]+\.\w+\/)/.test(v.gitUrl) : v.kind === 'manual' ? caseCount.value > 0 : true;
});
const canSave = computed(() => !!d.value.name.trim() && sourceOk.value && !!d.value.template.includes('{{input}}'));
function save(): void {
  if (!canSave.value) return;
  const v = d.value;
  const origin: NonNullable<Benchmark['origin']> =
    v.kind === 'registry' ? { kind: 'registry', ref: picked.value!.ref, revision: v.revision, split: v.split, format: picked.value!.registry }
    : v.kind === 'upload' ? { kind: 'upload', ref: v.file, format: v.format }
    : v.kind === 'git' ? { kind: 'git', ref: v.gitUrl, revision: v.gitRef, format: `${v.gitFormat}: ${v.gitPath}` }
    : v.kind === 'observability' ? { kind: 'observability', ref: `${obs.value.tool} · ${obs.value.name}`, format: `${obs.value.tool} dataset` }
    : { kind: 'manual', ref: `${caseCount.value} cases written here` };
  const prevVersion = existing.value ? setupOf(existing.value).version : 'v0';
  const fields: Omit<Benchmark, 'id'> = {
    name: v.name.trim(), description: v.description.trim(), cases: caseCount.value, metric: v.metric, suiteIds: [...v.suiteIds], source: v.kind === 'registry' ? 'public' : 'internal',
    threshold: v.gated ? v.threshold : undefined, origin,
    task: { system: v.system, template: v.template, tools: v.tools, temperature: v.temperature, maxTokens: v.maxTokens, samples: v.samples, sampleSize: v.sampleAll ? null : v.sampleSize },
    scorer: { kind: v.scorer, detail: v.scorerDetail, judgeModelId: ['judge', 'pairwise'].includes(v.scorer) ? v.judgeModelId : undefined, aggregate: v.aggregate },
    owner: v.owner, privateData: v.privateData, version: `v${(Number(prevVersion.replace(/\D/g, '')) || 0) + 1}`,
  };
  let id = existing.value?.id ?? '';
  if (existing.value) Object.assign(existing.value, fields);
  else {
    id = `bm-${Date.now().toString(36)}`;
    BENCHMARKS.push({ id, ...fields });
  }
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `${isNew.value ? 'Added' : 'Changed'} benchmark ${fields.name} (${fields.version}, ${SOURCE_KINDS.find((s) => s.id === v.kind)?.label.toLowerCase()})`, target: fields.name, tenantId: 'root' });
  notify(isNew.value ? 'Run it on a model to get its first result.' : `Saved as ${fields.version}. Past results keep the version they ran on.`, 'success', isNew.value ? 'Benchmark added' : 'Benchmark saved');
  void router.push(`/root/benchmarks/benchmarks/${id}`);
}
const back = () => router.push(existing.value ? `/root/benchmarks/benchmarks/${existing.value.id}` : '/root/benchmarks?tab=benchmarks');
const suiteItems = computed(() => db.suites.map((s) => ({ id: s.id, label: s.name, sub: s.scenario, meta: `pass at ${s.threshold}` })));
</script>

<template>
  <div>
    <PageHeader :title="isNew ? 'New benchmark' : `Edit ${existing?.name}`" back description="A dataset, a task and a scorer. Load it from where your evaluations already live, or write it here." @back="back">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="back">Cancel</GoButton>
        <GoButton size="m" :disabled="!canSave" @click="save">{{ isNew ? 'Add benchmark' : 'Save' }}</GoButton>
      </template>
    </PageHeader>

    <div class="layout">
      <div class="col">
        <Card title="1. Source" subtitle="Where the cases come from">
          <GoSegmentButtonGroup v-model="d.kind" size="s" aria-label="Source" class="seg">
            <GoSegmentButton v-for="k in SOURCE_KINDS" :key="k.id" :value="k.id">{{ k.label }}</GoSegmentButton>
          </GoSegmentButtonGroup>
          <p class="sub">{{ SOURCE_KINDS.find((k) => k.id === d.kind)?.hint }}</p>

          <template v-if="d.kind === 'registry'">
            <ItemPicker v-model="d.registryPick" :items="catalogItems" placeholder="Search benchmarks, categories or registries" noun="benchmarks" :max-height="300" />
            <div v-if="picked" class="picked">
              <strong>{{ picked.name }}</strong> · {{ picked.registry }} <code>{{ picked.ref }}</code> · {{ picked.license }}
              <span v-if="picked.note" class="warn block">{{ picked.note }}</span>
            </div>
            <div class="two">
              <GoFormControl label="Revision" label-for="be-rev" hint="Pin a commit for repeatable results"><GoInput id="be-rev" v-model="d.revision" size="m" /></GoFormControl>
              <GoFormControl label="Split" label-for="be-split"><GoInput id="be-split" v-model="d.split" size="m" /></GoFormControl>
            </div>
          </template>

          <template v-else-if="d.kind === 'upload'">
            <label class="drop">
              <input type="file" accept=".jsonl,.json,.csv,.parquet" class="file" @change="onFile" />
              <span>{{ d.file ? `${d.file} · ${d.format}` : 'Choose a JSONL, CSV or Parquet file' }}</span>
              <span class="sub">One case per row. Stored on the instance; never sent to a provider except as the prompts of a run.</span>
            </label>
          </template>

          <template v-else-if="d.kind === 'git'">
            <GoFormControl label="Repository" label-for="be-git" required><GoInput id="be-git" v-model="d.gitUrl" size="m" placeholder="gitlab.constructor.tech/platform/evals" /></GoFormControl>
            <div class="three">
              <GoFormControl label="Definition file" label-for="be-path"><GoInput id="be-path" v-model="d.gitPath" size="m" /></GoFormControl>
              <GoFormControl label="Branch or tag" label-for="be-ref"><GoInput id="be-ref" v-model="d.gitRef" size="m" /></GoFormControl>
              <GoFormControl label="Format">
                <GoSelect v-model="d.gitFormat" size="m" aria-label="Format">
                  <GoSelectOption value="Inspect task">Inspect task</GoSelectOption>
                  <GoSelectOption value="lm-eval YAML">lm-evaluation-harness YAML</GoSelectOption>
                  <GoSelectOption value="promptfoo YAML">promptfoo YAML</GoSelectOption>
                  <GoSelectOption value="OpenAI Evals JSONL">OpenAI Evals</GoSelectOption>
                </GoSelect>
              </GoFormControl>
            </div>
            <GoToggle v-model="d.syncOnPush">Sync on push — a new commit makes a new version</GoToggle>
          </template>

          <template v-else-if="d.kind === 'observability'">
            <GoFormControl label="Dataset" hint="Curated from real traces in the connected tool; personal data stays redacted">
              <GoSelect v-model="d.obsDataset" size="m" aria-label="Dataset">
                <GoSelectOption v-for="x in OBS_DATASETS" :key="x.id" :value="x.id">{{ x.name }}<template #description>{{ x.tool }} · {{ x.items }} items · updated {{ x.updated }}</template></GoSelectOption>
              </GoSelect>
            </GoFormControl>
          </template>

          <template v-else>
            <div class="cases">
              <div v-for="(c, i) in d.cases" :key="i" class="case">
                <GoInput v-model="c.input" size="m" :placeholder="`Case ${i + 1}: input`" :aria-label="`Case ${i + 1} input`" />
                <GoInput v-model="c.expected" size="m" placeholder="Expected" :aria-label="`Case ${i + 1} expected`" />
                <button type="button" class="mini" :aria-label="`Remove case ${i + 1}`" @click="d.cases.splice(i, 1)">✕</button>
              </div>
              <button type="button" class="link" @click="d.cases.push({ input: '', expected: '' })">Add case</button>
            </div>
          </template>
        </Card>

        <Card title="2. Dataset" :subtitle="`${caseCount.toLocaleString('en')} cases`" class="spaced">
          <div v-if="['upload', 'observability'].includes(d.kind)" class="three">
            <GoFormControl label="Input field" label-for="be-in"><GoInput id="be-in" v-model="d.inputField" size="m" /></GoFormControl>
            <GoFormControl label="Expected field" label-for="be-exp"><GoInput id="be-exp" v-model="d.expectedField" size="m" /></GoFormControl>
            <GoFormControl label="Case id field" label-for="be-id" optional><GoInput id="be-id" v-model="d.idField" size="m" /></GoFormControl>
          </div>
          <GoTable v-if="preview.length" size="sm" class="preview">
            <GoTableRow header><GoTableCell>Input</GoTableCell><GoTableCell>Expected</GoTableCell></GoTableRow>
            <GoTableRow v-for="(c, i) in preview" :key="i"><GoTableCell><code class="clip">{{ c.input }}</code></GoTableCell><GoTableCell><code class="clip">{{ c.expected }}</code></GoTableCell></GoTableRow>
          </GoTable>
          <p v-else class="sub">Pick a source to see its first cases.</p>
          <div class="row">
            <GoToggle v-model="d.sampleAll">Run every case</GoToggle>
            <GoFormControl v-if="!d.sampleAll" label="Random sample of" label-for="be-ss" class="narrow"><GoInputNumber id="be-ss" v-model="d.sampleSize" :min="10" :step="50" size="m" /></GoFormControl>
          </div>
        </Card>

        <Card title="3. Task" subtitle="How each case becomes a request to the model" class="spaced">
          <GoFormControl label="System prompt" label-for="be-sys" optional><GoInput id="be-sys" v-model="d.system" type="textarea" size="m" placeholder="You are a careful assistant…" /></GoFormControl>
          <GoFormControl label="Prompt template" label-for="be-tpl" :hint="d.template.includes('{{input}}') ? 'Fields of the case as {{field}}' : 'Must contain {{input}}'"><GoInput id="be-tpl" v-model="d.template" type="textarea" size="m" /></GoFormControl>
          <GoFormControl label="Tools the model may call">
            <GoSegmentButtonGroup v-model="d.tools" size="s" aria-label="Tools">
              <GoSegmentButton value="none">None</GoSegmentButton>
              <GoSegmentButton value="case">Those in each case</GoSegmentButton>
              <GoSegmentButton value="mcp">MCP servers in a sandbox</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <div class="three">
            <GoFormControl label="Temperature" label-for="be-t"><GoInputNumber id="be-t" v-model="d.temperature" :min="0" :max="2" :step="0.1" size="m" /></GoFormControl>
            <GoFormControl label="Max output tokens" label-for="be-mt"><GoInputNumber id="be-mt" v-model="d.maxTokens" :min="16" :step="1024" size="m" /></GoFormControl>
            <GoFormControl label="Samples per case" label-for="be-k" hint="More than 1 gives pass@k"><GoInputNumber id="be-k" v-model="d.samples" :min="1" :max="20" size="m" /></GoFormControl>
          </div>
        </Card>
      </div>

      <div class="col">
        <Card title="Name">
          <GoFormControl label="Name" label-for="be-name" required><GoInput id="be-name" v-model="d.name" size="m" /></GoFormControl>
          <GoFormControl label="What it tests" label-for="be-desc"><GoInput id="be-desc" v-model="d.description" size="m" /></GoFormControl>
        </Card>

        <Card title="4. Scoring" subtitle="How an answer is judged" class="spaced">
          <GoFormControl label="Scorer">
            <GoSelect v-model="d.scorer" size="m" aria-label="Scorer">
              <GoSelectOption v-for="x in SCORERS" :key="x.id" :value="x.id">{{ x.label }}<template #description>{{ x.hint }}</template></GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl label="Details" label-for="be-sd" :hint="scorerHint(d.scorer)"><GoInput id="be-sd" v-model="d.scorerDetail" :type="['judge', 'pairwise'].includes(d.scorer) ? 'textarea' : 'text'" size="m" /></GoFormControl>
          <GoFormControl v-if="['judge', 'pairwise'].includes(d.scorer)" label="Judge model" hint="Pinned: a judge must not change between runs">
            <GoSelect v-model="d.judgeModelId" size="m" aria-label="Judge model">
              <GoSelectOption v-for="m in judges" :key="m.id" :value="m.id">{{ m.name }}<template #description>{{ m.version }}</template></GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <div class="two">
            <GoFormControl label="Metric" label-for="be-metric"><GoInput id="be-metric" v-model="d.metric" size="m" /></GoFormControl>
            <GoFormControl label="Aggregate">
              <GoSelect v-model="d.aggregate" size="m" aria-label="Aggregate">
                <GoSelectOption value="mean">Mean</GoSelectOption>
                <GoSelectOption value="pass@1">pass@1</GoSelectOption>
                <GoSelectOption value="pass@k">pass@k</GoSelectOption>
                <GoSelectOption value="win-rate">Win rate</GoSelectOption>
              </GoSelect>
            </GoFormControl>
          </div>
          <GoToggle v-model="d.gated">Has a pass threshold</GoToggle>
          <GoFormControl v-if="d.gated" label="Pass at" label-for="be-thr" class="narrow"><GoInputNumber id="be-thr" v-model="d.threshold" :min="0" :max="100" size="m" /></GoFormControl>
        </Card>

        <Card title="5. Suites and ownership" class="spaced">
          <GoFormControl label="Part of suites" hint="None makes it standalone">
            <ItemPicker v-model="d.suiteIds" :items="suiteItems" placeholder="Search suites" noun="suites" :max-height="200" />
          </GoFormControl>
          <GoFormControl label="Owner" label-for="be-owner"><GoInput id="be-owner" v-model="d.owner" size="m" /></GoFormControl>
          <GoToggle v-model="d.privateData">Uses private company data — runs only on models that may see it</GoToggle>
          <p v-if="d.kind === 'registry' && picked" class="sub">Public benchmarks may be in a model's training data; prefer recent or private ones for decisions.</p>
          <p v-if="existing" class="sub">Saving makes {{ setupOf(existing).version.replace(/\d+/, (n) => String(Number(n) + 1)) }}; results of earlier versions are kept apart.</p>
          <p v-if="d.judgeModelId && ['judge', 'pairwise'].includes(d.scorer)" class="sub">Judge: {{ modelById(d.judgeModelId)?.name }}.</p>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .layout {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .col {
    display: grid;
    align-content: start;
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  :deep(.body) > * + * {
    margin-block-start: var(--acv-spacing-regular);
  }

  .seg {
    flex-wrap: wrap;
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .three {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .row {
    display: flex;
    align-items: end;
    gap: var(--acv-spacing-regular);
  }

  .narrow {
    max-inline-size: 220px;
  }

  .picked {
    @mixin acv-text-ui-body-2;
    display: block;
    padding: var(--acv-spacing-small);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
  }

  .drop {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: 4px;
    padding: var(--acv-spacing-large);
    border: 1px dashed var(--acv-color-glyph-tertiary);
    border-radius: var(--acv-radius-large);
    text-align: center;
    cursor: pointer;
  }

  .file {
    display: none;
  }

  .cases {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .case {
    display: grid;
    grid-template-columns: 1fr 1fr 28px;
    gap: var(--acv-spacing-x-small);
    align-items: center;
  }

  .mini {
    inline-size: 24px;
    block-size: 24px;
    padding: 0;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-small);
    background: none;
    cursor: pointer;
  }

  .link {
    @mixin acv-text-ui-caption-1;
    justify-self: start;
    padding: 0;
    border: none;
    background: none;
    color: var(--acv-color-glyph-brand);
    cursor: pointer;
  }

  .preview {
    margin-block: var(--acv-spacing-small);
  }

  .clip {
    @mixin acv-text-ui-caption-1;
    display: block;
    max-inline-size: 360px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-tertiary);
  }

  .block {
    display: block;
  }

  .warn {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-status-warning-strong, #b45309);
  }
</style>
