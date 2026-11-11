<script setup lang="ts">
import ItemPicker from '@/components/ui/ItemPicker.vue';
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref, watch } from 'vue';
import type { Guardrail } from '@/data/types';
import { routableModels } from '@/state/aliases';
import { db, record } from '@/state/db';
import { session } from '@/state/session';

/**
 * Add or edit a guardrail: which detector, when it runs, what it does on a
 * hit, which models it covers, and what happens when the detector itself is
 * down. Detectors follow LiteLLM's guardrail hooks: built-in checks, and
 * external guardrail services reached through their API.
 */
export interface Detector { id: string; name: string; kind: string; provider: string; hint: string; stages: Guardrail['stage'][]; actions: Guardrail['mode'][] }
const DETECTORS: Detector[] = [
  { id: 'pii', name: 'Personal data', kind: 'Personal data', provider: 'Presidio (built in)', hint: 'Names, emails, phones, IBANs, national IDs; masks them, and can put them back in the answer', stages: ['input', 'output', 'both'], actions: ['redact', 'block', 'flag'] },
  { id: 'secrets', name: 'Secrets', kind: 'Security', provider: 'Built in', hint: 'API keys, private keys, connection strings', stages: ['input', 'both'], actions: ['block', 'redact', 'flag'] },
  { id: 'injection', name: 'Prompt injection', kind: 'Security', provider: 'Built in classifier', hint: 'Instructions hidden in documents, web pages and tool results', stages: ['input', 'parallel', 'tools'], actions: ['block', 'flag'] },
  { id: 'keywords', name: 'Banned words and patterns', kind: 'Content policy', provider: 'Built in', hint: 'Words, phrases and regular expressions you list', stages: ['input', 'output', 'both'], actions: ['block', 'redact', 'flag'] },
  { id: 'topics', name: 'Restricted topics', kind: 'Content policy', provider: 'LLM as judge', hint: 'A small model decides whether the text is on a topic you describe', stages: ['input', 'output', 'parallel'], actions: ['block', 'flag'] },
  { id: 'harm', name: 'Harmful content', kind: 'Content safety', provider: 'Llama Guard (self-hosted)', hint: 'Violence, self-harm, harassment, sexual content', stages: ['input', 'output', 'both', 'parallel'], actions: ['block', 'flag'] },
  { id: 'code-exec', name: 'Code execution', kind: 'Security', provider: 'Built in', hint: 'Answers or tool calls that run shell commands or code', stages: ['output', 'tools'], actions: ['block', 'flag'] },
  { id: 'tool-policy', name: 'Tool policy', kind: 'Tools', provider: 'Built in', hint: 'Which MCP tools a call may use, and with which arguments', stages: ['tools'], actions: ['block', 'flag'] },
  { id: 'schema', name: 'Output schema', kind: 'Output quality', provider: 'Built in', hint: 'Answers must be valid against the requested JSON schema', stages: ['output'], actions: ['block', 'flag'] },
  { id: 'lakera', name: 'Lakera Guard', kind: 'Security', provider: 'Lakera (external)', hint: 'Injection, jailbreaks and data leakage', stages: ['input', 'output', 'parallel'], actions: ['block', 'flag'] },
  { id: 'azure', name: 'Azure AI Content Safety', kind: 'Content safety', provider: 'Microsoft (external)', hint: 'Harm categories with severity levels; prompt shields', stages: ['input', 'output', 'both'], actions: ['block', 'flag'] },
  { id: 'bedrock', name: 'Amazon Bedrock Guardrails', kind: 'Content safety', provider: 'AWS (external)', hint: 'Denied topics, word filters, PII, contextual grounding', stages: ['input', 'output', 'both'], actions: ['block', 'redact', 'flag'] },
  { id: 'model-armor', name: 'Google Model Armor', kind: 'Security', provider: 'Google Cloud (external)', hint: 'Injection, jailbreak, sensitive data and malicious URLs', stages: ['input', 'output', 'both'], actions: ['block', 'redact', 'flag'] },
  { id: 'webhook', name: 'Your own service', kind: 'Custom', provider: 'Webhook', hint: 'Calls your endpoint with the text; it answers allow, block or a redacted text', stages: ['input', 'output', 'both', 'parallel', 'tools'], actions: ['block', 'redact', 'flag'] },
];
const STAGES: Record<Guardrail['stage'], { label: string; hint: string }> = {
  input: { label: 'Before the call', hint: 'Checks the prompt; a block costs nothing' },
  output: { label: 'After the call', hint: 'Checks the answer before the caller sees it' },
  both: { label: 'Before and after', hint: 'Prompt and answer' },
  parallel: { label: 'During the call', hint: 'Runs beside the model; stops the answer on a hit, adds no latency otherwise' },
  tools: { label: 'On tool calls', hint: 'Checks each tool call and its result (MCP)' },
};
const ACTIONS: Record<Guardrail['mode'], string> = { block: 'Block', redact: 'Mask and continue', flag: 'Flag only' };
const stageLabel = (st: Guardrail['stage']) => STAGES[st].label;
const stageHint = (st: Guardrail['stage']) => STAGES[st].hint;
const actionLabel = (a: Guardrail['mode']) => ACTIONS[a];

