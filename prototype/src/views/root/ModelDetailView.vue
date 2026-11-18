<script setup lang="ts">
import ItemPicker from '@/components/ui/ItemPicker.vue';
import ClassCostTable from '@/components/ui/ClassCostTable.vue';
import { costByClass, pricesOf } from '@/data/tokenClasses';
import { CAPABILITIES, CAP_GROUPS, MODALITIES, MODES, PARAMS, capLabel, missingCaps, profileOf } from '@/data/capabilities';
import type { Capability, Modality, ModelMode } from '@/data/types';
import { membershipsOf, roleText } from '@/state/aliases';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoStatusTag } from '@constructor/ui/status-tag';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, reactive, ref, watch } from 'vue';
import { isV1 } from '@/state/scope';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IconCircleCheck, IconCircleXmark, IconClockArrowRotateLeft } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import LifecycleTag from '@/components/ui/LifecycleTag.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { AdmissionStage } from '@/data/types';
import { CREDITS_PER_USD, fmtContext, fmtDate, fmtCreditPrice, fmtCredits, fmtDateTime, fmtInt, fmtPct } from '@/lib/format';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import BarList from '@/components/charts/BarList.vue';
import LifecycleMoveMenu from '@/components/root/LifecycleMoveMenu.vue';
import LineChart from '@/components/charts/LineChart.vue';
import StatTile from '@/components/ui/StatTile.vue';
import { statsFor } from '@/data/modelStats';
import { PERIODS, periodOf, seriesFor, type PeriodId } from '@/lib/period';
import { BENCHMARKS, estimateUsd, runsOf, startRuns, targetName } from '@/state/benchRuns';
import { GoInput } from '@constructor/ui/input';
import { IconSearch } from '@/components/icons';
import { db, modelById, record, tenantById } from '@/state/db';
import { aliasesOf, matches, modelsOf, ruleText, tenantLicenses, tenantsOn } from '@/state/tenantLicenses';

const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const model = computed(() => modelById(String(route.params.id)));

// PRD FR-D1..D5, in pipeline order. A failure stops everything after it.
const STAGES: { id: AdmissionStage; label: string; prd: string }[] = [
  { id: 'license', label: 'License check', prd: 'FR-D1' },
  { id: 'security', label: 'Security scan', prd: 'FR-D2' },
  { id: 'capacity', label: 'Capacity checks', prd: 'FR-D11' },
  { id: 'download', label: 'Download to weights cache', prd: 'FR-D12' },
  { id: 'acceptance', label: 'Acceptance tests', prd: 'FR-D3' },
  { id: 'benchmark', label: 'Terminal Bench (eval instance)', prd: 'FR-D4' },
];
// v1 hides benchmarks, Terminal Bench included (product decision, 18 Nov 2026).
const stagesShown = computed(() => STAGES.filter((s) => !(isV1.value && s.id === 'benchmark')));
const STATUS = { passed: 'success', failed: 'error', running: 'info', pending: 'disabled', skipped: 'disabled' } as const;

// Promotion needs the GPUs to serve it (FR-C14): a shortfall blocks it.
const gpuFree = computed(() => db.clusters.filter((c) => c.status !== 'offline' && c.kind === 'on-prem').reduce((s, c) => s + c.gpus - c.gpusUsed, 0));
const shortfall = computed(() => Math.max(0, (model.value?.gpusRequired ?? 0) - gpuFree.value));
const isOpenWeight = computed(() => model.value && model.value.hosting !== 'commercial');
const familyDefault = computed(() => db.aliases.find((a) => !!a.family && a.family === model.value?.family));
const memberships = computed(() => (model.value ? membershipsOf(model.value.id) : []));
const runs = computed(() => db.runs.filter((r) => r.candidateId === model.value?.id));
const suiteName = (id: string) => db.suites.find((s) => s.id === id)?.name ?? id;

function act(action: string, after: () => void, message: string): void {
  const m = model.value;
  if (!m) return;
  after();
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `${action} ${m.name}`, target: m.name, tenantId: 'root' });
  notify(message, 'success', action);
}

const setDefault = () =>
  act(`Pointed ${familyDefault.value?.name} at`, () => {
    const alias = familyDefault.value;
    if (alias && model.value) {
      alias.primary = model.value.id;
    }
  }, `Requests to ${familyDefault.value?.name} now go to this model. The previous default stays available by ID.`);
// DECOMPOSITION's model-registry statuses, beside the PRD lifecycle states.
const REGISTRY: Record<string, string> = { discovered: 'registered', verifying: 'scanning / benchmarking', verified: 'ready', failed: 'ready — blocked', approved: 'ready', 'rolling-out': 'deployed', ga: 'deployed', deprecated: 'deprecated', retired: 'retired' };

// Which tenant licenses include this model, and how: by rule, picked, through a model alias, or as the partner's own.
const includedIn = computed(() => {
  const m = model.value;
  if (!m) return [];
  return tenantLicenses
    .filter((l) => modelsOf(l).some((x) => x.id === m.id))
    .map((l) => {
      const alias = aliasesOf(l).find((a) => a.primary === m.id);
      const how = l.extraIds.includes(m.id) ? 'Partner’s own model' : matches(l, m) ? (l.models.mode === 'list' ? 'Picked' : `By rule: ${ruleText(l)}`) : alias ? `Through model alias ${alias.name}` : 'Included';
      return { license: l, how, owner: l.ownerId === 'root' ? 'Instance' : tenantById(l.ownerId)?.name ?? l.ownerId, tenants: tenantsOn(l) };
    });
});
const tenantsReached = computed(() => new Set(includedIn.value.flatMap((r) => r.tenants.map((t) => t.id))).size);

