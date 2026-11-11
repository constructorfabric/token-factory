<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoMessage } from '@constructor/ui/message';
import { ref, watch } from 'vue';

/**
 * Stepping into someone else's account is a named, recorded act: it asks for
 * a reason (a ticket, usually) and says plainly what the session can do.
 */
const props = defineProps<{ target: string; role: string; scope: string; defaultReason?: string }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ confirm: [reason: string] }>();

const reason = ref(props.defaultReason ?? '');
watch(open, (v) => {
  if (v) reason.value = props.defaultReason ?? '';
});

function start(): void {
  if (!reason.value.trim()) return;
  emit('confirm', reason.value.trim());
  open.value = false;
}
</script>

<template>
  <GoDialog v-model="open" size="m">
    <GoDialogWindow :title="`Impersonate ${target}`" header-border @close="open = false">
      <div class="body">
        <GoMessage variant="warning" border rounded>
          You will act as {{ role }}
          <template #addition>{{ scope }} Every action is recorded in the audit log as Victor Batraev on behalf of {{ target }}. The session ends after 60 minutes.</template>
        </GoMessage>
        <GoFormControl label="Reason or ticket" label-for="impersonate-reason" required hint="Shown to the tenant's administrators in their audit log.">
          <GoInput id="impersonate-reason" v-model="reason" size="m" placeholder="e.g. SUP-4410 — Payments team cannot reach coding-default" />
        </GoFormControl>
      </div>
      <template #footer>
        <div class="footer">
          <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
          <GoButton size="m" :disabled="!reason.trim()" @click="start">Start impersonation</GoButton>
        </div>
      </template>
    </GoDialogWindow>
  </GoDialog>
</template>

<style scoped>
  .body {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
