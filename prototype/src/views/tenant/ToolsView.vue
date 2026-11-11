<script setup lang="ts">
import RegisterMcpDialog from '@/components/tenant/RegisterMcpDialog.vue';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { IconPlus } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { AssignmentLevel, Unit } from '@/data/types';
import { fmtInt } from '@/lib/format';
import { db, record, tenantById, unitById } from '@/state/db';
import { session } from '@/state/session';
import { effectiveFor, itemName, mcpName, reach, requiredMcp, tools } from '@/state/tools';

const route = useRoute();
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId);
const tenantName = tenantById(tenantId)?.name ?? '';

// Scopes: the tenant, then its units as Constructor Platform holds them.
const scopes = computed(() => {
  const out: { id: string | null; name: string; depth: number }[] = [{ id: null, name: `${tenantName} (whole tenant)`, depth: 0 }];
  const walk = (parent: string | null, depth: number) => {
    for (const u of db.units.filter((x) => x.tenantId === tenantId && x.parentId === parent) as Unit[]) {
      if (u.kind !== 'company') out.push({ id: u.id, name: u.name, depth });
      walk(u.id, u.kind === 'company' ? depth : depth + 1);
    }
  };
  walk(null, 1);
  return out;
});
const scope = ref<string | null>('un-payments');
const scopeKey = computed({ get: () => scope.value ?? '__tenant', set: (v: string) => (scope.value = v === '__tenant' ? null : v) });
const here = computed(() => tools.assignments.filter((a) => a.tenantId === tenantId && a.unitId === scope.value));

// Approved items the tenant may assign (MCP-04, SKL-04).
const assignable = computed(() => [
  ...tools.mcpServers.filter((s) => ['ga', 'approved'].includes(s.state) && (!s.ownerTenantId || s.ownerTenantId === tenantId)).map((s) => ({ kind: 'mcp' as const, id: s.id, name: s.name })),
  ...tools.skillSets.filter((s) => ['ga', 'approved', 'rolling-out'].includes(s.state)).map((s) => ({ kind: 'skillset' as const, id: s.id, name: s.name })),
]);
const newItem = ref('skillset:ss-incident');
const newLevel = ref<AssignmentLevel>('recommended');
const LEVELS: AssignmentLevel[] = ['required', 'recommended', 'available', 'blocked'];
const LEVEL_COLOR = { required: 'blue', recommended: 'mint', available: 'neutral', blocked: 'red' } as const;

const simulation = computed(() => {
  const [kind, id] = newItem.value.split(':') as ['mcp' | 'skillset', string];
  const mcps = kind === 'skillset' ? requiredMcp(id).map(mcpName) : [];
  return { kind, id, people: reach(tenantId, scope.value), mcps };
});

function add(): void {
  const { kind, id, people, mcps } = simulation.value;
  const existing = here.value.find((a) => a.kind === kind && a.itemId === id);
  if (existing) existing.level = newLevel.value;
  else tools.assignments.push({ id: `as-${Date.now()}`, tenantId, unitId: scope.value, kind, itemId: id, level: newLevel.value, setBy: session.current.value?.person ?? '' });
  const where = scope.value ? unitById(scope.value)?.name : tenantName;
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenantName : undefined, action: `Set ${itemName(kind, id)} to ${newLevel.value} for ${where}`, target: itemName(kind, id), tenantId });
  notify(`${itemName(kind, id)} is ${newLevel.value} for ${fmtInt(people)} users in ${where}.${mcps.length ? ` Configured with it: ${mcps.join(', ')}.` : ''}`, 'success', 'Rule saved');
}

function remove(id: string): void {
  const i = tools.assignments.findIndex((a) => a.id === id);
  if (i >= 0) tools.assignments.splice(i, 1);
}

// ORG-07: the effective set for one user, and the rule that decided each item.
const people = computed(() => db.users.filter((u) => u.tenantId === tenantId && u.status === 'active'));
const personId = ref('u-jane');
const person = computed(() => db.users.find((u) => u.id === personId.value));
const effective = computed(() => (person.value ? effectiveFor(person.value) : []));

const sRule = useSort(() => here.value, { item: (r) => itemName(r.kind, r.itemId), level: (r) => r.level, by: (r) => r.setBy });
const registerOpen = ref(false);
</script>

