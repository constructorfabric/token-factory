<script setup lang="ts">
import ItemPicker from '@/components/ui/ItemPicker.vue';
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { computed, ref, watch } from 'vue';
import type { McpServer } from '@/data/types';
import { record } from '@/state/db';
import { session } from '@/state/session';
import { tools } from '@/state/tools';

/**
 * A Customer Admin registers an MCP server of their own (PRD FR-171/172):
 * its address and credentials, then which of its tools users may call. It
 * is scanned like any server, and only this tenant sees it.
 */
const props = defineProps<{ tenantId: string }>();
const open = defineModel<boolean>({ required: true });
const { notify } = useNotificationsStore();
const d = ref({ name: '', url: '', auth: 'per-user-oauth' as McpServer['credentials'], secret: '' });
const discovered = ref<{ name: string; risk: 'read' | 'write' | 'admin' }[]>([]);
const allowed = ref<string[]>([]);
const probing = ref(false);
watch(open, (o) => {
  if (!o) return;
  d.value = { name: '', url: '', auth: 'per-user-oauth', secret: '' };
  discovered.value = [];
  allowed.value = [];
});
const urlOk = computed(() => /^https:\/\/[^\s]+$/.test(d.value.url));
// The gateway connects and lists the server's tools; write and admin tools start unticked.
function discover(): void {
  if (!urlOk.value) return;
  probing.value = true;
  setTimeout(() => {
    discovered.value = [
      { name: 'search_tickets', risk: 'read' }, { name: 'get_ticket', risk: 'read' }, { name: 'list_customers', risk: 'read' },
      { name: 'add_comment', risk: 'write' }, { name: 'update_ticket', risk: 'write' }, { name: 'delete_ticket', risk: 'admin' },
    ];
    allowed.value = discovered.value.filter((t) => t.risk === 'read').map((t) => t.name);
    if (!d.value.name.trim()) d.value.name = new URL(d.value.url).hostname.split('.')[0]!.replace(/^\w/, (c) => c.toUpperCase());
    probing.value = false;
  }, 700);
}
const canSave = computed(() => !!d.value.name.trim() && urlOk.value && allowed.value.length > 0 && (d.value.auth !== 'shared' || !!d.value.secret));
function save(): void {
  if (!canSave.value) return;
  const id = `mcp-${Date.now().toString(36)}`;
  const picked = discovered.value.filter((t) => allowed.value.includes(t.name));
  tools.mcpServers.push({
    id, name: d.value.name.trim(), publisher: 'Your organization', source: 'internal', version: '1.0.0', transport: 'http', tools: picked, credentials: d.value.auth, state: 'verifying',
    scan: 'Scanning tool descriptions for hidden instructions…', risk: picked.some((t) => t.risk === 'admin') ? 'high' : picked.some((t) => t.risk === 'write') ? 'medium' : 'low', ownerTenantId: props.tenantId, url: d.value.url,
  });
  const live = tools.mcpServers.find((s) => s.id === id)!;
  setTimeout(() => {
    live.state = 'approved';
    live.scan = 'Tool descriptions clean; TLS valid; answers within 300 ms';
  }, 2500);
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', action: `Registered MCP server ${live.name} (${picked.length} tools allowed)`, target: live.name, tenantId: props.tenantId });
  notify(`${live.name} is being scanned. Once clean, give it to departments or teams below.`, 'success', 'MCP server registered');
  open.value = false;
}
const riskText = (r: 'read' | 'write' | 'admin') => (r === 'read' ? 'reads' : r === 'write' ? 'changes data' : 'admin');
</script>

<template>
  <GoDialog v-model="open" size="m">
    <GoDialogWindow title="Register an MCP server" header-border @close="open = false">
      <div class="fields">
        <span class="sub">Only your organization sees it. It is scanned like every server before anyone can use it.</span>
        <GoFormControl label="Server address" label-for="mcp-url" required hint="Streamable HTTP over HTTPS">
          <div class="row">
            <GoInput id="mcp-url" v-model="d.url" size="m" placeholder="https://helpdesk.acme.example/mcp" class="grow" />
            <GoButton variant="secondary" size="m" :disabled="!urlOk" :loading="probing" @click="discover">Connect and list tools</GoButton>
          </div>
        </GoFormControl>
        <GoFormControl label="Name" label-for="mcp-name" required><GoInput id="mcp-name" v-model="d.name" size="m" /></GoFormControl>
        <GoFormControl label="Credentials">
          <GoSegmentButtonGroup v-model="d.auth" size="s" aria-label="Credentials">
            <GoSegmentButton value="per-user-oauth">Each user signs in (OAuth)</GoSegmentButton>
            <GoSegmentButton value="shared">One shared key</GoSegmentButton>
            <GoSegmentButton value="none">None</GoSegmentButton>
          </GoSegmentButtonGroup>
        </GoFormControl>
        <GoFormControl v-if="d.auth === 'shared'" label="Key" label-for="mcp-key" hint="Stored as a secret; users never see it"><GoInput id="mcp-key" v-model="d.secret" type="password" size="m" /></GoFormControl>
        <GoFormControl v-if="discovered.length" label="Tools users may call" :hint="`${allowed.length} of ${discovered.length}. Tools that change data start unticked.`">
          <ItemPicker v-model="allowed" :items="discovered.map((t) => ({ id: t.name, label: t.name, group: t.risk === 'read' ? 'Read only' : t.risk === 'write' ? 'Changes data' : 'Admin', warn: t.risk === 'read' ? undefined : riskText(t.risk) }))" placeholder="Search tools" noun="tools" :max-height="240" />
        </GoFormControl>
      </div>
      <template #footer>
        <div class="footer">
          <GoButton variant="secondary" size="m" @click="open = false">Cancel</GoButton>
          <GoButton size="m" :disabled="!canSave" @click="save">Register</GoButton>
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

  .row {
    display: flex;
    gap: var(--acv-spacing-small);
  }

  .grow {
    flex: 1;
  }

  .checks {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-x-small);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .warn {
    color: var(--acv-color-status-warning-strong, #b45309);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