// ---- retirement: the plan for a deprecated model, from what still uses it
// ---- capabilities: what callers can rely on; scenario aliases check them
const capsOpen = ref(false);
type CapsDraft = { caps: Capability[]; mode: ModelMode; input: Modality[]; output: Modality[]; maxOutput: number; params: string[]; unsupported: 'drop' | 'reject' };
const capsDraft = ref<CapsDraft>({ caps: [], mode: 'chat', input: ['text'], output: ['text'], maxOutput: 16_384, params: [], unsupported: 'drop' });
const profile = computed(() => (model.value ? profileOf(model.value) : undefined));
function openCaps(): void {
  const m = model.value;
  if (!m) return;
  const pr = profileOf(m);
  capsDraft.value = { caps: [...m.capabilities], mode: pr.mode, input: [...pr.input], output: [...pr.output], maxOutput: pr.maxOutput, params: [...pr.params], unsupported: pr.unsupported };
  capsOpen.value = true;
}
function saveCaps(): void {
  const m = model.value;
  if (!m) return;
  const d = capsDraft.value;
  const removed = m.capabilities.filter((c) => !d.caps.includes(c));
  Object.assign(m, {
    capabilities: CAPABILITIES.map((c) => c.id).filter((c) => d.caps.includes(c)),
    mode: d.mode, inputModalities: [...d.input], outputModalities: [...d.output], maxOutput: d.maxOutput, params: PARAMS.filter((x) => d.params.includes(x)), unsupportedParams: d.unsupported,
  });
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Changed capabilities of ${m.name}: ${m.capabilities.join(', ')}; in ${d.input.join('+')}, out ${d.output.join('+')}; unsupported parameters ${d.unsupported}`, target: m.name, tenantId: 'root' });
  notify(removed.length ? `Removed ${removed.map(capLabel).join(', ')}. Aliases that require them now flag this model.` : 'Saved.', removed.length ? 'warning' : 'success', 'Capabilities saved');
  capsOpen.value = false;
}
// Aliases this model serves that require something it lacks.
const capWarnings = computed(() =>
  memberships.value
    .map((ms) => ({ ms, miss: missingCaps(model.value, ms.alias.requiredCapabilities) }))
    .filter((x) => x.miss.length)
    .map((x) => `${x.ms.alias.name} (${roleText(x.ms)}) needs ${x.miss.map(capLabel).join(', ')}`),
);

const retirement = computed(() => {
  const m = model.value;
  if (!m || !['deprecated', 'retired'].includes(m.state)) return undefined;
  const replacement = modelById(m.replacementId);
  const aliases = memberships.value.filter((x) => x.role === 'primary').map((x) => x.alias);
  const days = m.retiresOn ? Math.round((Date.parse(m.retiresOn) - Date.parse('2026-11-11')) / 86_400_000) : 0;
  const retired = m.state === 'retired';
  const replacementLive = !!replacement && ['ga'].includes(replacement.state);
  const replacementRolling = replacement?.state === 'rolling-out';
  const steps: { text: string; state: 'done' | 'now' | 'next' }[] = [
    { text: `Notice to ${tenantsReached.value} tenants on ${includedIn.value.length} licenses that include it`, state: 'done' },
    replacement
      ? { text: `Replacement: ${replacement.name}${!isV1.value && replacement.scores && Object.keys(replacement.scores).length ? ` — scores ${Object.entries(replacement.scores).map(([k, v]) => `${suiteName(k)} ${v}`).join(', ')}` : ''}`, state: 'done' }
      : { text: 'Choose a replacement (deprecate again to set one)', state: 'now' },
    { text: replacement ? `${replacement.name} ${replacementLive ? 'generally available' : replacementRolling ? `rolling out (${replacement.ring})` : 'not rolled out yet'}` : 'Roll out the replacement', state: replacementLive || retired ? 'done' : replacement ? 'now' : 'next' },
    { text: aliases.length ? `Move ${aliases.map((a) => a.name).join(', ')} off it — still its primary` : 'No alias points at it any more', state: aliases.length && !retired ? (replacementLive ? 'now' : 'next') : 'done' },
    { text: `Retire${m.retiresOn ? ` on ${fmtDate(m.retiresOn)}` : ''}: requests naming it get 404 with ${replacement ? replacement.name : 'the alias'} to use`, state: retired ? 'done' : 'next' },
  ];
  return { steps, subtitle: retired ? 'Requests naming it get 404 with the model to use instead.' : `${days} days left${replacement ? ` · replaced by ${replacement.name}` : ''}` };
});


// ---- tabs
const tab = computed(() => ((isV1.value ? ['usage'] : ['usage', 'benchmarks']).includes(String(route.query.tab)) ? String(route.query.tab) : 'overview'));
const go = (t: string) => router.replace({ query: t === 'overview' ? {} : { tab: t } });

// ---- price: what callers are charged, in platform credits per 1M tokens
const price = reactive({ in: 0, cachedIn: 0, cacheWrite: 0, out: 0 });
const priceNow = (m: NonNullable<typeof model.value>) => { const p = pricesOf(m); return { in: Math.round(p.in * CREDITS_PER_USD), cachedIn: Math.round(p.cachedIn * CREDITS_PER_USD), cacheWrite: Math.round(p.cacheWrite * CREDITS_PER_USD), out: Math.round(p.out * CREDITS_PER_USD) }; };
watch(model, (m) => m && Object.assign(price, priceNow(m)), { immediate: true });
const priceChanged = computed(() => !!model.value && JSON.stringify(priceNow(model.value)) !== JSON.stringify({ in: price.in, cachedIn: price.cachedIn, cacheWrite: price.cacheWrite, out: price.out }));
function savePrice(): void {
  const m = model.value;
  if (!m) return;
  const was = `${fmtCreditPrice(m.priceIn)} / ${fmtCreditPrice(m.priceOut)}`;
  m.priceIn = price.in / CREDITS_PER_USD;
  m.priceCachedIn = price.cachedIn / CREDITS_PER_USD;
  m.priceCacheWrite = price.cacheWrite / CREDITS_PER_USD;
  m.priceOut = price.out / CREDITS_PER_USD;
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Changed the price of ${m.name} from ${was} to ${price.in} in, ${price.cachedIn} cached in, ${price.cacheWrite} cache write, ${price.out} out credits per 1M tokens`, target: m.name, tenantId: 'root' });
  notify('New requests are charged the new price; usage already recorded keeps the price it ran at.', 'success', 'Price saved');
}

