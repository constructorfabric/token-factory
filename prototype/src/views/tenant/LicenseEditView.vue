<script setup lang="ts">
import { ownCredits } from '@/state/credits';
import { GoButton } from '@constructor/ui/button';
import { GoCheckbox } from '@constructor/ui/checkbox';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
import CustomerLifecycleTag from '@/components/ui/CustomerLifecycleTag.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { License, LimitPeriod, Model } from '@/data/types';
import { CREDITS_PER_USD, fmtContext, fmtCreditPrice, toCredits } from '@/lib/format';
import { db, licenseById, modelById, record, tenantBase } from '@/state/db';
import { isModelAlias } from '@/state/aliases';
import { session } from '@/state/session';

const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tenantId = String(route.params.tenantId ?? 'root');
const isNew = route.params.id === 'new';
const original = licenseById(String(route.params.id));

const blank: License = {
  id: `l-${Date.now()}`, tenantId, name: '', description: '', allowedModels: [],
  limits: { daily: { tokens: 1_000_000, cost: 10 }, weekly: { tokens: 4_000_000, cost: 40 }, monthly: { tokens: 15_000_000, cost: 150 } },
  keyLimits: { daily: 0, weekly: 0, monthly: 0 }, platformAllowed: true, keyRpm: 30, keyMaxContext: 128_000,
  rpm: 60, maxContext: 128_000, guardrailProfile: 'Default', holders: 0,
};
// A plain copy: structuredClone cannot clone Vue's reactive proxies.
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const draft = reactive<License>({ allowedAliases: [], ...clone(original ?? blank) });

/** What this tenant may hand out: platform models it has enabled, plus its own. */
const available = computed(() =>
  db.models.filter((m) => (m.ownerTenantId === tenantId || !m.ownerTenantId) && ['ga', 'rolling-out', 'deprecated'].includes(m.state)),
);
const groups = computed(() => {
  const own = `Your keys and models · ${ownCredits(tenantId)}`;
  const g: Record<string, Model[]> = { 'Commercial · platform credits': [], 'Self-hosted & Gcore · platform credits': [], [own]: [] };
  for (const m of available.value) {
    if (m.ownerTenantId) g[own]!.push(m);
    else if (m.hosting === 'commercial') g['Commercial · platform credits']!.push(m);
    else g['Self-hosted & Gcore · platform credits']!.push(m);
  }
  return g;
});

const PERIODS: LimitPeriod[] = ['daily', 'weekly', 'monthly'];
const holders = computed(() => db.units.filter((u) => u.defaultLicenseId === draft.id).reduce((s, u) => s + u.members, 0));

// Limits are edited in AI credits and stored as the license's cost.
const credits = reactive({ daily: toCredits(draft.limits.daily.cost), weekly: toCredits(draft.limits.weekly.cost), monthly: toCredits(draft.limits.monthly.cost) });
const CONTEXTS = [64_000, 128_000, 200_000, 256_000, 400_000, 1_000_000];
const PERIOD_LABEL: Record<LimitPeriod, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const ownAllowed = ref(draft.keyLimits.monthly > 0);
const keyCredits = reactive({ daily: toCredits(draft.keyLimits.daily), weekly: toCredits(draft.keyLimits.weekly), monthly: toCredits(draft.keyLimits.monthly) });

function save(): void {
  for (const period of PERIODS) {
    draft.limits[period].cost = draft.platformAllowed ? credits[period] / CREDITS_PER_USD : 0;
    draft.keyLimits[period] = ownAllowed.value ? keyCredits[period] / CREDITS_PER_USD : 0;
  }
  if (!draft.name.trim()) {
    notify('Give the license a name.', 'warning');
    return;
  }
  if (isNew) db.licenses.push(clone(draft));
  else if (original) Object.assign(original, clone(draft));
  record({ actor: session.current.value?.person ?? '', actorRole: session.current.value?.role ?? '', onBehalfOf: session.impersonating.value ? 'Acme Corp' : undefined, action: `${isNew ? 'Created' : 'Edited'} license ${draft.name}`, target: `License: ${draft.name}`, tenantId });
  notify(isNew ? `${draft.name} created.` : `${draft.name} saved. Seat holders get the new limits on their next request.`, 'success', 'License saved');
  void router.push(`${tenantBase(tenantId)}/licenses`);
}
// Model aliases offered: those pointing at a model this tenant may hand out.
const offeredAliases = computed(() => db.aliases.filter((a) => isModelAlias(a) && available.value.some((m) => m.id === a.primary)));
</script>

