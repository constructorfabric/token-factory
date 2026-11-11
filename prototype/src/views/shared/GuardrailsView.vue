<script setup lang="ts">
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref } from 'vue';
import GuardrailDialog from '@/components/shared/GuardrailDialog.vue';
import { IconLock, IconPlus } from '@/components/icons';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { Guardrail } from '@/data/types';
import { fmtInt } from '@/lib/format';
import { db, modelById, record, tenantById } from '@/state/db';
import { session } from '@/state/session';

/**
 * The same screen at both levels. The root sets platform guardrails and may
 * enforce them; a tenant sees those as locked and adds its own beside them.
 */
const { notify } = useNotificationsStore();
const ctx = computed(() => session.current.value);
const atRoot = computed(() => ctx.value?.kind === 'root');
const rows = computed(() => db.guardrails.filter((g) => g.scope === 'platform' || g.tenantId === ctx.value?.tenantId));
const editable = (g: Guardrail) => atRoot.value || (g.scope === 'tenant' && g.tenantId === ctx.value?.tenantId) || (g.scope === 'platform' && !g.enforced);

function changed(g: Guardrail, what: string): void {
  record({ actor: ctx.value?.person ?? '', actorRole: ctx.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantById(ctx.value?.tenantId)?.name : undefined, action: `Guardrail ${g.name}: ${what}`, target: g.name, tenantId: ctx.value?.tenantId ?? 'root' });
  notify(`${g.name}: ${what}.`, 'success');
}

const STAGE: Record<Guardrail['stage'], string> = { input: 'Before the call', output: 'After the call', both: 'Before and after', parallel: 'During the call', tools: 'On tool calls' };
const dialogOpen = ref(false);
const editing = ref<Guardrail | undefined>();
function openDialog(g?: Guardrail): void {
  editing.value = g;
  dialogOpen.value = true;
}

const sGr = useSort(() => rows.value, { name: (r) => r.name, scope: (r) => r.scope, stage: (r) => r.stage, hits: (r) => r.hits7d });
</script>

<template>
  <div>
    <PageHeader title="Guardrails" :description="atRoot ? 'Checks every request and response passes at the gateway. Enforced guardrails apply to every tenant and cannot be switched off below.' : 'Platform guardrails apply to you; enforced ones are locked. Add your own on top — they apply to this organization only.'">
      <template #actions>
        <GoButton size="m" @click="openDialog()">
          <template #icon><IconPlus /></template>
          Add guardrail
        </GoButton>
      </template>
    </PageHeader>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sGr" k="name">Guardrail</SortHeader>
          <SortHeader :sort="sGr" k="scope">Scope</SortHeader>
          <SortHeader :sort="sGr" k="stage">Runs</SortHeader>
          <GoTableCell>Covers</GoTableCell>
          <GoTableCell width="140">Action</GoTableCell>
          <SortHeader :sort="sGr" k="hits">Hits, 7 days</SortHeader>
          <GoTableCell width="90">On</GoTableCell>
        </GoTableRow>
        <GoTableRow v-for="g in sGr.rows.value" :key="g.id">
          <GoTableCell>
            <GoTableName :is="editable(g) ? 'button' : 'span'" class="name-btn" @click="editable(g) && openDialog(g)">{{ g.name }}</GoTableName>
            <span class="sub">{{ g.description }}</span>
            <span class="sub">{{ g.provider ?? 'Built in' }}{{ g.failMode === 'open' ? ' · lets requests through if it fails' : ' · refuses if it fails' }}</span>
          </GoTableCell>
          <GoTableCell>
            <GoTag size="s" :color="g.scope === 'platform' ? 'purple' : 'blue'">{{ g.scope === 'platform' ? 'Platform' : 'This tenant' }}</GoTag>
            <GoTag v-if="g.enforced" size="s" color="neutral"><template #icon><IconLock /></template>Enforced</GoTag>
          </GoTableCell>
          <GoTableCell>{{ STAGE[g.stage] }}</GoTableCell>
          <GoTableCell>{{ g.appliesTo === 'external' ? 'External providers' : g.appliesTo === 'models' ? (g.modelIds ?? []).map((id) => modelById(id)?.name).join(', ') : 'Every model' }}</GoTableCell>
          <GoTableCell>
            <GoSelect v-model="g.mode" size="m" :disabled="!editable(g)" :aria-label="`Action for ${g.name}`" @update:model-value="changed(g, `action set to ${g.mode}`)">
              <GoSelectOption value="block">Block</GoSelectOption>
              <GoSelectOption value="redact">Redact</GoSelectOption>
              <GoSelectOption value="flag">Flag only</GoSelectOption>
            </GoSelect>
          </GoTableCell>
          <GoTableCell>{{ fmtInt(g.hits7d) }}</GoTableCell>
          <GoTableCell>
            <GoToggle v-model="g.enabled" size="s" :disabled="!editable(g) || g.enforced" :aria-label="`Enable ${g.name}`" @update:model-value="changed(g, g.enabled ? 'enabled' : 'disabled')" />
          </GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>
    <GuardrailDialog v-model="dialogOpen" :edit="editing" :at-root="atRoot" :tenant-id="ctx?.tenantId ?? 'root'" />
  </div>
</template>

<style scoped>
  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow-x: auto;
  }

  .name-btn {
    padding: 0;
    border: none;
    background: none;
    text-align: start;
    cursor: pointer;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    max-inline-size: 520px;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
