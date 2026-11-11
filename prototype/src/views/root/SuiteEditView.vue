<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import ItemPicker from '@/components/ui/ItemPicker.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { BENCHMARKS, membersOf, setupOf } from '@/state/benchRuns';
import { SCORERS } from '@/data/benchCatalog';
import { db, record } from '@/state/db';

/** A suite: benchmarks grouped under one scenario and one pass threshold, which alias gates read. */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const existing = computed(() => (route.params.id ? db.suites.find((s) => s.id === String(route.params.id)) : undefined));
const isNew = computed(() => !existing.value);
const d = ref({ name: '', scenario: '', threshold: 70, owner: 'Platform Engineering', privateData: true, members: [] as string[], weighting: 'cases' as 'cases' | 'equal' });
watch(existing, (s) => {
  if (!s) return;
  d.value = { name: s.name, scenario: s.scenario, threshold: s.threshold, owner: s.owner, privateData: s.privateData, members: membersOf(s.id).map((b) => b.id), weighting: 'cases' };
}, { immediate: true });

const items = computed(() => BENCHMARKS.map((b) => {
  const st = setupOf(b);
  return { id: b.id, label: b.name, group: b.source === 'public' ? 'Public' : 'Internal', sub: `${SCORERS.find((x) => x.id === st.scorer.kind)?.label} · ${b.metric}`, meta: `${b.cases.toLocaleString('en')} cases`, warn: st.privateData && !d.value.privateData ? 'private data' : undefined };
}));
const cases = computed(() => BENCHMARKS.filter((b) => d.value.members.includes(b.id)).reduce((s, b) => s + b.cases, 0));
const canSave = computed(() => !!d.value.name.trim() && d.value.members.length > 0);
function save(): void {
  if (!canSave.value) return;
  const v = d.value;
  let id = existing.value?.id ?? '';
  const scoring = `${v.weighting === 'cases' ? 'Mean weighted by cases' : 'Mean of benchmarks'} over ${v.members.length} benchmarks`;
  if (existing.value) {
    const s = existing.value;
    const changedGate = s.threshold !== v.threshold || membersOf(s.id).length !== v.members.length;
    Object.assign(s, { name: v.name.trim(), scenario: v.scenario.trim(), threshold: v.threshold, owner: v.owner, privateData: v.privateData, cases: cases.value, scoring, version: changedGate ? `v${(Number(s.version.replace(/\D/g, '')) || 1) + 1}` : s.version });
  } else {
    id = `b-${Date.now().toString(36)}`;
    db.suites.push({ id, name: v.name.trim(), scenario: v.scenario.trim(), cases: cases.value, scoring, threshold: v.threshold, owner: v.owner, version: 'v1', privateData: v.privateData });
  }
  // Membership lives on the benchmarks.
  for (const b of BENCHMARKS) {
    const inIt = v.members.includes(b.id);
    if (inIt && !b.suiteIds.includes(id)) b.suiteIds.push(id);
    if (!inIt && b.suiteIds.includes(id)) b.suiteIds.splice(b.suiteIds.indexOf(id), 1);
  }
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `${isNew.value ? 'Created' : 'Changed'} suite ${v.name.trim()}: ${v.members.length} benchmarks, pass at ${v.threshold}`, target: v.name.trim(), tenantId: 'root' });
  notify(isNew.value ? 'Run it on models to get first results.' : 'Saved. Alias gates read the new threshold from the next run.', 'success', isNew.value ? 'Suite created' : 'Suite saved');
  void router.push(`/root/benchmarks/suites/${id}`);
}
const back = () => router.push(existing.value ? `/root/benchmarks/suites/${existing.value.id}` : '/root/benchmarks?tab=suites');
</script>

<template>
  <div>
    <PageHeader :title="isNew ? 'New suite' : `Edit ${existing?.name}`" back description="Benchmarks grouped under one scenario and one pass threshold. Scenario aliases route only to models that pass it." @back="back">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="back">Cancel</GoButton>
        <GoButton size="m" :disabled="!canSave" @click="save">{{ isNew ? 'Create suite' : 'Save' }}</GoButton>
      </template>
    </PageHeader>

    <div class="layout">
      <Card :title="`Benchmarks in this suite · ${d.members.length}`" :subtitle="`${cases.toLocaleString('en')} cases; a suite run runs them all`">
        <ItemPicker v-model="d.members" :items="items" placeholder="Search benchmarks" noun="benchmarks" :max-height="520" />
      </Card>

      <div class="col">
        <Card title="Suite">
          <GoFormControl label="Name" label-for="se-name" required><GoInput id="se-name" v-model="d.name" size="m" /></GoFormControl>
          <GoFormControl label="Scenario it measures" label-for="se-sc"><GoInput id="se-sc" v-model="d.scenario" type="textarea" size="m" /></GoFormControl>
          <GoFormControl label="Owner" label-for="se-owner"><GoInput id="se-owner" v-model="d.owner" size="m" /></GoFormControl>
        </Card>
        <Card title="Score and gate" class="spaced">
          <GoFormControl label="Suite score">
            <GoSegmentButtonGroup v-model="d.weighting" size="s" aria-label="Weighting">
              <GoSegmentButton value="cases">Weighted by cases</GoSegmentButton>
              <GoSegmentButton value="equal">Each benchmark equal</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <GoFormControl label="Pass threshold" label-for="se-thr" hint="Alias gates read this; changing it makes a new version"><GoInputNumber id="se-thr" v-model="d.threshold" :min="0" :max="100" size="m" /></GoFormControl>
          <GoToggle v-model="d.privateData">Uses private company data — runs only on models that may see it</GoToggle>
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
</style>
