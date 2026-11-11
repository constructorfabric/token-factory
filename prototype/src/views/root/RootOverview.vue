<script setup lang="ts">
import { chooser } from '@/state/onboarding';
import { tenantLicenses } from '@/state/tenantLicenses';
import { GoButton } from '@constructor/ui/button';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { rootAttention } from '@/state/attention';
import BarList from '@/components/charts/BarList.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import UsageMeter from '@/components/ui/UsageMeter.vue';
import { tenantKeyShare } from '@/data/mock';
import type { Tenant } from '@/data/types';
import { fmtCredits, fmtDate, fmtInt } from '@/lib/format';
import { db, tenantById } from '@/state/db';

/**
 * What the instance admin needs on arrival, built like the tenant overview:
 * what to act on now, then the two kinds of credits across every tenant,
 * the tenants themselves, and GPU capacity. Detail lives on the owning page.
 */
const router = useRouter();

// ---- the month so far (mock: today is 10 November)
const DAY = 10;
const DAYS = 30;
const tenants = computed(() => db.tenants.filter((t) => t.tier !== 'root'));
const ownShare = (t: Tenant) => tenantKeyShare[t.id] ?? (t.byok ? 0.25 : 0);
const platformOf = (t: Tenant) => (t.spend30d * (1 - ownShare(t)) * DAY) / DAYS;
const forecast = (v: number) => (v * DAYS) / DAY;
const platformSoFar = computed(() => tenants.value.reduce((s, t) => s + platformOf(t), 0));
const topPlatform = computed(() => [...tenants.value].filter((t) => platformOf(t) > 0).sort((a, b) => platformOf(b) - platformOf(a)).slice(0, 5).map((t) => ({ label: t.name, value: platformOf(t), hint: t.budget30d ? `${Math.round((forecast(platformOf(t)) / t.budget30d) * 100)}% of allowance by 30 Nov` : undefined })));

// ---- tenants and seats
// Tenants per tenant license; a partner's own licenses say whose they are.
const byLicense = computed(() => tenantLicenses
  .map((l) => ({ label: l.name, hint: l.ownerId === 'root' ? undefined : `by ${tenantById(l.ownerId)?.name}`, value: tenants.value.filter((t) => t.licenseTypeId === l.id).length }))
  .filter((r) => r.value)
  .sort((a, b) => b.value - a.value));
const seats = computed(() => tenants.value.filter((t) => t.seats).reduce((s, t) => ({ taken: s.taken + Math.min(t.users, t.seats), sold: s.sold + t.seats }), { taken: 0, sold: 0 }));

// ---- capacity
const gpus = computed(() => db.clusters.filter((c) => c.status !== 'offline').reduce((s, c) => ({ used: s.used + c.gpusUsed, total: s.total + c.gpus }), { used: 0, total: 0 }));
const clusters = computed(() => db.clusters.map((c) => ({ label: c.name, value: c.gpusUsed, hint: `${c.status === 'healthy' ? '' : `${c.status} · `}${c.gpusUsed} of ${c.gpus} GPUs` })));

// ---- needs attention: only what the instance admin acts on, each with one action
// The same items the notification inbox keeps, with older events.
const attention = computed(() => rootAttention());
</script>

<template>
  <div>
    <PageHeader title="Instance overview" description="What needs you now, and how usage, tenants and capacity stand this month.">
      <template #actions><GoButton variant="secondary" size="m" @click="chooser.open = true">Start onboarding</GoButton></template>
    </PageHeader>

    <Card title="Needs attention" :subtitle="attention.length ? `${attention.length} ${attention.length === 1 ? 'item' : 'items'}` : 'Nothing right now'" flush class="spaced">
      <template #actions><GoButton variant="ghost" size="s" @click="router.push('/root/notifications')">All notifications</GoButton></template>
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

    <div class="cards">
      <Card title="Platform credits" subtitle="November so far · everything that ran through this instance" fill>
        <div class="figure">
          <span class="figure-value">{{ fmtCredits(platformSoFar) }}</span>
          <span class="sub">used this month · heading for {{ fmtCredits(forecast(platformSoFar)) }} by 30 November</span>
        </div>
        <h3 class="sub-title">Top tenants</h3>
        <BarList :items="topPlatform" :format="fmtCredits" />
        <div class="card-actions"><GoButton variant="secondary" size="s" @click="router.push('/root/usage')">Open usage</GoButton></div>
      </Card>
      <Card title="Tenants" :subtitle="`${tenants.length} tenants · seats in their organization licenses`" fill>
        <UsageMeter label="Seats taken" :used="seats.taken" :limit="seats.sold" :format="fmtInt" />
        <h3 class="sub-title">By license</h3>
        <BarList :items="byLicense" :format="fmtInt" />
        <div class="card-actions"><GoButton variant="secondary" size="s" @click="router.push('/root/tenants')">Open tenants</GoButton></div>
      </Card>
      <Card title="GPU capacity" subtitle="Allocated now · clusters that are online" fill>
        <UsageMeter label="Allocated" :used="gpus.used" :limit="gpus.total" :format="fmtInt" />
        <h3 class="sub-title">By cluster</h3>
        <BarList :items="clusters" :format="(n) => `${fmtInt(n)} GPUs`" />
        <div class="card-actions"><GoButton variant="secondary" size="s" @click="router.push('/root/deployments')">Open deployments</GoButton></div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
  .spaced {
    margin-block-end: var(--acv-spacing-regular);
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

  .cards {
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
</style>
