<script setup lang="ts">
import TenantLicenseSummary from '@/components/root/TenantLicenseSummary.vue';
import { licenseOfTenant, licensesOfferedBy, tenantLicenseById } from '@/state/tenantLicenses';
import { canCreateTenants } from '@/state/roles';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoDropdownMenuDivider, GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { useNotificationsStore } from '@constructor/ui/notification';
import StatusTag from '@/components/ui/StatusTag.vue';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { IconEllipsisVertical, IconPersonGear, IconPlus, IconSearch } from '@/components/icons';
import ImpersonateDialog from '@/components/shell/ImpersonateDialog.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatTile from '@/components/ui/StatTile.vue';
import type { Tenant } from '@/data/types';
import { CREDITS_PER_USD, fmtCompact, fmtCredits, fmtInt, percentOf } from '@/lib/format';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { GoToggle } from '@constructor/ui/toggle';
import { db, record, tenantById } from '@/state/db';
import { enterTenant } from '@/state/session';

const router = useRouter();
const { notify } = useNotificationsStore();

const query = ref('');

// ---- create: name, description, where it sits, and who administers it
const createOpen = ref(false);
// The first tenant admin is invited by email and sets the tenant up on first sign-in.
const draft = reactive({ name: '', description: '', parentId: 'root', firstName: '', lastName: '', email: '', seats: 50, credits: 100_000, end: '2027-11-30', typeId: 'tl-enterprise' });
const parents = computed(() => db.tenants.filter((t) => t.tier === 'root' || canCreateTenants(t)));
// The license list follows the parent: the instance's licenses, or the partner's own.
const offered = computed(() => licensesOfferedBy(draft.parentId));
const draftLicense = computed(() => tenantLicenseById(draft.typeId));
watch(() => draft.parentId, () => {
  if (!offered.value.some((l) => l.id === draft.typeId)) draft.typeId = offered.value[0]?.id ?? '';
});
const adminName = computed(() => `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim());
const adminOk = computed(() => !!draft.firstName.trim() && !!draft.lastName.trim() && /.+@.+\..+/.test(draft.email));
const canCreate = computed(() => !!draft.name.trim() && !!draft.typeId && adminOk.value && draft.seats > 0 && /^\d{4}-\d{2}-\d{2}$/.test(draft.end));
function openCreate(): void {
  Object.assign(draft, { name: '', description: '', parentId: 'root', firstName: '', lastName: '', email: '', seats: 50, credits: 100_000, end: '2027-11-30', typeId: 'tl-enterprise' });
  createOpen.value = true;
}
function create(): void {
  if (!canCreate.value) return;
  const id = `t-${draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-3)}`;
  const parent = db.tenants.find((t) => t.id === draft.parentId);
  db.tenants.push({
    id, name: draft.name.trim(), description: draft.description.trim() || undefined, parentId: draft.parentId, tier: tenantLicenseById(draft.typeId)?.createTenants ? 'partner' : 'customer', status: 'provisioning', deployment: 'shared', region: parent?.region ?? 'EU (Frankfurt)',
    users: 0, seats: draft.seats, units: 0, spend30d: 0, budget30d: draft.credits / CREDITS_PER_USD, licenseEnd: draft.end, licenseTypeId: draft.typeId, tokens30d: 0, models: 0, byok: false, createdAt: new Date().toISOString().slice(0, 10), admin: adminName.value, plan: 'Team', setupDone: false,
  });
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Created tenant ${draft.name.trim()} with administrator ${adminName.value}; license ${tenantLicenseById(draft.typeId)?.name}, ${draft.seats} seats, ${fmtInt(draft.credits)} platform credits a month until ${draft.end}`, target: draft.name.trim(), tenantId: id });
  notify(`${adminName.value} gets an invitation at ${draft.email} and is guided through setup on first sign-in.`, 'success', `${draft.name.trim()} created`);
  createOpen.value = false;
}

/** Partners first, then their customers beneath them: the tiers stay visible. */
const rows = computed(() => {
  const all = db.tenants.filter((t) => t.tier !== 'root');
  const q = query.value.trim().toLowerCase();
  const matches = (t: Tenant) => !q || t.name.toLowerCase().includes(q) || t.admin.toLowerCase().includes(q);
  const out: { tenant: Tenant; depth: number }[] = [];
  const walk = (parent: string, depth: number) => {
    for (const t of all.filter((x) => x.parentId === parent)) {
      const childMatch = all.some((c) => c.parentId === t.id && matches(c));
      if (matches(t) || childMatch) out.push({ tenant: t, depth });
      walk(t.id, depth + 1);
    }
  };
  walk('root', 0);
  return out;
});

const totals = computed(() => {
  const list = db.tenants.filter((t) => t.tier !== 'root');
  return {
    tenants: list.length,
    partners: list.filter((t) => t.tier === 'partner').length,
    users: list.reduce((s, t) => s + t.users, 0),
    spend: list.reduce((s, t) => s + t.spend30d, 0),
    overBudget: list.filter((t) => t.budget30d && t.spend30d > t.budget30d).length,
  };
});

