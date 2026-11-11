<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref } from 'vue';
import { IconCopy, IconPlus, IconTrash } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import StatusTag from '@/components/ui/StatusTag.vue';
import type { TenantRole } from '@/data/types';
import { db, record, tenantById } from '@/state/db';
import { ROLES } from '@/state/roles';
import { session } from '@/state/session';

/**
 * How users of this tenant sign in: single sign-on through the company's
 * identity provider (SAML 2.0 or OpenID Connect), the email domains it covers,
 * whether it is enforced, and how group claims map to roles and licenses.
 */
const props = defineProps<{ tenantId: string }>();
const { notify } = useNotificationsStore();
const tenant = computed(() => tenantById(props.tenantId));
const slug = computed(() => (props.tenantId === 'root' ? 'root' : props.tenantId.replace(/^t-/, '')));
const domain = computed(() => `${(tenant.value?.name ?? 'company').split(/\s+/)[0]!.toLowerCase()}.example`);
const BASE = 'https://tf.constructor.tech';

const PROVIDERS = [
  { id: 'entra', label: 'Microsoft Entra ID', protocol: 'saml' },
  { id: 'okta', label: 'Okta', protocol: 'oidc' },
  { id: 'google', label: 'Google Workspace', protocol: 'saml' },
  { id: 'keycloak', label: 'Keycloak', protocol: 'oidc' },
  { id: 'saml', label: 'Other SAML 2.0 provider', protocol: 'saml' },
  { id: 'oidc', label: 'Other OpenID Connect provider', protocol: 'oidc' },
] as const;

// Acme starts configured; any other tenant starts with nothing set up.
const configured = props.tenantId === 't-acme';
const sso = ref({
  enabled: configured,
  provider: (configured ? 'entra' : 'okta') as (typeof PROVIDERS)[number]['id'],
  protocol: (configured ? 'saml' : 'oidc') as 'saml' | 'oidc',
  metadataUrl: configured ? 'https://login.microsoftonline.com/acme-tenant/federationmetadata/2007-06/federationmetadata.xml' : '',
  issuer: '',
  clientId: '',
  secret: '',
  enforce: configured,
  jit: true,
  lastTest: configured ? '2026-11-08T10:14:00Z' : '',
});
function pickProvider(id: (typeof PROVIDERS)[number]['id']): void {
  sso.value.provider = id;
  sso.value.protocol = PROVIDERS.find((p) => p.id === id)!.protocol;
}
const domains = ref(configured ? [{ name: domain.value, verified: true }] : []);
const newDomain = ref('');
function addDomain(): void {
  const d = newDomain.value.trim().toLowerCase();
  if (!d || domains.value.some((x) => x.name === d)) return;
  domains.value.push({ name: d, verified: false });
  newDomain.value = '';
}

// Group claims → roles; first match wins, everyone else is a user.
const rules = ref<{ group: string; role: TenantRole | 'user' }[]>(configured ? [
  { group: 'TF-Admins', role: 'tenant-admin' },
  { group: 'IT-License-Managers', role: 'license-manager' },
  { group: 'Finance-Controllers', role: 'reports-viewer' },
] : []);
const licenses = computed(() => db.licenses.filter((l) => l.tenantId === props.tenantId));

const ready = computed(() => sso.value.protocol === 'saml' ? !!sso.value.metadataUrl : !!sso.value.issuer && !!sso.value.clientId);
const testing = ref(false);
function audit(action: string): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenant.value?.name : undefined, action, target: 'Sign-in options', tenantId: props.tenantId });
}
function test(): void {
  testing.value = true;
  setTimeout(() => {
    testing.value = false;
    sso.value.lastTest = new Date().toISOString();
    audit('Tested single sign-on');
    notify('Signed in through your identity provider and read email, name and groups. Nothing was changed.', 'success', 'Sign-in works');
  }, 800);
}
function save(): void {
  audit(`Saved sign-in options${sso.value.enforce ? ' (SSO enforced)' : ''}`);
  notify(sso.value.enabled ? `Users with ${domains.value.map((d) => '@' + d.name).join(', ') || 'your domains'} now sign in through ${PROVIDERS.find((p) => p.id === sso.value.provider)?.label}.` : 'Saved.', 'success', 'Sign-in options saved');
}
function copy(text: string): void {
  void navigator.clipboard?.writeText(text);
  notify('Copied to the clipboard.', 'success');
}
const spValues = computed(() => sso.value.protocol === 'saml'
  ? [{ label: 'Entity ID', value: `${BASE}/sso/${slug.value}` }, { label: 'Reply URL (ACS)', value: `${BASE}/sso/${slug.value}/saml/acs` }]
  : [{ label: 'Redirect URI', value: `${BASE}/sso/${slug.value}/oidc/callback` }]);
