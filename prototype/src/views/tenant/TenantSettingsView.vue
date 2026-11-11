<script setup lang="ts">
import { instance, latestRelease, updateAvailable } from '@/state/instance';
import NotificationSettings from '@/components/tenant/NotificationSettings.vue';
import SignInSettings from '@/components/tenant/SignInSettings.vue';
import SupportAccessSettings from '@/components/tenant/SupportAccessSettings.vue';
import ToolConnectDialog from '@/components/tenant/ToolConnectDialog.vue';
import TenantLicenseSummary from '@/components/root/TenantLicenseSummary.vue';
import TenantLicensesSettings from '@/components/root/TenantLicensesSettings.vue';
import RolloutSettings from '@/components/root/RolloutSettings.vue';
import { licenseOfTenant, offersLicenses } from '@/state/tenantLicenses';
import { ROOT_TENANT_ID } from '@/data/mock';
import { GoButton } from '@constructor/ui/button';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSecondaryNavigation, GoSecondaryNavigationItem, GoSecondaryNavigationSection } from '@constructor/ui/secondary-navigation';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import StatusTag from '@/components/ui/StatusTag.vue';
import { GoStepper, GoStepperItem } from '@constructor/ui/stepper';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { IconBell, IconCloud, IconLock, IconOrganization, IconPersonGear, IconPlugConnection, IconReceipt, IconRocket } from '@/components/icons';
import UsageMeter from '@/components/ui/UsageMeter.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { fmtAgo, fmtCredits, fmtDate, fmtDateTime, fmtInt } from '@/lib/format';
import { db, record, tenantById } from '@/state/db';
import { activePeopleSource, integrationsFor, type Integration } from '@/state/integrations';
import { session } from '@/state/session';

const route = useRoute();
const { notify } = useNotificationsStore();
// Also embedded in the root console's settings for the root tenant itself.
const props = defineProps<{ embeddedTenantId?: string; embeddedSection?: string }>();
const embedded = computed(() => !!props.embeddedTenantId);
const tenantId = props.embeddedTenantId ?? String(route.params.tenantId ?? ROOT_TENANT_ID);
const tenant = computed(() => tenantById(tenantId));
const integrations = integrationsFor(tenantId);

const GROUPS = [
  { title: 'Organization', items: [
    { id: 'general', label: 'General', icon: IconOrganization },
    { id: 'license', label: 'License', icon: IconReceipt },
    { id: 'integrations', label: 'Integrations', icon: IconPlugConnection },
    { id: 'notifications', label: 'Notifications', icon: IconBell },
    { id: 'signin', label: 'Sign-in options', icon: IconLock },
    { id: 'support', label: 'Support access', icon: IconPersonGear },
  ] },
];
// A partner that creates tenants and deploys its own models offers licenses of its own.
// Tenants that manage their own models (own keys or deployments) set how those roll out.
const managesOwnModels = computed(() => !isRoot.value && (!!licenseOfTenant(tenant.value)?.ownKeys || !!licenseOfTenant(tenant.value)?.ownModels));
const groups = computed(() => {
  const g = [...GROUPS];
  if (managesOwnModels.value) g.push({ title: 'Your models', items: [{ id: 'rollout', label: 'Model rollout', icon: IconRocket }] });
  if (offersLicenses(tenant.value)) g.push({ title: 'Your customers', items: [{ id: 'licenses', label: 'Licenses', icon: IconReceipt }] });
  return g;
});
const section = computed(() => props.embeddedSection ?? String(route.query.section ?? 'general'));

// ---- organization license: what the platform sells this tenant
const seatsAssigned = computed(() => db.licenses.filter((l) => l.tenantId === tenantId).reduce((n, l) => n + l.holders, 0));
const ORG_LICENSE = {
  plan: 'Enterprise',
  start: '2026-01-15',
  end: '2027-01-14',
  families: ['Claude', 'GPT', 'Gemini', 'GLM', 'Qwen', 'gpt-oss'],
  features: ['SSO and claims mapping', 'Organization sync', 'Bring your own key', 'Own models', 'MCP registry', 'Guardrails', 'Audit log', 'CSV export'],
  support: 'Premium · 4-hour response, named engineer',
};
// The plan and term the instance admin set for this tenant, when set.
const plan = computed(() => tenant.value?.plan ?? ORG_LICENSE.plan);
const licenseEnd = computed(() => tenant.value?.licenseEnd ?? ORG_LICENSE.end);
const daysLeft = computed(() => Math.round((Date.parse(licenseEnd.value) - Date.parse('2026-11-10')) / 86_400_000));
const isRoot = computed(() => tenantId === ROOT_TENANT_ID);
const tenantLicense = computed(() => licenseOfTenant(tenant.value));
const importOpen = ref(false);
const licenseKey = ref('');
function importLicense(): void {
  audit('Imported a license key', 'Instance license');
  notify('The key is signed by Constructor and valid. It takes effect after the next restart of the gateway.', 'success', 'License imported');
  importOpen.value = false;
  licenseKey.value = '';
}

