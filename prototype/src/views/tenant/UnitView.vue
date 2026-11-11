<script setup lang="ts">
import { GoAvatar } from '@constructor/ui/avatar';
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import { GoTag } from '@constructor/ui/tag';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import UserTable from '@/components/tenant/UserTable.vue';
import UsageBlock, { type Breakdown } from '@/components/ui/UsageBlock.vue';
import { acmeByModel, acmeDaily, tenantKeyShare } from '@/data/mock';
import type { Unit } from '@/data/types';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { fmtInt } from '@/lib/format';
import { db, effectiveUnitLicense, licenseById, record, tenantById, unitById, tenantBase } from '@/state/db';
import { activePeopleSource } from '@/state/integrations';
import { session } from '@/state/session';

const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId ?? 'root');
const unit = computed(() => unitById(String(route.params.unitId)));
const source = computed(() => activePeopleSource(tenantId));
const tab = computed(() => (['users', 'settings'].includes(String(route.query.tab)) ? String(route.query.tab) : 'overview'));
const go = (t: string) => router.replace({ query: t === 'overview' ? {} : { tab: t } });

// ---- overview: the unit's usage in the same layout as a user's; mock scales the organization's
const ORG_USERS = 1240;
const ORG_SPEND = 63_980;
const WEIGHT: Record<string, number> = { 'un-eng': 3, 'un-product': 1.4, 'un-support': 0.7, 'un-finance': 0.5, 'un-sales': 0.35 };
const weight = (u?: Unit) => (u ? WEIGHT[u.id] ?? WEIGHT[u.parentId ?? ''] ?? 1.6 : 1);
const unitShare = computed(() => ((unit.value?.members ?? 0) / ORG_USERS) * weight(unit.value) * 0.62);
const unitSpend = computed(() => (unit.value?.kind === 'company' ? ORG_SPEND : ORG_SPEND * unitShare.value));
const unitDaily = computed(() => acmeDaily.map((v) => (v * unitSpend.value) / ORG_SPEND));
const keyShareUnit = computed(() => (effectiveUnitLicense(unit.value).license?.keyLimits.monthly ? (tenantKeyShare[tenantId] ?? 0) : 0));
const subUnits = computed(() => db.units.filter((u) => u.parentId === unit.value?.id));
const unitBreakdowns = computed<Breakdown[]>(() => [
  subUnits.value.length
    ? { title: 'By team', unit: 'credits', items: subUnits.value.map((u) => ({ label: u.name, value: (ORG_SPEND * (u.members / ORG_USERS) * weight(u) * 0.62), hint: `${u.members} users` })).sort((a, b) => b.value - a.value) }
    : { title: 'Top users', unit: 'credits', items: db.users.filter((x) => x.unitId === unit.value?.id).sort((a, b) => b.usage.monthly.cost - a.usage.monthly.cost).slice(0, 6).map((x) => ({ label: x.name, value: x.usage.monthly.cost, hint: x.title })) },
  { title: 'By model', unit: 'credits', items: acmeByModel.filter((m) => keyShareUnit.value || m.source === 'platform').map((m) => ({ ...m, value: (m.value * unitSpend.value) / ORG_SPEND })) },
]);

function audit(action: string): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantById(tenantId)?.name : undefined, action, target: `Unit: ${unit.value?.name}`, tenantId });
}

// ---- users
const withSubUnits = ref(false);
const unitIds = computed(() => {
  const ids = new Set<string>([unit.value?.id ?? '']);
  if (withSubUnits.value) {
    const walk = (id: string) => db.units.filter((u) => u.parentId === id).forEach((u) => { ids.add(u.id); walk(u.id); });
    walk(unit.value?.id ?? '');
  }
  return ids;
});
const members = computed(() => db.users.filter((u) => unitIds.value.has(u.unitId)));
const hasSubUnits = computed(() => db.units.some((u) => u.parentId === unit.value?.id));

const candidate = ref('');
const delegateOptions = computed(() => db.users.filter((u) => u.unitId === unit.value?.id && u.status === 'active' && !unit.value?.delegates?.includes(u.name)));
function addDelegate(): void {
  const u = unit.value;
  if (!u || !candidate.value) return;
  u.delegates = [...(u.delegates ?? []), candidate.value];
  audit(`Delegated management of ${u.name} to ${candidate.value}`);
  notify(`${candidate.value} can now manage licenses in ${u.name}.`, 'success');
  candidate.value = '';
}
function removeDelegate(name: string): void {
  const u = unit.value;
  if (!u) return;
  u.delegates = (u.delegates ?? []).filter((d) => d !== name);
  audit(`Removed ${name} as delegate of ${u.name}`);
}

// ---- settings: default user license
const INHERIT = '__inherit';
const licenses = computed(() => db.licenses.filter((l) => l.tenantId === tenantId));
const draft = ref(INHERIT);
watch(unit, (u) => (draft.value = u?.defaultLicenseId ?? INHERIT), { immediate: true });
const inherited = computed(() => effectiveUnitLicense(unitById(unit.value?.parentId)));
const effective = computed(() => effectiveUnitLicense(unit.value));
const changed = computed(() => (unit.value?.defaultLicenseId ?? INHERIT) !== draft.value);
const overrides = computed(() => db.users.filter((u) => u.unitId === unit.value?.id && u.licenseOverrideId).length);
const chosen = computed(() => (draft.value === INHERIT ? inherited.value.license : licenseById(draft.value)));

