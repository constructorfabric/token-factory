<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, reactive, ref, watch } from 'vue';
import Card from '@/components/ui/Card.vue';
import { ownCredits } from '@/state/credits';
import { LANGUAGES, languageLabel, type LanguageId } from '@/state/prefs';
import { record, tenantById } from '@/state/db';
import { session } from '@/state/session';

/**
 * Who Token Factory emails about what. One sending address on the
 * organization's domain, and every Token Factory event with its recipients,
 * an on/off switch and an editable template.
 */
const props = defineProps<{ tenantId: string }>();
const { notify } = useNotificationsStore();
const tenant = computed(() => tenantById(props.tenantId));
const domain = computed(() => `${(tenant.value?.name ?? 'company').split(/\s+/)[0]!.toLowerCase()}.example`);
const own = computed(() => ownCredits(props.tenantId));

function audit(action: string): void {
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? tenant.value?.name : undefined, action, target: 'Notifications', tenantId: props.tenantId });
}

// ---- sender: one domain, verified once
const sender = ref({ name: 'Token Factory', local: 'it-support', language: 'en' as LanguageId });


// ---- events
type Audience = 'users' | 'admins';
interface Event {
  id: string;
  group: string;
  name: string;
  when: string;
  to: string[];
  audience: Audience;
  /** Whether the email goes out. */
  on: boolean;
  /** Security notices cannot be switched off. */
  required?: boolean;
  vars: string[];
  subject: string;
  body: string;
  /** Saved versions in other languages; English lives in subject and body. */
  t: Partial<Record<LanguageId, { subject: string; body: string }>>;
}
const ev = (e: Omit<Event, 'on' | 't'> & { on?: boolean }): Event => ({ on: true, t: { ...TRANSLATED[e.id] }, ...e });

type Text = { subject: string; body: string };
const TRANSLATED: Record<string, Partial<Record<LanguageId, Text>>> = {
  'license.requested': {
    de: { subject: '{{user.name}} beantragt {{license.requested}}', body: '{{user.name}} hat {{license.current}} und beantragt {{license.requested}}:\n\n„{{request.reason}}“\n\nAntrag prüfen: {{action.url}}' },
    fr: { subject: '{{user.name}} demande {{license.requested}}', body: '{{user.name}} a {{license.current}} et demande {{license.requested}} :\n\n« {{request.reason}} »\n\nExaminer la demande : {{action.url}}' },
    es: { subject: '{{user.name}} solicita {{license.requested}}', body: '{{user.name}} tiene {{license.current}} y solicita {{license.requested}}:\n\n«{{request.reason}}»\n\nRevisar la solicitud: {{action.url}}' },
  },
  'license.approved': {
    de: { subject: 'Sie haben jetzt {{license.requested}}', body: 'Hallo {{user.first_name}},\n\n{{decided.by}} hat Ihren Antrag genehmigt. {{license.requested}} gilt ab Ihrer nächsten Anfrage.\n\n{{decision.note}}' },
    fr: { subject: 'Vous avez maintenant {{license.requested}}', body: 'Bonjour {{user.first_name}},\n\n{{decided.by}} a approuvé votre demande. {{license.requested}} s’applique dès votre prochaine requête.\n\n{{decision.note}}' },
    es: { subject: 'Ya tiene {{license.requested}}', body: 'Hola, {{user.first_name}}:\n\n{{decided.by}} aprobó su solicitud. {{license.requested}} se aplica desde su próxima petición.\n\n{{decision.note}}' },
  },
  'license.declined': {
    de: { subject: 'Ihr Antrag auf {{license.requested}}', body: 'Hallo {{user.first_name}},\n\n{{decided.by}} hat Ihren Antrag auf {{license.requested}} abgelehnt.\n\n{{decision.note}}' },
    fr: { subject: 'Votre demande de {{license.requested}}', body: 'Bonjour {{user.first_name}},\n\n{{decided.by}} a refusé votre demande de {{license.requested}}.\n\n{{decision.note}}' },
    es: { subject: 'Su solicitud de {{license.requested}}', body: 'Hola, {{user.first_name}}:\n\n{{decided.by}} rechazó su solicitud de {{license.requested}}.\n\n{{decision.note}}' },
  },
  'limit.warning': {
    de: { subject: 'Sie haben {{limit.percent}} % Ihrer {{credit.type}} ({{limit.period}}) verbraucht', body: 'Hallo {{user.first_name}},\n\nSie haben {{limit.percent}} % Ihrer {{credit.type}} ({{limit.period}}) verbraucht. Das Limit wird {{limit.resets_at}} zurückgesetzt.' },
    fr: { subject: 'Vous avez utilisé {{limit.percent}} % de vos {{credit.type}} ({{limit.period}})', body: 'Bonjour {{user.first_name}},\n\nVous avez utilisé {{limit.percent}} % de vos {{credit.type}} ({{limit.period}}). La limite est réinitialisée {{limit.resets_at}}.' },
    es: { subject: 'Ha usado el {{limit.percent}} % de sus {{credit.type}} ({{limit.period}})', body: 'Hola, {{user.first_name}}:\n\nHa usado el {{limit.percent}} % de sus {{credit.type}} ({{limit.period}}). El límite se restablece {{limit.resets_at}}.' },
  },
};

