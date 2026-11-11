<script setup lang="ts">
import { IconPlus } from '@/components/icons';
import { useRouter } from 'vue-router';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoButton } from '@constructor/ui/button';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoInputNumber } from '@constructor/ui/input-number-control';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoProgressBar } from '@constructor/ui/progress-bar';
import StatusTag from '@/components/ui/StatusTag.vue';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { IconRefresh } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { Deployment } from '@/data/types';
import { fmtInt } from '@/lib/format';
import { db, modelById, record, tenantById } from '@/state/db';

const { notify } = useNotificationsStore();
const cluster = (id: string) => db.clusters.find((c) => c.id === id);
const STATUS = { running: 'success', scaling: 'info', deploying: 'info', stopped: 'disabled', failed: 'error' } as const;
const CLUSTER = { healthy: 'success', degraded: 'warning', offline: 'disabled' } as const;

function scale(d: Deployment): void {
  record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Set replicas to ${d.replicas}`, target: `${modelById(d.modelId)?.name} · ${cluster(d.clusterId)?.name}`, tenantId: d.tenantId ?? 'root' });
  notify(`${modelById(d.modelId)?.name} scaling to ${d.replicas} replicas.`, 'success');
}

const sDep = useSort(() => db.deployments, { model: (r) => modelById(r.modelId)?.name, pool: (r) => cluster(r.clusterId)?.name, runtime: (r) => r.runtime, replicas: (r) => r.replicas, util: (r) => r.utilization, tps: (r) => r.tps, status: (r) => r.status });
const router = useRouter();
</script>

<template>
  <div>
    <PageHeader title="Deployments" description="Where self-hosted models run: GPU pools, replicas, utilization and the runtime they use.">
      <template #actions>
        <GoButton size="m" @click="router.push('/root/deployments/new')"><template #icon><IconPlus /></template>New deployment</GoButton>
      </template>
    </PageHeader>

    <div class="clusters">
      <Card v-for="c in db.clusters" :key="c.id" :title="c.name" :subtitle="`${c.location} · ${c.gpu}`">
        <template #actions>
          <StatusTag :variant="CLUSTER[c.status]" size="sm">{{ c.status }}</StatusTag>
        </template>
        <div class="gpu">
          <span>{{ c.gpusUsed }} of {{ c.gpus }} GPUs allocated</span>
          <GoProgressBar :value="c.gpusUsed" :max="c.gpus" :variant="c.gpusUsed / c.gpus > 0.85 ? 'warning' : 'default'" />
        </div>
        <span class="sub">{{ c.costHour ? `$${c.costHour}/GPU-hour` : 'Owned hardware' }}</span>
      </Card>
    </div>

    <Card title="Model deployments" flush class="spaced">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sDep" k="model">Model</SortHeader>
          <SortHeader :sort="sDep" k="pool">Pool</SortHeader>
          <SortHeader :sort="sDep" k="runtime">Runtime</SortHeader>
          <SortHeader :sort="sDep" k="replicas">Replicas</SortHeader>
          <SortHeader :sort="sDep" k="util">Utilization</SortHeader>
          <SortHeader :sort="sDep" k="tps">Throughput</SortHeader>
          <SortHeader :sort="sDep" k="status">Status</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="d in sDep.rows.value" :key="d.id">
          <GoTableCell>
            <GoTableName>{{ modelById(d.modelId)?.name }}</GoTableName>
            <span v-if="d.tenantId" class="sub">Dedicated to {{ tenantById(d.tenantId)?.name }}</span>
          </GoTableCell>
          <GoTableCell>{{ cluster(d.clusterId)?.name }}</GoTableCell>
          <GoTableCell>
            {{ d.runtime }} · {{ d.quantization }}
            <GoTag v-if="d.runtime !== 'vLLM'" size="s" color="orange">preview runtime</GoTag>
          </GoTableCell>
          <GoTableCell>
            <div class="replicas">
              <GoInputNumber v-model="d.replicas" :min="d.minReplicas" :max="d.maxReplicas" size="s" :aria-label="`Replicas of ${modelById(d.modelId)?.name}`" />
              <GoButton variant="ghost" size="s" aria-label="Apply" @click="scale(d)"><template #icon><IconRefresh /></template></GoButton>
            </div>
            <span class="sub">{{ d.minReplicas }}–{{ d.maxReplicas }} × {{ d.gpusPerReplica }} GPU</span>
          </GoTableCell>
          <GoTableCell><GoProgressBar :value="d.utilization" :max="100" suffix /></GoTableCell>
          <GoTableCell>{{ fmtInt(d.tps) }} tok/s<span class="sub">queue {{ d.queue }}</span></GoTableCell>
          <GoTableCell><StatusTag :variant="STATUS[d.status]" size="sm">{{ d.status }}</StatusTag></GoTableCell>
        </GoTableRow>
      </GoTable>
    </Card>
  </div>
</template>

<style scoped>
  .clusters {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--acv-spacing-regular);
  }

  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .gpu {
    @mixin acv-text-ui-caption-1-medium;
    display: grid;
    gap: var(--acv-spacing-xx-small);
  }

  .replicas {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-xx-small);
    max-inline-size: 160px;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
