<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { computed, ref } from 'vue';
import type { Model } from '@/data/types';
import { routableModels } from '@/state/aliases';
import { capLabel, missingCaps } from '@/data/capabilities';
import { applyMove, movesFor, type Move } from '@/state/lifecycle';
import { policyFor } from '@/state/rollout';

/** "Move to…": the lifecycle moves this model can make now, on the board and the model page. */
const props = withDefaults(defineProps<{ model: Model; compact?: boolean }>(), { compact: false });
const { notify } = useNotificationsStore();
const moves = computed(() => movesFor(props.model));

function pick(move: Move): void {
  if (move.blocked) return;
  if (move.id === 'deprecate') return openDeprecate(move);
  notify(applyMove(props.model, move), move.danger ? 'warning' : 'success', move.label.replace('…', ''));
}

// ---- deprecation needs a date and, ideally, a replacement
const open = ref(false);
const pending = ref<Move | null>(null);
const retiresOn = ref('');
const replacementId = ref('');
const minDate = computed(() => {
  const d = new Date(Date.UTC(2026, 10, 11));
  d.setUTCDate(d.getUTCDate() + policyFor(props.model.ownerTenantId ?? 'root').noticeDays);
  return d.toISOString().slice(0, 10);
});
// Same family first: the likeliest successors.
const replacements = computed(() => routableModels().filter((m) => m.id !== props.model.id && ['ga', 'rolling-out', 'approved'].includes(m.state)).sort((a, b) => Number(b.family === props.model.family) - Number(a.family === props.model.family)));
function openDeprecate(move: Move): void {
  pending.value = move;
  retiresOn.value = minDate.value;
  replacementId.value = replacements.value.find((m) => m.family === props.model.family)?.id ?? '';
  open.value = true;
}
const dateOk = computed(() => /^\d{4}-\d{2}-\d{2}$/.test(retiresOn.value) && retiresOn.value >= minDate.value);
function confirm(): void {
  if (!pending.value || !dateOk.value) return;
  notify(applyMove(props.model, pending.value, { retiresOn: retiresOn.value, replacementId: replacementId.value || undefined }), 'warning', 'Deprecated');
  open.value = false;
}
</script>

<template>
  <span v-if="moves.length" class="move" @click.stop.prevent>
    <GoDropdownMenuPopover :aria-label="`Move ${model.name}`" position="bottom-right">
      <template #handle="{ toggle }">
        <GoButton :variant="compact ? 'ghost' : 'secondary'" :size="compact ? 's' : 'm'" @click="toggle">{{ compact ? 'Move' : 'Move to…' }}</GoButton>
      </template>
      <GoDropdownMenuItem v-for="mv in moves" :key="mv.id" :danger="mv.danger" :disabled="!!mv.blocked" @select="pick(mv)">
        {{ mv.label }}
        <template #description>{{ mv.blocked ?? mv.hint }}</template>
      </GoDropdownMenuItem>
    </GoDropdownMenuPopover>

    <GoDialog v-model="open" size="m">
      <GoDialogWindow :title="`Deprecate ${model.name}`" header-border @close="open = false">
        <div class="fields">
          <p class="text">Tenant admins whose licenses include it are told now. It keeps serving until the retire date; then requests naming it get 404 with the replacement to use.</p>
          <GoFormControl label="Retire on" label-for="dep-date" :hint="dateOk ? `At least ${policyFor(model.ownerTenantId ?? 'root').noticeDays} days of notice (rollout settings)` : `No earlier than ${minDate}`">
            <GoInput id="dep-date" v-model="retiresOn" size="m" placeholder="YYYY-MM-DD" />
          </GoFormControl>
          <GoFormControl label="Replacement" optional hint="Shown to callers and tenant admins; aliases still pointing here are listed on the model page">
            <GoSelect v-model="replacementId" size="m" aria-label="Replacement">
              <GoSelectOption value="">None</GoSelectOption>
              <GoSelectOption v-for="m in replacements" :key="m.id" :value="m.id">{{ m.name }}<template #description>{{ m.family }} · {{ m.provider }}{{ missingCaps(m, model.capabilities).length ? ` · lacks ${missingCaps(m, model.capabilities).map(capLabel).join(', ')}` : '' }}</template></GoSelectOption>
            </GoSelect>
          </GoFormControl>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
            <GoButton variant="danger" size="m" :disabled="!dateOk" @click="confirm">Deprecate</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </span>
</template>

<style scoped>
  .move {
    display: inline-flex;
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .text {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