const props = defineProps<{ edit?: Guardrail; atRoot: boolean; tenantId: string }>();
const open = defineModel<boolean>({ required: true });
const { notify } = useNotificationsStore();
const d = ref({ detector: 'pii', name: '', description: '', stage: 'input' as Guardrail['stage'], mode: 'redact' as Guardrail['mode'], appliesTo: 'all' as NonNullable<Guardrail['appliesTo']>, modelIds: [] as string[], failMode: 'closed' as NonNullable<Guardrail['failMode']>, enforced: false, endpoint: '' });
const detector = computed(() => DETECTORS.find((x) => x.id === d.value.detector)!);
watch(open, (o) => {
  if (!o) return;
  const g = props.edit;
  const det = g ? DETECTORS.find((x) => x.provider === g.provider || x.kind === g.kind) ?? DETECTORS[0]! : DETECTORS[0]!;
  d.value = { detector: det.id, name: g?.name ?? '', description: g?.description ?? '', stage: g?.stage ?? det.stages[0]!, mode: g?.mode ?? det.actions[0]!, appliesTo: g?.appliesTo ?? 'all', modelIds: [...(g?.modelIds ?? [])], failMode: g?.failMode ?? 'closed', enforced: g?.enforced ?? false, endpoint: '' };
});
// Keep stage and action valid for the detector picked.
watch(() => d.value.detector, () => {
  if (!detector.value.stages.includes(d.value.stage)) d.value.stage = detector.value.stages[0]!;
  if (!detector.value.actions.includes(d.value.mode)) d.value.mode = detector.value.actions[0]!;
});
const external = computed(() => /external|webhook/i.test(detector.value.provider));
const canSave = computed(() => (!!d.value.name.trim() || !props.edit) && (d.value.appliesTo !== 'models' || d.value.modelIds.length > 0) && (d.value.detector !== 'webhook' || /^https:\/\//.test(d.value.endpoint)));
function save(): void {
  if (!canSave.value) return;
  const v = d.value;
  const fields = {
    name: v.name.trim() || detector.value.name, kind: detector.value.kind, description: v.description.trim() || detector.value.hint, provider: detector.value.provider,
    stage: v.stage, mode: v.mode, appliesTo: v.appliesTo, modelIds: v.appliesTo === 'models' ? [...v.modelIds] : undefined, failMode: v.failMode, enforced: props.atRoot && v.enforced,
  };
  if (props.edit) Object.assign(props.edit, fields);
  else db.guardrails.push({ id: `g-${Date.now().toString(36)}`, scope: props.atRoot ? 'platform' : 'tenant', tenantId: props.atRoot ? undefined : props.tenantId, enabled: true, hits7d: 0, ...fields });
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', action: `${props.edit ? 'Changed' : 'Added'} guardrail ${fields.name}: stage ${v.stage}, action ${v.mode}, covers ${v.appliesTo}`, target: fields.name, tenantId: props.tenantId });
  notify(`${fields.name} applies to new requests within a minute.`, 'success', props.edit ? 'Guardrail saved' : 'Guardrail added');
  open.value = false;
}
</script>

<template>
  <GoDialog v-model="open" size="l">
    <GoDialogWindow :title="edit ? `Edit ${edit.name}` : 'Add guardrail'" header-border @close="open = false">
      <div class="fields">
        <GoFormControl label="Detector">
          <GoSelect v-model="d.detector" size="m" aria-label="Detector">
            <GoSelectOption v-for="x in DETECTORS" :key="x.id" :value="x.id">{{ x.name }}<template #description>{{ x.provider }} · {{ x.hint }}</template></GoSelectOption>
          </GoSelect>
        </GoFormControl>
        <div class="two">
          <GoFormControl label="Name" label-for="gd-name" optional><GoInput id="gd-name" v-model="d.name" size="m" :placeholder="detector.name" /></GoFormControl>
          <GoFormControl label="What it is for" label-for="gd-desc" optional><GoInput id="gd-desc" v-model="d.description" size="m" :placeholder="detector.hint" /></GoFormControl>
        </div>
        <GoFormControl v-if="d.detector === 'webhook'" label="Endpoint" label-for="gd-url" hint="HTTPS; the gateway signs each call"><GoInput id="gd-url" v-model="d.endpoint" size="m" placeholder="https://guard.example.com/check" /></GoFormControl>

        <GoFormControl label="When it runs">
          <div class="options">
            <label v-for="st in detector.stages" :key="st" class="option" :class="{ option_on: d.stage === st }">
              <input v-model="d.stage" type="radio" name="gd-stage" :value="st" />
              <span><span class="option-name">{{ stageLabel(st) }}</span><span class="sub">{{ stageHint(st) }}</span></span>
            </label>
          </div>
        </GoFormControl>
        <GoFormControl label="On a hit">
          <GoSegmentButtonGroup v-model="d.mode" size="s" aria-label="Action">
            <GoSegmentButton v-for="a in detector.actions" :key="a" :value="a">{{ actionLabel(a) }}</GoSegmentButton>
          </GoSegmentButtonGroup>
        </GoFormControl>

        <GoFormControl label="Covers">
          <GoSegmentButtonGroup v-model="d.appliesTo" size="s" aria-label="Covers">
            <GoSegmentButton value="all">Every model</GoSegmentButton>
            <GoSegmentButton value="external">External providers only</GoSegmentButton>
            <GoSegmentButton value="models">Chosen models</GoSegmentButton>
          </GoSegmentButtonGroup>
        </GoFormControl>
        <ItemPicker v-if="d.appliesTo === 'models'" v-model="d.modelIds" :items="routableModels().map((m) => ({ id: m.id, label: m.name, group: m.family, sub: m.provider }))" placeholder="Search models" noun="models" :max-height="220" />

        <GoFormControl :label="external ? 'When the service does not answer' : 'When the detector fails'">
          <GoSegmentButtonGroup v-model="d.failMode" size="s" aria-label="Failure">
            <GoSegmentButton value="closed">Refuse the request</GoSegmentButton>
            <GoSegmentButton value="open">Let it through and log</GoSegmentButton>
          </GoSegmentButtonGroup>
        </GoFormControl>
        <GoToggle v-if="atRoot" v-model="d.enforced">Enforce for every tenant — they see it locked and cannot switch it off</GoToggle>
      </div>
      <template #footer>
        <div class="footer">
          <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
          <GoButton size="m" :disabled="!canSave" @click="save">{{ edit ? 'Save' : 'Add guardrail' }}</GoButton>
        </div>
      </template>
    </GoDialogWindow>
  </GoDialog>
</template>

<style scoped>
  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--acv-spacing-x-small);
  }

  .option {
    display: flex;
    align-items: flex-start;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-x-small) var(--acv-spacing-small);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    cursor: pointer;

    &.option_on {
      border-color: var(--acv-color-glyph-brand);
    }

    & input {
      margin-block-start: 3px;
      accent-color: var(--acv-color-glyph-brand);
    }
  }

  .option-name {
    @mixin acv-text-ui-body-2;
    display: block;
  }

  .checks {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-x-small);
    max-block-size: 200px;
    overflow-y: auto;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
