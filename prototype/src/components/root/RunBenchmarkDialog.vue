<script setup lang="ts">
import ItemPicker from '@/components/ui/ItemPicker.vue';
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { useNotificationsStore } from '@constructor/ui/notification';
import { computed, ref, watch } from 'vue';
import { benchModels, estimateUsd, runsOf, startRuns, targetName } from '@/state/benchRuns';

/** Run one suite or one benchmark against one model or many. */
const props = defineProps<{ kind: 'suite' | 'benchmark'; targetId: string; preselect?: string[] }>();
const open = defineModel<boolean>({ required: true });
const { notify } = useNotificationsStore();
const picked = ref<string[]>([]);
watch(open, (o) => {
  if (!o) return;
  picked.value = props.preselect?.length ? [...props.preselect] : benchModels().filter((m) => m.state === 'ga').map((m) => m.id);
});
const busy = (modelId: string) => runsOf(modelId).some((r) => r.suiteId === props.targetId && ['queued', 'running'].includes(r.status));
const runnable = computed(() => picked.value.filter((id) => !busy(id)));
const per = computed(() => (props.kind === 'suite' ? estimateUsd([props.targetId]) : estimateUsd([], [props.targetId])));
function start(): void {
  // Counted before starting: once started, the models show as running.
  const ids = [...runnable.value];
  for (const id of ids) {
    startRuns(id, props.kind === 'suite' ? [props.targetId] : [], 'Victor Batraev', undefined, props.kind === 'benchmark' ? [props.targetId] : []);
  }
  notify(`${targetName(props.targetId)} queued on ${ids.length} ${ids.length === 1 ? 'model' : 'models'}, about $${per.value * ids.length}. Results appear as each finishes.`, 'info', 'Runs started');
  open.value = false;
}
</script>

<template>
  <GoDialog v-model="open" size="m">
    <GoDialogWindow :title="`Run ${targetName(targetId)}`" header-border @close="open = false">
      <div class="fields">
        <span class="sub">Runs on the eval instance with pinned settings, once per model.</span>
        <ItemPicker v-model="picked" :items="benchModels().map((m) => ({ id: m.id, label: m.name, group: m.family, sub: m.provider, disabled: busy(m.id), disabledReason: 'Already running', meta: m.state === 'ga' ? '' : m.state }))" placeholder="Search models" noun="models" :max-height="360" />
      </div>
      <template #footer>
        <div class="footer">
          <span class="sub est">About ${{ per * runnable.length }}, charged to the <RouterLink to="/root/evaluation?tab=setup" @click="open = false">evaluation budget</RouterLink></span>
          <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
          <GoButton size="m" :disabled="!runnable.length" @click="start">Run on {{ runnable.length }} {{ runnable.length === 1 ? 'model' : 'models' }}</GoButton>
        </div>
      </template>
    </GoDialogWindow>
  </GoDialog>
</template>

<style scoped>
  .fields {
    display: grid;
    gap: var(--acv-spacing-small);
  }

  .tools {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .search {
    flex: 1;
  }

  .link {
    @mixin acv-text-ui-caption-1;
    padding: 0;
    border: none;
    background: none;
    color: var(--acv-color-glyph-brand);
    cursor: pointer;
  }

  .list {
    display: grid;
    gap: var(--acv-spacing-small);
    max-block-size: 340px;
    overflow-y: auto;
  }

  .row {
    display: inline-flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }

  .est {
    margin-inline-end: auto;
  }
</style>
