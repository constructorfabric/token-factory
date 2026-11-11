<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref, watch } from 'vue';
import Card from '@/components/ui/Card.vue';
import { record } from '@/state/db';
import { session } from '@/state/session';
import { policyFor, type RolloutPolicy } from '@/state/rollout';

/**
 * How new models reach traffic: the rings, and the rules for moving between
 * them. The instance's apply to the models it serves; a tenant that manages
 * its own models sets its own for those.
 */
const props = defineProps<{ tenantId: string }>();
const { notify } = useNotificationsStore();
const isRoot = computed(() => props.tenantId === 'root');
const clone = (p: RolloutPolicy): RolloutPolicy => JSON.parse(JSON.stringify(p));
const draft = ref<RolloutPolicy>(clone(policyFor(props.tenantId)));
watch(() => props.tenantId, (id) => (draft.value = clone(policyFor(id))));
const changed = computed(() => JSON.stringify(draft.value) !== JSON.stringify(policyFor(props.tenantId)));
// Shares only grow ring by ring, and the last enabled ring takes everyone.
const enabled = computed(() => draft.value.rings.filter((r) => r.enabled));
const problem = computed(() => {
  if (!enabled.value.length) return 'Enable at least one ring.';
  if (enabled.value.some((r, i) => i > 0 && r.share <= enabled.value[i - 1]!.share)) return 'Each ring must take a larger share than the one before.';
  if (enabled.value[enabled.value.length - 1]!.share !== 100) return 'The last enabled ring must take 100% of traffic.';
  return '';
});
function save(): void {
  if (problem.value) return;
  Object.assign(policyFor(props.tenantId), clone(draft.value));
  record({ actor: session.current.value?.person ?? 'Victor Batraev', actorRole: session.current.value?.role ?? 'Instance Admin', action: `Changed model rollout settings: ${enabled.value.map((r) => `${r.name} ${r.share}%`).join(' → ')}`, target: 'Model rollout', tenantId: props.tenantId });
  notify('Rollouts in progress keep their current ring; the next move uses the new settings.', 'success', 'Rollout settings saved');
}
</script>

<template>
  <div>
    <Card title="Rings" :subtitle="isRoot ? 'Who gets a new model first, for the models this instance serves. A model moves ring by ring on the Lifecycle page or its own page.' : 'Who in your organization gets a new model first, for the models you add or deploy yourselves.'">
      <template #actions><GoButton size="m" :disabled="!changed || !!problem" @click="save">Save</GoButton></template>
      <div class="rings">
        <div class="ring ring-head">
          <span>Ring</span><span>Share of traffic, %</span><span>Soak before next, days</span><span>On</span>
        </div>
        <div v-for="r in draft.rings" :key="r.id" class="ring" :class="{ ring_off: !r.enabled }">
          <GoInput v-model="r.name" size="m" :aria-label="`${r.id} name`" />
          <GoInputNumber v-model="r.share" :min="1" :max="100" :step="5" size="m" :aria-label="`${r.name} share`" />
          <GoInputNumber v-model="r.soakDays" :min="0" :max="60" size="m" :aria-label="`${r.name} soak days`" />
          <GoToggle v-model="r.enabled" size="s" :aria-label="`Use ${r.name}`" />
        </div>
      </div>
      <p v-if="problem" class="problem">{{ problem }}</p>
      <p v-else class="sub">{{ enabled.map((r) => `${r.name} ${r.share}%`).join(' → ') }}</p>
    </Card>

    <Card title="Moving between rings" class="spaced">
      <div class="rules">
        <GoToggle v-model="draft.autoAdvance">Move to the next ring by itself once a ring has soaked and stayed healthy</GoToggle>
        <div class="two">
          <GoFormControl label="Healthy: error rate at most this much higher, points" label-for="ro-err">
            <GoInputNumber id="ro-err" v-model="draft.maxErrorDelta" :min="0" :max="5" :step="0.1" size="m" />
          </GoFormControl>
          <GoFormControl label="Healthy: p95 latency at most this much slower, %" label-for="ro-lat">
            <GoInputNumber id="ro-lat" v-model="draft.maxLatencyDelta" :min="0" :max="200" :step="5" size="m" />
          </GoFormControl>
        </div>
        <GoToggle v-model="draft.approvalForBroad">The last ring (everyone) always needs an admin to press the button</GoToggle>
        <GoToggle v-model="draft.autoRollback">Roll back by itself when the new model's error rate passes the limit</GoToggle>
        <GoFormControl v-if="draft.autoRollback" label="Roll back above this error rate, %" label-for="ro-rb" class="narrow">
          <GoInputNumber id="ro-rb" v-model="draft.rollbackErrorRate" :min="0.1" :max="50" :step="0.5" size="m" />
        </GoFormControl>
        <GoFormControl label="Notice before a deprecated model retires, days" label-for="ro-notice" hint="The earliest retire date the Deprecate dialog allows" class="narrow">
          <GoInputNumber id="ro-notice" v-model="draft.noticeDays" :min="0" :max="365" :step="15" size="m" />
        </GoFormControl>
      </div>
    </Card>
  </div>
</template>

<style scoped>
  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .rings {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .ring {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 180px 180px 48px;
    gap: var(--acv-spacing-small);
    align-items: center;

    &.ring_off {
      opacity: 0.55;
    }
  }

  .ring-head {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .rules {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .narrow {
    max-inline-size: 360px;
  }

  .problem {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) 0 0;
    color: var(--acv-color-status-danger-strong);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) 0 0;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