// ---- usage: aggregates only, never a tenant's individual requests
const period = ref<PeriodId>('30d');
const stats = computed(() => (model.value ? statsFor(model.value) : undefined));
const scale = computed(() => periodOf(period.value).days / 30);
const series = computed(() => (stats.value ? seriesFor(stats.value.daily, period.value) : []));
const scaled = (n: number) => Math.round(n * scale.value);
const classRows = computed(() => (model.value && stats.value ? costByClass(model.value, scaled(stats.value.tokensIn30d), scaled(stats.value.tokensOut30d), stats.value.cacheHit) : []));
const creditsBilled = computed(() => classRows.value.reduce((s, r) => s + r.credits, 0) / CREDITS_PER_USD);
const fmtBig = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

// ---- benchmarks: per-suite result, run history, new runs
const history = computed(() => (model.value ? runsOf(model.value.id) : []));
const latestOf = (suiteId: string) => history.value.find((r) => r.suiteId === suiteId && (r.status === 'passed' || r.status === 'failed'));
const inFlight = (suiteId: string) => history.value.some((r) => r.suiteId === suiteId && (r.status === 'queued' || r.status === 'running'));
const trendOf = (suiteId: string) => history.value.filter((r) => r.suiteId === suiteId && r.score !== undefined).slice(0, 2);
const runOpen = ref(false);
const runSuites = ref<string[]>([]);
const runBenchmarks = ref<string[]>([]);
const benchQuery = ref('');
// A benchmark already in a picked suite runs with it.
const coveredBy = (b: (typeof BENCHMARKS)[number]) => db.suites.find((s) => b.suiteIds.includes(s.id) && runSuites.value.includes(s.id));
const benchShown = computed(() => {
  const q = benchQuery.value.trim().toLowerCase();
  return BENCHMARKS.filter((b) => !q || `${b.name} ${b.description} ${b.suiteIds.map((id) => targetName(id)).join(' ')}`.toLowerCase().includes(q));
});
const benchPicked = computed(() => runBenchmarks.value.filter((id) => { const b = BENCHMARKS.find((x) => x.id === id); return b && !coveredBy(b); }));
const runCount = computed(() => runSuites.value.length + benchPicked.value.length);
const benchmarkResults = computed(() => BENCHMARKS.map((b) => ({ b, last: history.value.find((r) => r.suiteId === b.id && r.score !== undefined) })).filter((x) => x.last));
function openRun(only?: string, kind: 'suite' | 'benchmark' = 'suite'): void {
  runSuites.value = only ? (kind === 'suite' ? [only] : []) : db.suites.map((s) => s.id);
  runBenchmarks.value = only && kind === 'benchmark' ? [only] : [];
  benchQuery.value = '';
  runOpen.value = true;
}
function run(): void {
  const m = model.value;
  if (!m || !runCount.value) return;
  startRuns(m.id, runSuites.value, 'Victor Batraev', (r) => notify(r.threshold === undefined ? `${targetName(r.suiteId)}: ${r.score}.` : `${targetName(r.suiteId)}: ${r.score} against a threshold of ${r.threshold}.`, r.status === 'failed' ? 'warning' : 'success', r.status === 'passed' ? 'Benchmark passed' : r.status === 'failed' ? 'Benchmark failed' : 'Benchmark finished'), benchPicked.value);
  notify(`${runCount.value} ${runCount.value === 1 ? 'run' : 'runs'} queued on the eval instance, about $${estimateUsd(runSuites.value, benchPicked.value)}.`, 'info', 'Benchmark runs started');
  runOpen.value = false;
  go('benchmarks');
}
const RUN_TAG = { queued: 'disabled', running: 'info', passed: 'success', failed: 'error', done: 'info' } as const;

const sRun = useSort(() => runs.value, { suite: (r) => suiteName(r.suiteId), inc: (r) => r.incumbentScore, cand: (r) => r.candidateScore, cost: (r) => r.costDelta, lat: (r) => r.latencyDelta, status: (r) => r.status });
</script>

