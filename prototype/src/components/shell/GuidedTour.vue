<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { closeTour, tour } from '@/state/onboarding';

/**
 * A guided tour: dims the page, lights up one element at a time, and says what
 * it is for and what the user can do there. Back, Next, Skip; Escape closes.
 */
const step = computed(() => tour.steps[tour.index]);
const rect = ref<DOMRect | null>(null);

function measure(): void {
  const sel = step.value?.target;
  const el = sel ? document.querySelector(sel) : null;
  rect.value = el ? el.getBoundingClientRect() : null;
}
watch(() => [tour.open, tour.index], () => nextTick(measure), { immediate: true });
const onResize = () => tour.open && measure();
const onKey = (e: KeyboardEvent) => {
  if (!tour.open) return;
  if (e.key === 'Escape') closeTour();
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') back();
};
onMounted(() => {
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', onKey);
});

const PAD = 6;
const hole = computed(() => (rect.value ? { top: `${rect.value.top - PAD}px`, left: `${rect.value.left - PAD}px`, width: `${rect.value.width + PAD * 2}px`, height: `${rect.value.height + PAD * 2}px` } : null));
// The card sits beside what it points at, kept inside the window.
const card = computed(() => {
  if (!rect.value) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const top = Math.min(Math.max(rect.value.top - 12, 16), window.innerHeight - 300);
  return { top: `${top}px`, left: `${rect.value.right + 20}px` };
});
const last = computed(() => tour.index === tour.steps.length - 1);
function next(): void {
  if (last.value) closeTour();
  else tour.index++;
}
function back(): void {
  if (tour.index > 0) tour.index--;
}
</script>

<template>
  <div v-if="tour.open && step" class="tour" role="dialog" aria-modal="true" :aria-label="step.title">
    <div v-if="hole" class="hole" :style="hole" />
    <div v-else class="dim" />
    <div class="card" :style="card">
      <span class="count">{{ tour.index + 1 }} of {{ tour.steps.length }}</span>
      <h2 class="title">{{ step.title }}</h2>
      <p class="text">{{ step.text }}</p>
      <ul v-if="step.actions?.length" class="actions">
        <li v-for="a in step.actions" :key="a">{{ a }}</li>
      </ul>
      <div class="dots" aria-hidden="true">
        <span v-for="(_, i) in tour.steps" :key="i" class="dot" :class="{ dot_on: i === tour.index }" />
      </div>
      <div class="footer">
        <GoButton v-if="!last" variant="ghost" size="s" @click="closeTour">Skip tour</GoButton>
        <span class="spacer" />
        <GoButton v-if="tour.index > 0" variant="secondary" size="s" @click="back">Back</GoButton>
        <GoButton size="s" @click="next">{{ last ? 'Start using Token Factory' : tour.index === 0 ? 'Show me around' : 'Next' }}</GoButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tour {
    position: fixed;
    inset: 0;
    z-index: 2000;
  }

  .dim {
    position: absolute;
    inset: 0;
    background: rgb(0 0 0 / 50%);
  }

  .hole {
    position: absolute;
    border-radius: var(--acv-radius-medium);
    box-shadow: 0 0 0 9999px rgb(0 0 0 / 50%);
    outline: 2px solid var(--acv-color-glyph-brand);
    pointer-events: none;
    transition: all 0.2s ease;
  }

  .card {
    position: absolute;
    display: grid;
    gap: var(--acv-spacing-x-small);
    inline-size: 360px;
    padding: var(--acv-spacing-regular);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
  }

  .count {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }

  .title {
    @mixin acv-text-subheading-3;
    margin: 0;
    color: var(--acv-color-glyph-primary);
  }

  .text {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .actions {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: 2px;
    margin: 0;
    padding-inline-start: var(--acv-spacing-regular);
    color: var(--acv-color-glyph-primary);
  }

  .dots {
    display: flex;
    gap: 4px;
    margin-block-start: var(--acv-spacing-x-small);
  }

  .dot {
    inline-size: 6px;
    block-size: 6px;
    border-radius: 50%;
    background: var(--acv-color-surface-tertiary);

    &.dot_on {
      background: var(--acv-color-glyph-brand);
    }
  }

  .footer {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-x-small);
  }

  .spacer {
    flex: 1;
  }
</style>
