<script setup lang="ts">
import ItemPicker from '@/components/ui/ItemPicker.vue';
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoDropdownMenuDivider, GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref } from 'vue';
import type { Model } from '@/data/types';
import { IconEllipsisVertical, IconPlus, IconSearch } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import TenantLicenseSummary from '@/components/root/TenantLicenseSummary.vue';
import { CREDITS_PER_USD, fmtCreditPrice } from '@/lib/format';
import { db, modelById, record, tenantById } from '@/state/db';
import { isModelAlias } from '@/state/aliases';
import { session } from '@/state/session';
import { RULES, licenseOfTenant, licensesOfferedBy, matches, ownModelsOf, poolFor, tenantLicenses, tenantsOn, type ModelRule, type TenantLicense } from '@/state/tenantLicenses';

/**
 * The tenant licenses this owner offers. The instance offers licenses to the
 * tenants beneath it; a partner offers its own to its customers, built from
 * what its license includes plus the models it deploys itself.
 */
const props = defineProps<{ ownerId: string }>();
const { notify } = useNotificationsStore();
const isRoot = computed(() => props.ownerId === 'root');
const owner = computed(() => tenantById(props.ownerId));
const ownLicense = computed(() => licenseOfTenant(owner.value));
const list = computed(() => licensesOfferedBy(props.ownerId));
const pool = computed(() => poolFor(props.ownerId));
const ownModels = computed(() => (isRoot.value ? [] : ownModelsOf(props.ownerId)));
const families = computed(() => [...new Set(pool.value.map((m) => m.family))].sort());

// ---- pick models: search, grouped by vendor or by class
const VENDOR: Record<string, string> = { Claude: 'Anthropic', GPT: 'OpenAI', 'gpt-oss': 'OpenAI', Gemini: 'Google', Qwen: 'Alibaba (Qwen)', GLM: 'Zhipu AI (GLM)', Llama: 'Meta (Llama)', Mistral: 'Mistral AI', DeepSeek: 'DeepSeek' };
const vendorOf = (m: Model) => VENDOR[m.family] ?? m.provider;
// Class by price per 1M output tokens, in credits.
const CLASSES = [
  { id: 'frontier', label: 'Frontier', text: '1,000 credits or more per 1M output tokens', test: (c: number) => c >= 1000 },
  { id: 'balanced', label: 'Balanced', text: '200 to 1,000 credits per 1M output tokens', test: (c: number) => c >= 200 && c < 1000 },
  { id: 'economy', label: 'Fast & economical', text: 'Under 200 credits per 1M output tokens', test: (c: number) => c < 200 },
];
const classOf = (m: Model) => CLASSES.find((c) => c.test(m.priceOut * CREDITS_PER_USD))!;
const groupBy = ref<'vendor' | 'class'>('vendor');
const pickQuery = ref('');
const pickGroups = computed(() => {
  const q = pickQuery.value.trim().toLowerCase();
  const hits = pool.value.filter((m) => !q || `${m.name} ${m.family} ${m.provider} ${vendorOf(m)}`.toLowerCase().includes(q));
  const keys = groupBy.value === 'vendor' ? [...new Set(hits.map(vendorOf))].sort().map((v) => ({ id: v, label: v, text: '' })) : CLASSES;
  return keys
    .map((k) => ({ ...k, models: hits.filter((m) => (groupBy.value === 'vendor' ? vendorOf(m) : classOf(m).id) === k.id) }))
    .filter((g) => g.models.length);
});
// One list for model aliases and models; aliases carry an 'alias:' prefix in it.
const pickItems = computed(() => [
  ...offeredAliases.value.map((a) => ({ id: `alias:${a.id}`, label: a.name, group: 'Model aliases — follow the newest model of their line', sub: `${a.family} family · now ${modelById(a.primary)?.name}` })),
  ...pool.value.map((m) => ({ id: m.id, label: m.name, group: groupBy.value === 'vendor' ? vendorOf(m) : classOf(m).label, sub: [groupBy.value === 'vendor' ? classOf(m).label : vendorOf(m), vendorOf(m) === m.provider ? '' : m.provider].filter(Boolean).join(' · '), meta: `${fmtCreditPrice(m.priceOut)} credits per 1M out` }))
    .sort((a, b) => a.group.localeCompare(b.group)),
]);
const pickedAll = computed({
  get: () => [...draft.value.aliasIds.map((id) => `alias:${id}`), ...draft.value.ids],
  set: (v: string[]) => {
    draft.value.aliasIds = v.filter((x) => x.startsWith('alias:')).map((x) => x.slice(6));
    draft.value.ids = v.filter((x) => !x.startsWith('alias:'));
  },
});
const allPicked = (ms: Model[]) => ms.every((m) => draft.value.ids.includes(m.id));
function toggleGroup(ms: Model[]): void {
  const ids = ms.map((m) => m.id);
  draft.value.ids = allPicked(ms) ? draft.value.ids.filter((id) => !ids.includes(id)) : [...new Set([...draft.value.ids, ...ids])];
}