<template>
  <div v-if="model">
    <PageHeader :title="model.name" back :description="`${model.provider} · ${model.family} family · version ${model.version}`" @back="router.push('/root/models')">
      <template #actions>
        <GoButton v-if="!isV1" variant="secondary" size="m" @click="openRun()">Run benchmarks</GoButton>
        <LifecycleMoveMenu :model="model" />
        <GoButton v-if="model.state === 'ga' && familyDefault && familyDefault.primary !== model.id" variant="secondary" size="m" @click="setDefault">Make {{ familyDefault.name }} point here</GoButton>
      </template>
      <div class="state">
        <LifecycleTag :state="model.state" :ring="model.ring" />
        <span class="registry">Registry status: <strong>{{ REGISTRY[model.state] }}</strong></span>
      </div>
    </PageHeader>

    <GoTabs class="tabs">
      <GoTabsItem :active="tab === 'overview'" @click="go('overview')">Overview</GoTabsItem>
      <GoTabsItem :active="tab === 'usage'" @click="go('usage')">Usage</GoTabsItem>
      <GoTabsItem v-if="!isV1" :active="tab === 'benchmarks'" @click="go('benchmarks')">Benchmarks · {{ new Set(history.map((r) => r.suiteId)).size }}</GoTabsItem>
    </GoTabs>

    <template v-if="tab === 'overview'">
    <Card v-if="retirement" :title="model.state === 'retired' ? 'Retired' : `Retirement: ${fmtDate(model.retiresOn ?? '')}`" :subtitle="retirement.subtitle" class="retire-card">
      <ol class="plan">
        <li v-for="st in retirement.steps" :key="st.text" :class="st.state">{{ st.text }}</li>
      </ol>
    </Card>
    <GoMessage v-if="['verified', 'approved'].includes(model.state) && shortfall > 0" variant="error" border rounded class="notice">
      Promotion blocked: needs {{ model.gpusRequired }} GPUs, {{ gpuFree }} free on the instance
      <template #addition>Free {{ shortfall }} more GPUs — scale down or retire a deployment — and promote again.</template>
    </GoMessage>
    <GoMessage v-else-if="['verified', 'approved'].includes(model.state)" variant="success" border rounded class="notice">
      Ready to promote: needs {{ model.gpusRequired }} GPUs, {{ gpuFree }} free
      <template v-if="!isV1" #addition>Benchmark scores are evidence here; scenario aliases only route to models that pass their scenario.</template>
    </GoMessage>
    <GoMessage v-if="!isV1 && isOpenWeight && model.state !== 'discovered' && !model.admission?.benchmark" variant="warning" rounded class="notice">
      No benchmark result for this model
    </GoMessage>

    <div class="grid">
      <Card v-if="isOpenWeight" title="Admission" subtitle="Each stage must pass before the next runs. License, security and acceptance failures block the model.">
        <ol class="stages">
          <li v-for="s in stagesShown" :key="s.id" class="stage" :class="`stage_${model.admission?.[s.id]?.status ?? 'pending'}`">
            <IconCircleCheck v-if="model.admission?.[s.id]?.status === 'passed'" class="stage-icon" aria-hidden="true" />
            <IconCircleXmark v-else-if="model.admission?.[s.id]?.status === 'failed'" class="stage-icon" aria-hidden="true" />
            <IconClockArrowRotateLeft v-else class="stage-icon" aria-hidden="true" />
            <div class="stage-body">
              <span class="stage-name">{{ s.label }}</span>
              <span class="stage-note">{{ model.admission?.[s.id]?.note ?? 'Not run' }}</span>
            </div>
            <GoStatusTag :variant="STATUS[model.admission?.[s.id]?.status ?? 'pending']" size="xs">{{ model.admission?.[s.id]?.status ?? 'pending' }}</GoStatusTag>
          </li>
        </ol>
      </Card>

      <div class="side" :class="{ side_row: !isOpenWeight }">
      <Card title="Details">
        <GoDescriptionList>
          <GoDescriptionListItem v-if="model.hfId"><template #name>Hugging Face</template><template #value>{{ model.hfId }}</template></GoDescriptionListItem>
          <GoDescriptionListItem v-if="model.modelLicense"><template #name>Model license</template><template #value>{{ model.modelLicense }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>In aliases</template><template #value>
            <span v-if="!memberships.length" class="muted">None — reachable only by its model ID</span>
            <span v-for="ms in memberships" :key="`${ms.alias.id}-${ms.role}-${ms.position ?? 0}`" class="membership"><RouterLink to="/root/routing"><code>{{ ms.alias.name }}</code></RouterLink> {{ roleText(ms) }}</span>
          </template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Max context</template><template #value>{{ fmtContext(model.context) }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Capabilities</template><template #value>
            {{ model.capabilities.length }} of {{ CAPABILITIES.length }} · {{ profile?.input.join(', ') }} in
            <button type="button" class="edit-link" @click="openCaps">Edit</button>
            <span v-for="w in capWarnings" :key="w" class="sub lacking">{{ w }}</span>
          </template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Price per 1M</template><template #value>{{ fmtCreditPrice(pricesOf(model).in) }} in · {{ fmtCreditPrice(pricesOf(model).cachedIn) }} cached · {{ fmtCreditPrice(pricesOf(model).cacheWrite) }} cache write · {{ fmtCreditPrice(pricesOf(model).out) }} out</template></GoDescriptionListItem>
          <GoDescriptionListItem v-if="model.gpusRequired"><template #name>GPUs to serve</template><template #value>{{ model.gpusRequired }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Uptime 30d</template><template #value>{{ model.uptime30d ? fmtPct(model.uptime30d, 2) : '—' }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Data processed in</template><template #value>{{ model.dataResidency }}</template></GoDescriptionListItem>
          <GoDescriptionListItem v-if="model.retiresOn"><template #name>Retires</template><template #value>{{ model.retiresOn }}</template></GoDescriptionListItem>
        </GoDescriptionList>
      </Card>
      <Card title="Price" subtitle="What callers are charged per 1M tokens, in platform credits. Applies to new requests.">
        <div class="price">
        <GoFormControl label="Input, uncached" label-for="md-in"><GoInputNumber id="md-in" v-model="price.in" :min="0" :step="10" size="m" /></GoFormControl>
        <GoFormControl label="Input, cached" label-for="md-cin"><GoInputNumber id="md-cin" v-model="price.cachedIn" :min="0" :step="1" size="m" /></GoFormControl>
        <GoFormControl label="Cache write" label-for="md-cw"><GoInputNumber id="md-cw" v-model="price.cacheWrite" :min="0" :step="10" size="m" /></GoFormControl>
        <GoFormControl label="Output" label-for="md-out"><GoInputNumber id="md-out" v-model="price.out" :min="0" :step="10" size="m" /></GoFormControl>
          <GoButton size="m" :disabled="!priceChanged" class="price-save" @click="savePrice">Save price</GoButton>
        </div>
      </Card>
      </div>
    </div>

    <Card v-if="profile" title="Capabilities" subtitle="What callers can rely on. Scenario aliases only route to models that have what they require." class="caps-card">
      <template #actions><GoButton variant="secondary" size="s" @click="openCaps">Edit</GoButton></template>
      <div class="caps-grid">
        <div class="caps-facts">
          <span class="fact"><span class="sub">Mode</span>{{ MODES.find((x) => x.id === profile!.mode)?.label }}</span>
          <span class="fact"><span class="sub">Takes</span>{{ profile.input.map((x) => MODALITIES.find((y) => y.id === x)?.label).join(', ') }}</span>
          <span class="fact"><span class="sub">Returns</span>{{ profile.output.map((x) => MODALITIES.find((y) => y.id === x)?.label).join(', ') }}</span>
          <span class="fact"><span class="sub">Context / max output</span>{{ fmtContext(model.context) }} / {{ fmtContext(profile.maxOutput) }} tokens</span>
          <span class="fact"><span class="sub">Unsupported parameters</span>{{ profile.unsupported === 'drop' ? 'Dropped silently' : 'Refused with 400' }}</span>
        </div>
        <div v-for="g in CAP_GROUPS" :key="g" class="caps-group">
          <span class="sub">{{ g }}</span>
          <span v-for="c in CAPABILITIES.filter((x) => x.group === g)" :key="c.id" class="cap" :class="{ cap_off: !model.capabilities.includes(c.id) }" :title="c.hint">{{ model.capabilities.includes(c.id) ? '✓' : '–' }} {{ c.label }}</span>
        </div>
      </div>
      <div class="params"><span class="sub">Request parameters it accepts</span><code v-for="x in profile.params" :key="x" class="param">{{ x }}</code></div>
    </Card>

    <Card v-if="!isV1" title="Candidate vs incumbent" subtitle="Same suites, same run settings. Scores, cost and latency against the model it would replace." flush>
      <template #actions></template>
      <GoTable size="sm">
        <GoTableRow header>
          <SortHeader :sort="sRun" k="suite">Suite</SortHeader>
          <SortHeader :sort="sRun" k="inc">Incumbent</SortHeader>
          <SortHeader :sort="sRun" k="cand">This model</SortHeader>
          <SortHeader :sort="sRun" k="cost">Cost</SortHeader>
          <SortHeader :sort="sRun" k="lat">Latency</SortHeader>
          <SortHeader :sort="sRun" k="status">Result</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="r in sRun.rows.value" :key="r.id">
          <GoTableCell>{{ suiteName(r.suiteId) }}</GoTableCell>
          <GoTableCell>{{ modelById(r.incumbentId)?.name }} · {{ r.incumbentScore }}</GoTableCell>
          <GoTableCell><strong>{{ r.status === 'running' ? '…' : r.candidateScore }}</strong></GoTableCell>
          <GoTableCell>{{ r.costDelta > 0 ? '+' : '' }}{{ r.costDelta }}%</GoTableCell>
          <GoTableCell>{{ r.latencyDelta > 0 ? '+' : '' }}{{ r.latencyDelta }}%</GoTableCell>
          <GoTableCell><GoStatusTag :variant="r.status === 'passed' ? 'success' : r.status === 'failed' ? 'error' : 'info'" size="sm">{{ r.status }}</GoStatusTag></GoTableCell>
        </GoTableRow>
        <GoTableRow v-if="!runs.length">
          <GoTableCell :colspan="6"><span class="empty">No comparison runs yet. Scores per suite: {{ Object.entries(model.scores).map(([k, v]) => `${suiteName(k)} ${v}`).join(' · ') || 'none' }}</span></GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <Card title="Included in licenses" :subtitle="includedIn.length ? `${includedIn.length} tenant licenses include it, reaching ${tenantsReached} tenants. Change it in the licenses, under Settings → Tenant licenses.` : 'No tenant license includes it, so no tenant can call it.'" flush class="spaced">
      <GoTable v-if="includedIn.length" size="sm">
        <GoTableRow header>
          <GoTableCell>Tenant license</GoTableCell>
          <GoTableCell>Offered by</GoTableCell>
          <GoTableCell>How it is included</GoTableCell>
          <GoTableCell>Tenants on it</GoTableCell>
        </GoTableRow>
        <GoTableRow v-for="r in includedIn" :key="r.license.id">
          <GoTableCell><RouterLink :to="r.license.ownerId === 'root' ? '/root/settings?section=licenses' : `/root/tenants/${r.license.ownerId}`">{{ r.license.name }}</RouterLink></GoTableCell>
          <GoTableCell>{{ r.owner }}</GoTableCell>
          <GoTableCell>{{ r.how }}</GoTableCell>
          <GoTableCell>
            <template v-if="r.tenants.length"><RouterLink v-for="(t, i) in r.tenants" :key="t.id" :to="`/root/tenants/${t.id}`">{{ t.name }}{{ i < r.tenants.length - 1 ? ', ' : '' }}</RouterLink></template>
            <span v-else class="empty">None yet</span>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>
    </template>

    <!-- Usage: aggregates for the instance; individual requests stay with their tenant -->
    <template v-else-if="tab === 'usage' && stats">
      <div class="usage-head">
        <span class="sub">Aggregated across tenants. Individual requests stay private to their tenant.</span>
        <GoSegmentButtonGroup v-model="period" size="s" aria-label="Period">
          <GoSegmentButton v-for="p in PERIODS" :key="p.id" :value="p.id">{{ p.label }}</GoSegmentButton>
        </GoSegmentButtonGroup>
      </div>
      <div class="tiles">
        <StatTile label="Requests" :value="fmtBig(scaled(stats.requests30d))" :hint="periodOf(period).label" />
        <StatTile label="Tokens in / out" :value="`${fmtBig(scaled(stats.tokensIn30d))} / ${fmtBig(scaled(stats.tokensOut30d))}`" :hint="`${stats.cacheHit}% of input from cache`" />
        <StatTile label="Credits billed" :value="fmtCredits(creditsBilled)" hint="At the current price" />
        <StatTile label="Errors" :value="fmtPct(stats.errorRate, 2)" :hint="`${fmtInt(Math.round(scaled(stats.requests30d) * stats.errorRate / 100))} requests`" :tone="stats.errorRate > 1.5 ? 'warn' : 'neutral'" />
        <StatTile label="Latency p50 / p95" :value="`${fmtInt(stats.p50Ms)} / ${fmtInt(stats.p95Ms)} ms`" :hint="`First token p95 ${fmtInt(stats.ttftP95Ms)} ms`" />
        <StatTile label="Output speed" :value="`${fmtInt(model.tps)} tok/s`" :hint="`Uptime ${model.uptime30d ? fmtPct(model.uptime30d, 2) : '—'} over 30 days`" />
      </div>
      <Card :title="period === 'today' ? 'Requests per hour' : 'Requests per day'" class="spaced">
        <LineChart :key="period" :points="series" label="Requests" :format="fmtBig" />
      </Card>
      <Card title="Cost by token class" :subtitle="`${periodOf(period).label} · at the current price per class`" flush class="spaced">
        <ClassCostTable :rows="classRows" />
      </Card>
      <div class="two spaced">
        <Card title="By tenant" subtitle="Requests in the period">
          <BarList :items="stats.byTenant.map((t) => ({ ...t, value: scaled(t.value) }))" :format="fmtBig" />
        </Card>
        <Card title="Failures by type" subtitle="Counts only">
          <BarList v-if="stats.errorsByType.length" :items="stats.errorsByType.map((t) => ({ ...t, value: scaled(t.value) }))" :format="fmtInt" />
          <p v-else class="sub">No failures.</p>
        </Card>
      </div>
    </template>
    <p v-else-if="tab === 'usage'" class="sub">No traffic yet.</p>

    <!-- Benchmarks: latest result per suite, then every run -->
    <template v-else-if="tab === 'benchmarks'">
      <Card title="Results by suite" subtitle="The latest finished run of each suite; this is what alias gates read." flush>
        <template #actions><GoButton size="s" @click="openRun()">Run benchmarks</GoButton></template>
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>Benchmark suite</GoTableCell>
            <GoTableCell>Score</GoTableCell>
            <GoTableCell>Threshold</GoTableCell>
            <GoTableCell>Change</GoTableCell>
            <GoTableCell>Last run</GoTableCell>
            <GoTableCell width="110" />
          </GoTableRow>
          <GoTableRow v-for="s in db.suites" :key="s.id">
            <GoTableCell>{{ s.name }}<span class="sub">{{ s.version }} · {{ s.cases }} cases · {{ s.scoring }}</span></GoTableCell>
            <GoTableCell>
              <GoStatusTag v-if="latestOf(s.id)" :variant="latestOf(s.id)!.status === 'passed' ? 'success' : 'error'" size="sm">{{ latestOf(s.id)!.score }}</GoStatusTag>
              <span v-else class="sub">Not run</span>
            </GoTableCell>
            <GoTableCell>{{ s.threshold }}</GoTableCell>
            <GoTableCell>
              <template v-if="trendOf(s.id).length === 2">{{ trendOf(s.id)[0]!.score! - trendOf(s.id)[1]!.score! >= 0 ? '+' : '' }}{{ trendOf(s.id)[0]!.score! - trendOf(s.id)[1]!.score! }}</template>
              <span v-else class="sub">—</span>
            </GoTableCell>
            <GoTableCell>{{ latestOf(s.id) ? fmtDateTime(latestOf(s.id)!.at) : '—' }}</GoTableCell>
            <GoTableCell>
              <span v-if="inFlight(s.id)" class="sub">Running…</span>
              <GoButton v-else variant="ghost" size="s" @click="openRun(s.id)">Run</GoButton>
            </GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>

      <Card title="Individual benchmarks" subtitle="Latest result of each benchmark run on its own. Public benchmarks have no threshold: they are evidence, not a gate." flush class="spaced">
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>Benchmark</GoTableCell>
            <GoTableCell>Part of</GoTableCell>
            <GoTableCell>Score</GoTableCell>
            <GoTableCell>Last run</GoTableCell>
            <GoTableCell width="110" />
          </GoTableRow>
          <GoTableRow v-for="x in benchmarkResults" :key="x.b.id">
            <GoTableCell>{{ x.b.name }}<span class="sub">{{ x.b.source }} · {{ x.b.cases }} cases · {{ x.b.metric }}</span></GoTableCell>
            <GoTableCell>{{ x.b.suiteIds.map((id) => targetName(id)).join(', ') || 'Standalone' }}</GoTableCell>
            <GoTableCell><GoStatusTag :variant="RUN_TAG[x.last!.status]" size="sm">{{ x.last!.score }}</GoStatusTag><span class="sub">{{ x.b.threshold === undefined ? 'no threshold' : `threshold ${x.b.threshold}` }}</span></GoTableCell>
            <GoTableCell>{{ fmtDateTime(x.last!.at) }}</GoTableCell>
            <GoTableCell>
              <span v-if="inFlight(x.b.id)" class="sub">Running…</span>
              <GoButton v-else variant="ghost" size="s" @click="openRun(x.b.id, 'benchmark')">Run</GoButton>
            </GoTableCell>
          </GoTableRow>
          <GoTableRow v-if="!benchmarkResults.length"><GoTableCell :colspan="5"><span class="empty">No single benchmarks run yet. Pick them under Run benchmarks.</span></GoTableCell></GoTableRow>
        </GoTable>
      </Card>

      <Card title="Run history" :subtitle="`${history.length} runs, newest first`" flush class="spaced">
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>When</GoTableCell>
            <GoTableCell>Suite or benchmark</GoTableCell>
            <GoTableCell>Result</GoTableCell>
            <GoTableCell>Cost</GoTableCell>
            <GoTableCell>Duration</GoTableCell>
            <GoTableCell>Started by</GoTableCell>
          </GoTableRow>
          <GoTableRow v-for="r in history" :key="r.id">
            <GoTableCell>{{ fmtDateTime(r.at) }}</GoTableCell>
            <GoTableCell>{{ targetName(r.suiteId) }}<span class="sub">{{ r.kind === 'suite' ? `Suite ${r.suiteVersion}` : 'Single benchmark' }}</span></GoTableCell>
            <GoTableCell><GoStatusTag :variant="RUN_TAG[r.status]" size="sm">{{ r.score !== undefined ? `${r.score} · ${r.status}` : r.status }}</GoStatusTag><span class="sub">{{ r.threshold === undefined ? 'no threshold' : `threshold ${r.threshold}` }}</span></GoTableCell>
            <GoTableCell>${{ r.costUsd }}</GoTableCell>
            <GoTableCell>{{ r.durationMin }} min</GoTableCell>
            <GoTableCell>{{ r.by }}</GoTableCell>
          </GoTableRow>
          <GoTableRow v-if="!history.length"><GoTableCell :colspan="6"><span class="empty">No runs yet.</span></GoTableCell></GoTableRow>
        </GoTable>
      </Card>
    </template>

    <GoDialog v-model="capsOpen" size="l">
      <GoDialogWindow :title="`Capabilities of ${model.name}`" header-border @close="capsOpen = false">
        <div class="fields">
          <span class="sub">What callers can rely on. Acceptance tests check them on admission; scenario aliases only route to models that have what they require.</span>
          <div class="two">
            <GoFormControl label="Mode">
              <GoSelect v-model="capsDraft.mode" size="m" aria-label="Mode">
                <GoSelectOption v-for="x in MODES" :key="x.id" :value="x.id">{{ x.label }}</GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <GoFormControl label="Max output, tokens" label-for="cap-out"><GoInputNumber id="cap-out" v-model="capsDraft.maxOutput" :min="256" :step="1024" size="m" /></GoFormControl>
          </div>
          <div class="two">
            <GoFormControl label="Takes"><div class="inline-checks"><GoCheckbox v-for="x in MODALITIES" :key="x.id" v-model="capsDraft.input" :value="x.id">{{ x.label }}</GoCheckbox></div></GoFormControl>
            <GoFormControl label="Returns"><div class="inline-checks"><GoCheckbox v-for="x in MODALITIES" :key="x.id" v-model="capsDraft.output" :value="x.id">{{ x.label }}</GoCheckbox></div></GoFormControl>
          </div>
          <div class="cap-edit">
            <div v-for="g in CAP_GROUPS" :key="g" class="caps-group">
              <span class="sub">{{ g }}</span>
              <GoCheckbox v-for="c in CAPABILITIES.filter((x) => x.group === g)" :key="c.id" v-model="capsDraft.caps" :value="c.id">{{ c.label }}<span class="sub">{{ c.hint }}</span></GoCheckbox>
            </div>
          </div>
          <GoFormControl label="Request parameters it accepts" hint="The gateway maps each to the provider's own name">
            <div class="inline-checks"><GoCheckbox v-for="x in PARAMS" :key="x" v-model="capsDraft.params" :value="x"><code>{{ x }}</code></GoCheckbox></div>
          </GoFormControl>
          <GoFormControl label="A request with a parameter it does not accept">
            <GoSegmentButtonGroup v-model="capsDraft.unsupported" size="s" aria-label="Unsupported parameters">
              <GoSegmentButton value="drop">Drop it and answer</GoSegmentButton>
              <GoSegmentButton value="reject">Refuse with 400</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="capsOpen = false">Cancel</GoButton>
            <GoButton size="m" @click="saveCaps">Save</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>

    <GoDialog v-model="runOpen" size="m">
      <GoDialogWindow :title="`Run benchmarks on ${model.name}`" header-border @close="runOpen = false">
        <div class="fields">
          <span class="sub">Runs on the eval instance with pinned settings. A suite result replaces the model's score for that suite; a single benchmark adds evidence.</span>
          <span class="dlg-group">Suites</span>
          <ItemPicker v-model="runSuites" :items="db.suites.map((x) => ({ id: x.id, label: x.name, sub: `${x.version} · ${x.cases} cases`, disabled: inFlight(x.id), disabledReason: 'Already running' }))" placeholder="Search suites" noun="suites" :max-height="180" />
          <span class="dlg-group">Individual benchmarks</span>
          <ItemPicker v-model="runBenchmarks" :items="BENCHMARKS.map((b) => ({ id: b.id, label: b.name, group: b.suiteIds.length ? 'In a suite' : 'Standalone', sub: `${b.source} · ${b.cases} cases${b.threshold === undefined ? '' : ` · threshold ${b.threshold}`}`, disabled: !!coveredBy(b) || inFlight(b.id), disabledReason: coveredBy(b) ? `Runs with ${coveredBy(b)!.name}` : 'Already running' }))" placeholder="Search benchmarks" noun="benchmarks" :max-height="240" />
        </div>
        <template #footer>
          <div class="footer">
            <span class="sub est">About ${{ estimateUsd(runSuites, benchPicked) }}, charged to the benchmark budget</span>
            <GoButton variant="secondary" size="m" @click="runOpen = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!runCount" @click="run">Start {{ runCount }} {{ runCount === 1 ? 'run' : 'runs' }}</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .caps-card {
    margin-block-end: var(--acv-spacing-regular);
  }

  .caps-grid {
    display: grid;
    grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .caps-facts {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .fact {
    @mixin acv-text-ui-body-2;
  }

  .caps-group {
    display: grid;
    gap: 4px;
    align-content: start;
  }

  .cap {
    @mixin acv-text-ui-body-2;

    &.cap_off {
      color: var(--acv-color-glyph-tertiary);
    }
  }

  .params {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-block-start: var(--acv-spacing-regular);
  }

  .param {
    @mixin acv-text-ui-caption-1;
    padding: 1px 6px;
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-secondary);
  }

  .inline-checks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--acv-spacing-small) var(--acv-spacing-regular);
  }

  .cap-edit {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .edit-link {
    @mixin acv-text-ui-caption-1;
    margin-inline-start: var(--acv-spacing-x-small);
    padding: 0;
    border: none;
    background: none;
    color: var(--acv-color-glyph-brand);
    cursor: pointer;
  }

  .lacking {
    color: var(--acv-color-status-warning-strong, #b45309);
  }

  .retire-card {
    margin-block-end: var(--acv-spacing-regular);
  }

  .plan {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-xx-small);
    margin: 0;
    padding-inline-start: var(--acv-spacing-medium);
    color: var(--acv-color-glyph-tertiary);

    & .done {
      color: var(--acv-color-glyph-primary);
    }

    & .now {
      color: var(--acv-color-glyph-brand);
      font-weight: var(--acv-font-weight-medium);
    }
  }

  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }

  .side {
    display: grid;
    gap: var(--acv-spacing-regular);
    align-content: start;

    &.side_row {
      grid-column: 1 / -1;
      grid-template-columns: 3fr 2fr;
      align-items: start;
    }
  }

  .price {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: end;
  }

  .price-save {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .usage-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--acv-spacing-regular);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-small);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }

  .dlg-group {
    @mixin acv-text-ui-caption-1;
    margin-block-start: var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-secondary);
    text-transform: uppercase;
  }

  .bench-list {
    display: grid;
    gap: var(--acv-spacing-small);
    max-block-size: 260px;
    overflow-y: auto;
  }

  .est {
    margin-inline-end: auto;
  }

  .membership {
    display: block;
  }

  .muted {
    color: var(--acv-color-glyph-tertiary);
  }

  .state {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-x-small);
  }

  .notice {
    margin-block-end: var(--acv-spacing-regular);
  }

  .grid {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .stages {
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .stage {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: start;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-x-small) var(--acv-spacing-small);
    border-radius: var(--acv-radius-regular);
    background: var(--acv-color-surface-secondary);

    &.stage_failed {
      background: var(--acv-color-status-danger-light);
    }
  }

  .stage-icon {
    --icon-size: var(--acv-icon-size-sm);
    color: var(--acv-color-glyph-tertiary);

    .stage_passed & {
      color: var(--acv-color-status-success-strong);
    }

    .stage_failed & {
      color: var(--acv-color-status-danger-strong);
    }
  }

  .stage-body {
    display: flex;
    flex-direction: column;
  }

  .stage-name {
    @mixin acv-text-ui-body-2-medium;
  }

  .prd {
    @mixin acv-text-ui-caption-2;
    color: var(--acv-color-glyph-tertiary);
  }

  .stage-note {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .registry {
    @mixin acv-text-ui-caption-1;
    align-self: center;
    color: var(--acv-color-glyph-secondary);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }


  .empty {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