</script>

<template>
  <div class="sign-in">
    <Card title="Single sign-on" subtitle="Users sign in with their company account instead of a Token Factory password">
      <template #actions>
        <GoToggle v-model="sso.enabled" size="s">{{ sso.enabled ? 'On' : 'Off' }}</GoToggle>
      </template>
      <template v-if="sso.enabled">
        <div class="fields">
          <div class="two">
            <GoFormControl label="Identity provider">
              <GoSelect :model-value="sso.provider" size="m" aria-label="Identity provider" @update:model-value="pickProvider">
                <GoSelectOption v-for="p in PROVIDERS" :key="p.id" :value="p.id">{{ p.label }}</GoSelectOption>
              </GoSelect>
            </GoFormControl>
            <GoFormControl label="Protocol">
              <GoSegmentButtonGroup v-model="sso.protocol" size="s" aria-label="Protocol">
                <GoSegmentButton value="saml">SAML 2.0</GoSegmentButton>
                <GoSegmentButton value="oidc">OpenID Connect</GoSegmentButton>
              </GoSegmentButtonGroup>
            </GoFormControl>
          </div>

          <div class="sp">
            <span class="sub">Enter these in {{ PROVIDERS.find((p) => p.id === sso.provider)?.label }}</span>
            <div v-for="v in spValues" :key="v.label" class="sp-row">
              <span class="sp-label">{{ v.label }}</span>
              <code class="mono">{{ v.value }}</code>
              <GoButton variant="ghost" size="s" :aria-label="`Copy ${v.label}`" @click="copy(v.value)"><template #icon><IconCopy /></template></GoButton>
            </div>
          </div>

          <template v-if="sso.protocol === 'saml'">
            <GoFormControl label="Federation metadata URL" label-for="sso-meta" hint="From your identity provider; certificates and endpoints are read from it and kept current.">
              <GoInput id="sso-meta" v-model="sso.metadataUrl" size="m" placeholder="https://…/federationmetadata.xml" />
            </GoFormControl>
          </template>
          <template v-else>
            <GoFormControl label="Issuer URL" label-for="sso-issuer">
              <GoInput id="sso-issuer" v-model="sso.issuer" size="m" placeholder="https://acme.okta.com" />
            </GoFormControl>
            <div class="two">
              <GoFormControl label="Client ID" label-for="sso-client">
                <GoInput id="sso-client" v-model="sso.clientId" size="m" />
              </GoFormControl>
              <GoFormControl label="Client secret" label-for="sso-secret">
                <GoInput id="sso-secret" v-model="sso.secret" type="password" size="m" />
              </GoFormControl>
            </div>
          </template>

          <div class="test-row">
            <GoButton variant="secondary" size="m" :disabled="!ready" :loading="testing" @click="test">Test sign-in</GoButton>
            <span class="sub">{{ sso.lastTest ? 'Last test passed' : 'Not tested yet' }}</span>
          </div>
        </div>
      </template>
      <p v-else class="sub">Users sign in with their email and a Token Factory password, with MFA.</p>
    </Card>

    <div v-if="sso.enabled" class="pair">
      <Card title="Email domains" subtitle="Users with these addresses are sent to your identity provider" fill>
        <GoTable size="sm">
          <GoTableRow v-for="d in domains" :key="d.name">
            <GoTableCell><code class="mono">@{{ d.name }}</code></GoTableCell>
            <GoTableCell>
              <StatusTag :variant="d.verified ? 'success' : 'warning'">{{ d.verified ? 'verified' : 'waiting for DNS' }}</StatusTag>
              <span v-if="!d.verified" class="sub">Add TXT <code>tf-verify={{ slug }}</code> to its DNS</span>
            </GoTableCell>
            <GoTableCell width="48">
              <GoButton variant="ghost" size="s" :aria-label="`Remove ${d.name}`" @click="domains = domains.filter((x) => x.name !== d.name)"><template #icon><IconTrash /></template></GoButton>
            </GoTableCell>
          </GoTableRow>
          <GoTableRow v-if="!domains.length"><GoTableCell><span class="sub">No domains yet.</span></GoTableCell></GoTableRow>
        </GoTable>
        <div class="add-row">
          <GoInput v-model="newDomain" size="m" placeholder="example.com" aria-label="Domain" @keydown.enter="addDomain" />
          <GoButton variant="secondary" size="m" :disabled="!newDomain.trim()" @click="addDomain"><template #icon><IconPlus /></template>Add</GoButton>
        </div>
      </Card>

      <Card title="Access" subtitle="Who gets in, and how accounts are created" fill>
        <div class="fields">
          <GoToggle v-model="sso.enforce">Require single sign-on — no Token Factory passwords for these domains</GoToggle>
          <GoMessage v-if="sso.enforce" variant="info" rounded>Customer admins keep a password with MFA as a break-glass sign-in.</GoMessage>
          <GoToggle v-model="sso.jit">Create the account on first sign-in</GoToggle>
          <p class="sub">New users get their unit’s default license{{ licenses.length ? '' : ' once you create licenses' }}. Disabling a user in your identity provider revokes their keys within a minute.</p>
        </div>
      </Card>
    </div>

    <Card v-if="sso.enabled" title="Roles from groups" subtitle="Groups in the sign-in token give roles; first match wins, everyone else is a user" flush class="spaced">
      <GoTable size="sm">
        <GoTableRow header>
          <GoTableCell>Group claim</GoTableCell>
          <GoTableCell>Role</GoTableCell>
          <GoTableCell width="48" />
        </GoTableRow>
        <GoTableRow v-for="(r, i) in rules" :key="i">
          <GoTableCell><GoInput v-model="r.group" size="m" aria-label="Group" /></GoTableCell>
          <GoTableCell>
            <GoSelect v-model="r.role" size="m" aria-label="Role">
              <GoSelectOption value="user">User</GoSelectOption>
              <GoSelectOption v-for="x in ROLES" :key="x.id" :value="x.id">{{ x.label }}</GoSelectOption>
            </GoSelect>
          </GoTableCell>
          <GoTableCell><GoButton variant="ghost" size="s" aria-label="Remove rule" @click="rules.splice(i, 1)"><template #icon><IconTrash /></template></GoButton></GoTableCell>
        </GoTableRow>
      </GoTable>
      <div class="rule-add"><GoButton variant="secondary" size="s" @click="rules.push({ group: '', role: 'user' })"><template #icon><IconPlus /></template>Add rule</GoButton></div>
    </Card>

    <div class="save-row"><GoButton size="m" @click="save">Save sign-in options</GoButton></div>
  </div>
</template>

<style scoped>
  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: end;
  }

  .sp {
    display: grid;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
  }

  .sp-row {
    display: grid;
    grid-template-columns: 140px 1fr auto;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .sp-label {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-secondary);
  }

  .mono {
    @mixin acv-text-ui-caption-1;
    font-family: var(--acv-font-family-monospace, monospace);
    word-break: break-all;
  }

  .test-row,
  .add-row {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
  }

  .add-row {
    margin-block-start: var(--acv-spacing-regular);
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: stretch;
    margin-block-start: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .rule-add {
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
  }

  .save-row {
    display: flex;
    margin-block-start: var(--acv-spacing-regular);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
