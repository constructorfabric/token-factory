<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, reactive, ref } from 'vue';
import Card from '@/components/ui/Card.vue';
import { record } from '@/state/db';

/**
 * How the gateway handles every request, whatever model it names: retries,
 * fallbacks for prompts that are too long or refused, request parameters a
 * model does not take, response caching, and what external providers may do
 * with the data. Modelled on LiteLLM's router settings and OpenRouter's
 * provider preferences.
 */
const { notify } = useNotificationsStore();
const saved = reactive({
  retries: 2, backoffMs: 500, timeoutS: 600, firstTokenTimeoutS: 60,
  contextFallback: true, policyFallback: true, capabilityRouting: true,
  unsupported: 'drop' as 'drop' | 'reject', requireParams: false,
  cache: 'exact' as 'off' | 'exact' | 'semantic', cacheTtlMin: 60, cacheSimilarity: 0.95, cachePerTenant: true,
  noTraining: true, zdrOnly: false, euOnlyForEuTenants: true,
  maxCreditsPerRequest: 5000,
});
const d = ref({ ...saved });
const changed = computed(() => JSON.stringify(d.value) !== JSON.stringify(saved));
function save(): void {
  Object.assign(saved, d.value);
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Changed gateway settings: ${d.value.retries} retries, cache ${d.value.cache}, unsupported parameters ${d.value.unsupported}`, target: 'Gateway', tenantId: 'root' });
  notify('Applies to new requests within a minute.', 'success', 'Gateway settings saved');
}
</script>

<template>
  <div>
    <Card title="Retries and timeouts" subtitle="For provider errors and overload (429, 5xx, 529); not for errors in the request itself.">
      <template #actions><GoButton size="m" :disabled="!changed" @click="save">Save</GoButton></template>
      <div class="four">
        <GoFormControl label="Retries before falling back" label-for="gw-r"><GoInputNumber id="gw-r" v-model="d.retries" :min="0" :max="5" size="m" /></GoFormControl>
        <GoFormControl label="First backoff, ms" label-for="gw-b" hint="Doubles each retry"><GoInputNumber id="gw-b" v-model="d.backoffMs" :min="0" :step="100" size="m" /></GoFormControl>
        <GoFormControl label="First token within, s" label-for="gw-ft"><GoInputNumber id="gw-ft" v-model="d.firstTokenTimeoutS" :min="5" :step="5" size="m" /></GoFormControl>
        <GoFormControl label="Whole request within, s" label-for="gw-t"><GoInputNumber id="gw-t" v-model="d.timeoutS" :min="30" :step="30" size="m" /></GoFormControl>
      </div>
    </Card>

    <Card title="Fallbacks and routing" class="spaced">
      <div class="rules">
        <GoToggle v-model="d.contextFallback">Prompt too long for the model: try the next model in the alias chain with a larger context, instead of refusing</GoToggle>
        <GoToggle v-model="d.policyFallback">Provider refuses on content policy: try the next model in the chain</GoToggle>
        <GoToggle v-model="d.capabilityRouting">Skip models that cannot take what the request uses — images, files, audio, tools — when choosing from an alias chain</GoToggle>
        <GoToggle v-model="d.requireParams">Route only to models that accept every parameter in the request</GoToggle>
        <GoFormControl label="A parameter the model does not accept, unless the model says otherwise" class="narrow">
          <GoSegmentButtonGroup v-model="d.unsupported" size="s" aria-label="Unsupported parameters">
            <GoSegmentButton value="drop">Drop it and answer</GoSegmentButton>
            <GoSegmentButton value="reject">Refuse with 400</GoSegmentButton>
          </GoSegmentButtonGroup>
        </GoFormControl>
        <GoFormControl label="Refuse a request estimated above, credits" label-for="gw-max" hint="Guards against runaway prompts; 0 turns it off" class="narrow">
          <GoInputNumber id="gw-max" v-model="d.maxCreditsPerRequest" :min="0" :step="500" size="m" />
        </GoFormControl>
      </div>
    </Card>

    <Card title="Response cache" subtitle="Answers repeated requests from the cache: no model call, no credits." class="spaced">
      <div class="rules">
        <GoSegmentButtonGroup v-model="d.cache" size="s" aria-label="Cache">
          <GoSegmentButton value="off">Off</GoSegmentButton>
          <GoSegmentButton value="exact">Exact match</GoSegmentButton>
          <GoSegmentButton value="semantic">Similar requests</GoSegmentButton>
        </GoSegmentButtonGroup>
        <div v-if="d.cache !== 'off'" class="four">
          <GoFormControl label="Keep answers for, minutes" label-for="gw-ttl"><GoInputNumber id="gw-ttl" v-model="d.cacheTtlMin" :min="1" :step="15" size="m" /></GoFormControl>
          <GoFormControl v-if="d.cache === 'semantic'" label="Similarity at least" label-for="gw-sim" hint="0.95 is close to identical"><GoInputNumber id="gw-sim" v-model="d.cacheSimilarity" :min="0.8" :max="1" :step="0.01" size="m" /></GoFormControl>
        </div>
        <GoToggle v-if="d.cache !== 'off'" v-model="d.cachePerTenant">Keep each tenant's cache separate — an answer is never served to another tenant</GoToggle>
      </div>
    </Card>

    <Card title="External providers and data" subtitle="Which provider endpoints requests may reach when they leave the instance." class="spaced">
      <div class="rules">
        <GoToggle v-model="d.noTraining">Only providers that do not train on prompts and answers</GoToggle>
        <GoToggle v-model="d.zdrOnly">Only endpoints with zero data retention</GoToggle>
        <GoToggle v-model="d.euOnlyForEuTenants">Tenants in the EU reach EU-processed endpoints only</GoToggle>
      </div>
    </Card>
  </div>
</template>

<style scoped>
  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .four {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .rules {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .narrow {
    max-inline-size: 420px;
  }
</style>
