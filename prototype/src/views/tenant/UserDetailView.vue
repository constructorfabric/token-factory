<script setup lang="ts">
import { ownCredits, ownName } from '@/state/credits';
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoDropdownMenuDivider, GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import StatusTag from '@/components/ui/StatusTag.vue';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IconEllipsisVertical, IconPersonGear } from '@/components/icons';
import ImpersonateDialog from '@/components/shell/ImpersonateDialog.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import UsageBlock, { type Breakdown } from '@/components/ui/UsageBlock.vue';
import { myByModel, myDailySpend } from '@/data/mock';
import { fmtAgo, fmtCredits, fmtDate } from '@/lib/format';
import type { TenantRole } from '@/data/types';
import { db, effectiveUnitLicense, effectiveUserLicense, licenseById, record, splitUsage, tenantById, unitById, tenantBase } from '@/state/db';
import { USER_ROLE, roleLabel, rolesFor, rolesOf } from '@/state/roles';
import { enterUser, session } from '@/state/session';

const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId ?? 'root');
const user = computed(() => db.users.find((u) => u.id === route.params.userId));
const unit = computed(() => unitById(user.value?.unitId));
const seat = computed(() => (user.value ? effectiveUserLicense(user.value) : { license: undefined, source: 'unit' as const }));
const keys = computed(() => db.apiKeys.filter((k) => k.userId === user.value?.id));
const STATUS = { active: 'success', invited: 'info', blocked: 'disabled' } as const;

function audit(action: string): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantById(tenantId)?.name : undefined, action, target: `User: ${user.value?.name}`, tenantId });
}

// ---- license
const UNIT = '__unit';
const licenses = computed(() => db.licenses.filter((l) => l.tenantId === tenantId));
const draft = ref(UNIT);
watch(user, (u) => (draft.value = u?.licenseOverrideId ?? UNIT), { immediate: true });
const unitDefault = computed(() => effectiveUnitLicense(unit.value));
const chosen = computed(() => (draft.value === UNIT ? unitDefault.value.license : licenseById(draft.value)));
const changed = computed(() => (user.value?.licenseOverrideId ?? UNIT) !== draft.value);
function applyLicense(): void {
  const u = user.value;
  if (!u) return;
  u.licenseOverrideId = draft.value === UNIT ? undefined : draft.value;
  audit(`Set license to ${chosen.value?.name}${draft.value === UNIT ? ' (unit default)' : ' (personal)'}`);
  notify(`${u.name} now has ${chosen.value?.name}. It applies from their next request.`, 'success', 'License changed');
}

// ---- manager: the unit's manager, or the parent unit's when the user runs the unit
const manager = computed(() => {
  const u = user.value;
  let at = unit.value;
  while (at && at.manager === u?.name) at = unitById(at.parentId);
  return at?.manager;
});

// ---- roles: everyone is a user; roles add what they may manage
const roleDraft = ref<TenantRole[]>([]);
watch(user, (u) => (roleDraft.value = u ? [...rolesOf(u)] : []), { immediate: true });
const rolesChanged = computed(() => !!user.value && [...rolesOf(user.value)].sort().join() !== [...roleDraft.value].sort().join());
const admins = computed(() => db.users.filter((x) => x.tenantId === tenantId && x.status === 'active' && rolesOf(x).includes('tenant-admin')));
const lastAdmin = computed(() => !!user.value && rolesOf(user.value).includes('tenant-admin') && !roleDraft.value.includes('tenant-admin') && admins.value.length <= 1);
function applyRoles(): void {
  const u = user.value;
  if (!u || lastAdmin.value) return;
  u.roles = [...roleDraft.value];
  u.role = u.roles.includes('tenant-admin') ? 'tenant-admin' : 'user';
  audit(`Set roles: ${u.roles.length ? u.roles.map(roleLabel).join(', ') : 'user only'}`);
  notify(`${u.name} is now ${['User', ...u.roles.map(roleLabel)].join(', ')}. It applies from their next sign-in.`, 'success', 'Roles updated');
}

