<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoTable, GoTableCell, GoTableRow } from '@constructor/ui/table';
import { GoProgressBar } from '@constructor/ui/progress-bar';
import { GoDropdownMenuDivider, GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoFormControl } from '@constructor/ui/form';
import { GoInput } from '@constructor/ui/input';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { GoTabs, GoTabsItem } from '@constructor/ui/tabs';
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconEllipsisVertical, IconPlus } from '@/components/icons';
import ProviderKeysView from '@/views/tenant/ProviderKeysView.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { fmtInt } from '@/lib/format';
import { billingLabel, providers, type ComputeProvider } from '@/state/compute';
import { record } from '@/state/db';

/**
 * What the root tenant runs models on. Compute providers host deployments —
 * with a reserved quota, pay-as-you-go, or both. Model APIs are the root
 * tenant's provider keys for commercial models — the same screen a tenant has.
 */
const route = useRoute();
const router = useRouter();
const { notify } = useNotificationsStore();
const tab = computed(() => (route.query.tab === 'apis' ? 'apis' : 'compute'));
const go = (t: string) => router.replace({ query: t === 'compute' ? {} : { tab: t } });
const audit = (action: string, target: string) => record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action, target, tenantId: 'root' });

// ---- compute
const connected = computed(() => providers.filter((p) => p.status === 'connected'));
const available = computed(() => providers.filter((p) => p.status === 'available'));
// "Connect provider": pick one, then its connection form
const pickOpen = ref(false);
function pick(p: ComputeProvider): void {
  pickOpen.value = false;
  openConnect(p);
}
function disconnect(p: ComputeProvider): void {
  p.status = 'available';
  audit(`Disconnected compute provider ${p.name}`, p.name);
  notify(`${p.name} disconnected.`, 'success');
}
const connectOpen = ref(false);
const target = ref<ComputeProvider | null>(null);
const form = reactive<{ values: Record<string, string>; billing: ComputeProvider['billing']; quota: number; cap: number; region: string }>({ values: {}, billing: 'payg', quota: 16, cap: 5000, region: '' });
function openConnect(p: ComputeProvider): void {
  target.value = p;
  Object.assign(form, { values: {}, billing: p.billing === 'quota' ? 'quota' : 'payg', quota: 16, cap: 5000, region: p.regions[0] });
  connectOpen.value = true;
}
const canConnect = computed(() => !!target.value && target.value.fields.every((f) => form.values[f.id]?.trim()));
function connect(): void {
  const p = target.value;
  if (!p) return;
  Object.assign(p, { status: 'connected', billing: form.billing, quotaGpus: form.billing === 'payg' ? undefined : form.quota, paygCap: form.billing === 'quota' ? undefined : form.cap || undefined, regions: [form.region, ...p.regions.filter((r) => r !== form.region)] });
  audit(`Connected compute provider ${p.name} (${billingLabel(p)})`, p.name);
  notify(`${p.name} is ready for deployments in ${form.region}.`, 'success', 'Provider connected');
  connectOpen.value = false;
}

</script>