function apply(): void {
  const u = unit.value;
  if (!u) return;
  u.defaultLicenseId = draft.value === INHERIT ? null : draft.value;
  audit(`Set default license of ${u.name} to ${chosen.value?.name ?? 'none'}${draft.value === INHERIT ? ' (inherited)' : ''}`);
  notify(`${fmtInt(u.members)} users in ${u.name} now get ${chosen.value?.name}. Personal overrides are kept.`, 'success', 'Default license updated');
}
</script>

<template>
  <div v-if="unit">
    <PageHeader :title="unit.name" back :description="`${unit.kind === 'department' ? 'Department' : 'Team'} · ${fmtInt(unit.members)} users · from ${source?.name ?? 'the users source'}`" @back="router.push(`${tenantBase(tenantId)}/organization`)" />

    <GoTabs class="tabs">
      <GoTabsItem :active="tab === 'overview'" @click="go('overview')">Overview</GoTabsItem>
      <GoTabsItem :active="tab === 'users'" @click="go('users')">Users</GoTabsItem>
      <GoTabsItem :active="tab === 'settings'" @click="go('settings')">Settings</GoTabsItem>
    </GoTabs>

    <UsageBlock v-if="tab === 'overview'" hide-tokens :key-share="keyShareUnit" :credits30d="unitSpend" :requests30d="Math.round(unitSpend * 23)" :tokens30d="unitSpend * 116000" :cache-rate="60" :blended-per1-m="8.6" :daily="unitDaily" activity-title="Unit activity" :breakdowns="unitBreakdowns" />

    <template v-else-if="tab === 'users'">
      <Card title="Managers" subtitle="The manager comes from the users source; delegates are added here and may manage licenses in this unit">
        <ul class="managers">
          <li class="manager">
            <GoAvatar :name="unit.manager" size="s" />
            <span class="manager-name">{{ unit.manager }}</span>
            <GoTag size="s" color="blue">Unit manager · from {{ source?.name ?? 'users source' }}</GoTag>
          </li>
          <li v-for="d in unit.delegates ?? []" :key="d" class="manager">
            <GoAvatar :name="d" size="s" />
            <span class="manager-name">{{ d }}</span>
            <GoTag size="s" color="neutral">Delegated</GoTag>
            <GoButton variant="ghost" size="s" @click="removeDelegate(d)">Remove</GoButton>
          </li>
        </ul>
        <div class="add-delegate">
          <GoSelect v-model="candidate" size="m" placeholder="Choose a user" aria-label="Delegate" class="delegate-select">
            <GoSelectOption v-for="u in delegateOptions" :key="u.id" :value="u.name">{{ u.name }}<template #description>{{ u.title }}</template></GoSelectOption>
          </GoSelect>
          <GoButton variant="secondary" size="m" :disabled="!candidate" @click="addDelegate">Add delegate</GoButton>
        </div>
      </Card>

      <div class="people-head">
        <h2 class="people-title">Users</h2>
        <GoToggle v-if="hasSubUnits" v-model="withSubUnits" size="s">Include sub-units</GoToggle>
      </div>
      <UserTable :tenant-id="tenantId" :users="members" :show-unit="withSubUnits" />
    </template>

    <Card v-else title="Default user license" subtitle="Everyone in this unit, and in sub-units that do not set their own, gets this license" fill class="settings-card">
      <GoSelect v-model="draft" size="m" aria-label="Default license">
        <GoSelectOption :value="INHERIT">
          Inherit from {{ unitById(unit.parentId)?.name ?? 'the tenant' }}
          <template #description>Currently {{ inherited.license?.name ?? 'no license' }}</template>
        </GoSelectOption>
        <GoSelectOption v-for="l in licenses" :key="l.id" :value="l.id">
          {{ l.name }}
          <template #description>{{ fmtInt(l.holders) }} users · {{ l.description }}</template>
        </GoSelectOption>
      </GoSelect>
      <p class="hint">
        Effective now: <strong>{{ effective.license?.name ?? 'none' }}</strong><template v-if="effective.from && effective.from.id !== unit.id"> (inherited from {{ effective.from.name }})</template>.
        {{ overrides }} {{ overrides === 1 ? 'user has' : 'users have' }} a personal license and keep it.
      </p>
      <div class="card-actions">
        <GoButton size="m" :disabled="!changed" @click="apply">Apply to {{ fmtInt(unit.members) }} users</GoButton>
      </div>
    </Card>
  </div>
</template>

<style scoped>
  .tabs {
    margin-block-end: var(--acv-spacing-regular);
  }

  .managers {
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .manager {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .manager-name {
    @mixin acv-text-ui-body-2-medium;
  }

  .add-delegate {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-regular);
  }

  .delegate-select {
    min-inline-size: 280px;
  }

  .people-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: var(--acv-spacing-large) 0 var(--acv-spacing-small);
  }

  .people-title {
    @mixin acv-text-subheading-1;
    margin: 0;
  }

  .settings-card {
    max-inline-size: 720px;
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .seat-warning {
    margin-block-start: var(--acv-spacing-small);
  }

  .card-actions {
    display: flex;
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-regular);
  }
</style>