const statusVariant = (s: Tenant['status']) => (s === 'active' ? 'success' : s === 'provisioning' ? 'info' : 'disabled');
const DEPLOYMENT: Record<Tenant['deployment'], string> = { shared: 'Shared', dedicated: 'Dedicated data plane', 'self-hosted': 'Customer-hosted' };

const target = ref<Tenant | null>(null);
const dialogOpen = ref(false);

function askImpersonate(t: Tenant): void {
  target.value = t;
  dialogOpen.value = true;
}

function impersonate(reason: string): void {
  const t = target.value;
  if (!t) return;
  record({ actor: 'Victor Batraev', actorRole: 'Service Engineer', onBehalfOf: t.name, action: `Impersonation started (${reason})`, target: `Tenant ${t.name}`, tenantId: t.id });
  enterTenant(t.id, reason);
  notify(`You are now inside ${t.name} as Service Engineer.`, 'warning', 'Impersonation started');
  void router.push(`/t/${t.id}/overview`);
}

function suspend(t: Tenant): void {
  t.status = t.status === 'suspended' ? 'active' : 'suspended';
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: t.status === 'suspended' ? 'Suspended tenant' : 'Reactivated tenant', target: t.name, tenantId: t.id });
  notify(`${t.name} ${t.status === 'suspended' ? 'suspended' : 'reactivated'}.`, 'success');
}

const sTen = useSort(() => rows.value, { name: (r) => r.tenant.name, tier: (r) => r.tenant.tier, status: (r) => r.tenant.status, dep: (r) => r.tenant.deployment, seats: (r) => r.tenant.users, spend: (r) => r.tenant.spend30d, tokens: (r) => r.tenant.tokens30d });
</script>

