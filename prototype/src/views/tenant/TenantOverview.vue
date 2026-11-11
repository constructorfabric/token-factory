<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { tenantAttention } from '@/state/attention';
import BarList from '@/components/charts/BarList.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import UsageMeter from '@/components/ui/UsageMeter.vue';
import { acmeByModel, tenantKeyShare } from '@/data/mock';
import { fmtAgo, fmtCredits, fmtDate, fmtInt } from '@/lib/format';
import { ownCredits } from '@/state/credits';
import { db, licenseById, nearLimit, tenantById } from '@/state/db';
import { activePeopleSource } from '@/state/integrations';

/**
 * What a customer admin needs on arrival: what to act on now, how the two
 * credit budgets and the seat pool stand, and whether the users source is
 * healthy. Everything else is one click away on the page that owns it.
 */
const route = useRoute();
const router = useRouter();
const tenantId = String(route.params.tenantId);
const tenant = computed(() => tenantById(tenantId));
const base = `/t/${tenantId}`;

// ---- the month so far, and where it is heading (mock: today is 9 November)
const DAY = 9;
const DAYS = 30;
const keyShare = tenantKeyShare[tenantId] ?? 0;
const platformSoFar = computed(() => ((tenant.value?.spend30d ?? 0) * (1 - keyShare) * DAY) / DAYS);
const ownSoFar = computed(() => ((tenant.value?.spend30d ?? 0) * keyShare * DAY) / DAYS);
const forecast = (soFar: number) => (soFar * DAYS) / DAY;
const allowance = computed(() => tenant.value?.budget30d ?? 0);

const topModels = (source: 'platform' | 'keys') => (tenant.value?.spend30d ? acmeByModel : []).filter((m) => m.source === source).slice(0, 3).map((m) => ({ ...m, value: (m.value * DAY) / DAYS }));
const ownKeys = computed(() => db.providerKeys.filter((k) => k.tenantId === tenantId && k.mode === 'byok'));
// Spend per own key: the models reached through it.
const byKey = computed(() =>
  ownKeys.value.map((k) => {
    const models = db.models.filter((m) => m.providerKeyId === k.id).map((m) => m.name);
    const value = acmeByModel.filter((m) => m.source === 'keys' && models.some((n) => n.startsWith(m.label.split(' (')[0]!))).reduce((s, m) => s + m.value, 0);
    return { label: `${k.provider} · ${k.label}`, value: (value * DAY) / DAYS, hint: k.status === 'expiring' ? 'key expires in 9 days' : `${models.length} ${models.length === 1 ? 'model' : 'models'}` };
  }),
);

// ---- seats
const licenses = computed(() => db.licenses.filter((l) => l.tenantId === tenantId));
const holders = computed(() => licenses.value.reduce((s, l) => s + l.holders, 0));
const byLicense = computed(() => licenses.value.map((l) => ({ label: l.name, value: l.holders })).sort((a, b) => b.value - a.value));

// ---- needs attention: only what an admin can act on, each with one way to act
// The same items the notification inbox keeps, with older events.
const attention = computed(() => tenantAttention(tenantId));

const source = computed(() => activePeopleSource(tenantId));

// ---- license requests waiting for a decision
const pendingRequests = computed(() => db.licenseRequests.filter((x) => x.tenantId === tenantId && x.status === 'pending'));
const requestRows = computed(() => pendingRequests.value.slice(0, 4).map((x) => ({ ...x, user: db.users.find((u) => u.id === x.userId) })));
const decidedThisWeek = computed(() => db.licenseRequests.filter((x) => x.tenantId === tenantId && x.status !== 'pending' && x.decidedAt && Date.parse(x.decidedAt) > Date.parse('2026-11-02')).length);
</script>

