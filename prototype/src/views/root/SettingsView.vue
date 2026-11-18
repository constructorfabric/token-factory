<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoSecondaryNavigation, GoSecondaryNavigationItem, GoSecondaryNavigationSection } from '@constructor/ui/secondary-navigation';
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { IconBell, IconCloud, IconLock, IconOrganization, IconPlugConnection, IconReceipt, IconRefresh, IconRocket, IconUsersNewui } from '@/components/icons';
import TenantSettingsView from '@/views/tenant/TenantSettingsView.vue';
import UpdatesSettings from '@/components/root/UpdatesSettings.vue';
import TenantLicensesSettings from '@/components/root/TenantLicensesSettings.vue';
import RolloutSettings from '@/components/root/RolloutSettings.vue';
import GatewaySettings from '@/components/root/GatewaySettings.vue';
import { ROOT_TENANT_ID } from '@/data/mock';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { record } from '@/state/db';
import { isV1, V1_HIDDEN_SETTINGS } from '@/state/scope';

const { notify } = useNotificationsStore();
const route = useRoute();

// Second-level navigation: one section at a time, each with its own address.
const GROUPS = [
  { title: 'Root tenant', items: [
    { id: 'org-general', label: 'General', icon: IconOrganization },
    { id: 'org-integrations', label: 'Integrations', icon: IconPlugConnection },
    { id: 'org-notifications', label: 'Notifications', icon: IconBell },
    { id: 'org-signin', label: 'Sign-in options', icon: IconLock },
  ] },
  { title: 'Instance', items: [
    { id: 'instance', label: 'Configuration', icon: IconCloud },
    { id: 'licenses', label: 'Tenant licenses', icon: IconReceipt },
    { id: 'rollout', label: 'Model rollout', icon: IconRocket },
    { id: 'gateway', label: 'Gateway', icon: IconPlugConnection },
    { id: 'data', label: 'Data retention', icon: IconLock },
    { id: 'org-license', label: 'License', icon: IconReceipt },
    { id: 'updates', label: 'Updates', icon: IconRefresh },
  ] },
  { title: 'Access', items: [
    { id: 'roles', label: 'Roles & permissions', icon: IconUsersNewui },
  ] },
];
// In v1 the email notification settings are hidden; an address to one opens General.
const shownGroups = computed(() => GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !(isV1.value && V1_HIDDEN_SETTINGS.has(i.id))) })).filter((g) => g.items.length));
const section = computed(() => {
  const asked = String(route.query.section ?? 'org-general');
  return isV1.value && V1_HIDDEN_SETTINGS.has(asked) ? 'org-general' : asked;
});

const s = reactive({ domain: 'tf.constructor.tech' });

// Outgoing mail for every tenant's notifications; each tenant sets its own sender.
const mail = reactive({ host: 'smtp.constructor.tech', port: 587, security: 'starttls', user: 'tf-notifications', password: '', from: 'noreply@tf.constructor.tech' });
const mailTesting = ref(false);
function testMail(): void {
  mailTesting.value = true;
  setTimeout(() => {
    mailTesting.value = false;
    notify(`Test email sent from ${mail.from} through ${mail.host}:${mail.port}.`, 'success', 'Mail server works');
  }, 700);
}

// What the instance keeps, and for how long. Tenants can shorten, never lengthen.
const RETENTION = reactive([
  { id: 'usage', name: 'Usage records', why: 'Credits, tokens and requests per user, key and model — reports and billing.', keep: '13 months', options: ['6 months', '13 months', '25 months'] },
  { id: 'audit', name: 'Audit log', why: 'Who changed what, sign-ins and support sessions — compliance evidence.', keep: '24 months', options: ['12 months', '24 months', '7 years'] },
  { id: 'traces', name: 'Call metadata', why: 'Per-call model, latency, status and token counts — troubleshooting.', keep: '30 days', options: ['7 days', '30 days', '90 days'] },
  { id: 'content', name: 'Prompt and response content', why: 'Not stored unless a tenant turns on content logging for debugging.', keep: 'Not stored', options: ['Not stored', '7 days', '30 days'] },
  { id: 'leavers', name: 'Disabled users', why: 'Their keys are revoked at once; their personal data is deleted after this.', keep: '30 days', options: ['7 days', '30 days', '90 days'] },
  { id: 'backups', name: 'Backups', why: 'Nightly copies of configuration and usage, for disaster recovery.', keep: '30 days', options: ['7 days', '30 days', '90 days'] },
]);

