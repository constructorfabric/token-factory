<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconEllipsisVertical } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import StatusTag from '@/components/ui/StatusTag.vue';
import UsageBlock, { type Breakdown } from '@/components/ui/UsageBlock.vue';
import { acmeByModel, acmeDaily, tenantKeyShare } from '@/data/mock';
import { CREDITS_PER_USD, fmtCredits, fmtDate, fmtInt, toCredits } from '@/lib/format';
import { ownCredits } from '@/state/credits';
import { record, tenantById } from '@/state/db';
import TenantLicenseSummary from '@/components/root/TenantLicenseSummary.vue';
import { licenseOfTenant, licensesOfferedBy, tenantLicenseById } from '@/state/tenantLicenses';

/**
 * One tenant, as the instance admin sees it: who it is, how it uses the
 * platform (the same usage layout as a user's), and its organization license.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tenant = computed(() => tenantById(String(route.params.id)));
const parent = computed(() => tenantById(tenant.value?.parentId ?? undefined));

function audit(action: string): void {
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action, target: tenant.value?.name ?? '', tenantId: tenant.value?.id ?? 'root' });
}

// ---- usage, in the user usage layout, scaled to this tenant
const ACME_SPEND = 63_980;
const scale = computed(() => (tenant.value?.spend30d ?? 0) / ACME_SPEND);
const keyShare = computed(() => (tenant.value ? tenantKeyShare[tenant.value.id] ?? (tenant.value.byok ? 0.25 : 0) : 0));
const daily = computed(() => acmeDaily.map((v) => v * scale.value));
const breakdowns = computed<Breakdown[]>(() => [
  { title: 'By credit source', unit: 'credits', items: keyShare.value ? [{ label: 'Platform credits', value: (tenant.value?.spend30d ?? 0) * (1 - keyShare.value), hint: 'From its organization license' }, { label: ownCredits(tenant.value?.id), value: (tenant.value?.spend30d ?? 0) * keyShare.value, hint: 'Its own keys' }] : [{ label: 'Platform credits', value: tenant.value?.spend30d ?? 0, hint: 'From its organization license' }] },
  { title: 'By model', unit: 'credits', items: acmeByModel.filter((m) => keyShare.value || m.source === 'platform').map((m) => ({ ...m, value: m.value * scale.value })) },
]);

// ---- organization license
const lic = reactive({ seats: 0, credits: 0, end: '', typeId: '' });
// Licenses come from whoever the tenant sits under: the instance, or its partner.
const offered = computed(() => licensesOfferedBy(tenant.value?.parentId ?? 'root'));
const picked = computed(() => tenantLicenseById(lic.typeId));
function load(): void {
  const t = tenant.value;
  if (!t) return;
  Object.assign(lic, { seats: t.seats, credits: toCredits(t.budget30d), end: t.licenseEnd ?? '2027-03-31', typeId: licenseOfTenant(t)?.id ?? '' });
}
watch(tenant, load, { immediate: true });
const changed = computed(() => {
  const t = tenant.value;
  return !!t && (lic.seats !== t.seats || lic.credits !== toCredits(t.budget30d) || lic.end !== (t.licenseEnd ?? '2027-03-31') || lic.typeId !== (licenseOfTenant(t)?.id ?? ''));
});
const seatsLow = computed(() => !!tenant.value && lic.seats < tenant.value.users);
function apply(): void {
  const t = tenant.value;
  if (!t || seatsLow.value) return;
  Object.assign(t, { seats: lic.seats, budget30d: lic.credits / CREDITS_PER_USD, licenseEnd: lic.end, licenseTypeId: lic.typeId });
  audit(`Changed organization license: ${picked.value?.name ?? 'no license'}, ${lic.seats} seats, ${fmtInt(lic.credits)} platform credits a month, until ${lic.end}`);
  notify(`${t.name}'s administrators see the new license right away.`, 'success', 'License updated');
}

function suspend(): void {
  const t = tenant.value;
  if (!t) return;
  t.status = t.status === 'suspended' ? 'active' : 'suspended';
  audit(t.status === 'suspended' ? 'Suspended tenant — all keys refused' : 'Reactivated tenant');
  notify(t.status === 'suspended' ? 'Suspended. Every key of this tenant is refused within a minute.' : 'Reactivated.', 'success');
}
const STATUS = { active: 'success', provisioning: 'info', suspended: 'disabled' } as const;
</script>

<template>
  <div v-if="tenant">
    <PageHeader :title="tenant.name" back @back="router.push('/root/tenants')">
      <template #actions>
        <GoDropdownMenuPopover :expand-icon="false" aria-label="Tenant actions" position="bottom-right">
          <template #icon><IconEllipsisVertical /></template>
          <GoDropdownMenuItem :danger="tenant.status !== 'suspended'" @select="suspend">{{ tenant.status === 'suspended' ? 'Reactivate' : 'Suspend' }}</GoDropdownMenuItem>
        </GoDropdownMenuPopover>
      </template>
    </PageHeader>

    <div class="grid">
      <Card title="Details" fill>
        <GoDescriptionList>
          <GoDescriptionListItem><template #name>Status</template><template #value><StatusTag :variant="STATUS[tenant.status]">{{ tenant.setupDone === false ? 'being set up' : tenant.status }}</StatusTag></template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Description</template><template #value>{{ tenant.description ?? '—' }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Users</template><template #value>{{ fmtInt(tenant.users) }} in {{ tenant.units }} units</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Created</template><template #value>{{ fmtDate(tenant.createdAt) }}</template></GoDescriptionListItem>
        </GoDescriptionList>
      </Card>

      <Card title="Organization license" subtitle="What this tenant may hand out to its users" fill>
        <div class="fields">
          <GoFormControl label="License" :hint="tenant.parentId && tenant.parentId !== 'root' ? `Licenses offered by ${parent?.name}` : 'Defined under Settings → Tenant licenses'">
            <GoSelect v-model="lic.typeId" size="m" aria-label="License">
              <GoSelectOption v-for="l in offered" :key="l.id" :value="l.id">{{ l.name }}<template #description>{{ l.description }}</template></GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <TenantLicenseSummary v-if="picked" :license="picked" />
          <GoFormControl label="Valid until" label-for="td-end" hint="YYYY-MM-DD">
              <GoInput id="td-end" v-model="lic.end" size="m" placeholder="2027-03-31" />
            </GoFormControl>
          <div class="two">
            <GoFormControl label="Seats" label-for="td-seats" :hint="`${fmtInt(tenant.users)} taken`">
              <GoInputNumber id="td-seats" v-model="lic.seats" :min="0" :step="10" size="m" />
            </GoFormControl>
            <GoFormControl label="Platform credits a month" label-for="td-credits" :hint="`${fmtCredits(tenant.spend30d)} used in the last 30 days`">
              <GoInputNumber id="td-credits" v-model="lic.credits" :min="0" :step="10000" size="m" />
            </GoFormControl>
          </div>
          <p v-if="seatsLow" class="hint hint_warn">{{ fmtInt(tenant.users) }} users already hold seats; free some before lowering below that.</p>
        </div>
        <div class="card-actions"><GoButton size="m" :disabled="!changed || seatsLow" @click="apply">Apply license</GoButton></div>
      </Card>
    </div>

    <UsageBlock hide-tokens :key-share="keyShare" :credits30d="tenant.spend30d" :requests30d="Math.round(tenant.spend30d * 23)" :tokens30d="tenant.tokens30d" :cache-rate="61" :blended-per1-m="8.6" :daily="daily" activity-title="Activity" :breakdowns="breakdowns" class="usage" />
  </div>
</template>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    align-items: stretch;
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

  .hint {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-secondary);

    &.hint_warn {
      color: var(--acv-color-status-danger-strong);
    }
  }

  .card-actions {
    display: flex;
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-regular);
  }

  .usage {
    margin-block-start: var(--acv-spacing-large);
  }
</style>
