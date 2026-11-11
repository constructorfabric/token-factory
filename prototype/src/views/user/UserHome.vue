<script setup lang="ts">
import { ownCredits } from '@/state/credits';
import { GoButton } from '@constructor/ui/button';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoMessage } from '@constructor/ui/message';
import { computed, ref } from 'vue';
import BarList from '@/components/charts/BarList.vue';
import DayHeatmap from '@/components/charts/DayHeatmap.vue';
import StatTile from '@/components/ui/StatTile.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import UsageMeter from '@/components/ui/UsageMeter.vue';
import { myByModel, myDailySpend } from '@/data/mock';
import { fmtCompact, fmtCredits, fmtInt } from '@/lib/format';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { approverFor, db, licenseById, record, requestLicense, splitUsage } from '@/state/db';
import { session } from '@/state/session';
import { useMe } from './useMe';

const { notify } = useNotificationsStore();
const { user, seat, unit } = useMe();
// One period for every figure in the Usage block; the mock scales the 30-day numbers.
const PERIODS = [
  { id: 'today', label: 'Today', days: 1, factor: 0.065 },
  { id: '7d', label: 'Last 7 days', days: 7, factor: 0.24 },
  { id: '30d', label: 'Last 30 days', days: 30, factor: 1 },
  { id: '90d', label: 'Last 90 days', days: 90, factor: 2.85 },
];
const period = ref('30d');
const current = computed(() => PERIODS.find((p) => p.id === period.value) ?? PERIODS[2]!);
const stats = computed(() => ({ credits: 588.9 * current.value.factor, requests: Math.round(14_210 * current.value.factor), tokens: 61.2e6 * current.value.factor }));
// The company's own credits ("Acme-own credits"): models on the organization's own keys and deployments, a budget of their own.
const used = computed(() => (user.value ? { daily: splitUsage(user.value, 'daily'), weekly: splitUsage(user.value, 'weekly'), monthly: splitUsage(user.value, 'monthly') } : undefined));
const keyShare = computed(() => (used.value && user.value?.usage.monthly.cost ? used.value.monthly.keys / user.value.usage.monthly.cost : 0));
const scaled = <T extends { value: number }>(items: T[]) => items.map((i) => ({ ...i, value: i.value * current.value.factor }));
const byKey = computed(() => db.apiKeys.filter((k) => k.userId === user.value?.id && k.spend30d > 0).map((k) => ({ label: k.name, value: k.spend30d, hint: k.prefix })));

// Ask for a bigger seat: the request goes to the unit's manager, who decides.
const upgrades = computed(() => db.licenses.filter((l) => l.tenantId === user.value?.tenantId && l.id !== seat.value.license?.id));
const requestOpen = ref(false);
const target = ref('');
const reason = ref('');
const pendingReq = computed(() => db.licenseRequests.find((r) => r.userId === user.value?.id && r.status === 'pending'));
const pending = computed(() => (pendingReq.value ? { license: licenseById(pendingReq.value.licenseId)?.name ?? '', approver: approver.value } : null));
const approver = computed(() => (user.value ? approverFor(user.value) : 'your administrator'));

function openRequest(): void {
  target.value = upgrades.value[0]?.id ?? '';
  reason.value = '';
  requestOpen.value = true;
}

function sendRequest(): void {
  const lic = db.licenses.find((l) => l.id === target.value);
  if (!lic || !user.value) return;
  requestLicense(user.value, lic.id, reason.value);
  record({ actor: user.value.name, actorRole: 'User', onBehalfOf: session.impersonating.value ? 'impersonated by Victor Batraev' : undefined, action: `Requested license upgrade to ${lic.name}: ${reason.value || 'no reason given'}`, target: `User: ${user.value.name}`, tenantId: user.value.tenantId });
  notify(`Sent to ${approver.value}. You will be notified when it is decided.`, 'success', 'Upgrade requested');
  requestOpen.value = false;
}

</script>