// ---- usage, scaled to this user
const share = computed(() => (user.value?.usage.monthly.cost ?? 0) / 588.9);
const daily = computed(() => myDailySpend.map((v) => v * share.value));
const breakdowns = computed<Breakdown[]>(() => [
  { title: 'By credit source', unit: 'credits', items: user.value ? [{ label: 'Platform credits', value: splitUsage(user.value, 'monthly').platform, hint: 'Platform models' }, { label: ownCredits(tenantId), value: splitUsage(user.value, 'monthly').keys, hint: 'Your keys and models' }] : [] },
  { title: 'By model', unit: 'credits', items: myByModel.filter((m) => (user.value && splitUsage(user.value, 'monthly').keys) || m.source === 'platform').map((m) => ({ ...m, value: m.value * share.value })) },
  ...(keys.value.some((k) => k.spend30d > 0) ? [{ title: 'By API key', unit: 'credits' as const, items: keys.value.filter((k) => k.spend30d > 0).map((k) => ({ label: k.name, value: k.spend30d, hint: k.prefix })) }] : []),
]);

// ---- actions
function toggleUser(): void {
  const u = user.value;
  if (!u) return;
  const disabling = u.status !== 'blocked';
  u.status = disabling ? 'blocked' : 'active';
  const revoked = disabling ? keys.value.filter((k) => k.status === 'active') : [];
  for (const k of revoked) k.status = 'revoked';
  audit(disabling ? `Disabled user; revoked ${revoked.length} keys` : 'Enabled user');
  notify(disabling ? `${u.name} disabled.${revoked.length ? ` ${revoked.length} API ${revoked.length === 1 ? 'key' : 'keys'} revoked.` : ''}` : `${u.name} enabled.`, 'success');
}
const impersonateOpen = ref(false);
function impersonate(reason: string): void {
  const u = user.value;
  if (!u) return;
  audit(`Impersonation of user started (${reason})`);
  enterUser(tenantId, u.id, u.name, reason);
  void router.push('/me/home');
}
</script>