// The roles customer tenants use (state/roles.ts), and what each may do.
const ROLE_COLUMNS = ['User', 'Reports viewer', 'License manager', 'User manager', 'Customer admin', 'Support engineer', 'Service engineer'];
// Support and service engineers exist in the root tenant only.
const MATRIX: { what: string; roles: (boolean | string)[] }[] = [
  { what: 'Use models within their license', roles: [true, true, true, true, true, true, true] },
  { what: 'Create and revoke their own API keys', roles: [true, true, true, true, true, true, true] },
  { what: 'Request another license', roles: [true, true, true, true, true, true, true] },
  { what: 'Decide license requests', roles: ['their units, as manager', 'their units, as manager', true, true, true, false, false] },
  { what: 'View reports and the audit log', roles: [false, true, true, true, true, false, false] },
  { what: 'Create and edit licenses, set unit defaults', roles: [false, false, true, false, true, false, false] },
  { what: 'Invite and disable users, assign licenses', roles: [false, false, false, true, true, false, false] },
  { what: 'Assign roles', roles: [false, false, false, 'below admin', true, false, false] },
  { what: 'Models and provider keys', roles: [false, false, false, false, true, false, false] },
  { what: 'Organization settings: integrations, notifications, sign-in, support access', roles: [false, false, false, false, true, false, false] },
  { what: 'Create tenants beneath their own and choose their admin', roles: [false, false, false, false, 'when licensed', false, false] },
  { what: 'Impersonate a user of their own tenant', roles: [false, false, false, false, true, false, false] },
  { what: 'Enter a tenant read-only, within its support access', roles: [false, false, false, false, false, true, true] },
  { what: 'Enter a tenant with full access, within its support access', roles: [false, false, false, false, false, false, true] },
];

