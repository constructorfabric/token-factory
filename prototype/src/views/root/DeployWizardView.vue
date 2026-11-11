<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoStepper, GoStepperItem } from '@constructor/ui/stepper';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatTile from '@/components/ui/StatTile.vue';
import type { Capability } from '@/data/types';
import { CREDITS_PER_USD, fmtCompact, fmtContext, fmtInt } from '@/lib/format';
import { CANDIDATES, QUANT, billingLabel, connectedProviders, freeGpus, size, type Candidate, type Quant } from '@/state/compute';
import { db, record } from '@/state/db';

/**
 * Deploy an open-weight model on connected compute: pick the source, accept
 * or adjust the recommended layout, set how the model is served, price it,
 * and deploy. When it is up, the model enters the catalog and its lifecycle.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const STEPS = ['Model', 'Infrastructure', 'Serving', 'Price & lifecycle', 'Review'];
const LAST_STEP = STEPS.length - 1;
const suiteFilter = ref<'all' | 'selected'>('all');
const suiteQuery = ref('');
const suitesShown = computed(() => suites.value.filter((b) => (suiteFilter.value === 'all' || price.value.suites.includes(b.id)) && (!suiteQuery.value || `${b.name} ${b.scenario}`.toLowerCase().includes(suiteQuery.value.toLowerCase()))));
const contextOptions = computed(() => [32_768, 65_536, 131_072, 200_000, 262_144].filter((x) => x <= (picked.value?.context ?? 0)));
const suites = computed(() => db.suites);
const step = ref(0);

// ---- 1. source
const SOURCES = ['Hugging Face', 'Admitted, not deployed', 'Own registry'] as const;
const sourceFilter = ref<(typeof SOURCES)[number]>('Hugging Face');
const query = ref('');
const candidates = computed(() => CANDIDATES.filter((c) => c.source === sourceFilter.value && (!query.value || `${c.name} ${c.repo}`.toLowerCase().includes(query.value.toLowerCase()))));
const picked = ref<Candidate | null>(null);
const hfConnected = true;

// ---- 2. infrastructure: recommended first, every part adjustable
const providers = computed(() => connectedProviders());
const infra = ref({ provider: String(route.query.provider ?? providers.value.find((p) => p.id === 'gcore')?.id ?? providers.value[0]?.id ?? ''), region: '', gpu: '', quant: 'FP8' as Quant, gpus: 0, runtime: 'vLLM', min: 1, max: 2, scaleOn: 'utilization', target: 70, scaleToZero: false });
const provider = computed(() => providers.value.find((p) => p.id === infra.value.provider));
const gpu = computed(() => provider.value?.gpus.find((g) => g.type === infra.value.gpu) ?? provider.value?.gpus[0]);
function recommend(): void {
  const p = provider.value;
  if (!p || !picked.value) return;
  infra.value.region = p.regions[0] ?? '';
  // the largest-memory GPU that keeps the replica within 8 GPUs, else the largest
  const fit = [...p.gpus].sort((a, b) => b.memoryGb - a.memoryGb).find((g) => size(picked.value!, g, 'FP8').gpus <= 8) ?? p.gpus[0];
  infra.value.gpu = fit?.type ?? '';
  infra.value.quant = picked.value.paramsB > 100 ? 'FP8' : 'BF16';
  infra.value.gpus = 0;
  infra.value.runtime = picked.value.activeB < picked.value.paramsB ? 'SGLang' : 'vLLM';
  infra.value.min = 1;
  infra.value.max = 2;
}
watch([picked, () => infra.value.provider], recommend, { immediate: true });
const serving = ref({ name: '', alias: '', maxContext: 131_072, maxOutput: 16_384, maxSeqs: 0, kvCache: 'fp8', prefixCache: true, speculative: false, toolParser: 'auto', reasoning: true, structured: true, timeout: 600, capabilities: [] as string[] });
const sizing = computed(() => (picked.value && gpu.value ? size(picked.value, gpu.value, infra.value.quant, infra.value.gpus || undefined, infra.value.max, Math.min(serving.value.maxContext, 65_536)) : null));
// What users get from the selected resources, and how the alternatives compare.
const perUserOf = (tps: number, conc: number) => Math.round(Math.min(140, (tps / Math.max(1, conc)) * 2.4));
const perf = computed(() => {
  const z = sizing.value;
  if (!z) return null;
  const total = z.tpsPerReplica * infra.value.max;
  return { perUser: perUserOf(z.tpsPerReplica, z.concurrency), total, users: z.concurrency * infra.value.max, ttftP95: Math.round(z.ttftMs * 2.6), rpm: Math.round((total * 60) / 600), daily: total * 86_400 * 0.55 };
});
const selectedLabel = computed(() => `${infra.value.max} × ${sizing.value?.gpus ?? 0} ${gpu.value?.type.replace('NVIDIA ', '') ?? ''} · ${infra.value.quant} · ${infra.value.runtime} on ${provider.value?.name}, ${infra.value.region}`);
const options = computed(() => {
  const c = picked.value;
  const p = provider.value;
  if (!c || !p) return [];
  const list = p.gpus.flatMap((g) => (Object.keys(QUANT) as Quant[]).map((q) => {
    const z = size(c, g, q);
    return { key: `${g.type}-${q}`, gpu: g.type, quant: q, s: z, perUser: perUserOf(z.tpsPerReplica, z.concurrency), current: g.type === gpu.value?.type && q === infra.value.quant, best: false };
  })).filter((o) => o.s.gpus <= 16);
  const priced = list.filter((o) => o.s.costPer1M > 0);
  const cheapest = priced.length ? priced.reduce((a, b) => (a.s.costPer1M < b.s.costPer1M ? a : b)) : undefined;
  if (cheapest) cheapest.best = true;
  return list;
});
function applyOption(o: { gpu: string; quant: Quant }): void {
  infra.value.gpu = o.gpu;
  infra.value.quant = o.quant;
  infra.value.gpus = 0;
}
const recommended = computed(() => (picked.value && gpu.value ? size(picked.value, gpu.value, infra.value.quant) : null));
const fitsQuota = computed(() => !!provider.value && !!sizing.value && (provider.value.billing !== 'quota' || freeGpus(provider.value) >= sizing.value.gpus * infra.value.max));

// ---- 3. serving defaults follow the model
watch(picked, (c) => {
  if (!c) return;
  Object.assign(serving.value, {
    name: c.name, alias: c.repo.split('/').pop()!.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32), maxContext: Math.min(c.context, 131_072), maxOutput: 16_384, maxSeqs: 0,
    toolParser: c.family === 'Qwen' ? 'hermes' : c.family === 'Llama' ? 'llama3_json' : c.family === 'Mistral' ? 'mistral' : c.family === 'GLM' ? 'glm45' : 'auto',
    reasoning: c.capabilities.includes('reasoning'), capabilities: [...c.capabilities],
  });
}, { immediate: true });

// ---- 4. price and lifecycle
const price = ref({ in: 0, out: 0, ring: 'canary', suites: ['b-tools', 'b-extract'] as string[] });
watch(sizing, (s) => {
  if (!s) return;
  // suggested: the cost of 1M tokens at 55% utilization, plus a margin; output costs ~4× input
  const per1M = Math.max(0.05, s.costPer1M * 1.3);
  price.value.in = Math.round(per1M * 0.4 * CREDITS_PER_USD);
  price.value.out = Math.round(per1M * 1.6 * CREDITS_PER_USD);
}, { immediate: true });

const canNext = computed(() => {
  if (step.value === 0) return !!picked.value;
  if (step.value === 1) return !!sizing.value && fitsQuota.value;
  if (step.value === 2) return !!serving.value.name.trim() && !!serving.value.alias.trim();
  return true;
});

// ---- deploy: infrastructure, weights, serving, checks — then the catalog
const PHASES = computed(() => [
  `Provisioning ${sizing.value?.gpus ?? 0}× ${gpu.value?.type.replace('NVIDIA ', '')} on ${provider.value?.name} (${infra.value.region})`,
  `Downloading ${sizing.value?.weightsGb ?? 0} GB of weights from ${picked.value?.source === 'Own registry' ? 'your registry' : 'Hugging Face'}`,
  `Loading into ${infra.value.runtime} (${infra.value.quant}, tensor parallel ${sizing.value?.gpus ?? 0})`,
  'Health check and warm-up',
  'Adding to the model catalog — benchmarks start the lifecycle',
]);
const deploying = ref(false);
const phase = ref(0);
const doneId = ref('');
function deploy(): void {
  const c = picked.value;
  if (!c || !sizing.value || !provider.value) return;
  deploying.value = true;
  phase.value = 0;
  const tick = () => {
    phase.value++;
    if (phase.value < PHASES.value.length) setTimeout(tick, 900);
    else finish();
  };
  setTimeout(tick, 900);
}
function finish(): void {
  const c = picked.value!;
  const s = sizing.value!;
  const id = `m-dep-${Date.now().toString(36)}`;
  db.models.push({
    id, name: serving.value.name.trim(), provider: `${provider.value!.name} · ${infra.value.runtime}`, hosting: provider.value!.kind === 'Own hardware' ? 'self-hosted' : 'gpu-provider', family: c.family, version: c.repo.split('/').pop()!, context: serving.value.maxContext,
    priceIn: price.value.in / CREDITS_PER_USD, priceOut: price.value.out / CREDITS_PER_USD, capabilities: serving.value.capabilities as Capability[], state: 'verifying', uptime30d: 0, p50Ms: s.ttftMs, tps: s.tpsPerReplica, scores: {},
    dataResidency: infra.value.region, hfId: c.source === 'Own registry' ? undefined : c.repo, modelLicense: c.license, gpusRequired: s.gpus,
  });
  db.deployments.push({ id: `d-${id}`, modelId: id, clusterId: provider.value!.id === 'sofia' ? 'c-sofia' : 'c-gcore-lux', runtime: infra.value.runtime as 'vLLM', quantization: infra.value.quant, replicas: infra.value.min, minReplicas: infra.value.scaleToZero ? 0 : infra.value.min, maxReplicas: infra.value.max, gpusPerReplica: s.gpus, utilization: 0, queue: 0, tps: 0, status: 'running' });
  provider.value!.usedGpus += s.gpus * infra.value.min;
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Deployed ${c.repo} on ${provider.value!.name}: ${infra.value.min}–${infra.value.max} × ${s.gpus} ${gpu.value?.type}, ${infra.value.quant}; benchmarks ${price.value.suites.join(', ')}; lifecycle from ${price.value.ring}`, target: serving.value.name, tenantId: 'root' });
  notify(`${serving.value.name} is serving and in the catalog. Benchmarks run now; approve it for the ${price.value.ring} ring when they pass.`, 'success', 'Deployed');
  doneId.value = id;
}
const usd = (n: number) => `$${n.toLocaleString('en', { maximumFractionDigits: n < 10 ? 2 : 0 })}`;
// The review, in plain sentences.
const reviewModel = computed(() => `${picked.value?.name} · ${picked.value?.repo} · ${picked.value?.license}`);
const reviewInfra = computed(() => `${provider.value?.name}, ${infra.value.region} · ${infra.value.min} to ${infra.value.max} replicas of ${sizing.value?.gpus} × ${gpu.value?.type} · ${infra.value.quant} · ${infra.value.runtime}${infra.value.scaleToZero ? ' · scales to zero' : ''}`);
const reviewExpected = computed(() => `${fmtInt(sizing.value?.tpsPerReplica ?? 0)} tok/s and ${sizing.value?.concurrency} concurrent requests per replica · first token about ${sizing.value?.ttftMs} ms · ${gpu.value?.perHour ? `${usd(sizing.value?.perMonth ?? 0)} a month at peak` : 'own hardware'}`);
const reviewServing = computed(() => `"${serving.value.alias}" · ${fmtContext(serving.value.maxContext)} context · ${fmtInt(serving.value.maxOutput)} output tokens · tools ${serving.value.toolParser}${serving.value.prefixCache ? ' · prefix cache' : ''}${serving.value.structured ? ' · structured output' : ''}${serving.value.speculative ? ' · speculative decoding' : ''}`);
const reviewPrice = computed(() => `${price.value.in} / ${price.value.out} credits per 1M · benchmarks: ${db.suites.filter((x) => price.value.suites.includes(x.id)).map((x) => x.name).join(', ') || 'none'} · then the ${price.value.ring} ring`);
</script>

<template>
  <div>
    <PageHeader title="New deployment" back description="Run an open-weight model on your compute. When it is up, it joins the model catalog and its lifecycle starts." @back="router.push('/root/deployments')" />

    <!-- deploying -->
    <Card v-if="deploying" :title="doneId ? `${serving.name} is deployed` : `Deploying ${serving.name}`" :subtitle="doneId ? 'Serving and in the catalog' : 'This takes a few minutes in reality'">
      <ol class="phases">
        <li v-for="(p, i) in PHASES" :key="i" :class="{ done: i < phase || doneId, now: i === phase && !doneId }">{{ p }}</li>
      </ol>
      <div v-if="doneId" class="card-actions">
        <GoButton size="m" @click="router.push(`/root/models/${doneId}`)">Open in model catalog</GoButton>
        <GoButton variant="secondary" size="m" @click="router.push('/root/lifecycle')">Open lifecycle</GoButton>
      </div>
    </Card>

    <template v-else>
      <GoStepper class="stepper">
        <GoStepperItem v-for="(s, n) in STEPS" :key="s" :variant="n < step ? 'done' : n === step ? 'active' : 'inactive'">{{ s }}</GoStepperItem>
      </GoStepper>

      <!-- 1. model -->
      <Card v-if="step === 0" title="Choose the model" subtitle="From Hugging Face, from models already admitted, or from your own registry">
        <div class="toolbar">
          <GoSegmentButtonGroup v-model="sourceFilter" size="s" aria-label="Source">
            <GoSegmentButton v-for="s in SOURCES" :key="s" :value="s">{{ s }}</GoSegmentButton>
          </GoSegmentButtonGroup>
          <GoInput v-model="query" size="m" placeholder="Search name or repository" class="search" />
        </div>
        <p v-if="sourceFilter === 'Hugging Face'" class="sub">{{ hfConnected ? 'Hugging Face is connected: gated models your organization has accepted can be downloaded.' : 'Connect Hugging Face under Settings › Integrations for gated models.' }}</p>
        <div class="table-wrap">
          <GoTable size="sm">
            <GoTableRow header>
              <GoTableCell width="40" />
              <GoTableCell>Model</GoTableCell>
              <GoTableCell>Parameters</GoTableCell>
              <GoTableCell>Context</GoTableCell>
              <GoTableCell>License</GoTableCell>
            </GoTableRow>
            <GoTableRow v-for="c in candidates" :key="c.id" class="pick-row" :class="{ 'pick-row_on': picked?.id === c.id }" @click="picked = c">
              <GoTableCell><input type="radio" name="candidate" :checked="picked?.id === c.id" :aria-label="c.name" @change="picked = c" /></GoTableCell>
              <GoTableCell>{{ c.name }}<span class="sub mono">{{ c.repo }}</span></GoTableCell>
              <GoTableCell>{{ c.paramsB }}B<span v-if="c.activeB < c.paramsB" class="sub">{{ c.activeB }}B active (MoE)</span></GoTableCell>
              <GoTableCell>{{ fmtContext(c.context) }}</GoTableCell>
              <GoTableCell>{{ c.license }}<span v-if="c.gated" class="sub">gated</span></GoTableCell>
            </GoTableRow>
            <GoTableRow v-if="!candidates.length"><GoTableCell :colspan="5"><span class="sub">Nothing matches.</span></GoTableCell></GoTableRow>
          </GoTable>
        </div>
        <GoFormControl v-if="sourceFilter === 'Own registry'" label="Or another location" class="spaced" hint="S3, OCI image or a Hugging Face–style repository in your registry.">
          <GoInput size="m" placeholder="s3://bucket/path or oci://registry/image:tag" />
        </GoFormControl>
      </Card>

      <!-- 2. infrastructure -->
      <template v-else-if="step === 1 && picked">
        <Card title="Infrastructure" subtitle="Recommended for this model; change anything">
          <div class="three">
            <GoFormControl label="Provider">
              <GoSelect v-model="infra.provider" size="m" aria-label="Provider">
                <GoSelectOption v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}<template #description>{{ billingLabel(p) }}</template></GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <GoFormControl label="Region">
              <GoSelect v-model="infra.region" size="m" aria-label="Region">
                <GoSelectOption v-for="r in provider?.regions" :key="r" :value="r">{{ r }}</GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <GoFormControl label="GPU">
              <GoSelect v-model="infra.gpu" size="m" aria-label="GPU">
                <GoSelectOption v-for="g in provider?.gpus" :key="g.type" :value="g.type">{{ g.type }}<template #description>{{ g.perHour ? `$${g.perHour.toFixed(2)} per GPU-hour` : 'Your hardware' }}</template></GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <GoFormControl label="Precision">
              <GoSegmentButtonGroup v-model="infra.quant" size="s" aria-label="Precision">
                <GoSegmentButton v-for="(_, q) in QUANT" :key="q" :value="q">{{ q }}</GoSegmentButton>
              </GoSegmentButtonGroup>
            </GoFormControl>
            <GoFormControl label="GPUs per replica" label-for="d-gpus" :hint="`At least ${recommended?.gpus} for ${infra.quant}. More GPUs give more throughput and room for long contexts.`">
              <GoInputNumber id="d-gpus" :model-value="infra.gpus || recommended?.gpus || 1" :min="recommended?.gpus ?? 1" :max="16" size="m" @update:model-value="(v?: number) => (infra.gpus = v ?? 0)" />
            </GoFormControl>
            <GoFormControl label="Runtime">
              <GoSegmentButtonGroup v-model="infra.runtime" size="s" aria-label="Runtime">
                <GoSegmentButton value="vLLM">vLLM</GoSegmentButton>
                <GoSegmentButton value="SGLang">SGLang</GoSegmentButton>
                <GoSegmentButton value="TGI">TGI</GoSegmentButton>
              </GoSegmentButtonGroup>
            </GoFormControl>
          </div>
          <h3 class="sub-title">Scaling</h3>
          <div class="three">
            <GoFormControl label="Replicas, min" label-for="d-min"><GoInputNumber id="d-min" v-model="infra.min" :min="infra.scaleToZero ? 0 : 1" :max="infra.max" size="m" /></GoFormControl>
            <GoFormControl label="Replicas, max" label-for="d-max"><GoInputNumber id="d-max" v-model="infra.max" :min="Math.max(1, infra.min)" :max="12" size="m" /></GoFormControl>
            <GoFormControl label="Scale up at" label-for="d-target" hint="GPU utilization that adds a replica.">
              <GoInputNumber id="d-target" v-model="infra.target" :min="40" :max="95" :step="5" size="m" />
            </GoFormControl>
          </div>
          <GoToggle v-model="infra.scaleToZero" class="spaced">Scale to zero when idle for 30 minutes (first request then waits for a cold start)</GoToggle>
        </Card>

        <Card v-if="sizing && perf" title="Expected performance" :subtitle="selectedLabel" class="spaced">
          <div class="tiles">
            <StatTile label="Speed per user" :value="`${perf.perUser} tok/s`" hint="Output, while the replica is busy" />
            <StatTile label="Total throughput" :value="`${fmtInt(perf.total)} tok/s`" :hint="`${fmtInt(sizing.tpsPerReplica)} per replica × ${infra.max}`" />
            <StatTile label="Concurrent users" :value="fmtInt(perf.users)" :hint="`${sizing.concurrency} per replica before queueing`" />
            <StatTile label="First token" :value="`${sizing.ttftMs} ms`" :hint="`p95 about ${perf.ttftP95} ms with long prompts`" />
            <StatTile label="Requests a minute" :value="fmtInt(perf.rpm)" hint="At ~600 output tokens each" />
            <StatTile label="Daily capacity" :value="`${fmtCompact(perf.daily)} tokens`" hint="At 55% average utilization" />
            <StatTile label="Memory per replica" :value="`${sizing.memoryGb} GB`" :hint="`${sizing.weightsGb} GB weights + KV cache, of ${sizing.gpus * (gpu?.memoryGb ?? 0)} GB`" />
            <StatTile label="Cost" :value="gpu?.perHour ? `${usd(sizing.perHour)}/h` : 'Own hardware'" :hint="gpu?.perHour ? `${usd(sizing.perMonth)} a month at peak · ${usd(sizing.costPer1M)} per 1M tokens` : `${sizing.gpus * infra.max} of your GPUs`" />
          </div>

          <h3 class="sub-title">Other options on {{ provider?.name }}</h3>
          <div class="table-wrap">
            <GoTable size="sm">
              <GoTableRow header>
                <GoTableCell>GPU and precision</GoTableCell>
                <GoTableCell>GPUs per replica</GoTableCell>
                <GoTableCell>Throughput per replica</GoTableCell>
                <GoTableCell>Speed per user</GoTableCell>
                <GoTableCell>First token</GoTableCell>
                <GoTableCell>Cost per 1M tokens</GoTableCell>
              </GoTableRow>
              <GoTableRow v-for="o in options" :key="o.key" class="pick-row" :class="{ 'pick-row_on': o.current }" @click="applyOption(o)">
                <GoTableCell>{{ o.gpu.replace('NVIDIA ', '') }} · {{ o.quant }}<span v-if="o.current" class="sub">selected</span><span v-else-if="o.best" class="sub">cheapest per token</span></GoTableCell>
                <GoTableCell>{{ o.s.gpus }}</GoTableCell>
                <GoTableCell>{{ fmtInt(o.s.tpsPerReplica) }} tok/s</GoTableCell>
                <GoTableCell>{{ o.perUser }} tok/s</GoTableCell>
                <GoTableCell>{{ o.s.ttftMs }} ms</GoTableCell>
                <GoTableCell>{{ o.s.costPer1M ? usd(o.s.costPer1M) : 'own hardware' }}</GoTableCell>
              </GoTableRow>
            </GoTable>
          </div>
          <p class="sub">Estimates from model size and GPU; the benchmark run after deployment measures the real numbers.</p>
        </Card>
        <GoMessage v-if="!fitsQuota" variant="error" rounded class="spaced">Needs {{ (sizing?.gpus ?? 0) * infra.max }} GPUs; {{ provider?.name }} has {{ provider ? freeGpus(provider) : 0 }} free in its reserved quota. Lower the replicas, pick another GPU or provider.</GoMessage>
        <GoMessage v-else-if="provider?.billing === 'both' && (sizing?.gpus ?? 0) * infra.max > freeGpus(provider)" variant="warning" rounded class="spaced">Above the reserved quota at peak; the extra replicas run pay-as-you-go.</GoMessage>
      </template>

      <!-- 3. serving -->
      <Card v-else-if="step === 2" title="Serving" subtitle="How the model answers. Defaults come from the model card.">
        <div class="three">
          <GoFormControl label="Display name" label-for="s-name"><GoInput id="s-name" v-model="serving.name" size="m" /></GoFormControl>
          <GoFormControl label="Model ID" label-for="s-alias" hint="What callers put in “model”."><GoInput id="s-alias" v-model="serving.alias" size="m" /></GoFormControl>
          <GoFormControl label="Request timeout, seconds" label-for="s-timeout"><GoInputNumber id="s-timeout" v-model="serving.timeout" :min="30" :step="30" size="m" /></GoFormControl>
          <GoFormControl label="Max context" :hint="`The model supports up to ${fmtContext(picked?.context ?? 0)}; longer contexts need more memory.`">
            <GoSelect v-model="serving.maxContext" size="m" aria-label="Max context">
              <GoSelectOption v-for="c in contextOptions" :key="c" :value="c">{{ fmtContext(c) }} tokens</GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl label="Max output tokens" label-for="s-out"><GoInputNumber id="s-out" v-model="serving.maxOutput" :min="1024" :step="1024" size="m" /></GoFormControl>
          <GoFormControl label="Concurrent sequences" label-for="s-seqs" :hint="`0 uses the runtime estimate (${sizing?.concurrency}).`"><GoInputNumber id="s-seqs" v-model="serving.maxSeqs" :min="0" :step="8" size="m" /></GoFormControl>
          <GoFormControl label="Tool calling">
            <GoSelect v-model="serving.toolParser" size="m" aria-label="Tool call parser">
              <GoSelectOption v-for="p in ['auto', 'hermes', 'llama3_json', 'mistral', 'glm45', 'deepseek_v3', 'off']" :key="p" :value="p">{{ p }}</GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl label="KV cache">
            <GoSegmentButtonGroup v-model="serving.kvCache" size="s" aria-label="KV cache precision">
              <GoSegmentButton value="auto">Model precision</GoSegmentButton>
              <GoSegmentButton value="fp8">FP8</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
        </div>
        <div class="toggles">
          <GoToggle v-model="serving.prefixCache">Prefix caching — reuses shared prompt prefixes, isolated per tenant</GoToggle>
          <GoToggle v-model="serving.reasoning">Separate reasoning from the answer (reasoning parser)</GoToggle>
          <GoToggle v-model="serving.structured">Structured output — JSON schema enforced while generating</GoToggle>
          <GoToggle v-model="serving.speculative">Speculative decoding — faster answers at low load, uses spare GPU memory</GoToggle>
        </div>
        <GoFormControl label="Capabilities shown in the catalog" class="spaced">
          <div class="caps">
            <GoCheckbox v-for="c in ['tools', 'json', 'reasoning', 'code', 'vision']" :key="c" v-model="serving.capabilities" :value="c">{{ c }}</GoCheckbox>
          </div>
        </GoFormControl>
      </Card>

      <!-- 4. price and lifecycle -->
      <Card v-else-if="step === 3" title="Price and lifecycle" subtitle="What tenants are charged, and how the model reaches them">
        <div class="three">
          <GoFormControl label="Credits per 1M input tokens" label-for="p-in"><GoInputNumber id="p-in" v-model="price.in" :min="0" size="m" /></GoFormControl>
          <GoFormControl label="Credits per 1M output tokens" label-for="p-out"><GoInputNumber id="p-out" v-model="price.out" :min="0" size="m" /></GoFormControl>
          <GoFormControl label="First ring after approval">
            <GoSegmentButtonGroup v-model="price.ring" size="s" aria-label="First ring">
              <GoSegmentButton value="canary">Canary</GoSegmentButton>
              <GoSegmentButton value="pilot">Pilot</GoSegmentButton>
              <GoSegmentButton value="broad">Everyone</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
        </div>
        <p class="sub">Suggested from the cost: {{ usd(sizing?.costPer1M ?? 0) }} per 1M tokens at 55% utilization, plus 30%. Cached input is charged at a tenth.</p>
        <h3 class="sub-title">Benchmarks to run before approval</h3>
        <div class="toolbar">
          <GoSegmentButtonGroup v-model="suiteFilter" size="s" aria-label="Show">
            <GoSegmentButton value="all">All {{ suites.length }}</GoSegmentButton>
            <GoSegmentButton value="selected">Selected {{ price.suites.length }}</GoSegmentButton>
          </GoSegmentButtonGroup>
          <GoInput v-model="suiteQuery" size="m" placeholder="Search benchmarks" class="search" />
        </div>
        <div class="table-wrap">
          <GoTable size="sm">
            <GoTableRow header>
              <GoTableCell width="40" />
              <GoTableCell>Benchmark</GoTableCell>
              <GoTableCell width="90">Cases</GoTableCell>
              <GoTableCell>Passes when</GoTableCell>
            </GoTableRow>
            <GoTableRow v-for="b in suitesShown" :key="b.id">
              <GoTableCell><GoCheckbox v-model="price.suites" :value="b.id" :aria-label="b.name" /></GoTableCell>
              <GoTableCell>{{ b.name }}<span class="sub">{{ b.scenario }}</span></GoTableCell>
              <GoTableCell>{{ b.cases }}</GoTableCell>
              <GoTableCell><span class="sub-plain">{{ b.scoring }} · at least {{ b.threshold }}</span></GoTableCell>
            </GoTableRow>
            <GoTableRow v-if="!suitesShown.length"><GoTableCell :colspan="4"><span class="sub">Nothing matches.</span></GoTableCell></GoTableRow>
          </GoTable>
        </div>
      </Card>

      <!-- 5. review -->
      <Card v-else title="Review" subtitle="Deploying starts the infrastructure now; tenants see the model only after you approve it in the lifecycle">
        <div class="review">
          <div><span class="r-title">Model</span><span class="sub">{{ reviewModel }}</span></div>
          <div><span class="r-title">Infrastructure</span><span class="sub">{{ reviewInfra }}</span></div>
          <div><span class="r-title">Expected</span><span class="sub">{{ reviewExpected }}</span></div>
          <div><span class="r-title">Serving</span><span class="sub">{{ reviewServing }}</span></div>
          <div><span class="r-title">Price and lifecycle</span><span class="sub">{{ reviewPrice }}</span></div>
        </div>
      </Card>

      <div class="footer">
        <GoButton v-if="step > 0" variant="secondary" size="m" @click="step--">Back</GoButton>
        <span class="spacer" />
        <GoButton v-if="step < LAST_STEP" size="m" :disabled="!canNext" @click="step++">Next</GoButton>
        <GoButton v-else size="m" @click="deploy">Deploy</GoButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
  .stepper {
    margin-block-end: var(--acv-spacing-regular);
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-small);
  }

  .search {
    max-inline-size: 320px;
  }

  .table-wrap {
    display: grid;
    margin-block-start: var(--acv-spacing-small);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
  }

  .sub-plain {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .pick-row {
    cursor: pointer;
  }

  .pick-row_on {
    background: var(--acv-color-surface-secondary);
  }

  .candidates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-small);
    margin-block-start: var(--acv-spacing-small);
  }

  .candidate {
    display: grid;
    gap: 2px;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-primary);
    text-align: start;
    cursor: pointer;

    &.candidate_on {
      border-color: var(--acv-color-glyph-brand);
      box-shadow: inset 0 0 0 1px var(--acv-color-glyph-brand);
    }
  }

  .c-name,
  .r-title {
    @mixin acv-text-ui-body-2-medium;
    display: block;
    color: var(--acv-color-glyph-primary);
  }

  .mono {
    @mixin acv-text-ui-caption-1;
    font-family: var(--acv-font-family-monospace, monospace);
  }

  .three {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    align-items: end;
  }

  .sub-title {
    @mixin acv-text-subheading-3;
    margin: var(--acv-spacing-large) 0 var(--acv-spacing-small);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .toggles,
  .caps {
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-regular);
  }

  .caps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .review {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .phases {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-small);
    margin: 0;
    padding-inline-start: var(--acv-spacing-large);
    color: var(--acv-color-glyph-tertiary);

    & .done {
      color: var(--acv-color-glyph-primary);
    }

    & .done::marker {
      content: '✓  ';
      color: var(--acv-color-status-success-strong, #16a34a);
    }

    & .now {
      color: var(--acv-color-glyph-brand);
      font-weight: 600;
    }
  }

  .card-actions {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-large);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-regular);
  }

  .spacer {
    flex: 1;
  }
</style>
