<script setup lang="ts">
import { GoAvatar } from '@constructor/ui/avatar';
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { computed, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import StatusTag from '@/components/ui/StatusTag.vue';
import type { License, LicenseRequest } from '@/data/types';
import { fmtAgo, fmtContext, fmtCredits, fmtInt } from '@/lib/format';
import { useSort } from '@/lib/useSort';
import { ownCredits } from '@/state/credits';
import { approverFor, db, decideRequest, licenseById, modelById, record, tenantById, unitById, tenantBase } from '@/state/db';
import { session } from '@/state/session';

/**
 * Users asking for another license (REQ: license upgrade request). The manager
 * above them decides, or a license manager; approving gives the user that
 * license as a personal override, declining keeps theirs and says why.
 */
const route = useRoute();
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId ?? 'root');

type Filter = LicenseRequest['status'];
const filter = ref<Filter>('pending');
const all = computed(() => db.licenseRequests.filter((r) => r.tenantId === tenantId));
const count = (f: Filter) => all.value.filter((r) => r.status === f).length;
const userOf = (r: LicenseRequest) => db.users.find((u) => u.id === r.userId);
const rows = computed(() => all.value.filter((r) => r.status === filter.value));
const sort = useSort(() => rows.value, {
  person: (r) => userOf(r)?.name,
  to: (r) => licenseById(r.licenseId)?.name,
  at: (r) => r.at,
});

// ---- review: what changes for the user if approved
const reviewing = ref<LicenseRequest | null>(null);
const open = ref(false);
const note = ref('');
function review(r: LicenseRequest): void {
  reviewing.value = r;
  note.value = '';
  open.value = true;
}
const from = computed(() => licenseById(reviewing.value?.fromLicenseId));
const to = computed(() => licenseById(reviewing.value?.licenseId));
const gained = computed(() => (to.value?.allowedModels ?? []).filter((m) => !from.value?.allowedModels.includes(m)).map((m) => modelById(m)?.name));
const lost = computed(() => (from.value?.allowedModels ?? []).filter((m) => !to.value?.allowedModels.includes(m)).map((m) => modelById(m)?.name));
// Per credit type, as the license editor sets it: allowed, a day, requests a minute, max context.
type Budget = 'platform' | 'keys';
const allowed = (l: License | undefined, b: Budget) => !!l && (b === 'platform' ? l.platformAllowed : l.keyLimits.monthly > 0);
const cell = (l: License | undefined, b: Budget, what: 'daily' | 'rpm' | 'context') => {
  if (!allowed(l, b)) return 'Not allowed';
  if (what === 'daily') return fmtCredits(b === 'platform' ? l!.limits.daily.cost : l!.keyLimits.daily);
  if (what === 'rpm') return String(b === 'platform' ? l!.rpm : l!.keyRpm);
  return `${fmtContext(b === 'platform' ? l!.maxContext : l!.keyMaxContext)} tokens`;
};
const ROWS = [{ what: 'daily', label: 'A day' }, { what: 'rpm', label: 'Requests a minute' }, { what: 'context', label: 'Max context' }] as const;
const budgets = computed(() => [{ id: 'platform' as Budget, label: 'Platform credits' }, { id: 'keys' as Budget, label: ownCredits(tenantId) }]);

function decide(approve: boolean): void {
  const r = reviewing.value;
  const u = r ? userOf(r) : undefined;
  if (!r || !u) return;
  const me = session.current.value?.person ?? '';
  decideRequest(r, approve, me, note.value);
  record({ actor: me, actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantById(tenantId)?.name : undefined, action: `${approve ? 'Approved' : 'Declined'} license request: ${to.value?.name}${note.value ? ` (${note.value})` : ''}`, target: `User: ${u.name}`, tenantId });
  notify(approve ? `${u.name} now has ${to.value?.name} from their next request. They are notified.` : `${u.name} keeps ${from.value?.name ?? 'their license'}. They are notified with your note.`, 'success', approve ? 'Request approved' : 'Request declined');
  open.value = false;
}
</script>