function save(): void {
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Changed instance settings (${section.value})`, target: 'Instance settings', tenantId: 'root' });
  notify('Saved.', 'success', 'Settings saved');
}

</script>

<template>
  <div>
    <PageHeader title="Settings" :description="isV1 ? 'The root tenant’s own settings, and this instance’s tenant licenses, updates and roles.' : 'The root tenant’s own settings, and this instance’s domain, mail, tenant licenses, model rollout, gateway behaviour, data retention, updates and roles.'">
      <template #actions><GoButton size="m" @click="save">Save</GoButton></template>
    </PageHeader>

    <div class="settings-layout">
      <GoSecondaryNavigation class="settings-nav" aria-label="Settings sections">
        <GoSecondaryNavigationSection v-for="g in shownGroups" :key="g.title">
          <template #title>{{ g.title }}</template>
          <GoSecondaryNavigationItem v-for="item in g.items" :key="item.id" :component="'a'" :component-props="{ href: `#/root/settings?section=${item.id}` }" :active="section === item.id">
            <template #icon><component :is="item.icon" /></template>
            {{ item.label }}
          </GoSecondaryNavigationItem>
        </GoSecondaryNavigationSection>
      </GoSecondaryNavigation>
      <div class="section">
      <TenantSettingsView v-if="section.startsWith('org-')" :key="section" :embedded-tenant-id="ROOT_TENANT_ID" :embedded-section="section.slice(4)" />
      <UpdatesSettings v-if="section === 'updates'" />
      <TenantLicensesSettings v-if="section === 'licenses'" owner-id="root" />
      <RolloutSettings v-if="section === 'rollout'" tenant-id="root" />
      <GatewaySettings v-if="section === 'gateway'" />
      <template v-if="section === 'instance'">
        <Card title="Configuration">
          <GoFormControl label="Domain" label-for="set-domain" hint="Where users reach the portal and the API.">
            <GoInput id="set-domain" v-model="s.domain" size="m" />
          </GoFormControl>
        </Card>
        <Card v-if="!isV1" title="Mail server" subtitle="Outgoing email for notifications; each tenant chooses its own sender name and address" class="spaced">
          <div class="fields">
            <div class="mail-row">
              <GoFormControl label="SMTP host" label-for="mail-host"><GoInput id="mail-host" v-model="mail.host" size="m" /></GoFormControl>
              <GoFormControl label="Port" label-for="mail-port"><GoInputNumber id="mail-port" v-model="mail.port" :min="1" :max="65535" size="m" /></GoFormControl>
              <GoFormControl label="Security">
                <GoSegmentButtonGroup v-model="mail.security" size="s" aria-label="Security">
                  <GoSegmentButton value="starttls">STARTTLS</GoSegmentButton>
                  <GoSegmentButton value="tls">TLS</GoSegmentButton>
                  <GoSegmentButton value="none">None</GoSegmentButton>
                </GoSegmentButtonGroup>
              </GoFormControl>
            </div>
            <div class="two">
              <GoFormControl label="Username" label-for="mail-user"><GoInput id="mail-user" v-model="mail.user" size="m" /></GoFormControl>
              <GoFormControl label="Password" label-for="mail-pass" hint="Stored encrypted; leave empty to keep the current one."><GoInput id="mail-pass" v-model="mail.password" type="password" size="m" placeholder="••••••••" /></GoFormControl>
            </div>
            <GoFormControl label="Default sender" label-for="mail-from" hint="Used when a tenant has not set its own."><GoInput id="mail-from" v-model="mail.from" size="m" /></GoFormControl>
          </div>
          <div class="card-actions"><GoButton variant="secondary" size="m" :loading="mailTesting" @click="testMail">Send a test email</GoButton></div>
        </Card>
      </template>

      <Card v-if="section === 'data'" title="Data retention" subtitle="How long this instance keeps each kind of data. Tenants can shorten these, never lengthen them." flush>
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell>Data</GoTableCell>
            <GoTableCell width="200">Kept for</GoTableCell>
          </GoTableRow>
          <GoTableRow v-for="d in RETENTION" :key="d.id">
            <GoTableCell><span class="row-name">{{ d.name }}</span><span class="note-inline">{{ d.why }}</span></GoTableCell>
            <GoTableCell>
              <GoSelect v-model="d.keep" size="m" :aria-label="`${d.name} kept for`">
                <GoSelectOption v-for="o in d.options" :key="o" :value="o">{{ o }}</GoSelectOption>
              </GoSelect>
            </GoTableCell>
          </GoTableRow>
        </GoTable>
      </Card>

      <Card v-if="section === 'roles'" title="Roles & permissions" subtitle="What each role may do. Everyone is a user; roles add to it. Support and service engineers exist in the root tenant only." flush>
        <div class="matrix">
        <GoTable size="sm">
          <GoTableRow header>
            <GoTableCell width="190">Can</GoTableCell>
            <GoTableCell v-for="c in ROLE_COLUMNS" :key="c" width="64"><span class="col-head">{{ c }}</span></GoTableCell>
          </GoTableRow>
          <GoTableRow v-for="m in MATRIX" :key="m.what">
            <GoTableCell>{{ m.what }}</GoTableCell>
            <GoTableCell v-for="(v, i) in m.roles" :key="i">
              <span v-if="v === true" class="yes" aria-label="Yes">✓</span>
              <span v-else-if="v === false" class="no" aria-label="No">—</span>
              <span v-else class="note-inline">{{ v }}</span>
            </GoTableCell>
          </GoTableRow>
        </GoTable>
        </div>
      </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .settings-layout {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: var(--acv-spacing-large);
    align-items: start;
  }

  .section {
    max-inline-size: 880px;
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);

    &.fields_inline {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  .section {
    @mixin acv-text-subheading-3;
    margin: var(--acv-spacing-regular) 0 var(--acv-spacing-x-small);
  }

  .note-inline {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .note {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .mail-row {
    display: grid;
    grid-template-columns: 2fr 120px auto;
    gap: var(--acv-spacing-regular);
    align-items: end;
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .card-actions {
    display: flex;
    margin-block-start: var(--acv-spacing-regular);
  }

  .row-name {
    display: block;
  }

  .matrix {
    overflow-x: auto;
  }

  .col-head {
    @mixin acv-text-ui-caption-1;
    display: block;
    line-height: 1.2;
  }

  .yes {
    color: var(--acv-color-status-success-strong, #16a34a);
  }

  .no {
    color: var(--acv-color-glyph-tertiary);
  }

  .pad {
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
  }
</style>