const events = reactive<Event[]>([
  // Licenses and roles
  ev({ id: 'license.requested', group: 'Licenses and roles', name: 'License requested', when: 'Someone asks for another license', to: ['Their manager', 'License managers'], audience: 'admins', vars: ['user.name', 'license.current', 'license.requested', 'request.reason', 'action.url'], subject: '{{user.name}} asks for {{license.requested}}', body: '{{user.name}} has {{license.current}} and asks for {{license.requested}}:\n\n“{{request.reason}}”\n\nReview the request: {{action.url}}' }),
  ev({ id: 'license.approved', group: 'Licenses and roles', name: 'License request approved', when: 'The request is approved', to: ['The user'], audience: 'users', vars: ['user.first_name', 'license.requested', 'decided.by', 'decision.note'], subject: 'You now have {{license.requested}}', body: 'Hi {{user.first_name}},\n\n{{decided.by}} approved your request. {{license.requested}} applies from your next request.\n\n{{decision.note}}' }),
  ev({ id: 'license.declined', group: 'Licenses and roles', name: 'License request declined', when: 'The request is declined', to: ['The user'], audience: 'users', vars: ['user.first_name', 'license.requested', 'decided.by', 'decision.note'], subject: 'Your request for {{license.requested}}', body: 'Hi {{user.first_name}},\n\n{{decided.by}} declined your request for {{license.requested}}.\n\n{{decision.note}}' }),
  ev({ id: 'license.changed', group: 'Licenses and roles', name: 'License changed', when: 'An admin changes it, or the user moves unit', to: ['The user'], audience: 'users', vars: ['user.first_name', 'license.previous', 'license.new', 'license.daily_limits'], subject: 'Your license is now {{license.new}}', body: 'Hi {{user.first_name}},\n\nYour license changed from {{license.previous}} to {{license.new}}. Your limits: {{license.daily_limits}}.' }),
  ev({ id: 'role.changed', group: 'Licenses and roles', name: 'Roles changed', when: 'Someone changes what the user may manage', to: ['The user'], audience: 'users', required: true, vars: ['user.first_name', 'roles.list', 'changed.by'], subject: 'Your roles in Token Factory changed', body: 'Hi {{user.first_name}},\n\n{{changed.by}} set your roles to: {{roles.list}}. If you did not expect this, contact your administrator.' }),
  // API keys
  ev({ id: 'key.created', group: 'API keys', name: 'API key created', when: 'A user creates a key', to: ['Key owner'], audience: 'users', required: true, vars: ['user.first_name', 'key.name', 'key.prefix', 'key.expires_at'], subject: 'New API key: {{key.name}}', body: 'A key named {{key.name}} ({{key.prefix}}…) was created on your account. It expires {{key.expires_at}}. If this was not you, revoke it now.' }),
  ev({ id: 'key.expiring', group: 'API keys', name: 'API key expires soon', when: '7 days before expiry', to: ['Key owner'], audience: 'users', vars: ['user.first_name', 'key.name', 'key.expires_at', 'action.url'], subject: '{{key.name}} expires {{key.expires_at}}', body: 'Hi {{user.first_name}},\n\nYour key {{key.name}} expires {{key.expires_at}}. Create a new one and update your tools: {{action.url}}' }),
  ev({ id: 'key.revoked', group: 'API keys', name: 'API key revoked', when: 'A key is revoked, by its owner or an admin', to: ['Key owner'], audience: 'users', required: true, vars: ['user.first_name', 'key.name', 'revoked.by'], subject: '{{key.name}} was revoked', body: '{{revoked.by}} revoked {{key.name}}. Tools using it stop working within a minute.' }),
  // Usage and limits
  ev({ id: 'limit.warning', group: 'Usage and limits', name: 'Limit nearly used', when: '80% of a daily, weekly or monthly limit, per credit type', to: ['The user'], audience: 'users', vars: ['user.first_name', 'credit.type', 'limit.period', 'limit.percent', 'limit.resets_at'], subject: 'You have used {{limit.percent}}% of your {{limit.period}} {{credit.type}}', body: 'Hi {{user.first_name}},\n\nYou have used {{limit.percent}}% of your {{limit.period}} {{credit.type}}. It resets {{limit.resets_at}}.' }),
  ev({ id: 'limit.reached', group: 'Usage and limits', name: 'Limit reached', when: 'Requests start being refused', to: ['The user', 'Their manager'], audience: 'users', vars: ['user.first_name', 'credit.type', 'limit.period', 'limit.resets_at', 'action.url'], subject: 'Your {{limit.period}} {{credit.type}} are used up', body: 'Hi {{user.first_name}},\n\nRequests are refused until {{limit.resets_at}}. Need more? Request a license upgrade: {{action.url}}' }),
  ev({ id: 'key.limit', group: 'Usage and limits', name: 'Key limit reached', when: 'A key hits the limit its owner set', to: ['Key owner'], audience: 'users', vars: ['key.name', 'key.limit', 'limit.resets_at'], subject: '{{key.name}} reached its limit', body: '{{key.name}} used its {{key.limit}}. It works again {{limit.resets_at}}, or raise the limit.' }),
  ev({ id: 'org.credits', group: 'Usage and limits', name: 'Platform credits running low', when: 'The organization reaches 80% and 100% of its monthly platform credits', to: ['Customer admins'], audience: 'admins', vars: ['org.name', 'credits.used', 'credits.allowance', 'credits.forecast'], subject: '{{org.name}} used {{credits.used}} of {{credits.allowance}} platform credits', body: 'This month: {{credits.used}} of {{credits.allowance}}. Heading for {{credits.forecast}} by month end.' }),
  ev({ id: 'org.own', group: 'Usage and limits', name: 'Own-credit spend spike', when: 'Spend on your own keys doubles against the 7-day average', to: ['Customer admins'], audience: 'admins', vars: ['org.name', 'credits.today', 'credits.average', 'top.model'], subject: 'Unusual spend on your own keys', body: 'Today: {{credits.today}} against a {{credits.average}} daily average, mostly on {{top.model}}. Billed by your provider.' }),
  ev({ id: 'seats', group: 'Usage and limits', name: 'Seats almost used up', when: '90% of the seat pool is taken', to: ['Customer admins'], audience: 'admins', vars: ['seats.taken', 'seats.total'], subject: '{{seats.taken}} of {{seats.total}} seats taken', body: 'New users will not get a license once the pool is full. Request more seats under Settings › License.' }),
  // Models
  ev({ id: 'model.available', group: 'Models', name: 'New model in your license', when: 'A model is added to the user’s license', to: ['License holders'], audience: 'users', on: false, vars: ['user.first_name', 'model.name', 'model.alias', 'model.price'], subject: '{{model.name}} is available to you', body: 'Call it as {{model.alias}}. Price: {{model.price}} per 1M tokens.' }),
  ev({ id: 'model.deprecated', group: 'Models', name: 'Model deprecated', when: 'A model you use gets a retirement date', to: ['Users who used it', 'License managers'], audience: 'users', vars: ['model.name', 'model.retires_on', 'model.replacement'], subject: '{{model.name}} retires {{model.retires_on}}', body: 'Switch to {{model.replacement}} before {{model.retires_on}}. After that, calls to {{model.name}} are refused.' }),
  ev({ id: 'model.retired', group: 'Models', name: 'Model retired', when: 'Calls to it are now refused', to: ['Users who used it'], audience: 'users', vars: ['model.name', 'model.replacement'], subject: '{{model.name}} is retired', body: 'Use {{model.replacement}} instead.' }),
  ev({ id: 'model.discovered', group: 'Models', name: 'Model added from your key', when: 'A model is added through a provider key and waits to be enabled', to: ['Customer admins'], audience: 'admins', vars: ['model.name', 'key.label', 'action.url'], subject: '{{model.name}} is waiting to be enabled', body: 'Added through {{key.label}}. Enable it and add it to a license: {{action.url}}' }),
  // Provider keys and integrations
  ev({ id: 'pkey.expiring', group: 'Provider keys and integrations', name: 'Provider key expires soon', when: '14 and 3 days before', to: ['Customer admins'], audience: 'admins', vars: ['key.provider', 'key.label', 'key.expires_at', 'models.affected'], subject: '{{key.provider}} key {{key.label}} expires {{key.expires_at}}', body: 'These models stop answering when it expires: {{models.affected}}. Rotate it at {{key.provider}}, then update it in Token Factory.' }),
  ev({ id: 'pkey.invalid', group: 'Provider keys and integrations', name: 'Provider key stopped working', when: 'The provider rejects the key', to: ['Customer admins'], audience: 'admins', required: true, vars: ['key.provider', 'key.label', 'error.message', 'models.affected'], subject: '{{key.provider}} rejects key {{key.label}}', body: '{{error.message}}. Affected models: {{models.affected}}.' }),
  ev({ id: 'sync.failed', group: 'Provider keys and integrations', name: 'Users sync failed', when: 'A sync fails or skips users', to: ['Customer admins', 'User managers'], audience: 'admins', vars: ['source.name', 'sync.result', 'sync.note'], subject: '{{source.name}} sync: {{sync.result}}', body: '{{sync.note}}' }),
]);