<template>
  <div>
    <PageHeader title="Tenants" description="Every organization on this instance, by tier; each is isolated from the others.">
      <template #actions>
        <GoButton size="m" @click="openCreate">
          <template #icon><IconPlus /></template>
          Create tenant
        </GoButton>
      </template>
    </PageHeader>

    <div class="tiles">
      <StatTile label="Tenants" :value="String(totals.tenants)" :hint="`${totals.partners} partner · ${totals.tenants - totals.partners} customer`" />
      <StatTile label="Users" :value="fmtInt(totals.users)" hint="Across all tenants" />
      <StatTile label="AI credits, last 30 days" :value="fmtCredits(totals.spend)" hint="All tenants" />
      <StatTile label="Over budget" :value="String(totals.overBudget)" :tone="totals.overBudget ? 'warn' : 'good'" :hint="totals.overBudget ? 'Requests throttled by policy' : 'All within budget'" />
    </div>

    <div class="toolbar">
      <GoInput v-model="query" size="m" placeholder="Search tenants or administrators" clearable class="search">
        <template #prefix><IconSearch /></template>
      </GoInput>
    </div>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sTen" k="name">Tenant</SortHeader>
          <SortHeader :sort="sTen" k="tier">Tier</SortHeader>
          <SortHeader :sort="sTen" k="status">Status</SortHeader>
          <SortHeader :sort="sTen" k="dep">Deployment · region</SortHeader>
          <SortHeader :sort="sTen" k="seats">Seats</SortHeader>
          <SortHeader :sort="sTen" k="spend">Credits 30d</SortHeader>
          <SortHeader :sort="sTen" k="tokens">Tokens 30d</SortHeader>
          <GoTableCell width="56" />
        </GoTableRow>
        <GoTableRow v-for="{ tenant: t, depth } in sTen.rows.value" :key="t.id">
          <GoTableCell>
            <div class="name" :class="`name_depth_${sTen.key.value ? 0 : depth}`">
              <GoTableName :is="RouterLink" :to="`/root/tenants/${t.id}`">{{ t.name }}</GoTableName>
              <span class="sub">{{ licenseOfTenant(t)?.name ?? 'No license' }} · Admin: {{ t.admin }}</span>
            </div>
          </GoTableCell>
          <GoTableCell>
            <GoTag size="s" :color="t.tier === 'partner' ? 'purple' : 'neutral'">{{ t.tier === 'partner' ? 'Partner' : 'Customer' }}</GoTag>
          </GoTableCell>
          <GoTableCell><StatusTag :variant="statusVariant(t.status)" size="sm">{{ t.status }}</StatusTag></GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ DEPLOYMENT[t.deployment] }}</span>
            <span class="sub">{{ t.region }}</span>
          </GoTableCell>
          <GoTableCell>{{ fmtInt(t.users) }} / {{ fmtInt(t.seats) }}</GoTableCell>
          <GoTableCell>
            <span class="cell-main" :class="{ over: t.budget30d > 0 && t.spend30d > t.budget30d }">{{ fmtCredits(t.spend30d) }}</span>
            <span class="sub">{{ percentOf(t.spend30d, t.budget30d) }}% of {{ fmtCredits(t.budget30d) }}</span>
          </GoTableCell>
          <GoTableCell>{{ fmtCompact(t.tokens30d) }}</GoTableCell>
          <GoTableCell>
            <div class="row-actions">
              <GoDropdownMenuPopover :expand-icon="false" aria-label="Tenant actions" position="bottom-right">
                <template #icon><IconEllipsisVertical /></template>
                <GoDropdownMenuItem @select="askImpersonate(t)">
                  <template #icon><IconPersonGear /></template>
                  Impersonate
                  <template #description>{{ t.setupDone === false ? 'Set it up as Service Engineer' : 'Act inside as Service Engineer' }}</template>
                </GoDropdownMenuItem>
                <GoDropdownMenuDivider />
                <GoDropdownMenuItem @select="router.push(`/root/tenants/${t.id}`)">Open details</GoDropdownMenuItem>
                <GoDropdownMenuDivider />
                <GoDropdownMenuItem :danger="t.status !== 'suspended'" @select="suspend(t)">{{ t.status === 'suspended' ? 'Reactivate' : 'Suspend' }}</GoDropdownMenuItem>
              </GoDropdownMenuPopover>
            </div>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>

    <GoDialog v-model="createOpen" size="m">
      <GoDialogWindow title="Create tenant" header-border @close="createOpen = false">
        <div class="fields">
          <GoFormControl label="Name" label-for="ct-name" required>
            <GoInput id="ct-name" v-model="draft.name" size="m" placeholder="Wayne Enterprises" />
          </GoFormControl>
          <GoFormControl label="Description" label-for="ct-desc" optional>
            <GoInput id="ct-desc" v-model="draft.description" type="textarea" size="m" placeholder="What the organization does and why it uses Token Factory" />
          </GoFormControl>
          <GoFormControl label="Parent">
              <GoSelect v-model="draft.parentId" size="m" aria-label="Parent">
                <GoSelectOption v-for="t in parents" :key="t.id" :value="t.id">{{ t.tier === 'root' ? `${t.name} (directly)` : t.name }}</GoSelectOption>
              </GoSelect>
            </GoFormControl>
          <div class="admin">
            <span class="admin-title">Organization license</span>
            <span class="admin-hint">What the tenant may hand out to its users. You can change it later on the tenant’s page.</span>
          </div>
          <GoFormControl label="License" :hint="draft.parentId === 'root' ? 'Defined under Settings → Tenant licenses' : `Licenses offered by ${tenantById(draft.parentId)?.name}`">
            <GoSelect v-model="draft.typeId" size="m" aria-label="License">
              <GoSelectOption v-for="l in offered" :key="l.id" :value="l.id">{{ l.name }}<template #description>{{ l.description }}</template></GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <TenantLicenseSummary v-if="draftLicense" :license="draftLicense" />
          <div class="three">
            <GoFormControl label="Seats" label-for="ct-seats" required><GoInputNumber id="ct-seats" v-model="draft.seats" :min="1" :step="10" size="m" /></GoFormControl>
            <GoFormControl label="Platform credits a month" label-for="ct-credits"><GoInputNumber id="ct-credits" v-model="draft.credits" :min="0" :step="10000" size="m" /></GoFormControl>
            <GoFormControl label="Valid until" label-for="ct-end" hint="YYYY-MM-DD"><GoInput id="ct-end" v-model="draft.end" size="m" /></GoFormControl>
          </div>
          <div class="admin">
            <span class="admin-title">Tenant admin</span>
            <span class="admin-hint">We email them an invitation; on first sign-in they set the organization up and can add more admins.</span>
          </div>
          <div class="two">
            <GoFormControl label="First name" label-for="ct-first" required><GoInput id="ct-first" v-model="draft.firstName" size="m" /></GoFormControl>
            <GoFormControl label="Last name" label-for="ct-last" required><GoInput id="ct-last" v-model="draft.lastName" size="m" /></GoFormControl>
          </div>
          <GoFormControl label="Work email" label-for="ct-email" required><GoInput id="ct-email" v-model="draft.email" size="m" placeholder="name@company.com" /></GoFormControl>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="createOpen = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!canCreate" @click="create">Create tenant</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>

    <ImpersonateDialog
      v-if="target"
      v-model="dialogOpen"
      :target="target.name"
      role="Service Engineer with full access to this tenant"
      scope="You will see and change everything the tenant's administrators can: users, organization units, licenses, models, keys and reports."
      default-reason="SUP-4410 — Payments team cannot reach coding-default"
      @confirm="impersonate"
    />
  </div>
</template>

<style scoped>
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-large);
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .search {
    max-inline-size: 360px;
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow: visible;
  }

  .name {
    display: flex;
    flex-direction: column;

    &.name_depth_1 {
      padding-inline-start: var(--acv-spacing-large);
      border-inline-start: 2px solid var(--acv-color-border-light);
    }
  }

  .cell-main {
    display: block;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .over {
    color: var(--acv-color-status-danger-strong);
  }

  .row-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-xx-small);
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

  .three {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .admin {
    display: grid;
    gap: 2px;
    padding-block-start: var(--acv-spacing-x-small);
    border-block-start: var(--acv-border-light);
  }

  .admin-title {
    @mixin acv-text-ui-body-2-medium;
  }

  .admin-hint {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
