<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, reactive, ref, watch } from 'vue';
import { record, tenantById } from '@/state/db';
import type { Integration } from '@/state/integrations';
import { session } from '@/state/session';

/**
 * Connects a tool that is not a user source: a model source such as Hugging
 * Face, or an observability or security tool that receives what Token Factory
 * sends. Credentials, what to send, one test call, then connected.
 */
const props = defineProps<{ tenantId: string; integration: Integration | null }>();
const open = defineModel<boolean>({ required: true });
const { notify } = useNotificationsStore();

const values = reactive<Record<string, string>>({});
const sends = reactive<Record<string, boolean>>({});
const tested = ref(false);
const testing = ref(false);
watch(open, (o) => {
  if (!o || !props.integration) return;
  for (const f of props.integration.fields ?? []) values[f.id] = f.value ?? '';
  for (const s of props.integration.sends ?? []) sends[s] = true;
  tested.value = false;
});
const filled = computed(() => (props.integration?.fields ?? []).every((f) => f.optional || values[f.id]?.trim()));

function test(): void {
  testing.value = true;
  setTimeout(() => {
    testing.value = false;
    tested.value = true;
  }, 700);
}
function connect(): void {
  const i = props.integration;
  if (!i) return;
  const urlField = i.fields?.find((f) => !f.secret && /url|host|site/i.test(f.label));
  const secretField = i.fields?.find((f) => f.secret);
  const idField = i.fields?.find((f) => !f.secret && f !== urlField);
  Object.assign(i, {
    status: 'connected',
    account: urlField ? values[urlField.id] : i.vendor,
    url: urlField ? values[urlField.id] : undefined,
    clientId: idField ? values[idField.id] : undefined,
    secretHint: secretField ? `••••••••••••${(values[secretField.id] ?? '').slice(-4)}` : undefined,
    sends: (i.sends ?? []).filter((s) => sends[s]),
    lastTest: { at: new Date().toISOString(), ok: true, ms: 160 + Math.round(Math.random() * 120) },
  });
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantById(props.tenantId)?.name : undefined, action: `Connected ${i.name}`, target: i.name, tenantId: props.tenantId });
  notify(i.kind === 'models' ? `${i.name} connected. Gated and private models can now be admitted.` : `${i.name} connected. Data starts flowing within a minute.`, 'success', 'Integration connected');
  open.value = false;
}
</script>

<template>
  <GoDialog v-model="open" size="m">
    <GoDialogWindow v-if="integration" :title="`Connect ${integration.name}`" header-border @close="open = false">
      <div class="fields">
        <p class="text">{{ integration.description }}</p>
        <GoFormControl v-for="f in integration.fields" :key="f.id" :label="f.label" :label-for="`tc-${f.id}`" :hint="f.hint" :optional="f.optional">
          <GoInput :id="`tc-${f.id}`" v-model="values[f.id]" :type="f.secret ? 'password' : 'text'" size="m" :placeholder="f.placeholder" />
        </GoFormControl>
        <div v-if="integration.sends?.length" class="sends">
          <span class="label">{{ integration.kind === 'models' ? 'Use it for' : 'Send to ' + integration.name }}</span>
          <GoToggle v-for="s in integration.sends" :key="s" v-model="sends[s]" size="s">{{ s }}</GoToggle>
        </div>
        <GoMessage v-if="tested" variant="success" rounded>Connection works — signed in and checked the permissions. Nothing was sent yet.</GoMessage>
      </div>
      <template #footer>
        <div class="footer">
          <GoButton variant="secondary" size="m" :disabled="!filled" :loading="testing" @click="test">Test connection</GoButton>
          <span class="spacer" />
          <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
          <GoButton size="m" :disabled="!filled || !tested" @click="connect">Connect</GoButton>
        </div>
      </template>
    </GoDialogWindow>
  </GoDialog>
</template>

<style scoped>
  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .text {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .sends {
    display: grid;
    gap: var(--acv-spacing-x-small);
  }

  .label {
    @mixin acv-text-ui-body-2-medium;
    color: var(--acv-color-glyph-primary);
  }

  .footer {
    display: flex;
    gap: var(--acv-spacing-x-small);
  }

  .spacer {
    flex: 1;
  }
</style>