const filter = ref<'all' | Audience>('all');
const count = (f: 'all' | Audience) => events.filter((e) => f === 'all' || e.audience === f).length;
const groups = computed(() => {
  const out: { name: string; items: Event[] }[] = [];
  for (const e of events.filter((x) => filter.value === 'all' || x.audience === filter.value)) {
    const g = out.find((x) => x.name === e.group) ?? out[out.push({ name: e.group, items: [] }) - 1]!;
    g.items.push(e);
  }
  return out;
});
function toggled(e: Event): void {
  audit(`${e.on ? 'Enabled' : 'Disabled'} email for “${e.name}”`);
}

// ---- template editor
const editing = ref<Event | null>(null);
const editOpen = ref(false);
const draft = ref({ subject: '', body: '', language: 'en' as LanguageId });
/** The language has no version yet: the English text is shown and sent until one is saved. */
const fallback = ref(false);
function load(e: Event, lang: LanguageId): void {
  const own = lang === 'en' ? { subject: e.subject, body: e.body } : e.t[lang];
  fallback.value = !own;
  Object.assign(draft.value, own ?? { subject: e.subject, body: e.body });
}
function editTemplate(e: Event): void {
  editing.value = e;
  draft.value.language = sender.value.language;
  load(e, draft.value.language);
  editOpen.value = true;
}
watch(() => draft.value.language, (lang) => editing.value && load(editing.value, lang));
function insert(v: string): void {
  draft.value.body += `{{${v}}}`;
}
const SAMPLE: Record<string, string> = {
  'user.name': 'Raj Patel', 'user.first_name': 'Raj', 'license.current': 'Developer Standard', 'license.requested': 'Developer Pro', 'license.previous': 'Developer Standard', 'license.new': 'Developer Pro',
  'license.daily_limits': '6K platform credits, 3K own credits', 'request.reason': 'Joining the payments migration', 'decided.by': 'Linus Berg', 'decision.note': 'Approved for the migration.', 'action.url': 'https://tf.constructor.tech/…',
  'roles.list': 'User, Reports viewer', 'changed.by': 'Grace Hopper', 'key.name': 'Claude Code · laptop', 'key.prefix': 'cai-sk-7Fq2', 'key.expires_at': 'on 4 Feb 2027', 'revoked.by': 'Raj Patel', 'key.limit': '1,000 credits a month',
  'credit.type': 'platform credits', 'limit.period': 'weekly', 'limit.percent': '82', 'limit.resets_at': 'Monday 00:00 UTC', 'org.name': 'Acme Corp', 'credits.used': '1.2M', 'credits.allowance': '8M', 'credits.forecast': '4M',
  'credits.today': '310K credits', 'credits.average': '120K', 'top.model': 'GPT-5.1 (Acme Azure)', 'seats.taken': '1,262', 'seats.total': '1,400', 'model.name': 'Claude Sonnet 4.5', 'model.alias': 'coding-default',
  'model.price': '300 / 1,500 credits', 'model.retires_on': '15 Jan 2027', 'model.replacement': 'Claude Sonnet 5.5', 'key.provider': 'OpenAI', 'key.label': 'acme-research', 'models.affected': 'o4-mini (Acme OpenAI)',
  'error.message': '401 invalid_api_key', 'source.name': 'Constructor Platform', 'sync.result': 'partial', 'sync.note': '1 user skipped: no email address', 'keys.revoked': '2', 'engineer.name': 'Victor Batraev',
  'access.reason': 'SUP-4410', 'access.started_at': '15:40 UTC',
};
const fill = (t: string) => t.replace(/\{\{([\w.]+)\}\}/g, (_, k: string) => SAMPLE[k] ?? `{{${k}}}`);
function saveTemplate(): void {
  const e = editing.value;
  if (!e) return;
  const text = { subject: draft.value.subject, body: draft.value.body };
  if (draft.value.language === 'en') Object.assign(e, text);
  else e.t[draft.value.language] = text;
  fallback.value = false;
  audit(`Edited template “${e.name}” (${languageLabel(draft.value.language)})`);
  notify(`“${e.name}” in ${languageLabel(draft.value.language)} saved. The next message uses it.`, 'success');
  editOpen.value = false;
}
function sendTest(): void {
  notify(`Test sent to you from ${sender.value.local}@${domain.value}.`, 'success', 'Test sent');
}
function saveSender(): void {
  audit(`Sender set to ${sender.value.name} <${sender.value.local}@${domain.value}>`);
  notify(`Messages now come from ${sender.value.name} <${sender.value.local}@${domain.value}>.`, 'success', 'Sender saved');
}
</script>