<template>
  <div>
    <PageHeader title="Tools & skills" description="Which MCP servers and skill sets each department and team gets; a lower level can tighten a rule, never loosen it.">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="registerOpen = true">Register MCP server</GoButton>
        <GoSelect v-model="scopeKey" size="m" aria-label="Scope" class="scope-select">
          <GoSelectOption v-for="s in scopes" :key="s.id ?? '__tenant'" :value="s.id ?? '__tenant'">{{ '— '.repeat(s.depth) }}{{ s.name }}</GoSelectOption>
        </GoSelect>
      </template>
    </PageHeader>

    <div class="grid">
      <Card :title="`Rules set at ${scope ? unitById(scope)?.name : 'tenant level'}`" :subtitle="`Reaches ${fmtInt(reach(tenantId, scope))} users, unless a lower unit tightens a rule`" flush>
        <GoTable size="sm">
          <GoTableRow header>
            <SortHeader :sort="sRule" k="item">Item</SortHeader>
            <SortHeader :sort="sRule" k="level">Level</SortHeader>
            <SortHeader :sort="sRule" k="by">Set by</SortHeader>
            <GoTableCell width="60" />
          </GoTableRow>
          <GoTableRow v-for="a in sRule.rows.value" :key="a.id">
            <GoTableCell>
              <GoTableName>{{ itemName(a.kind, a.itemId) }}</GoTableName>
              <span class="sub">{{ a.kind === 'mcp' ? 'MCP server' : `Skill set · brings ${requiredMcp(a.itemId).map(mcpName).join(', ') || 'no MCP servers'}` }}</span>
            </GoTableCell>
            <GoTableCell>
              <GoSelect v-model="a.level" size="m" :aria-label="`Level of ${itemName(a.kind, a.itemId)}`">
                <GoSelectOption v-for="l in LEVELS" :key="l" :value="l">{{ l }}</GoSelectOption>
              </GoSelect>
            </GoTableCell>
            <GoTableCell>{{ a.setBy }}</GoTableCell>
            <GoTableCell><GoButton variant="ghost" size="s" @click="remove(a.id)">Remove</GoButton></GoTableCell>
          </GoTableRow>
          <GoTableRow v-if="!here.length">
            <GoTableCell :colspan="4"><span class="sub">No rules here — everything is inherited.</span></GoTableCell>
          </GoTableRow>
        </GoTable>

        <div class="add">
          <GoSelect v-model="newItem" size="m" aria-label="Item" class="add-item">
            <GoSelectOption v-for="i in assignable" :key="`${i.kind}:${i.id}`" :value="`${i.kind}:${i.id}`">
              {{ i.name }}
              <template #description>{{ i.kind === 'mcp' ? 'MCP server' : 'Skill set' }}</template>
            </GoSelectOption>
          </GoSelect>
          <GoSelect v-model="newLevel" size="m" aria-label="Level">
            <GoSelectOption v-for="l in LEVELS" :key="l" :value="l">{{ l }}</GoSelectOption>
          </GoSelect>
          <GoButton size="m" @click="add"><template #icon><IconPlus /></template>Add rule</GoButton>
        </div>
        <GoMessage variant="info" rounded class="simulation">
          Before saving: {{ fmtInt(simulation.people) }} users affected
          <template #addition>{{ simulation.mcps.length ? `The skill set brings ${simulation.mcps.join(', ')}, configured at the same level. Per-user sign-in is asked at install.` : 'No MCP servers come with it.' }}</template>
        </GoMessage>
      </Card>

      <Card title="Why does this user have it?" subtitle="The effective set, and every rule that applied, top to bottom">
        <template #actions>
          <GoSelect v-model="personId" size="m" aria-label="User" class="person-select">
            <GoSelectOption v-for="u in people" :key="u.id" :value="u.id">{{ u.name }} · {{ unitById(u.unitId)?.name }}</GoSelectOption>
          </GoSelect>
        </template>
        <ul class="effective">
          <li v-for="e in effective" :key="`${e.kind}:${e.itemId}`" class="item">
            <div class="item-head">
              <span class="item-name">{{ itemName(e.kind, e.itemId) }}</span>
              <GoTag size="s" :color="LEVEL_COLOR[e.level]" variant="strong">{{ e.level }}</GoTag>
            </div>
            <ol class="steps">
              <li v-for="(s, i) in e.steps" :key="i" :class="!s.applied && 'step_ignored'">{{ s.scope }}: {{ s.level }} <span class="sub-inline">— {{ s.why }}<template v-if="s.setBy !== '—'"> · {{ s.setBy }}</template></span></li>
            </ol>
          </li>
        </ul>
      </Card>
    </div>
    <RegisterMcpDialog v-model="registerOpen" :tenant-id="tenantId" />
  </div>
</template>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .scope-select,
  .person-select {
    min-inline-size: 260px;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .add {
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-regular) var(--acv-spacing-medium) 0;
  }

  .simulation {
    margin: var(--acv-spacing-small) var(--acv-spacing-medium) var(--acv-spacing-small);
  }

  .effective {
    display: grid;
    gap: var(--acv-spacing-small);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .item-name {
    @mixin acv-text-ui-body-2-medium;
  }

  .steps {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-xx-small) 0 0;
    padding-inline-start: var(--acv-spacing-medium);
    color: var(--acv-color-glyph-primary);
  }

  .step_ignored {
    color: var(--acv-color-glyph-tertiary);
    text-decoration: line-through;
  }

  .sub-inline {
    color: var(--acv-color-glyph-tertiary);
  }
</style>