function requestChange(): void {
  audit('Requested a change to the organization license', 'Organization license');
  notify('Request sent to your Constructor account manager. You will hear back within one business day.', 'success', 'License change requested');
}

// ---- catalog
type Filter = 'all' | 'connected' | 'available';
const filter = ref<Filter>('all');
const isOn = (i: Integration) => i.status !== 'available';
const shown = computed(() => integrations.filter((i) => filter.value === 'all' || (filter.value === 'connected' ? isOn(i) : !isOn(i))));
// The catalog is split by what an integration is for, in this order.
const KIND_INFO: { kind: Integration['kind']; title: string; text: string }[] = [
  { kind: 'models', title: 'Model sources', text: 'Where open-weight models are downloaded from for admission.' },
  { kind: 'users', title: 'User sources', text: 'Bring in users, departments, teams and managers. One at a time.' },
  { kind: 'identity', title: 'Identity provisioning', text: 'Your identity provider pushes users and groups over SCIM.' },
  { kind: 'observability', title: 'Observability', text: 'Send traces, metrics and logs to the tools your teams already use.' },
  { kind: 'security', title: 'Security & audit', text: 'Stream the audit log to your SIEM.' },
];
const kindFilter = ref<'all' | Integration['kind']>('all');
const kindsPresent = computed(() => KIND_INFO.filter((k) => integrations.some((i) => i.kind === k.kind)));
const kindCount = (k: 'all' | Integration['kind']) => shown.value.filter((i) => k === 'all' || i.kind === k).length;
const groupsShown = computed(() => KIND_INFO.filter((k) => kindFilter.value === 'all' || k.kind === kindFilter.value).map((k) => ({ ...k, items: shown.value.filter((i) => i.kind === k.kind) })).filter((g) => g.items.length));
const count = (f: Filter) => integrations.filter((i) => f === 'all' || (f === 'connected' ? isOn(i) : !isOn(i))).length;
const KIND = { users: 'Users & organization', identity: 'Identity provisioning', models: 'Model source', observability: 'Observability', security: 'Security & audit' };
// User sources sync users on a schedule; tools receive what Token Factory sends.
const isSource = (i: Integration) => i.kind === 'users' || i.kind === 'identity';
// Tools name their credentials themselves (public key, HEC token, …).
const idLabel = (i: Integration) => i.fields?.filter((f) => !f.secret && !/url|host|site/i.test(f.label))[0]?.label ?? 'Client ID';
const secretLabel = (i: Integration) => i.fields?.find((f) => f.secret)?.label ?? 'Client secret';
const toolOpen = ref(false);
const toolTarget = ref<Integration | null>(null);
const STATUS = { connected: 'success', paused: 'warning', available: 'disabled' } as const;
const STATUS_LABEL = { connected: 'Connected', paused: 'Paused', available: 'Not connected' } as const;
const SCHEDULE = { hourly: 'Every hour', daily: 'Daily at 02:00 UTC', manual: 'Only when run by hand' } as const;

// ---- test a connection: one authenticated call, no data changes
const testing = ref<string | null>(null);
function testConnection(i: Integration): void {
  testing.value = i.id;
  setTimeout(() => {
    i.lastTest = { at: new Date().toISOString(), ok: true, ms: 150 + Math.round(Math.random() * 120) };
    testing.value = null;
    audit(`Tested connection to ${i.name}`, i.name);
    notify(`Signed in and read the organization in ${i.lastTest.ms} ms. Nothing was changed.`, 'success', `${i.name}: connection works`);
  }, 700);
}
const testText = (i: Integration) => (i.lastTest ? `${i.lastTest.ok ? 'Connection works' : 'Connection failed'} · tested ${fmtAgo(i.lastTest.at)}` : 'Not tested yet');
const people = computed(() => activePeopleSource(tenantId));

