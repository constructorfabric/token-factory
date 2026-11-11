<script setup lang="ts">
import { ownCredits } from '@/state/credits';
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { computed, reactive, ref, watch } from 'vue';
import type { Capability } from '@/data/types';
import { CREDITS_PER_USD, fmtContext, toCredits } from '@/lib/format';
import { defaultCacheWriteFactor } from '@/data/tokenClasses';
import { db, record, tenantById } from '@/state/db';
import { session } from '@/state/session';

/**
 * Adds models reachable through one of the tenant's own provider keys (BYOK).
 * The key's provider is asked which models it serves; the administrator picks
 * the ones to offer. Each lands under Models as "Your key" and is usable once
 * a license allows it.
 */
const props = defineProps<{ tenantId: string; keyId?: string }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ added: [ids: string[]] }>();
const { notify } = useNotificationsStore();

/** priceIn / priceOut: the recommended price, in USD per 1M tokens (shown as AI credits). */
interface Offered { name: string; family: string; context: number; capabilities: Capability[]; priceIn: number; priceOut: number }
// What a validated key reports on its list-models call (mock).
const OFFERED: Record<string, Offered[]> = {
  Anthropic: [
    { name: 'Claude Opus 5.5', family: 'Claude', context: 1_000_000, capabilities: ['tools', 'vision', 'reasoning', 'code'], priceIn: 15, priceOut: 75 },
    { name: 'Claude Sonnet 5.5', family: 'Claude', context: 1_000_000, capabilities: ['tools', 'vision', 'reasoning', 'code'], priceIn: 3, priceOut: 15 },
    { name: 'Claude Haiku 4.5', family: 'Claude', context: 200_000, capabilities: ['tools', 'vision', 'code'], priceIn: 1, priceOut: 5 },
  ],
  OpenAI: [
    { name: 'GPT-5.1', family: 'GPT', context: 400_000, capabilities: ['tools', 'vision', 'json', 'reasoning', 'code'], priceIn: 2.5, priceOut: 12 },
    { name: 'GPT-5.1 mini', family: 'GPT', context: 400_000, capabilities: ['tools', 'json', 'code'], priceIn: 0.4, priceOut: 1.6 },
    { name: 'o4-mini', family: 'GPT', context: 200_000, capabilities: ['tools', 'json', 'reasoning', 'code'], priceIn: 1.1, priceOut: 4.4 },
  ],
  'Azure OpenAI': [
    { name: 'GPT-5.1', family: 'GPT', context: 400_000, capabilities: ['tools', 'vision', 'json', 'reasoning', 'code'], priceIn: 2.5, priceOut: 12 },
    { name: 'gpt-5.1-mini-eu', family: 'GPT', context: 400_000, capabilities: ['tools', 'json', 'code'], priceIn: 0.4, priceOut: 1.6 },
    { name: 'text-embedding-3-large', family: 'Embeddings', context: 8_000, capabilities: ['json'], priceIn: 0.13, priceOut: 0 },
  ],
  'AWS Bedrock': [
    { name: 'Claude Sonnet 5.5 (Bedrock)', family: 'Claude', context: 1_000_000, capabilities: ['tools', 'vision', 'reasoning', 'code'], priceIn: 3, priceOut: 15 },
    { name: 'Llama 4 Maverick', family: 'Llama', context: 1_000_000, capabilities: ['tools', 'code'], priceIn: 0.22, priceOut: 0.85 },
  ],
  'Google Vertex AI': [
    { name: 'Gemini 3 Pro', family: 'Gemini', context: 1_000_000, capabilities: ['tools', 'vision', 'reasoning', 'code'], priceIn: 2, priceOut: 10 },
    { name: 'Gemini 3 Flash', family: 'Gemini', context: 1_000_000, capabilities: ['tools', 'vision', 'code'], priceIn: 0.3, priceOut: 2.5 },
  ],
  'OpenAI-compatible endpoint': [
    { name: 'llama-3.3-70b-instruct', family: 'Llama', context: 128_000, capabilities: ['tools', 'json'], priceIn: 0.3, priceOut: 0.4 },
    { name: 'mistral-small-3.2', family: 'Mistral', context: 128_000, capabilities: ['tools', 'json'], priceIn: 0.1, priceOut: 0.3 },
  ],
};

const isRoot = computed(() => props.tenantId === 'root');
const creditName = computed(() => (isRoot.value ? 'platform credits' : ownCredits(props.tenantId)));
const keys = computed(() => db.providerKeys.filter((k) => k.tenantId === props.tenantId && k.mode === 'byok' && k.status !== 'invalid'));
const keyId = ref('');
const picked = ref<string[]>([]);
watch(open, (o) => {
  if (!o) return;
  keyId.value = props.keyId ?? keys.value[0]?.id ?? '';
  picked.value = [];
});
const key = computed(() => keys.value.find((k) => k.id === keyId.value));
const offerOf = (name: string) => (props.tenantId === 'root' ? name : `${name} (${key.value?.label})`);
const already = (o: Offered) => db.models.some((m) => m.providerKeyId === keyId.value && m.name === offerOf(o.name));
const offered = computed(() => (key.value ? OFFERED[key.value.provider] ?? [] : []));
watch(keyId, () => (picked.value = []));
// What a holder is charged in the company's own credits, per 1M tokens: prefilled with the recommended price.
const price = reactive<Record<string, { in: number; cachedIn: number; cacheWrite: number; out: number }>>({});
const prefill = (o: Offered) => ({ in: toCredits(o.priceIn), cachedIn: toCredits(o.priceIn * 0.1), cacheWrite: toCredits(o.priceIn * defaultCacheWriteFactor({ provider: key.value?.provider ?? '', family: o.family })), out: toCredits(o.priceOut) });
watch(picked, (names) => {
  for (const o of offered.value) if (names.includes(o.name) && !price[o.name]) price[o.name] = prefill(o);
});
const pickedOffers = computed(() => offered.value.filter((o) => picked.value.includes(o.name)));

