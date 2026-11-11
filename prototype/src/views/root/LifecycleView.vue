<script setup lang="ts">
import { RouterLink } from 'vue-router';
import LifecycleTag from '@/components/ui/LifecycleTag.vue';
import LifecycleMoveMenu from '@/components/root/LifecycleMoveMenu.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { LifecycleState } from '@/data/types';
import { db } from '@/state/db';

/** The patch-management board: one column per phase, every model in one. */
const COLUMNS: { title: string; states: LifecycleState[]; hint: string }[] = [
  { title: 'Intake', states: ['discovered', 'verifying'], hint: 'Admission running' },
  { title: 'Decision', states: ['verified', 'failed', 'approved'], hint: 'Waiting for an admin' },
  { title: 'Rolling out', states: ['rolling-out'], hint: 'Canary → pilot → broad' },
  { title: 'Generally available', states: ['ga'], hint: 'Serving all who may' },
  { title: 'Leaving', states: ['deprecated', 'retired'], hint: 'Notice → migration → retired' },
];
const column = (states: LifecycleState[]) => db.models.filter((m) => states.includes(m.state) && !m.ownerTenantId);
</script>

<template>
  <div>
    <PageHeader title="Lifecycle" description="Models are managed like patches: verified, approved, rolled out ring by ring, and retired with notice. Move a model from its card or its page." />

    <div class="board">
      <section v-for="c in COLUMNS" :key="c.title" class="column">
        <header class="column-head">
          <h2 class="column-title">{{ c.title }} <span class="count">{{ column(c.states).length }}</span></h2>
          <span class="column-hint">{{ c.hint }}</span>
        </header>
        <RouterLink v-for="m in column(c.states)" :key="m.id" :to="`/root/models/${m.id}`" class="card">
          <span class="card-name">{{ m.name }}</span>
          <span class="card-meta">{{ m.family }} · {{ m.provider }}</span>
          <LifecycleTag :state="m.state" :ring="m.ring" />
          <span v-if="m.retiresOn" class="card-meta">retires {{ m.retiresOn }}</span>
          <LifecycleMoveMenu :model="m" compact class="card-move" />
        </RouterLink>
      </section>
    </div>

  </div>
</template>

<style scoped>
  .board {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--acv-spacing-small);
    margin-block-end: var(--acv-spacing-large);
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-small);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-tertiary);
  }

  .column-title {
    @mixin acv-text-subheading-3;
    margin: 0;
  }

  .count,
  .column-hint,
  .card-meta {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--acv-spacing-xx-small);
    padding: var(--acv-spacing-small);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-regular);
    background: var(--acv-color-surface-primary);
    color: inherit;
    text-decoration: none;

    &:hover {
      box-shadow: var(--acv-shadow-small);
    }
  }

  .card-move {
    margin-block-start: var(--acv-spacing-xx-small);
  }

  .card-name {
    @mixin acv-text-ui-body-2-medium;
  }
</style>