<template>
  <div v-if="user">
    <PageHeader :title="user.name" back :description="`${user.title} · ${unit?.name ?? 'no unit'}`" @back="router.push(`${tenantBase(tenantId)}/users`)">
      <template #actions>
        <GoDropdownMenuPopover :expand-icon="false" aria-label="User actions" position="bottom-right">
          <template #icon><IconEllipsisVertical /></template>
          <GoDropdownMenuItem :disabled="user.status !== 'active'" @select="impersonateOpen = true">
            <template #icon><IconPersonGear /></template>
            Impersonate
          </GoDropdownMenuItem>
          <GoDropdownMenuDivider />
          <GoDropdownMenuItem :danger="user.status !== 'blocked'" @select="toggleUser">{{ user.status === 'blocked' ? 'Enable' : 'Disable' }}</GoDropdownMenuItem>
        </GoDropdownMenuPopover>
      </template>
    </PageHeader>

    <div class="grid">
      <Card title="Details">
        <GoDescriptionList>
          <GoDescriptionListItem><template #name>Email</template><template #value>{{ user.email }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Unit</template><template #value><RouterLink v-if="unit" :to="`${tenantBase(tenantId)}/organization/${unit.id}`" class="link">{{ unit.name }}</RouterLink></template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Manager</template><template #value>{{ manager ?? '—' }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Status</template><template #value><StatusTag :variant="STATUS[user.status]" size="sm">{{ user.status === 'blocked' ? 'disabled' : user.status }}</StatusTag></template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Last active</template><template #value>{{ fmtAgo(user.lastActive || null) }}</template></GoDescriptionListItem>
        </GoDescriptionList>
      </Card>

      <Card title="Roles" fill>
        <div class="roles">
          <GoCheckbox :model-value="true" disabled>{{ USER_ROLE.label }}<span class="sub">{{ USER_ROLE.description }}</span></GoCheckbox>
          <GoCheckbox v-for="r in rolesFor(tenantById(tenantId))" :key="r.id" v-model="roleDraft" :value="r.id">{{ r.label }}<span class="sub">{{ r.description }}</span></GoCheckbox>
        </div>
        <p v-if="lastAdmin" class="hint hint_warn">{{ user.name }} is the only customer admin. Make someone else admin first.</p>
        <div class="card-actions">
          <GoButton size="m" :disabled="!rolesChanged || lastAdmin" @click="applyRoles">Apply roles</GoButton>
        </div>
      </Card>

      <Card title="License" :subtitle="seat.source === 'override' ? 'Set for this user' : `Default of ${seat.from?.name ?? unit?.name}`" fill>
        <GoSelect v-model="draft" size="m" aria-label="License">
          <GoSelectOption :value="UNIT">
            Unit default
            <template #description>{{ unitDefault.license?.name ?? 'none' }} — from {{ unitDefault.from?.name ?? 'the unit' }}</template>
          </GoSelectOption>
          <GoSelectOption v-for="l in licenses" :key="l.id" :value="l.id">
            {{ l.name }}
            <template #description>{{ l.description }}</template>
          </GoSelectOption>
        </GoSelect>
        <p v-if="chosen" class="hint">{{ chosen.name }}: platform {{ fmtCredits(chosen.limits.daily.cost) }} a day, {{ chosen.rpm }} rpm<template v-if="chosen.keyLimits.daily"> · {{ ownName(tenantId) }} {{ fmtCredits(chosen.keyLimits.daily) }} a day, {{ chosen.keyRpm }} rpm</template> · {{ chosen.allowedModels.length }} models</p>
        <div class="card-actions">
          <GoButton size="m" :disabled="!changed" @click="applyLicense">Apply license</GoButton>
        </div>
      </Card>

      <Card title="API keys" :subtitle="`${keys.filter((k) => k.status === 'active').length} active`" flush>
        <GoTable size="sm">
          <GoTableRow v-for="k in keys" :key="k.id">
            <GoTableCell>{{ k.name }}<span class="sub">{{ k.prefix }}…</span></GoTableCell>
            <GoTableCell>{{ k.expiresAt ? `Expires ${fmtDate(k.expiresAt)}` : 'No expiry' }}</GoTableCell>
            <GoTableCell><StatusTag :variant="k.status === 'active' ? 'success' : 'disabled'" size="sm">{{ k.status }}</StatusTag></GoTableCell>
          </GoTableRow>
          <GoTableRow v-if="!keys.length"><GoTableCell><span class="sub">No keys.</span></GoTableCell></GoTableRow>
        </GoTable>
      </Card>
    </div>

    <UsageBlock hide-tokens :key-share="user.usage.monthly.cost ? splitUsage(user, 'monthly').keys / user.usage.monthly.cost : 0" :credits30d="user.usage.monthly.cost" :requests30d="Math.round(user.usage.monthly.cost * 24)" :tokens30d="user.usage.monthly.tokens" :cache-rate="62" :blended-per1-m="9.6" :daily="daily" activity-title="Activity" :breakdowns="breakdowns" class="usage" />

    <ImpersonateDialog v-model="impersonateOpen" :target="user.name" role="this user, with only their rights" scope="You will see what they see and can change only what they can." default-reason="SUP-4410 — reproduce the 429 the user reports" @confirm="impersonate" />
  </div>
</template>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    align-items: stretch;
  }

  .link {
    color: var(--acv-color-glyph-brand);
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }


  .roles {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .hint_warn {
    color: var(--acv-color-status-danger-strong);
  }

  .card-actions {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-regular);
  }

  .usage {
    margin-block-start: var(--acv-spacing-large);
  }
</style>