function add(): void {
  const k = key.value;
  if (!k) return;
  const tenantName = tenantById(props.tenantId)?.name;
  const ids: string[] = [];
  for (const o of pickedOffers.value) {
    const p = price[o.name] ?? prefill(o);
    const id = `m-byok-${Date.now()}-${ids.length}`;
    db.models.push({
      id, name: offerOf(o.name), provider: props.tenantId === 'root' ? k.provider : `${k.provider} · BYOK`, hosting: props.tenantId === 'root' ? 'commercial' : 'tenant-byok', family: o.family, version: 'latest', context: o.context, priceIn: p.in / CREDITS_PER_USD, priceCachedIn: p.cachedIn / CREDITS_PER_USD, priceCacheWrite: p.cacheWrite / CREDITS_PER_USD, priceOut: p.out / CREDITS_PER_USD, capabilities: o.capabilities,
      state: 'discovered', uptime30d: 0, p50Ms: 0, tps: 0, scores: {}, dataResidency: k.endpoint, ownerTenantId: props.tenantId === 'root' ? undefined : props.tenantId, providerKeyId: k.id,
    });
    ids.push(id);
  }
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantName : undefined, action: `Added ${ids.length} BYOK models from key ${k.label}`, target: picked.value.join(', '), tenantId: props.tenantId });
  notify(props.tenantId === 'root' ? 'They enter the lifecycle as discovered; admit them before tenants can use them.' : 'A probe call checks each one. Add them to a license to let users use them.', 'success', `${ids.length} ${ids.length === 1 ? 'model' : 'models'} added from ${k.label}`);
  open.value = false;
  emit('added', ids);
}
</script>

<template>
  <GoDialog v-model="open" size="m">
    <GoDialogWindow :title="isRoot ? 'Add models from a provider key' : 'Add models from your key'" header-border @close="open = false">
      <div class="fields">
        <GoFormControl label="Provider key">
          <GoSelect v-model="keyId" size="m" aria-label="Provider key" :disabled="!keys.length">
            <GoSelectOption v-for="k in keys" :key="k.id" :value="k.id">
              {{ k.provider }} · {{ k.label }}
              <template #description>{{ k.endpoint }}</template>
            </GoSelectOption>
          </GoSelect>
        </GoFormControl>
        <GoFormControl v-if="key" :label="`Models this key can call (${offered.length})`">
          <div class="offers">
            <GoCheckbox v-for="o in offered" :key="o.name" v-model="picked" :value="o.name" :disabled="already(o)">
              {{ o.name }}
              <span class="sub">{{ o.family }} · {{ fmtContext(o.context) }} context{{ already(o) ? ' · already added' : '' }}</span>
            </GoCheckbox>
          </div>
        </GoFormControl>
        <GoFormControl v-if="pickedOffers.length" :label="`Price in ${creditName}, per 1M tokens`" :hint="`Prefilled with the recommended price for each model. Holders are charged this against the ${creditName} limits of their license.`">
          <div class="prices">
            <span class="sub">Model</span><span class="sub">Input</span><span class="sub">Cached in</span><span class="sub">Cache write</span><span class="sub">Output</span>
            <template v-for="o in pickedOffers" :key="o.name">
              <span class="price-name">{{ o.name }}</span>
              <GoInputNumber v-model="price[o.name]!.in" :min="0" size="m" :aria-label="`${o.name} input price`" />
              <GoInputNumber v-model="price[o.name]!.cachedIn" :min="0" size="m" :aria-label="`${o.name} cached input price`" />
              <GoInputNumber v-model="price[o.name]!.cacheWrite" :min="0" size="m" :aria-label="`${o.name} cache write price`" />
              <GoInputNumber v-model="price[o.name]!.out" :min="0" size="m" :aria-label="`${o.name} output price`" />
            </template>
          </div>
        </GoFormControl>
        <GoMessage v-if="!keys.length" variant="warning" rounded>Add a provider key of your own first, under Provider keys.</GoMessage>
        <GoMessage v-else-if="isRoot" variant="info" rounded>
          Billed by {{ key?.provider }} to this instance
          <template #addition>New models enter the catalog as discovered and go through the lifecycle before tenants can add them to licenses; holders spend platform credits on them.</template>
        </GoMessage>
        <GoMessage v-else variant="info" rounded>
          Billed by {{ key?.provider }} to you
          <template #addition>Calls still pass the gateway: holders spend {{ ownCredits(tenantId) }} on these models, separate from platform credits, and reports show both.</template>
        </GoMessage>
      </div>
      <template #footer>
        <div class="footer">
          <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
          <GoButton size="m" :disabled="!picked.length" @click="add">Add {{ picked.length || '' }} {{ picked.length === 1 ? 'model' : 'models' }}</GoButton>
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

  .offers {
    display: grid;
    gap: var(--acv-spacing-small);
  }

  .prices {
    display: grid;
    grid-template-columns: minmax(0, 1fr) repeat(4, 96px);
    gap: var(--acv-spacing-x-small) var(--acv-spacing-small);
    align-items: center;
  }

  .price-name {
    @mixin acv-text-ui-body-2;
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