<template>
  <div>
    <PageHeader title="License requests" description="Users asking for another license. The manager above the user decides, or a license manager." />

    <div class="toolbar">
      <GoSegmentButtonGroup v-model="filter" size="s" aria-label="Status">
        <GoSegmentButton value="pending">Pending {{ count('pending') }}</GoSegmentButton>
        <GoSegmentButton value="approved">Approved {{ count('approved') }}</GoSegmentButton>
        <GoSegmentButton value="declined">Declined {{ count('declined') }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sort" k="user">User</SortHeader>
          <GoTableCell>Change</GoTableCell>
          <GoTableCell>Reason</GoTableCell>
          <SortHeader :sort="sort" k="at">Asked</SortHeader>
          <GoTableCell>{{ filter === 'pending' ? 'Decides' : 'Decided by' }}</GoTableCell>
          <GoTableCell width="110" />
        </GoTableRow>
        <GoTableRow v-for="r in sort.rows.value" :key="r.id">
          <GoTableCell>
            <div class="person">
              <GoAvatar :name="userOf(r)?.name" size="s" />
              <div>
                <GoTableName :is="RouterLink" :to="`${tenantBase(tenantId)}/users/${r.userId}`">{{ userOf(r)?.name }}</GoTableName>
                <span class="sub">{{ unitById(userOf(r)?.unitId)?.name }}</span>
              </div>
            </div>
          </GoTableCell>
          <GoTableCell>
            <span class="cell-main">{{ licenseById(r.licenseId)?.name }}</span>
            <span class="sub">from {{ licenseById(r.fromLicenseId)?.name ?? 'none' }}</span>
          </GoTableCell>
          <GoTableCell><span class="reason">{{ r.reason }}</span><span v-if="r.note" class="sub">Note: {{ r.note }}</span></GoTableCell>
          <GoTableCell>{{ fmtAgo(r.at) }}</GoTableCell>
          <GoTableCell>
            <template v-if="r.status === 'pending'">{{ userOf(r) ? approverFor(userOf(r)!) : '—' }}</template>
            <template v-else>
              <StatusTag :variant="r.status === 'approved' ? 'success' : 'error'">{{ r.status }}</StatusTag>
              <span class="sub">{{ r.decidedBy }} · {{ fmtAgo(r.decidedAt ?? null) }}</span>
            </template>
          </GoTableCell>
          <GoTableCell>
            <GoButton v-if="r.status === 'pending'" variant="secondary" size="s" @click="review(r)">Review</GoButton>
          </GoTableCell>
        </GoTableRow>
        <GoTableRow v-if="!sort.rows.value.length">
          <GoTableCell :colspan="6"><span class="sub">{{ filter === 'pending' ? 'Nothing waiting.' : `No ${filter} requests.` }}</span></GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>

    <GoDialog v-model="open" size="m">
      <GoDialogWindow v-if="reviewing" :title="`${userOf(reviewing)?.name} asks for ${to?.name}`" header-border @close="open = false">
        <div class="fields">
          <p class="quote">“{{ reviewing.reason }}”</p>
          <GoTable size="sm">
            <GoTableRow header>
              <GoTableCell />
              <GoTableCell>Now: {{ from?.name ?? 'none' }}</GoTableCell>
              <GoTableCell>Asked: {{ to?.name }}</GoTableCell>
            </GoTableRow>
            <template v-for="b in budgets" :key="b.id">
              <GoTableRow>
                <GoTableCell :colspan="3"><span class="group">{{ b.label }}</span></GoTableCell>
              </GoTableRow>
              <template v-if="allowed(from, b.id) || allowed(to, b.id)">
                <GoTableRow v-for="r in ROWS" :key="r.what">
                  <GoTableCell>{{ r.label }}</GoTableCell>
                  <GoTableCell class="nowrap">{{ cell(from, b.id, r.what) }}</GoTableCell>
                  <GoTableCell class="nowrap">{{ cell(to, b.id, r.what) }}</GoTableCell>
                </GoTableRow>
              </template>
              <GoTableRow v-else>
                <GoTableCell />
                <GoTableCell>Not allowed</GoTableCell>
                <GoTableCell>Not allowed</GoTableCell>
              </GoTableRow>
            </template>
            <GoTableRow>
              <GoTableCell>Models</GoTableCell>
              <GoTableCell>{{ from?.allowedModels.length ?? 0 }}</GoTableCell>
              <GoTableCell>{{ to?.allowedModels.length }}</GoTableCell>
            </GoTableRow>
          </GoTable>
          <p v-if="gained.length" class="hint">Gains {{ gained.join(', ') }}.</p>
          <p v-if="lost.length" class="hint">Loses {{ lost.join(', ') }}.</p>
          <p class="hint">Approving sets {{ to?.name }} for this user only; their unit default stays. {{ fmtInt(to?.holders ?? 0) }} users hold it today.</p>
          <GoFormControl label="Note to the user" label-for="req-note" optional hint="Sent with the decision. Say why when you decline.">
            <GoInput id="req-note" v-model="note" type="textarea" size="m" />
          </GoFormControl>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="danger" size="m" @click="decide(false)">Decline</GoButton>
            <span class="spacer" />
            <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
            <GoButton size="m" @click="decide(true)">Approve</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .toolbar {
    margin-block-end: var(--acv-spacing-regular);
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow-x: auto;
  }

  .person {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .cell-main {
    display: block;
  }

  .reason {
    display: block;
    max-inline-size: 360px;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .group {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .nowrap {
    white-space: nowrap;
  }

  .quote {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    margin: calc(-1 * var(--acv-spacing-x-small)) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .footer {
    display: flex;
    gap: var(--acv-spacing-x-small);
  }

  .spacer {
    flex: 1;
  }
</style>