function audit(action: string, target: string): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenant.value?.name : undefined, action, target, tenantId });
}

// ---- connect wizard
const wizardOpen = ref(false);
const target = ref<Integration | null>(null);
const step = ref(0);
const STEPS = ['Connect', 'What to sync', 'Schedule', 'Test & preview'];
const form = reactive({ subdomain: 'acme', apiKey: '', signedIn: false, users: true, units: true, managers: true, deactivate: true, schedule: 'hourly' as Integration['schedule'] });
const replaces = computed(() => (target.value?.kind === 'users' && people.value && people.value.id !== target.value.id ? people.value : undefined));
const canNext = computed(() => {
  if (step.value !== 0 || !target.value) return true;
  if (target.value.auth === 'api-key') return !!form.subdomain && !!form.apiKey;
  if (target.value.auth === 'oauth') return form.signedIn;
  return true;
});

const MAPPING: Record<string, { from: string; to: string }[]> = {
  bamboohr: [
    { from: 'Work email', to: 'Login and user email' },
    { from: 'Department', to: 'Department unit' },
    { from: 'Division / Team', to: 'Team unit under the department' },
    { from: 'Job title', to: 'Title' },
    { from: 'Reports to', to: 'Manager, and unit manager' },
    { from: 'Status = Inactive', to: 'User disabled, keys revoked' },
  ],
  default: [
    { from: 'Email', to: 'Login and user email' },
    { from: 'Department / organization', to: 'Department unit' },
    { from: 'Team', to: 'Team unit' },
    { from: 'Title', to: 'Title' },
    { from: 'Manager', to: 'Manager, and unit manager' },
  ],
};
const mapping = computed(() => MAPPING[target.value?.id ?? ''] ?? MAPPING.default!);

function openConnect(i: Integration): void {
  if (!isSource(i)) {
    toolTarget.value = i;
    toolOpen.value = true;
    return;
  }
  target.value = i;
  step.value = 0;
  Object.assign(form, { subdomain: 'acme', apiKey: '', signedIn: false, users: true, units: true, managers: true, deactivate: true, schedule: 'hourly' });
  wizardOpen.value = true;
}

function finish(): void {
  const i = target.value;
  if (!i) return;
  const old = replaces.value;
  if (old) {
    old.status = 'available';
    audit(`Disconnected ${old.name} as user source`, old.name);
  }
  Object.assign(i, {
    status: 'connected',
    account: i.auth === 'api-key' ? `${form.subdomain}.bamboohr.com` : i.auth === 'scim' ? 'SCIM endpoint' : `${i.vendor} account`,
    url: i.auth === 'api-key' ? `https://${form.subdomain}.bamboohr.com` : i.auth === 'scim' ? 'https://tf.constructor.tech/scim/v2/t-acme' : `https://${i.vendor.toLowerCase().replace(/\s+/g, '')}.com`,
    clientId: i.auth === 'api-key' ? 'API key' : `tf-${i.id}-${Math.random().toString(16).slice(2, 8)}`,
    secretHint: `••••••••••••${(form.apiKey || Math.random().toString(16)).slice(-4)}`,
    lastTest: { at: new Date().toISOString(), ok: true, ms: 204 },
    syncs: { users: form.users, units: form.units, managers: form.managers, deactivate: form.deactivate },
    schedule: form.schedule,
    lastSync: new Date().toISOString(),
    people: 1236,
    units: 17,
  });
  i.history.unshift({ at: new Date().toISOString(), result: 'partial', note: 'First sync: 1,236 users, 17 units; 4 skipped without a work email' });
  audit(`Connected ${i.name}${old ? ` (replaces ${old.name})` : ''}`, i.name);
  notify(`${i.name} connected and synced: 1,236 users, 17 departments and teams.${old ? ` ${old.name} no longer manages users.` : ''}`, 'success', 'Integration connected');
  wizardOpen.value = false;
}

