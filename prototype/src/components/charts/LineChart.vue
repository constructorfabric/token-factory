<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Point } from '@/data/types';

/**
 * One series over time. Single-series on purpose: the title names it, so no
 * legend box and no categorical palette are needed. The hover crosshair shows
 * the exact value, which is why the axis carries only three gridlines.
 */
const props = withDefaults(
  defineProps<{
    points: Point[];
    label: string;
    format?: (n: number) => string;
    height?: number;
  }>(),
  { format: (n: number) => String(n), height: 180 },
);

const width = 640;
const pad = { top: 12, right: 12, bottom: 24, left: 56 };
const hover = ref<number | null>(null);

const max = computed(() => {
  const top = Math.max(...props.points.map((p) => p.value), 1);
  const magnitude = 10 ** Math.floor(Math.log10(top));
  return Math.ceil(top / magnitude) * magnitude;
});

const x = (i: number) => pad.left + (i / Math.max(props.points.length - 1, 1)) * (width - pad.left - pad.right);
const y = (v: number) => pad.top + (1 - v / max.value) * (props.height - pad.top - pad.bottom);

const line = computed(() => props.points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(''));
const area = computed(() => `${line.value}L${x(props.points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`);
const ticks = computed(() => [0, max.value / 2, max.value]);
// Every 7th day plus the last, unless the last would sit on top of the one before it.
const xLabels = computed(() => props.points.map((p, i) => ({ i, label: p.label })).filter((_, i, all) => i % 7 === 0 || (i === all.length - 1 && i % 7 > 3)));

function onMove(event: MouseEvent): void {
  const svg = event.currentTarget as SVGSVGElement;
  const box = svg.getBoundingClientRect();
  const local = ((event.clientX - box.left) / box.width) * width;
  const step = (width - pad.left - pad.right) / Math.max(props.points.length - 1, 1);
  hover.value = Math.min(props.points.length - 1, Math.max(0, Math.round((local - pad.left) / step)));
}

const hovered = computed(() => (hover.value === null ? null : props.points[hover.value]));
const tooltipLeft = computed(() => (hover.value === null ? 0 : (x(hover.value) / width) * 100));
</script>

<template>
  <figure class="line-chart">
    <svg
      class="plot"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="`${label}, last ${points.length} days`"
      @mousemove="onMove"
      @mouseleave="hover = null"
    >
      <g class="grid">
        <g v-for="t in ticks" :key="t">
          <line :x1="pad.left" :x2="width - pad.right" :y1="y(t)" :y2="y(t)" />
          <text :x="pad.left - 8" :y="y(t) + 4" text-anchor="end">{{ format(t) }}</text>
        </g>
        <text v-for="l in xLabels" :key="l.i" :x="x(l.i)" :y="height - 6" text-anchor="middle">{{ l.label }}</text>
      </g>
      <path class="area" :d="area" />
      <path class="line" :d="line" />
      <g v-if="hover !== null && hovered">
        <line class="crosshair" :x1="x(hover)" :x2="x(hover)" :y1="pad.top" :y2="y(0)" />
        <circle class="marker" :cx="x(hover)" :cy="y(hovered.value)" r="4" />
      </g>
    </svg>
    <div v-if="hovered" class="tooltip" :class="tooltipLeft > 70 && 'tooltip_left'" :data-left="tooltipLeft">
      <span class="tooltip-label">{{ hovered.label }}</span>
      <span class="tooltip-value">{{ format(hovered.value) }}</span>
    </div>
  </figure>
</template>

<style scoped>
  .line-chart {
    position: relative;
    margin: 0;
  }

  .plot {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .grid {
    line {
      stroke: var(--acv-color-border-light);
      stroke-width: 1;
    }

    text {
      @mixin acv-text-ui-caption-2;
      fill: var(--acv-color-glyph-tertiary);
    }
  }

  .area {
    fill: var(--acv-color-decoration-blue-light);
    opacity: 0.6;
  }

  .line {
    fill: none;
    stroke: var(--acv-color-decoration-blue-intense);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .crosshair {
    stroke: var(--acv-color-border-strong);
    stroke-dasharray: 3 3;
  }

  .marker {
    fill: var(--acv-color-decoration-blue-intense);
    stroke: var(--acv-color-surface-primary);
    stroke-width: 2;
  }

  .tooltip {
    position: absolute;
    top: var(--acv-spacing-xx-small);
    inset-inline-end: var(--acv-spacing-x-small);
    display: flex;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-xx-small) var(--acv-spacing-x-small);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-primary);
    box-shadow: var(--acv-shadow-small);
    pointer-events: none;
  }

  .tooltip-label {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .tooltip-value {
    @mixin acv-text-ui-caption-1-medium;
    color: var(--acv-color-glyph-primary);
  }
</style>
