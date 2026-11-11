<script setup lang="ts">
import { licenseOfTenant } from '@/state/tenantLicenses';
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoStepper, GoStepperItem } from '@constructor/ui/stepper';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconPlus, IconTrash } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import CustomerLifecycleTag from '@/components/ui/CustomerLifecycleTag.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { License, Unit } from '@/data/types';
import { CREDITS_PER_USD, fmtCreditPrice, fmtCredits, fmtInt } from '@/lib/format';
import { ownCredits } from '@/state/credits';
import { addProviderKey, db, record, tenantById } from '@/state/db';
import { integrationsFor } from '@/state/integrations';
import { setupLater } from '@/state/onboarding';
import { session } from '@/state/session';

/**
 * A new tenant's first sign-in: connect users, choose models, create licenses,
 * hand each unit a default license, then review. Nothing is saved until Finish.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId);
const tenant = computed(() => tenantById(tenantId));
const base = `/t/${tenantId}`;

const STEPS = ['Welcome', 'Connect users', 'Add models', 'Create licenses', 'Default licenses', 'Review'];
const step = ref(0);

// ---- 1. users: one source brings users, departments, teams and managers
const SOURCES = [
  { id: 'constructor-platform', name: 'Constructor Platform', text: 'Your HR structure as Constructor Platform already has it.', recommended: true },
  { id: 'bamboohr', name: 'BambooHR', text: 'Employees, departments and reporting lines.' },
  { id: 'entra', name: 'Microsoft Entra ID', text: 'Users and groups pushed over SCIM.' },
  { id: 'jit', name: 'Sign-in only', text: 'No sync: accounts are created when users first sign in.' },
];
const source = ref('constructor-platform');
const connected = ref(false);
const connecting = ref(false);
const UNITS: { name: string; manager: string; members: number; kind: Unit['kind'] }[] = [
  { name: 'Research', manager: 'Dr. Elena Rossi', members: 92, kind: 'department' },
  { name: 'Clinical Operations', manager: 'Marc Dubois', members: 54, kind: 'department' },
  { name: 'Manufacturing', manager: 'Jonas Weber', members: 41, kind: 'department' },
  { name: 'Regulatory Affairs', manager: 'Priya Natarajan', members: 23, kind: 'department' },
  { name: 'IT', manager: 'Tomás Herrera', members: 21, kind: 'department' },
  { name: 'Finance', manager: 'Sofia Lindqvist', members: 17, kind: 'department' },
];
const userCount = UNITS.reduce((s, u) => s + u.members, 0);
function connect(): void {
  connecting.value = true;
  setTimeout(() => {
    connecting.value = false;
    connected.value = true;
  }, 900);
}

// ---- 2. models: platform models to switch on for the organization
const platform = computed(() => db.models.filter((m) => !m.ownerTenantId && ['ga', 'rolling-out', 'deprecated'].includes(m.state)));
const RECOMMENDED = ['m-sonnet-55', 'm-haiku-45', 'm-gpt-51-mini', 'm-qwen3-coder', 'm-gpt-oss'];
const models = ref<string[]>(RECOMMENDED.filter((id) => platform.value.some((m) => m.id === id)));
const byok = reactive({ on: false, provider: 'Azure OpenAI', label: '', secret: '' });

// ---- 3. licenses: start from three common seat types, edit or add
interface Draft { name: string; description: string; daily: number; rpm: number; models: 'coding' | 'chat' | 'self-hosted' | 'all'; own: number }
const drafts = ref<Draft[]>([
  { name: 'Developer', description: 'Coding models for engineers, with API keys.', daily: 4000, rpm: 120, models: 'coding', own: 0 },
  { name: 'Knowledge worker', description: 'Chat, summaries and documents.', daily: 800, rpm: 30, models: 'chat', own: 0 },
  { name: 'Restricted', description: 'Self-hosted models only; nothing leaves the company network.', daily: 300, rpm: 20, models: 'self-hosted', own: 0 },
]);
const SCOPE = { coding: 'Coding models', chat: 'Chat models', 'self-hosted': 'Self-hosted only', all: 'Every enabled model' } as const;
function modelsFor(d: Draft): string[] {
  const on = platform.value.filter((m) => models.value.includes(m.id));
  if (d.models === 'all') return on.map((m) => m.id);
  if (d.models === 'self-hosted') return on.filter((m) => m.hosting !== 'commercial').map((m) => m.id);
  if (d.models === 'chat') return on.filter((m) => !m.capabilities.includes('code') || ['m-haiku-45', 'm-gpt-51-mini'].includes(m.id)).map((m) => m.id);
  return on.filter((m) => m.capabilities.includes('code')).map((m) => m.id);
}
function addDraft(): void {
  drafts.value.push({ name: `License ${drafts.value.length + 1}`, description: '', daily: 1000, rpm: 60, models: 'all', own: 0 });
}

// ---- 4. default licenses: one for the organization, overridable per unit
const orgDefault = ref(1);
const unitDefault = reactive<Record<string, number | -1>>(Object.fromEntries(UNITS.map((u) => [u.name, -1])));
unitDefault['Research'] = 0;
unitDefault['IT'] = 0;
unitDefault['Manufacturing'] = 2;
const effective = (u: string) => (unitDefault[u] === -1 ? orgDefault.value : unitDefault[u]!);
const holdersOf = (i: number) => UNITS.filter((u) => effective(u.name) === i).reduce((s, u) => s + u.members, 0);

// ---- navigation
const canNext = computed(() => {
  if (step.value === 1) return connected.value || source.value === 'jit';
  if (step.value === 2) return models.value.length > 0;
  if (step.value === 3) return drafts.value.length > 0 && drafts.value.every((d) => d.name.trim());
  return true;
});
function later(): void {
  setupLater.add(tenantId);
  notify('You can finish setup from the overview whenever you are ready.', 'info', 'Setup paused');
  void router.push(`${base}/overview`);
}

// ---- finish: write everything at once
function finish(): void {
  const t = tenant.value;
  if (!t) return;
  const who = session.current.value?.person ?? '';
  const created: License[] = drafts.value.map((d, i) => ({
    id: `l-${tenantId}-${i}`, tenantId, name: d.name.trim(), description: d.description, allowedModels: modelsFor(d),
    limits: { daily: { tokens: d.daily * 1000, cost: d.daily / CREDITS_PER_USD }, weekly: { tokens: d.daily * 4500, cost: (d.daily * 4.5) / CREDITS_PER_USD }, monthly: { tokens: d.daily * 16000, cost: (d.daily * 16) / CREDITS_PER_USD } },
    keyLimits: { daily: d.own / CREDITS_PER_USD, weekly: (d.own * 4.5) / CREDITS_PER_USD, monthly: (d.own * 16) / CREDITS_PER_USD },
    platformAllowed: true, rpm: d.rpm, maxContext: 200_000, keyRpm: d.own ? 30 : 0, keyMaxContext: 128_000, guardrailProfile: 'Default', holders: source.value === 'jit' ? 0 : holdersOf(i),
  }));
  db.licenses.push(...created);
  if (source.value !== 'jit') {
    const root: Unit = { id: `un-${tenantId}`, tenantId, name: t.name, parentId: null, kind: 'company', manager: t.admin, members: userCount, defaultLicenseId: created[orgDefault.value]?.id, source: 'hr-sync' } as Unit;
    db.units.push(root);
    UNITS.forEach((u, i) => db.units.push({ id: `un-${tenantId}-${i}`, tenantId, name: u.name, parentId: root.id, kind: u.kind, manager: u.manager, members: u.members, defaultLicenseId: unitDefault[u.name] === -1 ? undefined : created[unitDefault[u.name]!]?.id, source: 'hr-sync' } as Unit));
    const integ = integrationsFor(tenantId).find((x) => x.id === source.value);
    if (integ) Object.assign(integ, { status: 'connected', account: `${t.name} (${SOURCES.find((s) => s.id === source.value)?.name})`, lastSync: new Date().toISOString(), people: userCount, units: UNITS.length });
    t.users = userCount;
    t.units = UNITS.length + 1;
  }
  if (byok.on && byok.label && byok.secret) addProviderKey({ tenantId, provider: byok.provider, label: byok.label, mode: 'byok', endpoint: '', hint: `••••${byok.secret.slice(-4)}`, addedBy: who });
  t.models = models.value.length;
  t.status = 'active';
  t.setupDone = true;
  setupLater.delete(tenantId);
  record({ actor: who, actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? t.name : undefined, action: `Completed setup: ${models.value.length} models, ${created.length} licenses${source.value !== 'jit' ? `, ${userCount} users from ${SOURCES.find((s) => s.id === source.value)?.name}` : ''}`, target: t.name, tenantId });
  notify(`${t.name} is ready. Users can sign in and get their unit’s license.`, 'success', 'Setup complete');
  void router.push(`${base}/overview`);
}
</script>

<template>
  <div v-if="tenant">
    <PageHeader :title="`Set up ${tenant.name}`" description="A few steps to get your organization ready. Nothing is saved until you finish; you can change all of it later.">
      <template #actions><GoButton variant="ghost" size="m" @click="later">Do it later</GoButton></template>
    </PageHeader>

    <GoStepper class="stepper">
      <GoStepperItem v-for="(s, n) in STEPS" :key="s" :variant="n < step ? 'done' : n === step ? 'active' : 'inactive'">{{ s }}</GoStepperItem>
    </GoStepper>

    <!-- 0. Welcome -->
    <Card v-if="step === 0" title="Welcome" subtitle="Here is what your organization license includes">
      <div class="facts">
        <div class="fact"><span class="fact-value">{{ fmtInt(tenant.seats) }}</span><span class="sub">seats</span></div>
        <div class="fact"><span class="fact-value">{{ fmtCredits(tenant.budget30d) }}</span><span class="sub">platform credits a month</span></div>
        <div class="fact"><span class="fact-value">{{ licenseOfTenant(tenant)?.name ?? '—' }}</span><span class="sub">license</span></div>
      </div>
      <ol class="plan">
        <li><strong>Connect users</strong> — bring in your users, departments and managers.</li>
        <li><strong>Add models</strong> — choose which AI models your organization uses.</li>
        <li><strong>Create licenses</strong> — seat types that say which models a user may use and how much.</li>
        <li><strong>Default licenses</strong> — what each department gets, so new users are ready on day one.</li>
      </ol>
    </Card>

    <!-- 1. Connect users -->
    <Card v-else-if="step === 1" title="Connect users" subtitle="One source keeps users, departments, teams and managers in step">
      <div class="choices">
        <button v-for="s in SOURCES" :key="s.id" type="button" class="choice" :class="{ choice_on: source === s.id }" :disabled="connected" @click="source = s.id">
          <span class="choice-name">{{ s.name }}<span v-if="s.recommended" class="badge">Recommended</span></span>
          <span class="sub">{{ s.text }}</span>
        </button>
      </div>
      <template v-if="source !== 'jit'">
        <div v-if="!connected" class="connect-row">
          <GoButton size="m" :loading="connecting" @click="connect">Connect {{ SOURCES.find((s) => s.id === source)?.name }}</GoButton>
          <span class="sub">Signs in to {{ SOURCES.find((s) => s.id === source)?.name }} and reads users and the organization structure. Nothing is changed there.</span>
        </div>
        <template v-else>
          <GoMessage variant="success" rounded class="spaced">
            Connected — {{ fmtInt(userCount) }} users in {{ UNITS.length }} departments
            <template #addition>{{ fmtInt(tenant.seats - userCount) }} of your {{ fmtInt(tenant.seats) }} seats stay free. It syncs every hour.</template>
          </GoMessage>
          <GoTable size="sm" class="spaced">
            <GoTableRow header><GoTableCell>Department</GoTableCell><GoTableCell>Manager</GoTableCell><GoTableCell>Users</GoTableCell></GoTableRow>
            <GoTableRow v-for="u in UNITS" :key="u.name"><GoTableCell>{{ u.name }}</GoTableCell><GoTableCell>{{ u.manager }}</GoTableCell><GoTableCell>{{ u.members }}</GoTableCell></GoTableRow>
          </GoTable>
        </template>
      </template>
      <GoMessage v-else variant="info" rounded class="spaced">Accounts are created on first sign-in. Set up single sign-on afterwards under Settings › Sign-in options.</GoMessage>
    </Card>

    <!-- 2. Add models -->
    <Card v-else-if="step === 2" title="Add models" :subtitle="`${models.length} selected. Recommended ones are ticked; you can change this any time under Models.`">
      <GoTable size="sm">
        <GoTableRow header><GoTableCell width="40" /><GoTableCell>Model</GoTableCell><GoTableCell>Credits per 1M, in / out</GoTableCell><GoTableCell>Lifecycle</GoTableCell></GoTableRow>
        <GoTableRow v-for="m in platform" :key="m.id">
          <GoTableCell><GoCheckbox v-model="models" :value="m.id" :aria-label="m.name" /></GoTableCell>
          <GoTableCell>{{ m.name }}<span class="sub">{{ m.provider }}{{ RECOMMENDED.includes(m.id) ? ' · recommended' : '' }}</span></GoTableCell>
          <GoTableCell>{{ fmtCreditPrice(m.priceIn) }} / {{ fmtCreditPrice(m.priceOut) }}</GoTableCell>
          <GoTableCell><CustomerLifecycleTag :model="m" /></GoTableCell>
        </GoTableRow>
      </GoTable>
      <div class="byok">
        <GoCheckbox v-model="byok.on">Also use a provider key of our own (optional)</GoCheckbox>
        <div v-if="byok.on" class="three">
          <GoFormControl label="Provider">
            <GoSelect v-model="byok.provider" size="m" aria-label="Provider">
              <GoSelectOption v-for="p in ['Azure OpenAI', 'OpenAI', 'Anthropic', 'AWS Bedrock', 'Google Vertex AI']" :key="p" :value="p">{{ p }}</GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl label="Label" label-for="w-label"><GoInput id="w-label" v-model="byok.label" size="m" placeholder="helix-prod" /></GoFormControl>
          <GoFormControl label="API key" label-for="w-secret"><GoInput id="w-secret" v-model="byok.secret" type="password" size="m" /></GoFormControl>
          <p class="sub span">Billed by your provider; users spend {{ ownCredits(tenantId) }} on its models. Pick the models afterwards under Provider keys.</p>
        </div>
      </div>
    </Card>

    <!-- 3. Create licenses -->
    <Card v-else-if="step === 3" title="Create licenses" subtitle="Seat types: which models a holder may use and how many platform credits a day. Fine-tune them later under Licenses.">
      <GoTable size="sm">
        <GoTableRow header>
          <GoTableCell>Name</GoTableCell><GoTableCell>Models</GoTableCell><GoTableCell width="150">Platform credits a day</GoTableCell><GoTableCell width="120">Requests / min</GoTableCell><GoTableCell width="48" />
        </GoTableRow>
        <GoTableRow v-for="(d, i) in drafts" :key="i">
          <GoTableCell><GoInput v-model="d.name" size="m" aria-label="License name" /><span class="sub">{{ d.description }}</span></GoTableCell>
          <GoTableCell>
            <GoSelect v-model="d.models" size="m" aria-label="Models">
              <GoSelectOption v-for="(label, k) in SCOPE" :key="k" :value="k">{{ label }}</GoSelectOption>
            </GoSelect>
            <span class="sub">{{ modelsFor(d).length }} of your models</span>
          </GoTableCell>
          <GoTableCell><GoInputNumber v-model="d.daily" :min="0" :step="100" size="m" aria-label="Platform credits a day" /></GoTableCell>
          <GoTableCell><GoInputNumber v-model="d.rpm" :min="1" size="m" aria-label="Requests a minute" /></GoTableCell>
          <GoTableCell><GoButton variant="ghost" size="s" :disabled="drafts.length === 1" aria-label="Remove license" @click="drafts.splice(i, 1)"><template #icon><IconTrash /></template></GoButton></GoTableCell>
        </GoTableRow>
      </GoTable>
      <div class="add-row"><GoButton variant="secondary" size="s" @click="addDraft"><template #icon><IconPlus /></template>Add license</GoButton></div>
    </Card>

    <!-- 4. Default licenses -->
    <Card v-else-if="step === 4" title="Default licenses" subtitle="Every user gets their department’s license; departments without one get the organization default">
      <GoFormControl label="Organization default" class="org-default">
        <GoSelect v-model="orgDefault" size="m" aria-label="Organization default">
          <GoSelectOption v-for="(d, i) in drafts" :key="i" :value="i">{{ d.name }}</GoSelectOption>
        </GoSelect>
      </GoFormControl>
      <GoTable v-if="source !== 'jit'" size="sm">
        <GoTableRow header><GoTableCell>Department</GoTableCell><GoTableCell>Users</GoTableCell><GoTableCell width="280">License</GoTableCell></GoTableRow>
        <GoTableRow v-for="u in UNITS" :key="u.name">
          <GoTableCell>{{ u.name }}</GoTableCell>
          <GoTableCell>{{ u.members }}</GoTableCell>
          <GoTableCell>
            <GoSelect v-model="unitDefault[u.name]" size="m" :aria-label="`License for ${u.name}`">
              <GoSelectOption :value="-1">Organization default ({{ drafts[orgDefault]?.name }})</GoSelectOption>
              <GoSelectOption v-for="(d, i) in drafts" :key="i" :value="i">{{ d.name }}</GoSelectOption>
            </GoSelect>
          </GoTableCell>
        </GoTableRow>
      </GoTable>
      <p v-else class="sub">With sign-in only, everyone gets the organization default until you connect a user source.</p>
    </Card>

    <!-- 5. Review -->
    <Card v-else title="Review" subtitle="Check, then finish. Everything stays editable afterwards.">
      <div class="review">
        <div><span class="review-title">Users</span><span class="sub">{{ source === 'jit' ? 'Created on first sign-in' : `${fmtInt(userCount)} users in ${UNITS.length} departments from ${SOURCES.find((s) => s.id === source)?.name}` }}</span></div>
        <div><span class="review-title">Models</span><span class="sub">{{ models.length }} platform models{{ byok.on && byok.label ? ` · provider key ${byok.label}` : '' }}</span></div>
        <div>
          <span class="review-title">Licenses</span>
          <span v-for="(d, i) in drafts" :key="i" class="sub">{{ d.name }}: {{ modelsFor(d).length }} models, {{ fmtInt(d.daily) }} platform credits a day, {{ d.rpm }} requests a minute{{ source === 'jit' ? '' : ` — ${fmtInt(holdersOf(i))} users` }}</span>
        </div>
        <div><span class="review-title">Organization default</span><span class="sub">{{ drafts[orgDefault]?.name }}</span></div>
      </div>
      <GoMessage v-if="source !== 'jit' && userCount > tenant.seats" variant="warning" rounded class="spaced">{{ fmtInt(userCount - tenant.seats) }} more users than seats; ask your account manager for more.</GoMessage>
    </Card>

    <div class="footer">
      <GoButton v-if="step > 0" variant="secondary" size="m" @click="step--">Back</GoButton>
      <span class="spacer" />
      <GoButton v-if="step < STEPS.length - 1" size="m" :disabled="!canNext" @click="step++">{{ step === 0 ? 'Start' : 'Next' }}</GoButton>
      <GoButton v-else size="m" @click="finish">Finish setup</GoButton>
    </div>
  </div>
</template>

<style scoped>
  .stepper {
    margin-block-end: var(--acv-spacing-regular);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .fact {
    display: grid;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
  }

  .fact-value {
    @mixin acv-text-subheading-3;
    color: var(--acv-color-glyph-primary);
  }

  .plan {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-x-small);
    margin: 0;
    padding-inline-start: var(--acv-spacing-large);
    color: var(--acv-color-glyph-secondary);
  }

  .choices {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-small);
  }

  .choice {
    display: grid;
    align-content: start;
    gap: 2px;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-primary);
    text-align: start;
    cursor: pointer;

    &.choice_on {
      border-color: var(--acv-color-glyph-brand);
      box-shadow: inset 0 0 0 1px var(--acv-color-glyph-brand);
    }

    &:disabled {
      cursor: default;
    }
  }

  .choice-name {
    @mixin acv-text-ui-body-2-medium;
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-primary);
  }

  .badge {
    @mixin acv-text-ui-caption-1;
    padding: 0 6px;
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-secondary);
    color: var(--acv-color-glyph-brand);
  }

  .connect-row,
  .add-row {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-regular);
    margin-block-start: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .byok {
    display: grid;
    gap: var(--acv-spacing-small);
    margin-block-start: var(--acv-spacing-regular);
  }

  .three {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-small);

    & .span {
      grid-column: 1 / -1;
    }
  }

  .org-default {
    max-inline-size: 360px;
    margin-block-end: var(--acv-spacing-regular);
  }

  .review {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .review-title {
    @mixin acv-text-ui-body-2-medium;
    display: block;
    color: var(--acv-color-glyph-primary);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-regular);
  }

  .spacer {
    flex: 1;
  }
</style>
