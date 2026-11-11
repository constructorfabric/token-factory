<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoStatusTag } from '@constructor/ui/status-tag';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import LineChart from '@/components/charts/LineChart.vue';
import Card from '@/components/ui/Card.vue';
import ItemPicker from '@/components/ui/ItemPicker.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatTile from '@/components/ui/StatTile.vue';
import UsageMeter from '@/components/ui/UsageMeter.vue';
import { fmtDateTime, fmtInt } from '@/lib/format';
import { routableModels } from '@/state/aliases';
import { BENCHMARKS, targetName } from '@/state/benchRuns';
import { db, modelById, record } from '@/state/db';
import { evalDaily, evalSetup, evalSpend, infraFailures, liveJobs, schedules, triggers, type Schedule } from '@/state/evalInfra';

/**
 * Where benchmarks run: the environment that serves candidate models,
 * sandboxes for scorers that run code, judges, datasets, the queue,
 * schedules and the budget — and how all of it is doing.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tab = computed(() => (['setup', 'schedules'].includes(String(route.query.tab)) ? String(route.query.tab) : 'monitoring'));
const go = (t: string) => router.replace({ query: t === 'monitoring' ? {} : { tab: t } });

// ---- monitoring
// The runner takes jobs up to its concurrency; the rest wait in the queue.
const jobs = computed(() => {
  let running = 0;
  return liveJobs().map((j) => {
    const runs = j.status === 'running' && running < evalSetup.maxConcurrentRuns;
    if (runs) running++;
    return { ...j, shown: runs ? ('running' as const) : ('queued' as const) };
  });
});
const runningNow = computed(() => jobs.value.filter((j) => j.shown === 'running').length);
const cluster = computed(() => db.clusters.find((c) => c.id === evalSetup.clusterId));
const sandboxesBusy = computed(() => Math.min(evalSetup.maxSandboxes, runningNow.value * 6 + 4));
const gpusBusy = computed(() => Math.min(evalSetup.gpusReserved, runningNow.value + 2));
const spendPct = computed(() => Math.round((evalSpend.usd / evalSetup.monthlyBudgetUsd) * 100));
function cancel(id: string): void {
  const j = liveJobs().find((x) => x.id === id);
  if (!j) return;
  j.status = 'failed';
  j.score = undefined;
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Cancelled benchmark run ${targetName(j.suiteId)} on ${modelById(j.modelId)?.name}`, target: targetName(j.suiteId), tenantId: 'root' });
  notify('Cancelled. Cases already finished are kept; nothing more is charged.', 'warning', 'Run cancelled');
}

// ---- setup
const clusters = computed(() => db.clusters.filter((c) => c.status !== 'offline'));
const judgeItems = computed(() => routableModels().filter((m) => m.capabilities.includes('reasoning')).map((m) => ({ id: m.id, label: m.name, group: m.family, sub: `${m.provider} · version ${m.version}` })));
const newImage = ref('');
function addImage(): void {
  const v = newImage.value.trim();
  if (v && !evalSetup.imageAllowlist.includes(v)) evalSetup.imageAllowlist.push(v);
  newImage.value = '';
}
function saveSetup(): void {
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Changed evaluation setup: ${evalSetup.environment}, ${evalSetup.gpusReserved} GPUs, ${evalSetup.maxSandboxes} sandboxes, budget $${evalSetup.monthlyBudgetUsd}`, target: 'Evaluation', tenantId: 'root' });
  notify('Running jobs finish on the old settings; new ones use these.', 'success', 'Evaluation setup saved');
}

// ---- schedules
const MODELS_LABEL: Record<Schedule['models'], string> = { ga: 'Every generally available model', candidates: 'Alias candidates and models rolling out', all: 'Every admitted model', picked: 'Picked models' };
const modelsLabel = (s: Schedule) => (s.models === 'picked' ? s.modelIds.map((id) => modelById(id)?.name).join(', ') : MODELS_LABEL[s.models]);
const schedOpen = ref(false);
const editing = ref<Schedule | null>(null);
const sd = ref({ name: '', targets: [] as string[], models: 'ga' as Schedule['models'], modelIds: [] as string[], when: 'Every day at 03:00 UTC' });
function openSchedule(s?: Schedule): void {
  editing.value = s ?? null;
  sd.value = s ? { name: s.name, targets: [...s.targets], models: s.models, modelIds: [...s.modelIds], when: s.when } : { name: '', targets: [], models: 'ga', modelIds: [], when: 'Every day at 03:00 UTC' };
  schedOpen.value = true;
}
function saveSchedule(): void {
  const v = sd.value;
  if (!v.name.trim() || !v.targets.length) return;
  if (editing.value) Object.assign(editing.value, { ...v, name: v.name.trim() });
  else schedules.push({ id: `sch-${Date.now().toString(36)}`, ...v, name: v.name.trim(), enabled: true, nextRun: '2026-11-12T03:00:00Z' });
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `${editing.value ? 'Changed' : 'Added'} benchmark schedule ${v.name.trim()}`, target: v.name.trim(), tenantId: 'root' });
  schedOpen.value = false;
}
const targetItems = computed(() => [
  ...db.suites.map((s) => ({ id: s.id, label: s.name, group: 'Suites', sub: s.scenario })),
  ...BENCHMARKS.map((b) => ({ id: b.id, label: b.name, group: 'Benchmarks', sub: b.metric })),
]);
const modelItems = computed(() => routableModels().map((m) => ({ id: m.id, label: m.name, group: m.family, sub: m.provider })));
const RUN_TAG = { queued: 'disabled', running: 'info', passed: 'success', failed: 'error', done: 'info' } as const;
</script>

<template>
  <div>
    <PageHeader title="Evaluation" description="Where benchmark runs happen: the evaluation environment, sandboxes, judges and datasets, with the queue, schedules and budget." />

    <GoTabs class="tabs">
      <GoTabsItem :active="tab === 'monitoring'" @click="go('monitoring')">Monitoring<span v-if="jobs.length" class="count">{{ jobs.length }}</span></GoTabsItem>
      <GoTabsItem :active="tab === 'setup'" @click="go('setup')">Setup</GoTabsItem>
      <GoTabsItem :active="tab === 'schedules'" @click="go('schedules')">Schedules · {{ schedules.length }}</GoTabsItem>
    </GoTabs>

    <!-- Monitoring -->
    <template v-if="tab === 'monitoring'">
      <div class="tiles">
        <StatTile label="Runs this month" :value="fmtInt(evalSpend.runs)" :hint="`${runningNow} running, ${jobs.length - runningNow} waiting`" />
        <StatTile label="Spend this month" :value="`$${fmtInt(evalSpend.usd)}`" :hint="`${spendPct}% of $${fmtInt(evalSetup.monthlyBudgetUsd)} · judges $${evalSpend.judgeUsd}`" :tone="spendPct >= evalSetup.alertAtPct ? 'warn' : 'neutral'" />
        <StatTile label="GPU hours" :value="fmtInt(evalSpend.gpuHours)" :hint="`On ${cluster?.name ?? '—'}`" />
        <StatTile label="Infrastructure failures" :value="`${infraFailures.length}`" hint="Last 3 days; low scores not counted" :tone="infraFailures.some((f) => f.outcome.startsWith('Failed')) ? 'warn' : 'neutral'" />
      </div>

      <div class="two spaced">
        <Card title="Capacity now">
          <UsageMeter label="Eval GPUs in use" :used="gpusBusy" :limit="evalSetup.gpusReserved" :format="fmtInt" />
          <UsageMeter label="Sandboxes in use" :used="sandboxesBusy" :limit="evalSetup.maxSandboxes" :format="fmtInt" />
          <UsageMeter label="Runs at once" :used="runningNow" :limit="evalSetup.maxConcurrentRuns" :format="fmtInt" />
          <UsageMeter label="Budget this month" :used="evalSpend.usd" :limit="evalSetup.monthlyBudgetUsd" :format="(n) => `$${fmtInt(n)}`" />
        </Card>
        <Card title="Runs per day" subtitle="Last 30 days; Sundays carry the weekly public set">
          <LineChart :points="evalDaily" label="Runs" :format="(n) => String(n)" :height="200" />
        </Card>
      </div>

      <Card title="Queue" :subtitle="jobs.length ? 'Admission runs first, then gates before promotion, then scheduled, then manual' : 'Nothing queued or running'" flush class="spaced">
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>Suite or benchmark</GoTableCell>
            <GoTableCell>Model</GoTableCell>
            <GoTableCell>State</GoTableCell>
            <GoTableCell>Since</GoTableCell>
            <GoTableCell>Started by</GoTableCell>
            <GoTableCell width="100" />
          </GoTableRow>
          <GoTableRow v-for="j in jobs" :key="j.id">
            <GoTableCell>{{ targetName(j.suiteId) }}</GoTableCell>
            <GoTableCell><RouterLink :to="`/root/models/${j.modelId}?tab=benchmarks`">{{ modelById(j.modelId)?.name }}</RouterLink></GoTableCell>
            <GoTableCell><GoStatusTag :variant="RUN_TAG[j.shown]" size="sm">{{ j.shown === 'queued' ? `queued · ${jobs.filter((x) => x.shown === 'queued').findIndex((x) => x.id === j.id) + 1}` : 'running' }}</GoStatusTag></GoTableCell>
            <GoTableCell>{{ fmtDateTime(j.at) }}</GoTableCell>
            <GoTableCell>{{ j.by }}</GoTableCell>
            <GoTableCell><GoButton variant="ghost" size="s" @click="cancel(j.id)">Cancel</GoButton></GoTableCell>
          </GoTableRow>
          <GoTableRow v-if="!jobs.length"><GoTableCell :colspan="6"><span class="sub">Start runs from a model, a suite, a benchmark or the Compare tab of Benchmarks.</span></GoTableCell></GoTableRow>
        </GoTable>
      </Card>

      <Card title="Infrastructure failures" subtitle="Problems with the runner, sandboxes, providers or judges — not low scores" flush class="spaced">
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>When</GoTableCell>
            <GoTableCell>Run</GoTableCell>
            <GoTableCell>What happened</GoTableCell>
            <GoTableCell>Outcome</GoTableCell>
          </GoTableRow>
          <GoTableRow v-for="f in infraFailures" :key="f.at">
            <GoTableCell>{{ fmtDateTime(f.at) }}</GoTableCell>
            <GoTableCell>{{ f.job }}</GoTableCell>
            <GoTableCell>{{ f.reason }}</GoTableCell>
            <GoTableCell><span :class="{ bad: f.outcome.startsWith('Failed') }">{{ f.outcome }}</span></GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>
    </template>

    <!-- Setup -->
    <template v-else-if="tab === 'setup'">
      <div class="save-row"><GoButton size="m" @click="saveSetup">Save setup</GoButton></div>
      <div class="two">
        <div class="col">
          <Card title="Model calls" subtitle="Where candidate models answer during a run">
            <GoSegmentButtonGroup v-model="evalSetup.environment" size="s" aria-label="Environment">
              <GoSegmentButton value="eval-instance">Separate eval instance (recommended)</GoSegmentButton>
              <GoSegmentButton value="shared-low-priority">Production, at low priority</GoSegmentButton>
            </GoSegmentButtonGroup>
            <p class="sub">{{ evalSetup.environment === 'eval-instance' ? 'Runs never compete with users for GPUs; models under admission are deployed here first.' : 'Cheaper, but runs wait for free capacity and can slow users down at peak.' }}</p>
            <div class="two-in">
              <GoFormControl label="GPU cluster">
                <GoSelect v-model="evalSetup.clusterId" size="m" aria-label="GPU cluster">
                  <GoSelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}<template #description>{{ c.gpu }} · {{ c.gpus - c.gpusUsed }} free</template></GoSelectOption>
                </GoSelect>
              </GoFormControl>
              <GoFormControl label="GPUs reserved" label-for="ev-gpu"><GoInputNumber id="ev-gpu" v-model="evalSetup.gpusReserved" :min="0" :max="64" size="m" /></GoFormControl>
            </div>
            <GoToggle v-model="evalSetup.scaleToZero">Release the GPUs when the queue is empty</GoToggle>
            <GoFormControl label="Share of external providers' rate limits for runs, %" label-for="ev-api" hint="Commercial models are called through the platform keys; runs back off above this share"><GoInputNumber id="ev-api" v-model="evalSetup.apiRateShare" :min="1" :max="50" size="m" /></GoFormControl>
          </Card>

          <Card title="Sandboxes" subtitle="For scorers that run code: unit tests, agent tasks, shell" class="spaced">
            <div class="two-in">
              <GoFormControl label="Runtime">
                <GoSegmentButtonGroup v-model="evalSetup.sandboxRuntime" size="s" aria-label="Runtime">
                  <GoSegmentButton value="kubernetes">Kubernetes</GoSegmentButton>
                  <GoSegmentButton value="docker">Docker host</GoSegmentButton>
                </GoSegmentButtonGroup>
              </GoFormControl>
              <GoFormControl label="Namespace" label-for="ev-ns"><GoInput id="ev-ns" v-model="evalSetup.namespace" size="m" /></GoFormControl>
            </div>
            <div class="four">
              <GoFormControl label="At most at once" label-for="ev-max"><GoInputNumber id="ev-max" v-model="evalSetup.maxSandboxes" :min="1" :step="4" size="m" /></GoFormControl>
              <GoFormControl label="CPU each" label-for="ev-cpu"><GoInputNumber id="ev-cpu" v-model="evalSetup.cpuPerSandbox" :min="1" :max="32" size="m" /></GoFormControl>
              <GoFormControl label="Memory each, GB" label-for="ev-mem"><GoInputNumber id="ev-mem" v-model="evalSetup.memGbPerSandbox" :min="1" :max="128" size="m" /></GoFormControl>
              <GoFormControl label="Per case, minutes" label-for="ev-to"><GoInputNumber id="ev-to" v-model="evalSetup.caseTimeoutMin" :min="1" :max="240" size="m" /></GoFormControl>
            </div>
            <GoFormControl label="Network from a sandbox">
              <GoSegmentButtonGroup v-model="evalSetup.egress" size="s" aria-label="Egress">
                <GoSegmentButton value="off">None</GoSegmentButton>
                <GoSegmentButton value="allowlist">Listed hosts only</GoSegmentButton>
                <GoSegmentButton value="open">Open</GoSegmentButton>
              </GoSegmentButtonGroup>
            </GoFormControl>
            <GoFormControl v-if="evalSetup.egress === 'allowlist'" label="Hosts" label-for="ev-hosts"><GoInput id="ev-hosts" v-model="evalSetup.egressAllowlist" size="m" /></GoFormControl>
            <GoFormControl label="Images sandboxes may run" hint="Anything else is refused before it is pulled">
              <ul class="images">
                <li v-for="(img, i) in evalSetup.imageAllowlist" :key="img"><code>{{ img }}</code><button type="button" class="mini" :aria-label="`Remove ${img}`" @click="evalSetup.imageAllowlist.splice(i, 1)">✕</button></li>
              </ul>
              <div class="add"><GoInput v-model="newImage" size="m" placeholder="registry/image:tag or registry/path/*" /><GoButton variant="secondary" size="m" :disabled="!newImage.trim()" @click="addImage">Add</GoButton></div>
            </GoFormControl>
          </Card>
        </div>

        <div class="col">
          <Card title="Judges" subtitle="Models allowed to score answers; each benchmark pins one">
            <ItemPicker v-model="evalSetup.judgeIds" ordered :items="judgeItems" placeholder="Search models" noun="models" :max-height="200" />
            <p class="sub">The second is the fallback when the first is unavailable.</p>
            <GoFormControl label="Judges may use at most, % of a run's budget" label-for="ev-js"><GoInputNumber id="ev-js" v-model="evalSetup.judgeShare" :min="5" :max="80" size="m" /></GoFormControl>
          </Card>

          <Card title="Datasets and results" class="spaced">
            <GoFormControl label="Storage" label-for="ev-b" hint="Uploaded files, cached registry datasets and per-case outputs"><GoInput id="ev-b" v-model="evalSetup.bucket" size="m" /></GoFormControl>
            <GoToggle v-model="evalSetup.cacheRegistry">Cache registry datasets at their pinned revision</GoToggle>
            <p class="sub">Gated Hugging Face datasets use the token of the <RouterLink to="/root/settings?section=org-integrations">Hugging Face integration</RouterLink>.</p>
            <GoFormControl label="Keep per-case prompts and answers, days" label-for="ev-keep"><GoInputNumber id="ev-keep" v-model="evalSetup.keepOutputsDays" :min="1" :max="730" size="m" /></GoFormControl>
            <GoToggle v-model="evalSetup.privateOnSelfHostedOnly">Benchmarks with private data run only on self-hosted models</GoToggle>
          </Card>

          <Card title="Queue and budget" class="spaced">
            <div class="two-in">
              <GoFormControl label="Runs at once" label-for="ev-c"><GoInputNumber id="ev-c" v-model="evalSetup.maxConcurrentRuns" :min="1" :max="64" size="m" /></GoFormControl>
              <GoFormControl label="Per model at once" label-for="ev-pm"><GoInputNumber id="ev-pm" v-model="evalSetup.perModelConcurrency" :min="1" :max="16" size="m" /></GoFormControl>
            </div>
            <p class="sub">Priority: {{ evalSetup.priorities.join(' → ') }}.</p>
            <div class="two-in">
              <GoFormControl label="Monthly budget, $" label-for="ev-bud"><GoInputNumber id="ev-bud" v-model="evalSetup.monthlyBudgetUsd" :min="0" :step="500" size="m" /></GoFormControl>
              <GoFormControl label="One run may cost at most, $" label-for="ev-cap"><GoInputNumber id="ev-cap" v-model="evalSetup.perRunCapUsd" :min="0" :step="50" size="m" /></GoFormControl>
            </div>
            <GoFormControl label="Notify at, % of budget" label-for="ev-al"><GoInputNumber id="ev-al" v-model="evalSetup.alertAtPct" :min="10" :max="100" :step="5" size="m" /></GoFormControl>
          </Card>
        </div>
      </div>
    </template>

    <!-- Schedules -->
    <template v-else>
      <Card title="Schedules" subtitle="Runs that repeat" flush>
        <template #actions><GoButton size="s" @click="openSchedule()">Add schedule</GoButton></template>
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>Schedule</GoTableCell>
            <GoTableCell>Runs</GoTableCell>
            <GoTableCell>On</GoTableCell>
            <GoTableCell>Last · next</GoTableCell>
            <GoTableCell width="70">On</GoTableCell>
            <GoTableCell width="80" />
          </GoTableRow>
          <GoTableRow v-for="s in schedules" :key="s.id">
            <GoTableCell>{{ s.name }}<span class="sub">{{ s.when }}</span></GoTableCell>
            <GoTableCell>{{ s.targets.map(targetName).join(', ') }}</GoTableCell>
            <GoTableCell>{{ modelsLabel(s) }}</GoTableCell>
            <GoTableCell>{{ s.lastRun ? fmtDateTime(s.lastRun) : '—' }}<span class="sub">next {{ s.enabled ? fmtDateTime(s.nextRun) : 'paused' }}</span></GoTableCell>
            <GoTableCell><GoToggle v-model="s.enabled" size="s" :aria-label="`Run ${s.name}`" /></GoTableCell>
            <GoTableCell><GoButton variant="ghost" size="s" @click="openSchedule(s)">Edit</GoButton></GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>
      <Card title="Triggers" subtitle="Runs that start by themselves when something changes" class="spaced">
        <div class="triggers">
          <div v-for="t in triggers" :key="t.id" class="trigger">
            <GoToggle v-model="t.enabled" size="s" :aria-label="t.label" />
            <span><span class="t-label">{{ t.label }}</span><span class="sub">Runs: {{ t.what }}</span></span>
          </div>
        </div>
      </Card>

      <GoDialog v-model="schedOpen" size="m">
        <GoDialogWindow :title="editing ? `Edit ${editing.name}` : 'Add schedule'" header-border @close="schedOpen = false">
          <div class="fields">
            <div class="two-in">
              <GoFormControl label="Name" label-for="sc-name" required><GoInput id="sc-name" v-model="sd.name" size="m" /></GoFormControl>
              <GoFormControl label="When">
                <GoSelect v-model="sd.when" size="m" aria-label="When">
                  <GoSelectOption value="Every 6 hours">Every 6 hours</GoSelectOption>
                  <GoSelectOption value="Every day at 03:00 UTC">Every day at 03:00 UTC</GoSelectOption>
                  <GoSelectOption value="Sundays at 02:00 UTC">Sundays at 02:00 UTC</GoSelectOption>
                  <GoSelectOption value="First of the month at 01:00 UTC">First of the month</GoSelectOption>
                </GoSelect>
              </GoFormControl>
            </div>
            <GoFormControl label="What to run"><ItemPicker v-model="sd.targets" :items="targetItems" placeholder="Search suites and benchmarks" noun="benchmarks" :max-height="180" /></GoFormControl>
            <GoFormControl label="On which models">
              <GoSelect v-model="sd.models" size="m" aria-label="Models">
                <GoSelectOption v-for="(label, k) in MODELS_LABEL" :key="k" :value="k">{{ label }}</GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <ItemPicker v-if="sd.models === 'picked'" v-model="sd.modelIds" :items="modelItems" placeholder="Search models" noun="models" :max-height="180" />
          </div>
          <template #footer>
            <div class="footer">
              <GoButton variant="secondary" size="m" @click="schedOpen = false">Cancel</GoButton>
              <GoButton size="m" :disabled="!sd.name.trim() || !sd.targets.length" @click="saveSchedule">{{ editing ? 'Save' : 'Add schedule' }}</GoButton>
            </div>
          </template>
        </GoDialogWindow>
      </GoDialog>
    </template>
  </div>
</template>

<style scoped>
  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }

  .count {
    @mixin acv-text-ui-caption-1;
    margin-inline-start: 6px;
    padding: 0 6px;
    border-radius: 8px;
    background: var(--acv-color-glyph-brand);
    color: #fff;
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .col {
    display: grid;
    align-content: start;
  }

  .two-in {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .four {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-small);
  }

  :deep(.body) > * + * {
    margin-block-start: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .save-row {
    display: flex;
    justify-content: flex-end;
    margin-block-end: var(--acv-spacing-regular);
  }

  .images {
    display: grid;
    gap: 4px;
    margin: 0 0 var(--acv-spacing-x-small);
    padding: 0;
    list-style: none;

    & li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--acv-spacing-small);
    }
  }

  .add {
    display: flex;
    gap: var(--acv-spacing-small);
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

  .triggers {
    display: grid;
    gap: var(--acv-spacing-small);
  }

  .trigger {
    display: flex;
    align-items: flex-start;
    gap: var(--acv-spacing-small);
  }

  .t-label {
    @mixin acv-text-ui-body-2;
    display: block;
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }

  .bad {
    color: var(--acv-color-status-danger-strong);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    margin: 0;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