// ---- manage a connected integration
const manageOpen = ref(false);
const managed = ref<Integration | null>(null);
const editing = ref(false);
const edit = reactive({ url: '', clientId: '', secret: '', schedule: 'hourly' as Integration['schedule'], users: true, units: true, managers: true, deactivate: true });
function openManage(i: Integration): void {
  managed.value = i;
  editing.value = false;
  manageOpen.value = true;
}
function startEdit(): void {
  const i = managed.value;
  if (!i) return;
  Object.assign(edit, { url: i.url ?? '', clientId: i.clientId ?? '', secret: '', schedule: i.schedule, ...i.syncs });
  editing.value = true;
}
function saveEdit(): void {
  const i = managed.value;
  if (!i) return;
  Object.assign(i, {
    url: edit.url, clientId: edit.clientId, schedule: edit.schedule,
    syncs: { users: edit.users, units: edit.units, managers: edit.managers, deactivate: edit.deactivate },
    secretHint: edit.secret ? `••••••••••••${edit.secret.slice(-4)}` : i.secretHint,
  });
  audit(`Edited settings of ${i.name}${edit.secret ? ' (new secret)' : ''}`, i.name);
  editing.value = false;
  testConnection(i);
}
const mask = (v?: string) => (v ? `${v.slice(0, 4)}••••••••${v.slice(-2)}` : '—');
function syncNow(): void {
  const i = managed.value;
  if (!i) return;
  i.lastSync = new Date().toISOString();
  i.history.unshift({ at: i.lastSync, result: 'success', note: 'No changes' });
  audit(`Ran sync now for ${i.name}`, i.name);
  notify(`${i.name}: synced, no changes.`, 'success');
}
function togglePause(): void {
  const i = managed.value;
  if (!i) return;
  i.status = i.status === 'paused' ? 'connected' : 'paused';
  audit(`${i.status === 'paused' ? 'Paused' : 'Resumed'} ${i.name}`, i.name);
  notify(i.status === 'paused' ? `${i.name} paused. Users and units stay as they are until you resume.` : `${i.name} resumed.`, 'info');
}
function disconnect(): void {
  const i = managed.value;
  if (!i) return;
  i.status = 'available';
  audit(`Disconnected ${i.name}`, i.name);
  notify(`${i.name} disconnected. Units and users stay; nothing updates them until you connect a source.`, 'warning');
  manageOpen.value = false;
}
</script>