<template>
  <div class="notifications">
    <Card title="Sender" :subtitle="`Every email comes from ${domain}, verified with SPF and DKIM so it is not marked as spam`" class="sender">
      <div class="sender-row">
        <GoFormControl label="Sender name" label-for="n-name">
          <GoInput id="n-name" v-model="sender.name" size="m" />
        </GoFormControl>
        <GoFormControl label="From" label-for="n-from">
          <GoInput id="n-from" v-model="sender.local" size="m"><template #suffix>@{{ domain }}</template></GoInput>
        </GoFormControl>
        <GoFormControl label="Default language" label-for="n-lang">
          <GoSelect id="n-lang" v-model="sender.language" size="m" aria-label="Default language">
            <GoSelectOption v-for="l in LANGUAGES" :key="l.id" :value="l.id">{{ l.label }}</GoSelectOption>
          </GoSelect>
        </GoFormControl>
      </div>
      <p class="hint hint_after">Users who chose a language in their profile get emails in it; everyone else gets the default.</p>
      <div class="card-actions"><GoButton size="m" @click="saveSender">Save sender</GoButton></div>
    </Card>

    <div class="toolbar">
      <GoSegmentButtonGroup v-model="filter" size="s" aria-label="Who receives">
        <GoSegmentButton value="all">All {{ count('all') }}</GoSegmentButton>
        <GoSegmentButton value="users">For users {{ count('users') }}</GoSegmentButton>
        <GoSegmentButton value="admins">For admins {{ count('admins') }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <GoTableCell>Event</GoTableCell>
          <GoTableCell>Goes to</GoTableCell>
          <GoTableCell width="90">Email</GoTableCell>
          <GoTableCell width="120" />
        </GoTableRow>
        <template v-for="g in groups" :key="g.name">
          <GoTableRow>
            <GoTableCell :colspan="4"><span class="group">{{ g.name }}</span></GoTableCell>
          </GoTableRow>
          <GoTableRow v-for="e in g.items" :key="e.id">
            <GoTableCell>
              <span class="name">{{ e.name }}<GoTag v-if="e.required" size="s" color="neutral" class="req">Required</GoTag></span>
              <span class="sub">{{ e.when.replace('own credits', own) }}</span>
            </GoTableCell>
            <GoTableCell><span class="sub sub_plain">{{ e.to.join(', ') }}</span></GoTableCell>
            <GoTableCell>
              <span v-if="e.required" class="sub sub_plain">Always</span>
              <GoToggle v-else v-model="e.on" size="s" :aria-label="`Email for ${e.name}`" @update:model-value="toggled(e)" />
            </GoTableCell>
            <GoTableCell><GoButton variant="ghost" size="s" @click="editTemplate(e)">Edit template</GoButton></GoTableCell>
          </GoTableRow>
        </template>
      </GoTable>
    </div>
    <p class="hint footnote">Required events are security notices and are always sent.</p>

    <GoDialog v-model="editOpen" size="l">
      <GoDialogWindow v-if="editing" :title="editing.name" header-border @close="editOpen = false">
        <div class="editor">
          <div class="fields">
            <GoFormControl label="Language">
              <GoSegmentButtonGroup v-model="draft.language" size="s" aria-label="Template language">
                <GoSegmentButton v-for="l in LANGUAGES" :key="l.id" :value="l.id">{{ l.label }}</GoSegmentButton>
              </GoSegmentButtonGroup>
            </GoFormControl>
            <p v-if="fallback" class="hint">No {{ languageLabel(draft.language) }} version yet. Users who chose {{ languageLabel(draft.language) }} get the English text below until you save one.</p>
            <GoFormControl label="Subject" label-for="t-subject">
              <GoInput id="t-subject" v-model="draft.subject" size="m" />
            </GoFormControl>
            <GoFormControl label="Message" label-for="t-body">
              <GoInput id="t-body" v-model="draft.body" type="textarea" size="m" class="body-input" />
            </GoFormControl>
            <div>
              <span class="sub">Insert a variable</span>
              <div class="vars">
                <button v-for="v in editing.vars" :key="v" type="button" class="var" @click="insert(v)">{{ v }}</button>
              </div>
            </div>
          </div>
          <div class="preview">
            <span class="sub">Preview with sample values</span>
            <div class="mail">
              <span class="mail-meta">From {{ sender.name }} &lt;{{ sender.local }}@{{ domain }}&gt;</span>
              <span class="mail-subject">{{ fill(draft.subject) }}</span>
              <p class="mail-body">{{ fill(draft.body) }}</p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="sendTest">Send me a test</GoButton>
            <span class="spacer" />
            <GoButton variant="secondary" size="m" @click="editOpen = false">Cancel</GoButton>
            <GoButton size="m" @click="saveTemplate">Save template</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .sender {
    margin-block-end: var(--acv-spacing-regular);
  }

  .sender-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    align-items: end;
  }

  .hint_after {
    margin-block-start: var(--acv-spacing-x-small);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .hint {
    @mixin acv-text-ui-caption-1;
    margin: calc(-1 * var(--acv-spacing-x-small)) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .footnote {
    margin-block-start: var(--acv-spacing-small);
  }

  .card-actions {
    display: flex;
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-regular);
  }


  .toolbar {
    margin-block-end: var(--acv-spacing-regular);
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow-x: auto;
  }

  .group {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .name {
    @mixin acv-text-ui-body-2-medium;
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-primary);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .sub_plain {
    color: var(--acv-color-glyph-secondary);
  }

  .editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-large);
  }

  .body-input :deep(textarea) {
    min-block-size: 180px;
  }

  .vars {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-block-start: 4px;
  }

  .var {
    @mixin acv-text-ui-caption-1;
    padding: 2px 6px;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-secondary);
    color: var(--acv-color-glyph-secondary);
    font-family: var(--acv-font-family-monospace, monospace);
    cursor: pointer;
  }

  .preview {
    display: grid;
    align-content: start;
    gap: var(--acv-spacing-x-small);
  }

  .mail {
    display: grid;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
  }

  .mail-meta {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .mail-subject {
    @mixin acv-text-ui-body-2-medium;
    color: var(--acv-color-glyph-primary);
  }

  .mail-body {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
    white-space: pre-wrap;
  }

  .footer {
    display: flex;
    gap: var(--acv-spacing-x-small);
  }

  .spacer {
    flex: 1;
  }
</style>
