<script setup lang="ts">
/** A titled surface for one subject on a page. */
/** `fill` stretches the card to its row and lets content push actions to the bottom. */
defineProps<{ title?: string; subtitle?: string; flush?: boolean; fill?: boolean }>();
</script>

<template>
  <section class="card" :class="fill && 'card_fill'">
    <header v-if="title || $slots.actions" class="head">
      <div class="titles">
        <h2 v-if="title" class="title">{{ title }}</h2>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions"><slot name="actions" /></div>
    </header>
    <div class="body" :class="flush && 'body_flush'"><slot /></div>
  </section>
</template>

<style scoped>
  .card {
    min-inline-size: 0;

    &.card_fill {
      display: flex;
      flex-direction: column;

      .body {
        display: flex;
        flex: 1;
        flex-direction: column;
      }
    }
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-regular) var(--acv-spacing-medium) 0;
  }

  .title {
    @mixin acv-text-subheading-2;
    margin: 0;
    color: var(--acv-color-glyph-primary);
  }

  .subtitle {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-xx-small) 0 0;
    color: var(--acv-color-glyph-secondary);
  }

  .actions {
    display: flex;
    gap: var(--acv-spacing-x-small);
  }

  .body {
    padding: var(--acv-spacing-regular) var(--acv-spacing-medium) var(--acv-spacing-medium);

    &.body_flush {
      padding: var(--acv-spacing-x-small) 0 var(--acv-spacing-x-small);
    }
  }
</style>