<template>
  <div v-if="tenant">
    <PageHeader :title="tenant.name" description="What needs you now, and how your credits and seats stand this month." />

    <div class="top">
    <Card title="Needs attention" :subtitle="attention.length ? `${attention.length} ${attention.length === 1 ? 'item' : 'items'}` : 'Nothing right now'" flush class="spaced">
      <template #actions><GoButton variant="ghost" size="s" @click="router.push(`${base}/notifications`)">All notifications</GoButton></template>
      <ul v-if="attention.length" class="attention">
        <li v-for="a in attention" :key="a.id" class="item" :class="`item_${a.tone}`">
          <div class="item-text">
            <span class="item-title">{{ a.title }}</span>
            <span class="sub">{{ a.text }}</span>
          </div>
          <GoButton variant="secondary" size="s" @click="router.push(a.to)">{{ a.action }}</GoButton>
        </li>
      </ul>
    </Card>
      <Card title="License requests" :subtitle="pendingRequests.length ? `${pendingRequests.length} waiting · ${decidedThisWeek} decided this week` : `None waiting · ${decidedThisWeek} decided this week`" fill class="spaced">
        <ul v-if="requestRows.length" class="requests">
          <li v-for="x in requestRows" :key="x.id">
            <span class="item-title">{{ x.user?.name }}</span>
            <span class="sub">{{ licenseById(x.fromLicenseId)?.name ?? 'none' }} → {{ licenseById(x.licenseId)?.name }} · {{ fmtAgo(x.at) }}</span>
          </li>
        </ul>
        <p v-else class="sub">No license requests waiting for a decision.</p>
        <div class="card-actions"><GoButton variant="secondary" size="s" @click="router.push(`${base}/approvals`)">{{ pendingRequests.length ? 'Review requests' : 'Open requests' }}</GoButton></div>
      </Card>
    </div>

    <div class="budgets">
      <Card title="Platform credits" :subtitle="`November so far · from your organization license`" fill>
        <UsageMeter label="Used this month" :used="platformSoFar" :limit="allowance" :format="fmtCredits" />
        <p class="forecast">Heading for {{ fmtCredits(forecast(platformSoFar)) }} by 30 November</p>
        <h3 class="sub-title">Top models</h3>
        <BarList v-if="topModels('platform').length" :items="topModels('platform')" :format="fmtCredits" />
        <p v-else class="sub">No usage yet.</p>
        <div class="card-actions"><GoButton variant="secondary" size="s" @click="router.push(`${base}/reports`)">Open reports</GoButton></div>
      </Card>
      <Card :title="ownCredits(tenantId)" subtitle="November so far · billed by your providers, no platform cap" fill>
        <div class="figure">
          <span class="figure-value">{{ fmtCredits(ownSoFar) }}</span>
          <span class="sub">used this month · heading for {{ fmtCredits(forecast(ownSoFar)) }}</span>
        </div>
        <h3 class="sub-title">By provider key</h3>
        <BarList v-if="byKey.length" :items="byKey" :format="fmtCredits" />
        <p v-else class="sub">No provider keys yet.</p>
        <h3 class="sub-title">Top models</h3>
        <BarList v-if="topModels('keys').length" :items="topModels('keys')" :format="fmtCredits" />
        <p v-else class="sub">No usage yet.</p>
        <div class="card-actions"><GoButton variant="secondary" size="s" @click="router.push(`${base}/keys`)">Open provider keys</GoButton></div>
      </Card>
      <Card title="Seats" subtitle="Each license holder takes one seat from your organization license" fill>
        <UsageMeter label="Taken" :used="holders" :limit="tenant.seats" :format="fmtInt" />
        <h3 class="sub-title">Users by license</h3>
        <BarList :items="byLicense" :format="fmtInt" />
        <div class="card-actions"><GoButton variant="secondary" size="s" @click="router.push(`${base}/licenses`)">Open licenses</GoButton></div>
      </Card>
    </div>

    <p v-if="source" class="source">
      Users and units from <RouterLink :to="`${base}/settings?section=integrations`" class="link">{{ source.name }}</RouterLink>
      · synced {{ fmtAgo(source.lastSync ?? null) }} · {{ fmtInt(source.people ?? 0) }} users in {{ source.units }} units
    </p>
    <p v-else class="source">No users source connected. <RouterLink :to="`${base}/settings?section=integrations`" class="link">Connect one</RouterLink> to keep users and units in step.</p>
  </div>
</template>

<style scoped>
  .spaced {
    margin-block-end: var(--acv-spacing-regular);
  }

  .top {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: stretch;
  }

  .requests {
    display: grid;
    gap: var(--acv-spacing-small);
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: grid;
    }
  }

  .attention {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-regular);
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border-block-start: var(--acv-border-light);
    border-inline-start: 3px solid transparent;

    &.item_danger {
      border-inline-start-color: var(--acv-color-status-danger-strong);
    }

    &.item_warning {
      border-inline-start-color: var(--acv-color-status-warning-strong, #d97706);
    }

    &.item_info {
      border-inline-start-color: var(--acv-color-decoration-blue-intense);
    }
  }

  .item-text {
    display: grid;
    flex: 1;
    min-inline-size: 0;
  }

  .item-title {
    @mixin acv-text-ui-body-2-medium;
    color: var(--acv-color-glyph-primary);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .budgets {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
    align-items: stretch;
  }

  .forecast {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-x-small) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .figure {
    display: grid;
    gap: 2px;
  }

  .figure-value {
    @mixin acv-text-subheading-3;
    color: var(--acv-color-glyph-primary);
  }

  .sub-title {
    @mixin acv-text-subheading-3;
    margin: var(--acv-spacing-large) 0 var(--acv-spacing-small);
    color: var(--acv-color-glyph-primary);
  }

  .card-actions {
    display: flex;
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-regular);
  }

  .link {
    color: var(--acv-color-glyph-brand);
  }

  .source {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-regular) 0 0;
    color: var(--acv-color-glyph-secondary);
  }
</style>