<template>
  <div v-if="user">
    <PageHeader :title="`Hello, ${user.name.split(' ')[0]}`" />

    <GoMessage v-if="seat.license && used && used.daily.platform / seat.license.limits.daily.cost >= 0.6" variant="warning" border rounded class="notice">
      You have used {{ Math.round((used.daily.platform / seat.license.limits.daily.cost) * 100) }}% of today's platform credits
      <template #addition>It resets at 00:00 UTC. Requests over the limit are refused with the quota and its reset time; ask your manager if you need more.</template>
    </GoMessage>

    <div class="grid">
      <Card title="My limits" :subtitle="`License: ${seat.license?.name}`">
        <template v-if="seat.license">
          <div class="budgets" :class="{ budgets_single: !seat.license.keyLimits.monthly }">
            <div>
              <h3 class="budget-title">Platform credits</h3>
              <UsageMeter label="Today" :used="used!.daily.platform" :limit="seat.license.limits.daily.cost" :format="fmtCredits" />
              <UsageMeter label="This week" :used="used!.weekly.platform" :limit="seat.license.limits.weekly.cost" :format="fmtCredits" />
              <UsageMeter label="This month" :used="used!.monthly.platform" :limit="seat.license.limits.monthly.cost" :format="fmtCredits" />
            </div>
            <div v-if="seat.license.keyLimits.monthly">
              <h3 class="budget-title">{{ ownCredits(user.tenantId) }}</h3>
                <UsageMeter label="Today" :used="used!.daily.keys" :limit="seat.license.keyLimits.daily" :format="fmtCredits" />
                <UsageMeter label="This week" :used="used!.weekly.keys" :limit="seat.license.keyLimits.weekly" :format="fmtCredits" />
                <UsageMeter label="This month" :used="used!.monthly.keys" :limit="seat.license.keyLimits.monthly" :format="fmtCredits" />
            </div>
          </div>
          <p class="note">Tokens this month: {{ fmtCompact(user.usage.monthly.tokens) }} of {{ fmtCompact(seat.license.limits.monthly.tokens) }} · {{ seat.license.rpm }} requests per minute · resets 00:00 UTC (day), Monday (week), 1st (month)</p>
        </template>
      </Card>

      <Card title="My seat" fill>
        <GoDescriptionList>
          <GoDescriptionListItem><template #name>License</template><template #value>{{ seat.license?.name }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Models</template><template #value>{{ seat.license?.allowedModels.length }} allowed</template></GoDescriptionListItem>
        </GoDescriptionList>
        <p v-if="pending" class="pending">Upgrade to {{ pending.license }} requested — waiting for {{ pending.approver }}.</p>
        <div class="actions">
          <GoButton variant="secondary" size="s" :disabled="!!pending || !upgrades.length" @click="openRequest">Request license upgrade</GoButton>
        </div>
      </Card>
    </div>

    <div class="usage-head">
      <h2 class="usage-title">Usage</h2>
      <GoSegmentButtonGroup v-model="period" size="s" aria-label="Period">
        <GoSegmentButton v-for="p in PERIODS" :key="p.id" :value="p.id">{{ p.label }}</GoSegmentButton>
      </GoSegmentButtonGroup>
    </div>
    <div class="tiles">
      <StatTile label="Platform credits" :value="fmtCredits(stats.credits * (1 - keyShare))" :hint="current.days === 1 ? '+12% vs yesterday' : `+9% vs the previous ${current.days} days`" />
      <StatTile v-if="keyShare" :label="ownCredits(user.tenantId)" :value="fmtCredits(stats.credits * keyShare)" hint="Your organization's own models" />
      <StatTile label="Requests" :value="fmtInt(stats.requests)" :hint="current.days === 1 ? 'So far today' : `${fmtInt(Math.round(stats.requests / current.days))} a day on average`" />
      <StatTile label="Tokens" :value="fmtCompact(stats.tokens)" hint="Input, output and reasoning" />
      <StatTile label="Cache hit rate" value="64%" :hint="`Saved about ${fmtCredits(stats.credits * 0.163)}`" tone="good" />
    </div>

    <Card title="My activity" subtitle="AI credits per day, last 12 months" class="spaced">
      <DayHeatmap :values="myDailySpend" end="2026-11-06" label="My AI credits per day" :format="fmtCredits" />
    </Card>

    <div class="breakdowns">
      <Card title="By model" :subtitle="`AI credits, ${current.label.toLowerCase()}`">
        <BarList :items="scaled(myByModel.filter((m) => keyShare || m.source === 'platform'))" :format="fmtCredits" />
      </Card>
      <Card title="By API key" :subtitle="`AI credits, ${current.label.toLowerCase()}`">
        <BarList :items="scaled(byKey)" :format="fmtCredits" />
      </Card>
    </div>


    <GoDialog v-model="requestOpen" size="m">
      <GoDialogWindow title="Request license upgrade" header-border @close="requestOpen = false">
        <div class="fields">
          <p class="note-plain">You have {{ seat.license?.name }}. {{ approver }} decides; you keep your current license until then.</p>
          <GoFormControl label="License you need">
            <GoSelect v-model="target" size="m" aria-label="License you need">
              <GoSelectOption v-for="l in upgrades" :key="l.id" :value="l.id">
                {{ l.name }}
                <template #description>{{ l.description }}</template>
              </GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl label="Why" label-for="upgrade-reason" optional>
            <GoInput id="upgrade-reason" v-model="reason" type="textarea" size="m" placeholder="e.g. I hit the daily limit most days working on the payments migration" />
          </GoFormControl>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="requestOpen = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!target" @click="sendRequest">Send request</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .notice {
    margin-block-end: var(--acv-spacing-large);
  }

  .grid {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .budgets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-large);
  }

  .budgets_single {
    grid-template-columns: 1fr;
  }

  .budget-title {
    @mixin acv-text-subheading-3;
    margin: 0 0 var(--acv-spacing-x-small);
  }

  .note {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-regular) 0 0;
    color: var(--acv-color-glyph-tertiary);
  }

  .actions {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-regular);
  }

  .pending {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-small) 0 0;
    color: var(--acv-color-status-info-strong);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .note-plain {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }

  .usage-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--acv-spacing-small);
  }

  .usage-title {
    @mixin acv-text-subheading-1;
    margin: 0;
    color: var(--acv-color-glyph-primary);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block: var(--acv-spacing-regular);
  }

  .breakdowns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }
</style>
