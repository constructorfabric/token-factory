<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref } from 'vue';
import Card from '@/components/ui/Card.vue';
import { fmtDateTime } from '@/lib/format';
import { db, record, tenantById } from '@/state/db';
import { session } from '@/state/session';

/**
 * How Constructor support may enter this organization. Read-only access (look,
 * change nothing) and full access (act as a Service Engineer) are decided
 * separately: always allowed, only after an admin approves, or never.
 */
const props = defineProps<{ tenantId: string }>();
const { notify } = useNotificationsStore();
const tenant = computed(() => tenantById(props.tenantId));

type Policy = 'allowed' | 'approval' | 'never';
const POLICY: { id: Policy; label: string }[] = [
  { id: 'allowed', label: 'Allowed' },
  { id: 'approval', label: 'After admin approval' },
  { id: 'never', label: 'Not allowed' },
];
// Make a ref, not a reactive object: see the note in NotificationSettings.
const access = ref({
  readonly: { policy: 'allowed' as Policy, minutes: 60 },
  full: { policy: 'approval' as Policy, minutes: 30 },
  notify: true,
  ticket: true,
});
const sessions = computed(() => db.audit.filter((e) => e.tenantId === props.tenantId && /Impersonation/.test(e.action)).slice(0, 5));

const MEANING: Record<'readonly' | 'full', string> = {
  readonly: 'Support sees what your admins see — users, licenses, usage, settings — and changes nothing.',
  full: 'Support acts as a Service Engineer and can change settings, licenses and keys. Every action is in your audit log.',
};

function save(): void {
  const a = access.value;
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenant.value?.name : undefined, action: `Support access: read-only ${a.readonly.policy}, full ${a.full.policy}`, target: 'Support access', tenantId: props.tenantId });
  notify('Constructor support follows these rules from the next session.', 'success', 'Support access saved');
}
</script>

<template>
  <div class="support">
    <div class="pair">
      <Card v-for="kind in (['readonly', 'full'] as const)" :key="kind" :title="kind === 'readonly' ? 'Read-only access' : 'Full access'" :subtitle="MEANING[kind]" fill>
        <div class="fields">
          <GoSegmentButtonGroup v-model="access[kind].policy" size="s" :aria-label="kind === 'readonly' ? 'Read-only access' : 'Full access'" wide>
            <GoSegmentButton v-for="p in POLICY" :key="p.id" :value="p.id">{{ p.label }}</GoSegmentButton>
          </GoSegmentButtonGroup>
          <p class="sub">
            {{ access[kind].policy === 'allowed' ? 'Support can start a session with a reason or ticket.' : access[kind].policy === 'approval' ? 'A customer admin approves each session before it starts.' : 'Support cannot enter this way; they can only ask your admins.' }}
          </p>
          <GoFormControl v-if="access[kind].policy !== 'never'" label="Session ends after, minutes" :label-for="`sa-${kind}`">
            <GoInputNumber :id="`sa-${kind}`" v-model="access[kind].minutes" :min="15" :max="240" :step="15" size="m" />
          </GoFormControl>
        </div>
      </Card>
    </div>

    <Card title="Every session" subtitle="Applies to both kinds of access" class="spaced">
      <div class="fields">
        <GoToggle v-model="access.ticket">Require a support ticket number</GoToggle>
        <GoToggle v-model="access.notify">Email customer admins when a session starts and ends</GoToggle>
        <p class="sub">Always: a banner shows support is inside, and every action is recorded as the engineer on behalf of {{ tenant?.name }}.</p>
      </div>
      <div class="card-actions"><GoButton size="m" @click="save">Save support access</GoButton></div>
    </Card>

    <Card title="Recent support sessions" flush class="spaced">
      <GoTable size="sm">
        <GoTableRow v-for="e in sessions" :key="e.id">
          <GoTableCell>{{ fmtDateTime(e.at) }}</GoTableCell>
          <GoTableCell>{{ e.actor }}</GoTableCell>
          <GoTableCell>{{ e.action }}</GoTableCell>
        </GoTableRow>
        <GoTableRow v-if="!sessions.length"><GoTableCell><span class="sub">No support sessions yet.</span></GoTableCell></GoTableRow>
      </GoTable>
    </Card>
  </div>
</template>

<style scoped>
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: stretch;
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .card-actions {
    display: flex;
    margin-block-start: var(--acv-spacing-regular);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