<template>
  <div>
    <PageHeader title="Providers" description="Compute for the models you deploy, and model APIs for the commercial models you offer." />
    <GoTabs class="tabs">
      <GoTabsItem :active="tab === 'compute'" @click="go('compute')">Compute</GoTabsItem>
      <GoTabsItem :active="tab === 'apis'" @click="go('apis')">Model APIs</GoTabsItem>
    </GoTabs>

    <template v-if="tab === 'compute'">
      <div class="embedded-head">
        <span class="sub">Where deployed models run. Each provider has a reserved quota, pay-as-you-go, or both.</span>
        <GoButton size="m" @click="pickOpen = true"><template #icon><IconPlus /></template>Connect provider</GoButton>
      </div>
      <div class="table-wrap">
        <GoTable>
          <GoTableRow header>
            <GoTableCell>Provider</GoTableCell>
            <GoTableCell>GPUs</GoTableCell>
            <GoTableCell>Billing</GoTableCell>
            <GoTableCell width="200">Reserved GPUs in use</GoTableCell>
            <GoTableCell width="56" />
          </GoTableRow>
          <GoTableRow v-for="p in connected" :key="p.id">
            <GoTableCell>{{ p.name }}<span class="sub">{{ p.kind }} · {{ p.regions.join(', ') }}</span></GoTableCell>
            <GoTableCell><span v-for="g in p.gpus" :key="g.type" class="gpu-line">{{ g.type.replace('NVIDIA ', '') }}<span class="sub-inline">{{ g.perHour ? ` · $${g.perHour.toFixed(2)}/h` : ' · owned' }}</span></span></GoTableCell>
            <GoTableCell><span class="billing">{{ billingLabel(p) }}</span></GoTableCell>
            <GoTableCell>
              <template v-if="p.quotaGpus"><span class="cell-main">{{ p.usedGpus }} of {{ p.quotaGpus }}</span><GoProgressBar :value="p.usedGpus" :max="p.quotaGpus" :variant="p.usedGpus / p.quotaGpus >= 0.9 ? 'warning' : 'default'" /></template>
              <span v-else class="sub">{{ p.usedGpus }} running · no reserved limit</span>
            </GoTableCell>
            <GoTableCell>
              <GoDropdownMenuPopover :expand-icon="false" aria-label="Provider actions" position="bottom-right">
                <template #icon><IconEllipsisVertical /></template>
                <GoDropdownMenuItem @select="router.push(`/root/deployments/new?provider=${p.id}`)">Deploy a model here</GoDropdownMenuItem>
                <GoDropdownMenuItem @select="openConnect(p)">Edit connection</GoDropdownMenuItem>
                <GoDropdownMenuDivider />
                <GoDropdownMenuItem danger :disabled="p.usedGpus > 0" @select="disconnect(p)">Disconnect<template #description>{{ p.usedGpus > 0 ? 'Stop its deployments first' : 'No deployments run here' }}</template></GoDropdownMenuItem>
              </GoDropdownMenuPopover>
            </GoTableCell>
          </GoTableRow>
        </GoTable>
      </div>
    </template>

    <ProviderKeysView v-else embedded-tenant-id="root" />

    <GoDialog v-model="pickOpen" size="m">
      <GoDialogWindow title="Connect a compute provider" header-border @close="pickOpen = false">
        <ul class="pick-list">
          <li v-for="p in available" :key="p.id">
            <button type="button" class="pick" @click="pick(p)">
              <span class="pick-name">{{ p.name }}<span class="sub-inline"> · {{ p.kind }}</span></span>
              <span class="sub">{{ p.text }}</span>
              <span class="sub">{{ p.regions.join(', ') }} · {{ p.gpus.map((g) => `${g.type.replace('NVIDIA ', '')} $${g.perHour.toFixed(2)}/h`).join(', ') }} · {{ p.billing === 'quota' ? 'reserved' : p.billing === 'payg' ? 'pay as you go' : 'reserved or pay as you go' }}</span>
            </button>
          </li>
          <li v-if="!available.length" class="sub">Every provider is connected.</li>
        </ul>
      </GoDialogWindow>
    </GoDialog>

    <GoDialog v-model="connectOpen" size="m">
      <GoDialogWindow v-if="target" :title="target.status === 'connected' ? `Edit ${target.name}` : `Connect ${target.name}`" header-border @close="connectOpen = false">
        <div class="fields">
          <GoFormControl v-for="f in target.fields" :key="f.id" :label="f.label" :label-for="`cp-${f.id}`">
            <GoInput :id="`cp-${f.id}`" v-model="form.values[f.id]" :type="f.secret ? 'password' : 'text'" size="m" :placeholder="f.placeholder" />
          </GoFormControl>
          <GoFormControl label="Default region">
            <GoSelect v-model="form.region" size="m" aria-label="Default region">
              <GoSelectOption v-for="r in target.regions" :key="r" :value="r">{{ r }}</GoSelectOption>
            </GoSelect>
          </GoFormControl>
          <GoFormControl label="Billing">
            <GoSegmentButtonGroup v-model="form.billing" size="s" aria-label="Billing">
              <GoSegmentButton value="quota">Reserved quota</GoSegmentButton>
              <GoSegmentButton value="payg">Pay as you go</GoSegmentButton>
              <GoSegmentButton value="both">Both</GoSegmentButton>
            </GoSegmentButtonGroup>
          </GoFormControl>
          <div class="two">
            <GoFormControl v-if="form.billing !== 'payg'" label="Reserved GPUs" label-for="cp-quota" hint="What your contract reserves.">
              <GoInputNumber id="cp-quota" v-model="form.quota" :min="1" size="m" />
            </GoFormControl>
            <GoFormControl v-if="form.billing !== 'quota'" label="Monthly cap, USD" label-for="cp-cap" hint="0 for no cap. Deployments stop scaling up at the cap.">
              <GoInputNumber id="cp-cap" v-model="form.cap" :min="0" :step="1000" size="m" />
            </GoFormControl>
          </div>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="connectOpen = false">Cancel</GoButton>
            <GoButton size="m" :disabled="!canConnect" @click="connect">{{ target?.status === 'connected' ? 'Save' : 'Connect' }}</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>


  </div>
</template>

<style scoped>
  .embedded-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-regular);
  }

  .gpu-line,
  .cell-main {
    display: block;
  }

  .sub-inline {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .pick-list {
    display: grid;
    gap: var(--acv-spacing-small);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pick {
    display: grid;
    gap: 2px;
    inline-size: 100%;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-primary);
    text-align: start;
    cursor: pointer;

    &:hover {
      border-color: var(--acv-color-glyph-brand);
    }
  }

  .pick-name {
    @mixin acv-text-ui-body-2-medium;
    color: var(--acv-color-glyph-primary);
  }

  .tabs,
  .toolbar {
    margin-block-end: var(--acv-spacing-regular);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .provider {
    display: grid;
    align-content: start;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-regular);
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
    @mixin acv-text-ui-caption-1;
    display: grid;
    place-items: center;
    inline-size: 36px;
    block-size: 36px;
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
    text-transform: uppercase;
  }

  .titles {
    display: grid;
    flex: 1;
    min-inline-size: 0;
  }

  .name {
    @mixin acv-text-ui-body-2-medium;
    margin: 0;
  }

  .kind,
  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .desc {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .gpus {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .billing {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .foot {
    display: flex;
    justify-content: flex-end;
    margin-block-start: auto;
  }

  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-end: var(--acv-spacing-small);
  }

  .section-title {
    @mixin acv-text-subheading-3;
    margin: 0;
  }

  .spaced {
    margin-block-start: var(--acv-spacing-large);
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow: visible;
  }

  .mono {
    @mixin acv-text-ui-caption-1;
    font-family: var(--acv-font-family-monospace, monospace);
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
