<script setup lang="ts">
import { ownName } from '@/state/credits';
import { GoAvatar } from '@constructor/ui/avatar';
import { GoDropdownMenuDivider, GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import StatusTag from '@/components/ui/StatusTag.vue';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { IconEllipsisVertical, IconPersonGear, IconSearch } from '@/components/icons';
import ImpersonateDialog from '@/components/shell/ImpersonateDialog.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import type { User } from '@/data/types';
import { fmtAgo, fmtCredits, percentOf } from '@/lib/format';
import { useSort } from '@/lib/useSort';
import { db, effectiveUserLicense, record, splitUsage, tenantById, unitById, tenantBase } from '@/state/db';
import { roleLabel, rolesOf } from '@/state/roles';
import { enterUser, session } from '@/state/session';

/**
 * Users of a tenant, or of one unit: search, filter by status, sort, and the
 * row actions an administrator needs. Shared by Users and the unit page so the
 * two lists behave the same.
 */
const props = withDefaults(defineProps<{ tenantId: string; users: User[]; showUnit?: boolean }>(), { showUnit: true });

const router = useRouter();
const { notify } = useNotificationsStore();
const tenantName = computed(() => tenantById(props.tenantId)?.name ?? '');

const query = ref('');
type Status = 'all' | User['status'];
const status = ref<Status>('all');
const matching = computed(() => {
  const q = query.value.trim().toLowerCase();
  return props.users.filter((u) => !q || `${u.name} ${u.email} ${u.title} ${unitById(u.unitId)?.name}`.toLowerCase().includes(q));
});
const filtered = computed(() => matching.value.filter((u) => status.value === 'all' || u.status === status.value));
const count = (s: Status) => matching.value.filter((u) => s === 'all' || u.status === s).length;

const sort = useSort(() => filtered.value, {
  name: (r) => r.name,
  unit: (r) => unitById(r.unitId)?.name,
  lic: (r) => effectiveUserLicense(r).license?.name,
  week: (r) => r.usage.weekly.cost,
  status: (r) => r.status,
  last: (r) => r.lastActive,
});
const STATUS = { active: 'success', invited: 'info', blocked: 'disabled' } as const;
const userLink = (u: User) => `${tenantBase(props.tenantId)}/users/${u.id}`;

function audit(action: string, target: string): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantName.value : undefined, action, target, tenantId: props.tenantId });
}

// ---- disable: every key of the user is refused within a minute (FR-B3.4)
function toggleUser(u: User): void {
  const disabling = u.status !== 'blocked';
  u.status = disabling ? 'blocked' : 'active';
  const revoked = disabling ? db.apiKeys.filter((k) => k.userId === u.id && k.status === 'active') : [];
  for (const k of revoked) k.status = 'revoked';
  audit(disabling ? `Disabled user; revoked ${revoked.length} keys` : 'Enabled user', `User: ${u.name}`);
  notify(disabling ? `${u.name} disabled.${revoked.length ? ` ${revoked.length} API ${revoked.length === 1 ? 'key' : 'keys'} revoked.` : ''}` : `${u.name} enabled.`, 'success');
}

// ---- impersonate
const target = ref<User | null>(null);
const impersonateOpen = ref(false);
function askImpersonate(u: User): void {
  target.value = u;
  impersonateOpen.value = true;
}
function impersonate(reason: string): void {
  const u = target.value;
  if (!u) return;
  audit(`Impersonation of user started (${reason})`, `User ${u.name}`);
  enterUser(props.tenantId, u.id, u.name, reason);
  notify(`You now see exactly what ${u.name} sees.`, 'warning', 'Impersonating a user');
  void router.push('/me/home');
}

defineExpose({ toggleUser, askImpersonate });
</script>

