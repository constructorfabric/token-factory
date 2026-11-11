<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { IconChevronRight, IconSwap } from '@/components/icons';
import { record, tenantById } from '@/state/db';
import { exitTo, session, type ContextKind } from '@/state/session';
import { homeFor } from '@/router';
import { fmtDateTime } from '@/lib/format';

/**
 * Always on screen while you act as someone else, at every level of the
 * chain, so nobody forgets whose account their clicks are landing in.
 */
const router = useRouter();
const { notify } = useNotificationsStore();

const steps = computed(() =>
  session.stack.value.map((c) => ({
    kind: c.kind,
    title: c.kind === 'root' ? c.person : c.kind === 'tenant' ? tenantById(c.tenantId)?.name ?? c.tenantId : c.person,
    role: c.kind === 'root' ? c.role : c.kind === 'tenant' ? `as ${c.role} · full access` : `as ${c.role}`,
  })),
);

const current = computed(() => session.current.value);
const tenantLevel = computed(() => session.stack.value.find((c) => c.kind === 'tenant'));

function leave(kind: ContextKind): void {
  const from = current.value;
  exitTo(kind);
  record({
    actor: 'Victor Batraev',
    actorRole: 'Instance Admin',
    action: `Impersonation ended (${from?.kind === 'user' ? from.person : tenantById(from?.tenantId)?.name})`,
    target: from?.kind === 'user' ? `User ${from.person}` : `Tenant ${tenantById(from?.tenantId)?.name}`,
    tenantId: from?.tenantId ?? 'root',
  });
  notify('Impersonation ended. You are back in your own session.', 'info');
  void router.push(homeFor());
}
</script>

<template>
  <div class="impersonation-banner" role="status" aria-live="polite">
    <IconSwap class="icon" aria-hidden="true" />
    <div class="chain">
      <span class="label">Impersonating</span>
      <template v-for="(step, i) in steps" :key="step.kind">
        <IconChevronRight v-if="i > 0" class="sep" aria-hidden="true" />
        <span class="step" :class="i === steps.length - 1 && 'step_current'">
          <strong>{{ step.title }}</strong> <span class="role">{{ step.role }}</span>
        </span>
      </template>
      <span v-if="current?.reason" class="meta">Reason: {{ current.reason }} · since {{ fmtDateTime(current.startedAt) }} · every action is recorded as Victor Batraev</span>
    </div>
    <div class="actions">
      <GoButton v-if="current?.kind === 'user' && tenantLevel" variant="secondary" size="s" @click="leave('tenant')">
        Back to {{ tenantById(tenantLevel.tenantId)?.name }}
      </GoButton>
      <GoButton variant="primary" size="s" @click="leave('root')">Exit to root console</GoButton>
    </div>
  </div>
</template>

<style scoped>
  .impersonation-banner {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-x-small) var(--acv-spacing-medium);
    border-block-end: 2px solid var(--acv-color-status-warning-strong);
    background: var(--acv-color-status-warning-light);
    color: var(--acv-color-glyph-primary);
  }

  .icon {
    --icon-size: var(--acv-icon-size-sm);
    flex: none;
    color: var(--acv-color-status-warning-strong);
  }

  .chain {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--acv-spacing-xx-small) var(--acv-spacing-x-small);
    min-inline-size: 0;
  }

  .label {
    @mixin acv-text-ui-caption-1-medium;
    padding: 0 var(--acv-spacing-x-small);
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-status-warning-strong);
    color: var(--acv-color-glyph-inverted);
    text-transform: uppercase;
  }

  .sep {
    --icon-size: var(--acv-icon-size-xs);
    color: var(--acv-color-glyph-tertiary);
  }

  .step {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-secondary);

    &.step_current {
      color: var(--acv-color-glyph-primary);
    }
  }

  .role {
    @mixin acv-text-ui-caption-1;
  }

  .meta {
    @mixin acv-text-ui-caption-1;
    flex-basis: 100%;
    color: var(--acv-color-glyph-secondary);
  }

  .actions {
    display: flex;
    flex: none;
    gap: var(--acv-spacing-x-small);
  }
</style>