// ---- create or edit
const open = ref(false);
const editingId = ref<string | null>(null);
type Draft = { name: string; description: string; createTenants: boolean; ownKeys: boolean; ownModels: boolean; mode: 'rule' | 'list'; aliasIds: string[]; rule: ModelRule; maxOutCredits: number; families: string[]; ids: string[]; extraIds: string[] };
const blank = (): Draft => ({ name: '', description: '', createTenants: false, ownKeys: false, ownModels: false, mode: 'rule', aliasIds: [], rule: 'all', maxOutCredits: 1500, families: [], ids: [], extraIds: [] });
const draft = ref<Draft>(blank());
function openNew(): void {
  editingId.value = null;
  draft.value = blank();
  open.value = true;
}
function openEdit(l: TenantLicense): void {
  editingId.value = l.id;
  const m = l.models;
  draft.value = {
    name: l.name, description: l.description, createTenants: l.createTenants, ownKeys: l.ownKeys, ownModels: l.ownModels,
    mode: m.mode, aliasIds: [...(l.aliasIds ?? [])], rule: m.mode === 'rule' ? m.rule : 'all', maxOutCredits: m.mode === 'rule' ? m.maxOutCredits ?? 1500 : 1500, families: m.mode === 'rule' ? [...(m.families ?? [])] : [], ids: m.mode === 'list' ? [...m.ids] : [], extraIds: [...l.extraIds],
  };
  open.value = true;
}
const draftModels = computed(() => {
  const d = draft.value;
  return d.mode === 'list' ? { mode: 'list' as const, ids: d.ids } : { mode: 'rule' as const, rule: d.rule, maxOutCredits: d.maxOutCredits, families: d.families };
});
const preview = computed(() => pool.value.filter((m) => matches({ models: draftModels.value }, m)));
// Model aliases on offer: those whose current model this owner can put in a license.
const offeredAliases = computed(() => {
  const q = pickQuery.value.trim().toLowerCase();
  return db.aliases.filter((a) => isModelAlias(a) && pool.value.some((m) => m.id === a.primary) && (!q || `${a.name} ${a.family} ${modelById(a.primary)?.name}`.toLowerCase().includes(q)));
});
const pickedAliases = computed(() => (draft.value.mode === 'list' ? draft.value.aliasIds : []));
const total = computed(() => new Set([...preview.value.map((m) => m.id), ...pickedAliases.value.map((id) => db.aliases.find((a) => a.id === id)?.primary ?? ''), ...draft.value.extraIds].filter(Boolean)).size);
const canSave = computed(() => !!draft.value.name.trim() && total.value > 0);
function save(): void {
  if (!canSave.value) return;
  const d = draft.value;
  const fields = { name: d.name.trim(), description: d.description.trim(), createTenants: d.createTenants, ownKeys: d.ownKeys, ownModels: d.ownModels, models: draftModels.value, extraIds: d.extraIds, aliasIds: d.mode === 'list' ? d.aliasIds : [] };
  const existing = tenantLicenses.find((l) => l.id === editingId.value);
  if (existing) Object.assign(existing, fields);
  else tenantLicenses.push({ id: `tl-${Date.now().toString(36)}`, ownerId: props.ownerId, ...fields });
  audit(`${existing ? 'Changed' : 'Created'} tenant license ${fields.name}: ${total.value} models`, fields.name);
  notify(existing && tenantsOn(existing).length ? `${tenantsOn(existing).length} tenants on it get the change right away.` : 'Pick it when you create a tenant or on a tenant’s page.', 'success', existing ? 'License saved' : 'License created');
  open.value = false;
}
function remove(l: TenantLicense): void {
  tenantLicenses.splice(tenantLicenses.indexOf(l), 1);
  audit(`Deleted tenant license ${l.name}`, l.name);
  notify(`${l.name} deleted.`, 'success');
}
function duplicate(l: TenantLicense): void {
  tenantLicenses.push({ ...JSON.parse(JSON.stringify(l)), id: `tl-${Date.now().toString(36)}`, name: `${l.name} (copy)` });
}
function audit(action: string, target: string): void {
  record({ actor: session.current.value?.person ?? 'Victor Batraev', actorRole: session.current.value?.role ?? 'Instance Admin', action, target, tenantId: props.ownerId });
}
const tenantsLink = (l: TenantLicense) => tenantsOn(l).map((t) => t.name).join(', ');
</script>