<template>
  <div class="user-table">
    <div class="toolbar">
      <GoInput v-model="query" size="m" placeholder="Search name, email, title or unit" clearable class="search">
        <template #prefix><IconSearch /></template>
      </GoInput>
      <GoSegmentButtonGroup v-model="status" size="s" aria-label="Status">
        <GoSegmentButton value="all">All {{ count('all') }}</GoSegmentButton>
        <GoSegmentButton value="active">Active {{ count('active') }}</GoSegmentButton>
        <GoSegmentButton value="invited">Invited {{ count('invited') }}</GoSegmentButton>
        <GoSegmentButton value="blocked">Disabled {{ count('blocked') }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sort" k="name">User</SortHeader>
          <SortHeader v-if="showUnit" :sort="sort" k="unit">Unit</SortHeader>
          <SortHeader :sort="sort" k="lic">License</SortHeader>
          <SortHeader :sort="sort" k="week">This week</SortHeader>
          <SortHeader :sort="sort" k="status">Status</SortHeader>
          <SortHeader :sort="sort" k="last">Last active</SortHeader>
          <GoTableCell width="56" />
        </GoTableRow>
        <GoTableRow v-for="u in sort.rows.value" :key="u.id">
          <GoTableCell>
            <div class="person">
              <GoAvatar :name="u.name" size="s" />
              <div>
                <GoTableName :is="RouterLink" :to="userLink(u)">{{ u.name }}</GoTableName>
                                <GoTag v-for="r in rolesOf(u)" :key="r" size="s" :color="r === 'tenant-admin' ? 'purple' : 'neutral'" class="role">{{ roleLabel(r) }}</GoTag>
                <span class="sub">{{ u.title }} · {{ u.email }}</span>
              </div>
            </div>
          </GoTableCell>
          <GoTableCell v-if="showUnit">{{ unitById(u.unitId)?.name }}</GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ effectiveUserLicense(u).license?.name ?? '—' }}</span>
            <span class="sub">{{ effectiveUserLicense(u).source === 'override' ? 'Personal override' : `Default of ${effectiveUserLicense(u).from?.name}` }}</span>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ fmtCredits(splitUsage(u, 'weekly').platform) }} platform</span>
            <span class="sub">{{ percentOf(splitUsage(u, 'weekly').platform, effectiveUserLicense(u).license?.limits.weekly.cost ?? 0) }}% of limit<template v-if="splitUsage(u, 'weekly').keys"> · {{ fmtCredits(splitUsage(u, 'weekly').keys) }} {{ ownName(tenantId) }} ({{ percentOf(splitUsage(u, 'weekly').keys, effectiveUserLicense(u).license?.keyLimits.weekly ?? 0) }}%)</template></span>
          </GoTableCell>
          <GoTableCell><StatusTag :variant="STATUS[u.status]" size="sm">{{ u.status === 'blocked' ? 'disabled' : u.status }}</StatusTag></GoTableCell>
          <GoTableCell>{{ fmtAgo(u.lastActive || null) }}</GoTableCell>
          <GoTableCell>
            <GoDropdownMenuPopover :expand-icon="false" aria-label="User actions" position="bottom-right">
              <template #icon><IconEllipsisVertical /></template>
              <GoDropdownMenuItem :disabled="u.status !== 'active'" @select="askImpersonate(u)">
                <template #icon><IconPersonGear /></template>
                Impersonate
                <template #description>{{ u.status === 'active' ? 'See exactly what they see' : 'Only active users' }}</template>
              </GoDropdownMenuItem>
              <GoDropdownMenuDivider />
              <GoDropdownMenuItem @select="router.push(userLink(u))">Open details</GoDropdownMenuItem>
              <GoDropdownMenuItem :danger="u.status !== 'blocked'" @select="toggleUser(u)">{{ u.status === 'blocked' ? 'Enable' : 'Disable' }}</GoDropdownMenuItem>
            </GoDropdownMenuPopover>
          </GoTableCell>
        </GoTableRow>
        <GoTableRow v-if="!sort.rows.value.length">
          <GoTableCell :colspan="7"><span class="sub">Nobody matches.</span></GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>


    <ImpersonateDialog
      v-if="target"
      v-model="impersonateOpen"
      :target="target.name"
      role="this user, with only their rights"
      scope="You will see what they see and can change only what they can — their API keys and personal settings."
      default-reason="SUP-4410 — reproduce the 429 the user reports"
      @confirm="impersonate"
    />
  </div>
</template>

<style scoped>
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

  .person {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .cell-main {
    display: block;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
