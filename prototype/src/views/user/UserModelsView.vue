<script setup lang="ts">
import { ownName, sourceLabel } from '@/state/credits';
import SortHeader from '@/components/ui/SortHeader.vue';
import { useSort } from '@/lib/useSort';
import { GoTable, GoTableCell, GoTableName, GoTableRow } from '@constructor/ui/table';
import { GoTag } from '@constructor/ui/tag';
import { computed } from 'vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { GoMessage } from '@constructor/ui/message';
import { fmtContext, fmtCredits, toCredits } from '@/lib/format';
import { creditSource, db, modelById } from '@/state/db';
import Card from '@/components/ui/Card.vue';
import { isModelAlias, modelAliasesIn, scenarioAliases } from '@/state/aliases';
import { useMe } from './useMe';

const { seat } = useMe();
const models = computed(() => (seat.value.license?.allowedModels ?? []).map((id) => modelById(id)).filter((m) => !!m));
// Model aliases your license names; each reaches whatever model it points at now.
const callable = computed(() => modelAliasesIn(seat.value.license?.allowedAliases).map((a) => ({ alias: a, model: modelById(a.primary) })));
const aliasesTo = (modelId: string) => callable.value.filter((r) => r.model?.id === modelId).map((r) => r.alias.name);

const sUm = useSort(() => models.value, { name: (r) => r.name, context: (r) => r.context, price: (r) => r.priceOut, src: (r) => creditSource(r), res: (r) => r.dataResidency });
</script>

<template>
  <div>
    <PageHeader title="My models" :description="`What your license (${seat.license?.name}) lets you call. Use the model ID or an alias; the response names the model that answered.`" />
    <GoMessage v-if="seat.license" variant="info" border rounded class="limits">
      Your limits — Platform: {{ fmtCredits(seat.license.limits.daily.cost) }} a day · {{ seat.license.rpm }} requests a minute<template v-if="seat.license.keyLimits.daily"> · {{ ownName() }}: {{ fmtCredits(seat.license.keyLimits.daily) }} a day · {{ seat.license.keyRpm }} requests a minute</template>
    </GoMessage>

    <Card title="Model aliases you can call" :subtitle="`${callable.length} of ${db.aliases.filter(isModelAlias).length}, from your license. Each follows one model line to its newest model.`" flush class="aliases-card">
      <ul class="alias-list">
        <li v-for="r in callable" :key="r.alias.id" class="alias-row">
          <code class="alias-name">{{ r.alias.name }}</code>
          <span class="alias-what">{{ r.alias.family }} family</span>
          <span class="alias-to">→ {{ r.model?.name }}</span>
        </li>
        <li v-if="!callable.length" class="sub alias-row">Your license reaches no model alias; call models by their ID.</li>
      </ul>
    </Card>

    <Card title="Scenario aliases" subtitle="Open to everyone and not part of your license: name the task, and the platform picks the model." flush class="aliases-card">
      <ul class="alias-list">
        <li v-for="a in scenarioAliases()" :key="a.id" class="alias-row">
          <code class="alias-name">{{ a.name }}</code>
          <span class="alias-what">{{ a.scenario }}</span>
          <span class="alias-to">→ {{ modelById(a.primary)?.name }}</span>
        </li>
      </ul>
    </Card>

    <div class="table-wrap">
      <GoTable>
        <GoTableRow header>
          <SortHeader :sort="sUm" k="name">Model</SortHeader>
          <GoTableCell>Call it as</GoTableCell>
          <SortHeader :sort="sUm" k="context">Context</SortHeader>
          <SortHeader :sort="sUm" k="price">AI credits per 1M tokens, in / out</SortHeader>
          <SortHeader :sort="sUm" k="src">Charged to</SortHeader>
          <SortHeader :sort="sUm" k="res">Data stays in</SortHeader>
        </GoTableRow>
        <GoTableRow v-for="m in sUm.rows.value" :key="m.id">
          <GoTableCell>
            <GoTableName>{{ m.name }}</GoTableName>
            <span class="sub">{{ m.provider }}</span>
          </GoTableCell>
          <GoTableCell>
            <code>{{ m.id.replace(/^m-/, '') }}</code>
            <GoTag v-for="a in aliasesTo(m.id)" :key="a" size="s" color="blue" class="alias">{{ a }}</GoTag>
          </GoTableCell>
          <GoTableCell>{{ fmtContext(m.context) }}</GoTableCell>
          <GoTableCell>
            {{ toCredits(m.priceIn) }} / {{ toCredits(m.priceOut) }}
            <GoTag v-if="m.priceOut >= 40" size="s" color="purple">premium · per-model grant</GoTag>
          </GoTableCell>
          <GoTableCell><GoTag size="s" :color="creditSource(m) === 'keys' ? 'blue' : 'neutral'">{{ sourceLabel(creditSource(m)) }}</GoTag></GoTableCell>
          <GoTableCell>{{ m.dataResidency }}</GoTableCell>
        </GoTableRow>
      </GoTable>
    </div>
  </div>
</template>

<style scoped>
  .limits {
    margin-block-end: var(--acv-spacing-regular);
  }

  .table-wrap {
    display: grid;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    overflow-x: auto;
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .aliases-card {
    margin-block-end: var(--acv-spacing-regular);
  }

  .alias-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .alias-row {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--acv-spacing-regular);
    align-items: center;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border-block-start: var(--acv-border-light);
  }

  .alias-what {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .alias-to {
    @mixin acv-text-ui-body-2;
    display: flex;
    gap: var(--acv-spacing-x-small);
    align-items: center;
  }

  .alias {
    margin-inline-start: var(--acv-spacing-xx-small);
  }
</style>