<template>
  <div>
    <PageHeader :title="isNew ? 'New license' : `Edit ${original?.name}`" :description="isNew ? 'A seat type for users in this tenant.' : `Held by ${draft.holders} users; default for units with ${holders} users.`" back @back="router.push(`${tenantBase(tenantId)}/licenses`)">
      <template #actions>
        <GoButton variant="secondary" size="m" @click="router.push(`${tenantBase(tenantId)}/licenses`)">Cancel</GoButton>
        <GoButton size="m" @click="save">Save license</GoButton>
      </template>
    </PageHeader>

    <div class="layout">
      <div class="column">
        <Card title="General">
          <div class="fields">
            <GoFormControl label="Name" label-for="lic-name" required>
              <GoInput id="lic-name" v-model="draft.name" size="m" />
            </GoFormControl>
            <GoFormControl label="Description" label-for="lic-desc">
              <GoInput id="lic-desc" v-model="draft.description" type="textarea" size="m" />
            </GoFormControl>
          </div>
        </Card>

        <Card title="Usage limits" subtitle="Per holder, set for each credit type. A request over a limit is refused with the limit and its reset time.">
          <section class="budget">
            <div class="budget-head">
              <h3 class="budget-title">Platform credits</h3>
              <GoToggle v-model="draft.platformAllowed" size="s">Allowed</GoToggle>
            </div>
            <p class="budget-note">Platform models, drawn from your organization license.</p>
            <template v-if="draft.platformAllowed">
              <div class="periods">
                <GoFormControl v-for="p in PERIODS" :key="p" :label="PERIOD_LABEL[p]" :label-for="`lim-${p}`">
                  <GoInputNumber :id="`lim-${p}`" v-model="credits[p]" :min="0" :step="500" size="m" />
                </GoFormControl>
              </div>
              <div class="caps">
                <GoFormControl label="Requests per minute" label-for="lim-rpm">
                  <GoInputNumber id="lim-rpm" v-model="draft.rpm" :min="1" size="m" />
                </GoFormControl>
                <GoFormControl label="Max context">
                  <GoSelect v-model="draft.maxContext" size="m" aria-label="Platform max context">
                    <GoSelectOption v-for="c in CONTEXTS" :key="c" :value="c">{{ fmtContext(c) }} tokens</GoSelectOption>
                  </GoSelect>
                </GoFormControl>
              </div>
            </template>
            <p v-else class="budget-note">Holders cannot use platform models.</p>
          </section>
          <section class="budget">
            <div class="budget-head">
              <h3 class="budget-title">{{ ownCredits(tenantId) }}</h3>
              <GoToggle v-model="ownAllowed" size="s">Allowed</GoToggle>
            </div>
            <p class="budget-note">Models on your own provider keys, billed by your provider.</p>
            <template v-if="ownAllowed">
              <div class="periods">
                <GoFormControl v-for="p in PERIODS" :key="p" :label="PERIOD_LABEL[p]" :label-for="`own-${p}`">
                  <GoInputNumber :id="`own-${p}`" v-model="keyCredits[p]" :min="0" :step="500" size="m" />
                </GoFormControl>
              </div>
              <div class="caps">
                <GoFormControl label="Requests per minute" label-for="own-rpm">
                  <GoInputNumber id="own-rpm" v-model="draft.keyRpm" :min="1" size="m" />
                </GoFormControl>
                <GoFormControl label="Max context">
                  <GoSelect v-model="draft.keyMaxContext" size="m" :aria-label="`${ownCredits(tenantId)} max context`">
                    <GoSelectOption v-for="c in CONTEXTS" :key="c" :value="c">{{ fmtContext(c) }} tokens</GoSelectOption>
                  </GoSelect>
                </GoFormControl>
              </div>
            </template>
            <p v-else class="budget-note">Holders cannot use your own models.</p>
          </section>
        </Card>
      </div>

      <Card title="Allowed models" :subtitle="`${draft.allowedModels.length} models${draft.allowedAliases?.length ? ` and ${draft.allowedAliases.length} model aliases` : ''} selected. Only models enabled for this tenant are offered.`">
        <div v-if="offeredAliases.length" class="group">
          <h3 class="group-title">Model aliases · follow the newest model of their line</h3>
          <label v-for="a in offeredAliases" :key="a.id" class="model">
            <GoCheckbox v-model="draft.allowedAliases" :value="a.id" :aria-label="a.name" />
            <span class="model-name"><code>{{ a.name }}</code><span class="model-meta">{{ a.family }} family · now {{ modelById(a.primary)?.name }}</span></span>
          </label>
        </div>
        <div v-for="(list, group) in groups" :key="group" class="group">
          <h3 class="group-title">{{ group }}</h3>
          <label v-for="m in list" :key="m.id" class="model">
            <GoCheckbox v-model="draft.allowedModels" :value="m.id" :aria-label="m.name" />
            <span class="model-name">{{ m.name }}<span class="model-meta">{{ m.provider }} · {{ fmtContext(m.context) }} · in {{ fmtCreditPrice(m.priceIn) }} / out {{ fmtCreditPrice(m.priceOut) }} credits per 1M</span></span>
            <span class="model-tags">
              <GoTag v-if="m.priceOut >= 40" size="s" color="purple">premium · per-model grant</GoTag>
              <CustomerLifecycleTag v-if="!m.ownerTenantId" :model="m" />
            </span>
          </label>
        </div>
      </Card>

    </div>
  </div>
</template>

<style scoped>

  .budget {
    display: grid;
    gap: var(--acv-spacing-x-small);
    padding-block: var(--acv-spacing-small);

    & + .budget {
      border-block-start: var(--acv-border-light);
    }
  }

  .budget-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .budget-title {
    @mixin acv-text-subheading-3;
    margin: 0;
  }

  .budget-note {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .periods {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--acv-spacing-small);
  }

  .caps {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--acv-spacing-small);
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .column {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);

    &.fields_inline {
      grid-template-columns: 1fr 1fr;
      margin-block-start: var(--acv-spacing-regular);
    }
  }

  .period {
    text-transform: capitalize;
  }

  .group {
    & + & {
      margin-block-start: var(--acv-spacing-regular);
    }
  }

  .group-title {
    @mixin acv-text-ui-caption-1-medium;
    margin: 0 0 var(--acv-spacing-xx-small);
    color: var(--acv-color-glyph-tertiary);
    text-transform: uppercase;
  }

  .model {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-x-small) 0;
    border-block-end: var(--acv-border-light);
    cursor: pointer;
  }

  .model-name {
    @mixin acv-text-ui-body-2-medium;
    display: flex;
    flex-direction: column;
  }

  .model-tags {
    display: flex;
    gap: var(--acv-spacing-xx-small);
  }

  .model-meta {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
