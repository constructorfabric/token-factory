<script setup lang="ts">
import ItemPicker from '@/components/ui/ItemPicker.vue';
import { CAPABILITIES, capLabel, missingCaps } from '@/data/capabilities';
import type { Capability } from '@/data/types';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconPlus } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { Alias } from '@/data/types';
import { db, modelById, record } from '@/state/db';
import { routableModels } from '@/state/aliases';

/**
 * Callers name an alias, not a model. A model alias follows one model line
 * across versions and only points at models of its family (Model.family);
 * a scenario alias answers to what a task needs, and each scenario is one of
 * the benchmark suites, so an alias only moves to a model that passes.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tab = computed(() => (route.query.tab === 'scenarios' ? 'scenarios' : 'models'));
const go = (t: string) => router.replace({ query: t === 'models' ? {} : { tab: t } });

const isModelAlias = (a: Alias) => !!a.family;
const modelAliases = computed(() => db.aliases.filter(isModelAlias));
const scenarios = computed(() => db.aliases.filter((a) => !isModelAlias(a)));
const STRATEGY = { priority: 'Priority', weighted: 'Weighted', 'least-latency': 'Least latency', 'lowest-cost': 'Lowest cost' } as const;
const suiteName = (id?: string) => db.suites.find((s) => s.id === id)?.name ?? '—';
// The gate is derived, not configured. A scenario alias needs its own
// scenario; for a model alias it is what its current model passes today.
// candidate is never promoted to something worse than what it replaces.
type Result = 'pass' | 'fail' | 'not-run';
const resultOf = (modelId: string | undefined, suiteId: string): { r: Result; score?: number } => {
  const score = modelById(modelId)?.scores[suiteId];
  const threshold = db.suites.find((x) => x.id === suiteId)?.threshold ?? 0;
  return score === undefined ? { r: 'not-run' } : { r: score >= threshold ? 'pass' : 'fail', score };
};
const gateFor = (family: boolean, primary: string, suiteId?: string) =>
  family ? db.suites.filter((x) => resultOf(primary, x.id).r === 'pass').map((x) => x.id) : suiteId ? [suiteId] : [];
const gateOf = (a: Alias) => gateFor(isModelAlias(a), a.primary, a.suiteId);
const TAG = { pass: 'green', fail: 'red', 'not-run': 'neutral' } as const;
const MARK = { pass: '✓', fail: '✗', 'not-run': '–' } as const;
// Models an alias may point at: the instance's own catalog, not retired or failed.
const routable = computed(() => routableModels());

const sMod = useSort(() => modelAliases.value, { name: (r) => r.name, family: (r) => r.family, primary: (r) => modelById(r.primary)?.name });
const sScn = useSort(() => scenarios.value, { name: (r) => r.name, scenario: (r) => suiteName(r.suiteId), primary: (r) => modelById(r.primary)?.name, strategy: (r) => r.strategy });

// ---- add or edit, one dialog for both kinds
type Draft = { name: string; family: string; description: string; suiteId: string; primary: string; candidate: string; candidateShare: number; fallbacks: string[]; strategy: Alias['strategy']; requiredSuites: string[]; caps: Capability[] };
const open = ref(false);
const kind = ref<'model' | 'scenario'>('model');
const editing = ref<Alias | null>(null);
const draft = ref<Draft>(blank());
function blank(): Draft {
  return { name: '', family: '', description: '', suiteId: db.suites[0]?.id ?? '', primary: '', candidate: '', candidateShare: 10, fallbacks: [], strategy: 'priority', requiredSuites: [], caps: [] };
}
function openNew(k: 'model' | 'scenario'): void {
  kind.value = k;
  editing.value = null;
  draft.value = blank();
  open.value = true;
}
function openEdit(a: Alias): void {
  kind.value = isModelAlias(a) ? 'model' : 'scenario';
  editing.value = a;
  draft.value = { caps: [...(a.requiredCapabilities ?? [])], name: a.name, family: a.family ?? '', description: isModelAlias(a) ? '' : a.scenario, suiteId: a.suiteId ?? '', primary: a.primary, candidate: a.candidate ?? '', candidateShare: a.candidateShare ?? 10, fallbacks: [...a.fallbacks], strategy: a.strategy, requiredSuites: [...a.requiredSuites] };
  open.value = true;
}
// A scenario alias always has to pass its own scenario's suite.
const draftGate = computed(() => gateFor(kind.value === 'model', draft.value.primary, draft.value.suiteId));
const gateModels = computed(() => {
  const d = draft.value;
  const out = [{ id: d.primary, role: kind.value === 'model' ? 'Current' : 'Primary' }];
  if (d.candidate && kind.value === 'scenario') out.push({ id: d.candidate, role: 'Candidate' });
  if (kind.value === 'scenario') d.fallbacks.forEach((f, i) => out.push({ id: f, role: `Fallback ${i + 1}` }));
  return out;
});
const nameTaken = computed(() => db.aliases.some((a) => a !== editing.value && a.name.toLowerCase() === draft.value.name.trim().toLowerCase()));
const primaryMissing = computed(() => (kind.value === 'scenario' ? missingCaps(modelById(draft.value.primary), draft.value.caps) : []));
// A model alias moving to another version should not lose what the current one can do.
const dropsFrom = computed(() => (kind.value === 'model' && editing.value && draft.value.primary && draft.value.primary !== editing.value.primary ? missingCaps(modelById(draft.value.primary), modelById(editing.value.primary)?.capabilities) : []));
const canSave = computed(() => !!draft.value.name.trim() && !nameTaken.value && !!draft.value.primary && !primaryMissing.value.length && (kind.value === 'model' ? !!draft.value.family : !!draft.value.suiteId));
const lacks = (modelId: string) => (kind.value === 'scenario' ? missingCaps(modelById(modelId), draft.value.caps) : []);
const chainLacks = (a: Alias, id: string) => missingCaps(modelById(id), isModelAlias(a) ? modelById(a.primary)?.capabilities : a.requiredCapabilities);
const familyNames = computed(() => [...new Set(routable.value.map((m) => m.family))].sort());
// A model alias only points at models of its family; a scenario alias at any model.
const pickable = computed(() => (kind.value === 'model' ? routable.value.filter((m) => m.family === draft.value.family) : routable.value));
const fallbackOptions = computed(() => pickable.value.filter((m) => m.id !== draft.value.primary));
// A fallback list may name any model, also of another family (FR-57).
const fallbackChoices = computed(() => routable.value.filter((m) => m.id !== draft.value.primary));
// What a fallback lacks: a scenario alias's required capabilities, or what the model alias's current model can do.
const fbLacks = (id: string) => (kind.value === 'scenario' ? lacks(id) : missingCaps(modelById(id), modelById(draft.value.primary)?.capabilities));
function setFamily(f: string): void {
  draft.value.family = f;
  const fits = (id: string) => modelById(id)?.family === f;
  if (!fits(draft.value.primary)) draft.value.primary = '';
  if (!fits(draft.value.candidate)) draft.value.candidate = '';
}
function save(): void {
  if (!canSave.value) return;
  const d = draft.value;
  const fields: Omit<Alias, 'id'> = {
    name: d.name.trim(),
    family: kind.value === 'model' ? d.family : undefined,
    scenario: kind.value === 'model' ? 'Model alias' : d.description.trim() || suiteName(d.suiteId),
    suiteId: kind.value === 'scenario' ? d.suiteId : undefined,
    primary: d.primary,
    candidate: kind.value === 'scenario' ? d.candidate || undefined : undefined,
    candidateShare: d.candidate && kind.value === 'scenario' ? d.candidateShare : undefined,
    fallbacks: d.fallbacks.filter((f) => f !== d.primary),
    strategy: kind.value === 'scenario' ? d.strategy : 'priority',
    requiredSuites: draftGate.value,
    requiredCapabilities: kind.value === 'scenario' && d.caps.length ? [...d.caps] : undefined,
  };
  if (editing.value) Object.assign(editing.value, fields);
  else db.aliases.push({ id: `a-${Date.now().toString(36)}`, ...fields });
  const what = kind.value === 'model' ? 'model alias' : 'scenario alias';
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `${editing.value ? 'Changed' : 'Added'} ${what} ${fields.name} → ${modelById(fields.primary)?.name}`, target: fields.name, tenantId: 'root' });
  notify(`Requests to “${fields.name}” go to ${modelById(fields.primary)?.name} within a minute.`, 'success', editing.value ? 'Saved' : `${kind.value === 'model' ? 'Model alias' : 'Scenario alias'} added`);
  open.value = false;
}
function remove(): void {
  const a = editing.value;
  if (!a) return;
  db.aliases.splice(db.aliases.indexOf(a), 1);
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Deleted alias ${a.name}`, target: a.name, tenantId: 'root' });
  notify(`Requests to “${a.name}” are refused from now on; callers get a clear error naming the alias.`, 'warning', 'Deleted');
  open.value = false;
}
function toggleFallback(id: string): void {
  const f = draft.value.fallbacks;
  draft.value.fallbacks = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
}
</script>

<template>
  <div>
    <PageHeader title="Aliases & routing" description="Callers name an alias, not a model, so moving an alias is the rollout.">
      <template #actions>
        <GoButton size="m" @click="openNew(tab === 'models' ? 'model' : 'scenario')">
          <template #icon><IconPlus /></template>
          {{ tab === 'models' ? 'Add model alias' : 'Add scenario alias' }}
        </GoButton>
      </template>
    </PageHeader>

    <GoTabs class="tabs">
      <GoTabsItem :active="tab === 'models'" @click="go('models')">Model aliases · {{ modelAliases.length }}</GoTabsItem>
      <GoTabsItem :active="tab === 'scenarios'" @click="go('scenarios')">Scenario aliases · {{ scenarios.length }}</GoTabsItem>
    </GoTabs>

    <Card v-if="tab === 'models'" title="Model aliases" subtitle="Named after a model line: requests go to its current model, which is always of the alias’s family" flush>
      <GoTable size="sm">
        <GoTableRow header>
          <SortHeader :sort="sMod" k="name">Model alias</SortHeader>
          <SortHeader :sort="sMod" k="family">Family</SortHeader>
          <SortHeader :sort="sMod" k="primary">Current model</SortHeader>
          <GoTableCell>Fallback list</GoTableCell>
          <GoTableCell>Can do</GoTableCell>
          <GoTableCell>Passes today</GoTableCell>
          <GoTableCell width="80" />
        </GoTableRow>
        <GoTableRow v-for="a in sMod.rows.value" :key="a.id">
          <GoTableCell><GoTableName :is="'button'" class="name-btn" @click="openEdit(a)"><code>{{ a.name }}</code></GoTableName></GoTableCell>
          <GoTableCell>{{ a.family }}</GoTableCell>
          <GoTableCell>{{ modelById(a.primary)?.name }}</GoTableCell>
          <GoTableCell>
            <template v-if="a.fallbacks.length"><span v-for="(f, i) in a.fallbacks" :key="f" :class="{ lacking: chainLacks(a, f).length }" :title="chainLacks(a, f).length ? `Lacks ${chainLacks(a, f).map(capLabel).join(', ')}` : ''">{{ i ? ' → ' : '' }}{{ modelById(f)?.name }}{{ chainLacks(a, f).length ? ' ⚠' : '' }}</span></template>
            <span v-else class="sub">None — outage error if it fails</span>
          </GoTableCell>
          <GoTableCell><span class="caps">{{ modelById(a.primary)?.capabilities.map(capLabel).join(', ') }}</span></GoTableCell>
          <GoTableCell>
            <GoTag v-for="s in gateOf(a)" :key="s" size="s" color="neutral">{{ suiteName(s) }}</GoTag>
            <span v-if="!gateOf(a).length" class="sub">No benchmark passed yet</span>
          </GoTableCell>
          <GoTableCell><GoButton variant="ghost" size="s" @click="openEdit(a)">Edit</GoButton></GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <Card v-else title="Scenario aliases" subtitle="What a task needs, independent of who serves it. Each scenario is a benchmark suite." flush>
      <GoTable size="sm">
        <GoTableRow header>
          <SortHeader :sort="sScn" k="name">Alias</SortHeader>
          <SortHeader :sort="sScn" k="scenario">Scenario</SortHeader>
          <SortHeader :sort="sScn" k="primary">Primary → candidate</SortHeader>
          <GoTableCell>Fallback chain</GoTableCell>
          <SortHeader :sort="sScn" k="strategy">Strategy</SortHeader>
          <GoTableCell>Gate · next candidate</GoTableCell>
          <GoTableCell width="80" />
        </GoTableRow>
        <GoTableRow v-for="a in sScn.rows.value" :key="a.id">
          <GoTableCell><GoTableName :is="'button'" class="name-btn" @click="openEdit(a)"><code>{{ a.name }}</code></GoTableName></GoTableCell>
          <GoTableCell>
            <RouterLink class="scenario-link" to="/root/benchmarks">{{ suiteName(a.suiteId) }}</RouterLink>
            <span v-if="a.scenario !== suiteName(a.suiteId)" class="sub">{{ a.scenario }}</span>
            <span v-if="a.requiredCapabilities?.length" class="sub">Needs {{ a.requiredCapabilities.map(capLabel).join(', ') }}</span>
          </GoTableCell>
          <GoTableCell>
            {{ modelById(a.primary)?.name }}
            <span v-if="a.candidate" class="sub">→ {{ modelById(a.candidate)?.name }} at {{ a.candidateShare }}%</span>
          </GoTableCell>
          <GoTableCell>
            <template v-if="a.fallbacks.length"><span v-for="(f, i) in a.fallbacks" :key="f" :class="{ lacking: chainLacks(a, f).length }" :title="chainLacks(a, f).length ? `Lacks ${chainLacks(a, f).map(capLabel).join(', ')}` : ''">{{ i ? ' → ' : '' }}{{ modelById(f)?.name }}{{ chainLacks(a, f).length ? ' ⚠' : '' }}</span></template>
            <template v-else>—</template>
            <span v-if="a.fallbacks.some((f) => chainLacks(a, f).length)" class="sub lacking">⚠ lacks {{ [...new Set(a.fallbacks.flatMap((f) => chainLacks(a, f)))].map(capLabel).join(', ') }}</span>
          </GoTableCell>
          <GoTableCell>{{ STRATEGY[a.strategy] }}</GoTableCell>
          <GoTableCell>
            <GoTag v-for="s in gateOf(a)" :key="s" size="s" :color="a.candidate ? TAG[resultOf(a.candidate, s).r] : 'neutral'">{{ a.candidate ? MARK[resultOf(a.candidate, s).r] : '' }} {{ suiteName(s) }}</GoTag>
            <span v-if="!a.candidate" class="sub">No candidate</span>
          </GoTableCell>
          <GoTableCell><GoButton variant="ghost" size="s" @click="openEdit(a)">Edit</GoButton></GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>

    <GoDialog v-model="open" size="m">
      <GoDialogWindow :title="editing ? `Edit ${editing.name}` : kind === 'model' ? 'Add model alias' : 'Add scenario alias'" header-border @close="open = false">
        <div class="fields">
          <GoFormControl :label="'Alias'" label-for="al-name" required :hint="nameTaken ? 'Another alias already has this name' : 'What callers put in the model field'">
            <GoInput id="al-name" v-model="draft.name" size="m" :placeholder="kind === 'model' ? 'Claude Sonnet' : 'coding-default'" />
          </GoFormControl>
          <GoFormControl v-if="kind === 'model'" label="Family" required hint="The alias only ever points at models of this family">
            <GoSelect :model-value="draft.family" size="m" aria-label="Family" placeholder="Choose a family" @update:model-value="setFamily(String($event))">
              <GoSelectOption v-for="f in familyNames" :key="f" :value="f">{{ f }}<template #description>{{ routable.filter((m) => m.family === f).map((m) => m.name).join(', ') }}</template></GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <template v-if="kind === 'scenario'">
            <GoFormControl label="Scenario" hint="The benchmark suite that defines it; models must pass it to be routed here">
              <GoSelect v-model="draft.suiteId" size="m" aria-label="Scenario">
                <GoSelectOption v-for="s in db.suites" :key="s.id" :value="s.id">{{ s.name }}<template #description>{{ s.scenario }}</template></GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <GoFormControl label="What it is for" label-for="al-desc" optional>
              <GoInput id="al-desc" v-model="draft.description" size="m" placeholder="Agentic coding in Claude Code, Codex and IDEs" />
            </GoFormControl>
            <GoFormControl label="Required capabilities" hint="Every model it routes to must have these; callers rely on them">
              <div class="checks">
                <GoCheckbox v-for="c in CAPABILITIES" :key="c.id" v-model="draft.caps" :value="c.id">{{ c.label }}<span class="sub">{{ c.hint }}</span></GoCheckbox>
              </div>
            </GoFormControl>
          </template>
          <div class="two">
            <GoFormControl :label="kind === 'model' ? 'Current model' : 'Primary model'" required>
              <GoSelect v-model="draft.primary" size="m" aria-label="Primary model" :placeholder="kind === 'model' && !draft.family ? 'Choose a family first' : 'Choose a model'" :disabled="kind === 'model' && !draft.family">
                <GoSelectOption v-for="m in pickable" :key="m.id" :value="m.id">{{ m.name }}<template #description>{{ m.provider }}{{ lacks(m.id).length ? ` · lacks ${lacks(m.id).map(capLabel).join(', ')}` : '' }}</template></GoSelectOption>
              </GoSelect>
              <span v-if="primaryMissing.length" class="sub lacking">Lacks {{ primaryMissing.map(capLabel).join(', ') }} — pick another model or drop the requirement</span>
              <span v-else-if="dropsFrom.length" class="sub lacking">Callers lose {{ dropsFrom.map(capLabel).join(', ') }} compared with {{ modelById(editing?.primary)?.name }}</span>
            </GoFormControl>
            <GoFormControl v-if="kind === 'scenario'" label="Next candidate" optional>
              <GoSelect v-model="draft.candidate" size="m" aria-label="Next candidate">
                <GoSelectOption value="">None</GoSelectOption>
                <GoSelectOption v-for="m in fallbackOptions" :key="m.id" :value="m.id">{{ m.name }}<template v-if="lacks(m.id).length" #description>lacks {{ lacks(m.id).map(capLabel).join(', ') }}</template></GoSelectOption>
              </GoSelect>
            </GoFormControl>
          </div>
          <template v-if="kind === 'scenario'">
            <div class="two">
              <GoFormControl v-if="draft.candidate" label="Candidate share of traffic, %" label-for="al-share">
                <GoInputNumber id="al-share" v-model="draft.candidateShare" :min="1" :max="100" :step="5" size="m" />
              </GoFormControl>
              <GoFormControl label="Strategy">
                <GoSelect v-model="draft.strategy" size="m" aria-label="Strategy">
                  <GoSelectOption v-for="(label, k) in STRATEGY" :key="k" :value="k">{{ label }}</GoSelectOption>
                </GoSelect>
              </GoFormControl>
            </div>

          </template>
          <GoFormControl :label="kind === 'model' ? 'Fallback list' : 'Fallback chain'" :hint="kind === 'model' ? 'Tried in order when the current model has no healthy engine or is turned off; the response names the model that answered. Without a list, callers get the outage error.' : 'Tried in the order you tick them when the primary fails or is overloaded'">
            <ItemPicker v-model="draft.fallbacks" ordered :items="fallbackChoices.map((m) => ({ id: m.id, label: m.name, group: kind === 'model' && m.family !== draft.family ? 'Other families' : kind === 'model' ? `${draft.family} family` : m.family, sub: m.provider, warn: fbLacks(m.id).length ? `lacks ${fbLacks(m.id).map(capLabel).join(', ')}` : undefined }))" placeholder="Search models" noun="models" :max-height="240" />
          </GoFormControl>
          <div v-if="draft.primary" class="gate">
            <span class="gate-title">{{ kind === 'scenario' ? 'Gate' : 'Benchmarks' }}</span>
            <span class="sub">{{ kind === 'scenario' ? `A model is routed here only when it passes ${suiteName(draft.suiteId)}.` : `What ${modelById(draft.primary)?.name} passes today.` }} From the latest benchmark runs.</span>
            <table class="gate-table">
              <thead>
                <tr><th>Benchmark suite</th><th>Threshold</th><th v-for="m in gateModels" :key="m.id">{{ m.role }}<span class="sub">{{ modelById(m.id)?.name }}</span></th></tr>
              </thead>
              <tbody>
                <tr v-for="sid in draftGate" :key="sid">
                  <td>{{ suiteName(sid) }}</td>
                  <td>{{ db.suites.find((x) => x.id === sid)?.threshold }}</td>
                  <td v-for="m in gateModels" :key="m.id" :class="`res res_${resultOf(m.id, sid).r}`">{{ MARK[resultOf(m.id, sid).r] }} {{ resultOf(m.id, sid).score ?? 'not run' }}</td>
                </tr>
                <tr v-if="!draftGate.length"><td :colspan="2 + gateModels.length" class="sub">{{ modelById(draft.primary)?.name }} passes no benchmark suite yet.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton v-if="editing" variant="secondary" size="m" class="delete" @click="remove">Delete</GoButton>
            <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!canSave" @click="save">{{ editing ? 'Save' : 'Add' }}</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }


  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }





  .name-btn {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .scenario-link {
    color: var(--acv-color-glyph-primary);
    text-decoration: none;

    &:hover {
      color: var(--acv-color-glyph-brand);
      text-decoration: underline;
    }
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .checks {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-x-small);
  }

  .gate {
    display: grid;
    gap: 4px;
  }

  .gate-title {
    @mixin acv-text-ui-body-2-medium;
  }

  .gate-table {
    @mixin acv-text-ui-caption-1;
    inline-size: 100%;
    margin-block-start: 4px;
    border-collapse: collapse;

    & th,
    & td {
      padding: 4px 8px 4px 0;
      border-block-end: var(--acv-border-light);
      text-align: start;
      vertical-align: top;
    }

    & th {
      font-weight: 500;
      color: var(--acv-color-glyph-secondary);
    }
  }

  .res_pass {
    color: var(--acv-color-status-success-strong, #16a34a);
  }

  .res_fail {
    color: var(--acv-color-status-danger-strong);
  }

  .res_not-run {
    color: var(--acv-color-glyph-tertiary);
  }

  .caps {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .lacking {
    color: var(--acv-color-status-warning-strong, #b45309);
  }

  .order {
    @mixin acv-text-ui-caption-1;
    margin-inline-start: 6px;
    padding: 0 5px;
    border-radius: 8px;
    background: var(--acv-color-surface-secondary);
    color: var(--acv-color-glyph-secondary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }

  .delete {
    margin-inline-end: auto;
    color: var(--acv-color-status-danger-strong);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