<template>
  <div v-if="tenant">
    <PageHeader v-if="!embedded" title="Settings" description="Settings for this organization: its profile, license, connected services, notifications and sign-in." />

    <div class="settings-layout" :class="{ 'settings-layout_embedded': embedded }">
      <GoSecondaryNavigation v-if="!embedded" aria-label="Settings sections">
        <GoSecondaryNavigationSection v-for="g in groups" :key="g.title">
          <template #title>{{ g.title }}</template>
          <GoSecondaryNavigationItem v-for="item in g.items" :key="item.id" :component="'a'" :component-props="{ href: `#/t/${tenantId}/settings?section=${item.id}` }" :active="section === item.id">
            <template #icon><component :is="item.icon" /></template>
            {{ item.label }}
          </GoSecondaryNavigationItem>
        </GoSecondaryNavigationSection>
      </GoSecondaryNavigation>

      <div class="section">
        <Card v-if="section === 'general'" title="General">
          <GoDescriptionList>
            <GoDescriptionListItem><template #name>Name</template><template #value>{{ tenant.name }}</template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>Description</template><template #value>{{ tenant.description ?? '—' }}</template></GoDescriptionListItem>
          </GoDescriptionList>
        </Card>

        <Card v-else-if="section === 'license' && isRoot" title="Community license" subtitle="Free · Token Factory open-source project" fill>
          <GoDescriptionList>
            <GoDescriptionListItem><template #name>License</template><template #value>Apache License 2.0</template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>Source</template><template #value>github.com/constructorfabric/token-factory</template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>Seats and credits</template><template #value>No limits — you size this instance yourself</template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>Version</template><template #value>Token Factory {{ instance.version }} · {{ instance.channel }}<RouterLink v-if="updateAvailable()" class="update-link" to="/root/settings?section=updates">{{ latestRelease().version }} available</RouterLink></template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>Support</template><template #value>Community, through the project’s issues and discussions</template></GoDescriptionListItem>
          </GoDescriptionList>
          <p class="hint-text">A commercial license adds support with response times and the enterprise features; import it here when you have one.</p>
          <div class="card-actions"><GoButton variant="secondary" size="m" @click="importOpen = true">Import license</GoButton></div>
        </Card>

        <Card v-else-if="section === 'license'" :title="`${tenantLicense?.name ?? plan} license`" :subtitle="`${fmtDate(ORG_LICENSE.start)} – ${fmtDate(licenseEnd)} · renews in ${daysLeft} days`" fill>
          <UsageMeter label="Seats assigned" :used="seatsAssigned" :limit="tenant.seats" :format="fmtInt" />
          <UsageMeter label="AI credits this month" :used="tenant.spend30d" :limit="tenant.budget30d" :format="fmtCredits" />
          <TenantLicenseSummary v-if="tenantLicense" :license="tenantLicense" class="lic-summary" />
          <div class="card-actions">
            <GoButton variant="secondary" size="m" @click="requestChange">Request change</GoButton>
          </div>
        </Card>

        <TenantLicensesSettings v-else-if="section === 'licenses' && offersLicenses(tenant)" :owner-id="tenantId" />
        <RolloutSettings v-else-if="section === 'rollout' && managesOwnModels" :tenant-id="tenantId" />
        <NotificationSettings v-else-if="section === 'notifications'" :tenant-id="tenantId" />

        <SignInSettings v-else-if="section === 'signin'" :tenant-id="tenantId" />

        <SupportAccessSettings v-else-if="section === 'support'" :tenant-id="tenantId" />

        <template v-else>
          <div class="toolbar">
            <GoSegmentButtonGroup v-model="kindFilter" size="s" aria-label="Type">
              <GoSegmentButton value="all">All types</GoSegmentButton>
              <GoSegmentButton v-for="k in kindsPresent" :key="k.kind" :value="k.kind">{{ k.title }} {{ kindCount(k.kind) }}</GoSegmentButton>
            </GoSegmentButtonGroup>
            <GoSegmentButtonGroup v-model="filter" size="s" aria-label="Filter">
              <GoSegmentButton value="all">All {{ count('all') }}</GoSegmentButton>
              <GoSegmentButton value="connected">Connected {{ count('connected') }}</GoSegmentButton>
              <GoSegmentButton value="available">Available {{ count('available') }}</GoSegmentButton>
            </GoSegmentButtonGroup>
          </div>

          <section v-for="g in groupsShown" :key="g.kind" class="kind-group">
            <div class="kind-head">
              <h2 class="kind-title">{{ g.title }}</h2>
              <span class="kind-text">{{ g.text }}</span>
            </div>
          <div class="catalog">
            <article v-for="i in g.items" :key="i.id" class="integration">
              <header class="head">
                <span class="logo" aria-hidden="true">{{ i.vendor.slice(0, 2) }}</span>
                <div class="titles">
                  <h2 class="name">{{ i.name }}</h2>
                  <span class="kind">{{ KIND[i.kind] }}</span>
                </div>
                <StatusTag :variant="STATUS[i.status]" size="sm">{{ STATUS_LABEL[i.status] }}</StatusTag>
              </header>
              <p class="desc">{{ i.description }}</p>
              <p v-if="isOn(i) && isSource(i)" class="meta">{{ i.account }} · {{ fmtInt(i.people ?? 0) }} users · {{ i.units }} units · synced {{ fmtAgo(i.lastSync ?? null) }}</p>
              <p v-else-if="isOn(i)" class="meta">{{ i.account }} · {{ (i.sends ?? []).join(' · ') }}</p>
              <div class="foot">
                <template v-if="isOn(i)">
                  <span class="test-result">{{ testText(i) }}</span>
                  <GoButton variant="secondary" size="s" :loading="testing === i.id" @click="testConnection(i)">Test connection</GoButton>
                  <GoButton variant="secondary" size="s" @click="openManage(i)">Manage</GoButton>
                </template>
                <GoButton v-else size="s" @click="openConnect(i)">Connect</GoButton>
              </div>
            </article>
          </div>
          </section>
        </template>
      </div>
    </div>

    <!-- Connect: four steps, ending in a preview of what the sync will do. -->
    <GoDialog v-model="wizardOpen" size="l">
      <GoDialogWindow v-if="target" :title="`Connect ${target.name}`" header-border @close="wizardOpen = false">
        <GoStepper class="stepper">
          <GoStepperItem v-for="(s, n) in STEPS" :key="s" :variant="n < step ? 'done' : n === step ? 'active' : 'inactive'">{{ s }}</GoStepperItem>
        </GoStepper>

        <div v-if="step === 0" class="fields">
          <template v-if="target.auth === 'api-key'">
            <GoFormControl label="Company domain" label-for="int-sub" hint="The part before .bamboohr.com">
              <GoInput id="int-sub" v-model="form.subdomain" size="m"><template #suffix>.bamboohr.com</template></GoInput>
            </GoFormControl>
            <GoFormControl label="API key" label-for="int-key" required hint="Create it in BambooHR under your profile → API keys. A read-only user is enough.">
              <GoInput id="int-key" v-model="form.apiKey" type="password" size="m" placeholder="Paste the API key" />
            </GoFormControl>
          </template>
          <template v-else-if="target.auth === 'oauth'">
            <p class="text">Sign in to {{ target.vendor }} as an administrator and allow Token Factory to read users and the organization structure.</p>
            <GoButton :variant="form.signedIn ? 'secondary' : 'primary'" size="m" @click="form.signedIn = true">
              <template #icon><IconCloud /></template>
              {{ form.signedIn ? `Signed in to ${target.vendor}` : `Sign in with ${target.vendor}` }}
            </GoButton>
          </template>
          <template v-else>
            <p class="text">Add Token Factory as a SCIM app in {{ target.vendor }} with this endpoint and token.</p>
            <GoDescriptionList>
              <GoDescriptionListItem><template #name>SCIM endpoint</template><template #value><code>https://tf.constructor.tech/scim/v2/t-acme</code></template></GoDescriptionListItem>
              <GoDescriptionListItem><template #name>Token</template><template #value><code>scim_••••••••••••7f2c</code> (shown once)</template></GoDescriptionListItem>
            </GoDescriptionList>
          </template>
        </div>

        <div v-else-if="step === 1" class="fields">
          <div class="toggles">
            <GoToggle v-model="form.users">Users — create and update users</GoToggle>
            <GoToggle v-model="form.units">Departments and teams — keep organization units in step</GoToggle>
            <GoToggle v-model="form.managers">Managers — set unit managers and reporting lines</GoToggle>
            <GoToggle v-model="form.deactivate">Leavers — disable the user and revoke their keys</GoToggle>
          </div>
          <GoTable size="sm">
            <GoTableRow header>
              <GoTableCell>{{ target.name }} field</GoTableCell>
              <GoTableCell>Becomes in Token Factory</GoTableCell>
            </GoTableRow>
            <GoTableRow v-for="m in mapping" :key="m.from">
              <GoTableCell>{{ m.from }}</GoTableCell>
              <GoTableCell>{{ m.to }}</GoTableCell>
            </GoTableRow>
          </GoTable>
        </div>

        <div v-else-if="step === 2" class="fields">
          <GoFormControl label="How often">
            <GoSegmentButtonGroup v-model="form.schedule" size="s" aria-label="How often">
              <GoSegmentButton value="hourly">Every hour</GoSegmentButton>
              <GoSegmentButton value="daily">Daily at 02:00 UTC</GoSegmentButton>
              <GoSegmentButton value="manual">Only when I run it</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <p class="text">A user who moves unit gets the new unit's default license at the next sync; a personal override is kept.</p>
        </div>

        <div v-else class="fields">
          <GoMessage variant="success" border rounded>
            Connection works — preview of the first sync
            <template #addition>1,236 users, 17 departments and teams. Compared with today: 3 users new, 2 moved unit, 1 leaver. 4 users have no work email and will be skipped.</template>
          </GoMessage>
          <GoMessage v-if="replaces" variant="warning" border rounded>
            {{ target.name }} replaces {{ replaces.name }} as the users source
            <template #addition>Only one source can manage users and units. {{ replaces.name }} stops syncing; existing units and licenses stay and are matched by name.</template>
          </GoMessage>
        </div>

        <template #footer>
          <div class="footer">
            <GoButton v-if="step > 0" variant="secondary" size="m" @click="step--">Back</GoButton>
            <span class="spacer" />
            <GoButton variant="secondary" size="m" @click="wizardOpen = false">Cancel</GoButton>
            <GoButton v-if="step < STEPS.length - 1" size="m" :disabled="!canNext" @click="step++">Next</GoButton>
            <GoButton v-else size="m" @click="finish">Connect and sync</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>

    <!-- Manage a connected integration: what it is, how it connects, how it went; edit and test. -->
    <GoDialog v-model="manageOpen" size="l">
      <GoDialogWindow v-if="managed" :title="managed.name" header-border @close="manageOpen = false">
        <div v-if="!editing" class="fields">
          <GoDescriptionList>
            <GoDescriptionListItem><template #name>Status</template><template #value><StatusTag :variant="STATUS[managed.status]" size="sm">{{ STATUS_LABEL[managed.status] }}</StatusTag> <span class="test-result">{{ testText(managed) }}</span></template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>URL</template><template #value><code>{{ managed.url ?? '—' }}</code></template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>{{ idLabel(managed) }}</template><template #value><code>{{ mask(managed.clientId) }}</code></template></GoDescriptionListItem>
            <GoDescriptionListItem><template #name>{{ secretLabel(managed) }}</template><template #value><code>{{ managed.secretHint ?? '—' }}</code></template></GoDescriptionListItem>
            <GoDescriptionListItem v-if="!isSource(managed)"><template #name>{{ managed.kind === 'models' ? 'Used for' : 'Sends' }}</template><template #value><span class="syncs"><GoTag v-for="x in managed.sends" :key="x" size="s" color="neutral">{{ x }}</GoTag></span></template></GoDescriptionListItem>
            <GoDescriptionListItem v-if="isSource(managed)"><template #name>Schedule</template><template #value>{{ SCHEDULE[managed.schedule] }} · last sync {{ fmtAgo(managed.lastSync ?? null) }}</template></GoDescriptionListItem>
            <GoDescriptionListItem v-if="isSource(managed)"><template #name>Brings in</template><template #value>
              {{ fmtInt(managed.people ?? 0) }} users · {{ managed.units }} units
              <span class="syncs">
                <GoTag v-if="managed.syncs.users" size="s" color="neutral">users</GoTag>
                <GoTag v-if="managed.syncs.units" size="s" color="neutral">departments & teams</GoTag>
                <GoTag v-if="managed.syncs.managers" size="s" color="neutral">managers</GoTag>
                <GoTag v-if="managed.syncs.deactivate" size="s" color="neutral">leavers</GoTag>
              </span>
            </template></GoDescriptionListItem>
          </GoDescriptionList>
          <h3 v-if="isSource(managed)" class="sub-title">Recent syncs</h3>
          <GoTable v-if="isSource(managed)" size="sm">
            <GoTableRow v-for="(h, n) in managed.history.slice(0, 6)" :key="n">
              <GoTableCell>{{ fmtDateTime(h.at) }}</GoTableCell>
              <GoTableCell><StatusTag :variant="h.result === 'success' ? 'success' : h.result === 'partial' ? 'warning' : 'error'" size="xs">{{ h.result }}</StatusTag></GoTableCell>
              <GoTableCell>{{ h.note }}</GoTableCell>
            </GoTableRow>
          </GoTable>
        </div>

        <div v-else class="fields">
          <GoFormControl label="URL" label-for="m-url">
            <GoInput id="m-url" v-model="edit.url" size="m" />
          </GoFormControl>
          <div class="pair">
            <GoFormControl label="Client ID" label-for="m-client">
              <GoInput id="m-client" v-model="edit.clientId" size="m" />
            </GoFormControl>
            <GoFormControl label="Client secret" label-for="m-secret" :hint="`Leave empty to keep the current one (${managed.secretHint}).`">
              <GoInput id="m-secret" v-model="edit.secret" type="password" size="m" placeholder="New secret" />
            </GoFormControl>
          </div>
          <GoFormControl label="Schedule">
            <GoSegmentButtonGroup v-model="edit.schedule" size="s" aria-label="Schedule">
              <GoSegmentButton value="hourly">Every hour</GoSegmentButton>
              <GoSegmentButton value="daily">Daily at 02:00 UTC</GoSegmentButton>
              <GoSegmentButton value="manual">Only when I run it</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <div class="toggles">
            <GoToggle v-model="edit.users">Users — create and update users</GoToggle>
            <GoToggle v-model="edit.units">Departments and teams — keep organization units in step</GoToggle>
            <GoToggle v-model="edit.managers">Managers — set unit managers and reporting lines</GoToggle>
            <GoToggle v-model="edit.deactivate">Leavers — disable the user and revoke their keys</GoToggle>
          </div>
        </div>

        <template #footer>
          <div v-if="!editing" class="footer">
            <GoButton variant="danger" size="m" @click="disconnect">Disconnect</GoButton>
            <span class="spacer" />
            <GoButton v-if="isSource(managed)" variant="secondary" size="m" @click="togglePause">{{ managed.status === 'paused' ? 'Resume' : 'Pause' }}</GoButton>
            <GoButton variant="secondary" size="m" @click="startEdit">Edit settings</GoButton>
            <GoButton variant="secondary" size="m" :loading="testing === managed.id" @click="testConnection(managed)">Test connection</GoButton>
            <GoButton v-if="isSource(managed)" size="m" :disabled="managed.status === 'paused'" @click="syncNow">Sync now</GoButton>
          </div>
          <div v-else class="footer">
            <span class="spacer" />
            <GoButton variant="secondary" size="m" @click="editing = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!edit.url" @click="saveEdit">Save and test</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>

    <ToolConnectDialog v-model="toolOpen" :tenant-id="tenantId" :integration="toolTarget" />

    <GoDialog v-model="importOpen" size="m">
      <GoDialogWindow title="Import license" header-border @close="importOpen = false">
        <div class="fields">
          <p class="text">Paste the license key you received from Constructor, or the contents of the license file. It is checked offline against its signature.</p>
          <GoFormControl label="License key" label-for="imp-key">
            <GoInput id="imp-key" v-model="licenseKey" type="textarea" size="m" placeholder="-----BEGIN TOKEN FACTORY LICENSE-----" />
          </GoFormControl>
        </div>
        <template #footer>
          <div class="footer">
            <span class="spacer" />
            <GoButton variant="secondary" size="m" @click="importOpen = false">Cancel</GoButton>
            <GoButton size="m" :disabled="licenseKey.trim().length < 20" @click="importLicense">Import</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .lic-summary {
    margin-block-start: var(--acv-spacing-regular);
  }

  .update-link {
    @mixin acv-text-ui-caption-1;
    margin-inline-start: var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-brand);
  }

  .settings-layout {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: var(--acv-spacing-large);
    align-items: start;

    &.settings-layout_embedded {
      display: block;
    }
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .hint-text {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-regular) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .card-actions {
    display: flex;
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-regular);
  }

  .toolbar {
    margin-block-end: var(--acv-spacing-regular);
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--acv-spacing-small);
  }

  .kind-group + .kind-group {
    margin-block-start: var(--acv-spacing-large);
  }

  .kind-head {
    display: grid;
    gap: 2px;
    margin-block-end: var(--acv-spacing-small);
    padding-block-end: var(--acv-spacing-x-small);
    border-block-end: var(--acv-border-light);
  }

  .kind-title {
    @mixin acv-text-subheading-3;
    margin: 0;
    color: var(--acv-color-glyph-primary);
  }

  .kind-text {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .catalog {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .integration {
    display: flex;
    flex-direction: column;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-regular) var(--acv-spacing-medium);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
  }

  .head {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .logo {
    @mixin acv-text-ui-caption-1-medium;
    display: grid;
    place-items: center;
    inline-size: 36px;
    block-size: 36px;
    border-radius: var(--acv-radius-regular);
    background: var(--acv-color-surface-tertiary);
    color: var(--acv-color-glyph-secondary);
    text-transform: uppercase;
  }

  .titles {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  .name {
    @mixin acv-text-subheading-3;
    margin: 0;
  }

  .kind,
  .meta {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-tertiary);
  }

  .desc,
  .text {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
    margin-block-start: auto;
  }

  .test-result {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .foot .test-result {
    margin-inline-end: auto;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-small);
  }

  .syncs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-block-start: 4px;
  }

  .stepper {
    margin-block-end: var(--acv-spacing-large);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .toggles {
    display: grid;
    gap: var(--acv-spacing-small);
  }

  .sub-title {
    @mixin acv-text-subheading-3;
    margin: 0;
  }

  .footer {
    display: flex;
    gap: var(--acv-spacing-x-small);
  }

  .spacer {
    flex: 1;
  }
</style>