<template>
  <div>
    <Card :title="isRoot ? 'Tenant licenses' : 'Licenses for your customers'" :subtitle="isRoot ? 'What a tenant may do and which models it gets. Seats, credits and term are set per tenant.' : `Built from your ${ownLicense?.name ?? ''} license, plus the models you deploy yourself.`">
      <template #actions>
        <GoButton size="m" @click="openNew"><template #icon><IconPlus /></template>New license</GoButton>
      </template>
      <ul class="cards">
        <li v-for="l in list" :key="l.id" class="lic">
          <div class="lic-head">
            <span class="lic-name">{{ l.name }}</span>
            <span class="sub">{{ tenantsOn(l).length ? `${tenantsOn(l).length} ${tenantsOn(l).length === 1 ? 'tenant' : 'tenants'}: ${tenantsLink(l)}` : 'No tenants yet' }}</span>
            <GoDropdownMenuPopover :expand-icon="false" aria-label="License actions" position="bottom-right" class="lic-menu">
              <template #icon><IconEllipsisVertical /></template>
              <GoDropdownMenuItem @select="openEdit(l)">Edit</GoDropdownMenuItem>
              <GoDropdownMenuItem @select="duplicate(l)">Duplicate</GoDropdownMenuItem>
              <GoDropdownMenuDivider />
              <GoDropdownMenuItem danger :disabled="tenantsOn(l).length > 0" @select="remove(l)">Delete<template v-if="tenantsOn(l).length" #description>Move its tenants to another license first</template></GoDropdownMenuItem>
            </GoDropdownMenuPopover>
          </div>
          <TenantLicenseSummary :license="l" />
        </li>
        <li v-if="!list.length" class="sub">No licenses yet.</li>
      </ul>
    </Card>

    <GoDialog v-model="open" size="l">
      <GoDialogWindow :title="editingId ? `Edit ${draft.name}` : 'New tenant license'" header-border @close="open = false">
        <div class="fields">
          <div class="two">
            <GoFormControl label="Name" label-for="tl-name" required><GoInput id="tl-name" v-model="draft.name" size="m" placeholder="Enterprise" /></GoFormControl>
            <GoFormControl label="Description" label-for="tl-desc" optional><GoInput id="tl-desc" v-model="draft.description" size="m" placeholder="Who it is for" /></GoFormControl>
          </div>

          <div class="block">
            <span class="block-title">The tenant may</span>
            <GoToggle v-model="draft.createTenants">Create tenants beneath it — its customer admins create them and pick their licenses</GoToggle>
            <GoToggle v-model="draft.ownKeys">Add its own provider keys and the models behind them</GoToggle>
            <GoToggle v-if="isRoot" v-model="draft.ownModels">Deploy its own models — and offer them in licenses of its own</GoToggle>
          </div>

          <div class="block">
            <div class="block-row">
              <span class="block-title">Models</span>
              <GoSegmentButtonGroup v-model="draft.mode" size="s" aria-label="How models are chosen">
                <GoSegmentButton value="rule">By rule</GoSegmentButton>
                <GoSegmentButton value="list">Pick models</GoSegmentButton>
              </GoSegmentButtonGroup>
            </div>
            <template v-if="draft.mode === 'rule'">
              <div class="rules">
                <label v-for="r in RULES" :key="r.id" class="rule" :class="{ rule_on: draft.rule === r.id }">
                  <input v-model="draft.rule" type="radio" name="tl-rule" :value="r.id" />
                  <span><span class="rule-name">{{ r.label }}</span><span class="sub">{{ r.text }}</span></span>
                </label>
              </div>
              <GoFormControl v-if="draft.rule === 'budget'" label="Up to, credits per 1M output tokens" label-for="tl-max">
                <GoInputNumber id="tl-max" v-model="draft.maxOutCredits" :min="0" :step="100" size="m" />
              </GoFormControl>
              <GoFormControl v-if="draft.rule === 'families'" label="Families">
                <div class="checks"><GoCheckbox v-for="f in families" :key="f" v-model="draft.families" :value="f">{{ f }}</GoCheckbox></div>
              </GoFormControl>
              <p class="sub">{{ preview.length }} {{ preview.length === 1 ? 'model matches' : 'models match' }} now; models added {{ isRoot ? 'to the catalog' : 'to your license' }} later join when they match.{{ preview.length ? ` ${preview.map((m) => m.name).join(', ')}.` : '' }}</p>
            </template>
            <template v-else>
              <div class="pick-tools">
                <span class="sub">Group by</span>
                <GoSegmentButtonGroup v-model="groupBy" size="s" aria-label="Group by">
                  <GoSegmentButton value="vendor">Vendor</GoSegmentButton>
                  <GoSegmentButton value="class">Class</GoSegmentButton>
                </GoSegmentButtonGroup>
                <span class="sub picked">{{ draft.ids.length }} of {{ pool.length }} models<template v-if="draft.aliasIds.length"> · {{ draft.aliasIds.length }} aliases</template> picked</span>
              </div>
              <ItemPicker v-model="pickedAll" :items="pickItems" placeholder="Search models and aliases" noun="models" :max-height="360" />
            </template>
          </div>

          <div v-if="!isRoot" class="block">
            <span class="block-title">Your own models</span>
            <span class="sub">Added on top of the rule or list. Models you deploy appear here once they serve.</span>
            <ItemPicker v-if="ownModels.length" v-model="draft.extraIds" :items="ownModels.map((m) => ({ id: m.id, label: m.name, sub: m.dataResidency, meta: `${Math.round(m.priceOut * CREDITS_PER_USD)} credits per 1M out` }))" placeholder="Search your models" noun="models" :max-height="220" />
            <span v-else class="sub">You have not deployed models of your own yet.</span>
          </div>
        </div>
        <template #footer>
          <div class="footer">
            <span class="sub total">{{ total }} {{ total === 1 ? 'model' : 'models' }} in this license</span>
            <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!canSave" @click="save">{{ editingId ? 'Save' : 'Create license' }}</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .cards {
    display: grid;
    gap: var(--acv-spacing-regular);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lic {
    display: grid;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
  }

  .lic-head {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .lic-name {
    @mixin acv-text-ui-body-2-medium;
  }

  .lic-menu {
    margin-inline-start: auto;
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-large);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--acv-spacing-regular);
  }

  .block {
    display: grid;
    gap: var(--acv-spacing-small);
  }

  .block-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .block-title {
    @mixin acv-text-ui-body-2-medium;
  }

  .rules {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--acv-spacing-x-small);
  }

  .rule {
    display: flex;
    align-items: flex-start;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-x-small) var(--acv-spacing-small);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    cursor: pointer;

    &.rule_on {
      border-color: var(--acv-color-glyph-brand);
    }

    & input {
      margin-block-start: 3px;
      accent-color: var(--acv-color-glyph-brand);
    }
  }

  .rule-name {
    @mixin acv-text-ui-body-2;
    display: block;
  }

  .checks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--acv-spacing-regular);
  }

  .pick {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-small);
  }

  .pick-tools {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .pick-search {
    flex: 1;
    max-inline-size: 280px;
  }

  .picked {
    margin-inline-start: auto;
  }

  .pick-groups {
    display: grid;
    gap: var(--acv-spacing-regular);
    max-block-size: 340px;
    overflow-y: auto;
    padding-inline-end: var(--acv-spacing-x-small);
  }

  .pick-group {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .pick-group-head {
    display: flex;
    align-items: baseline;
    gap: var(--acv-spacing-x-small);
    padding-block-end: 4px;
    border-block-end: var(--acv-border-light);
  }

  .pick-group-name {
    @mixin acv-text-ui-body-2-medium;
  }

  .group-toggle {
    @mixin acv-text-ui-caption-1;
    margin-inline-start: auto;
    padding: 0;
    border: none;
    background: none;
    color: var(--acv-color-glyph-brand);
    cursor: pointer;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    margin: 0;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }

  .total {
    margin-inline-end: auto;
  }
</style>
