<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * Usage per day as a calendar: weeks run left to right, Monday at the top.
 * Magnitude only, so one hue from light to dark (sequential), with an empty
 * day in the neutral surface colour. The legend states the scale; hovering a
 * day gives its exact value.
 */
const props = withDefaults(
  defineProps<{
    /** One value per day, oldest first, ending on `end`. */
    values: number[];
    end: string;
    format?: (n: number) => string;
    label: string;
  }>(),
  { format: (n: number) => String(n) },
);

interface Cell {
  date: Date;
  value: number;
  level: number;
}

const DAY = 86_400_000;
const LEVELS = 4;

// Quartiles of the active days, not fractions of the busiest one: usage is
// usually bunched, and linear steps would paint most days the same shade.
const thresholds = computed(() => {
  const sorted = props.values.filter((v) => v > 0).sort((a, b) => a - b);
  return [1, 2, 3].map((q) => sorted[Math.floor((sorted.length * q) / LEVELS)] ?? Infinity);
});
const levelOf = (v: number) => (v <= 0 ? 0 : 1 + thresholds.value.filter((t) => v >= t).length);

/** Columns of weeks, each Monday→Sunday; days outside the range are null. */
const weeks = computed(() => {
  const end = new Date(`${props.end}T00:00:00Z`);
  const start = new Date(end.getTime() - (props.values.length - 1) * DAY);
  const offset = (start.getUTCDay() + 6) % 7; // Monday = 0
  const cells: (Cell | null)[] = Array.from({ length: offset }, () => null);
  props.values.forEach((value, i) => cells.push({ date: new Date(start.getTime() + i * DAY), value, level: levelOf(value) }));
  while (cells.length % 7) cells.push(null);
  const out: (Cell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
  return out;
});

const months = computed(() =>
  weeks.value.map((w, i) => {
    const first = w.find((c) => c);
    if (!first) return '';
    const prev = weeks.value[i - 1]?.find((c) => c);
    return !prev || prev.date.getUTCMonth() !== first.date.getUTCMonth() ? first.date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }) : '';
  }),
);

const hovered = ref<Cell | null>(null);
const total = computed(() => props.values.reduce((s, v) => s + v, 0));
const activeDays = computed(() => props.values.filter((v) => v > 0).length);
const busiest = computed(() => {
  let best = { value: 0, index: 0 };
  props.values.forEach((value, index) => { if (value > best.value) best = { value, index }; });
  const end = new Date(`${props.end}T00:00:00Z`);
  return { value: best.value, date: new Date(end.getTime() - (props.values.length - 1 - best.index) * DAY) };
});
const streak = computed(() => {
  let n = 0;
  for (let i = props.values.length - 1; i >= 0 && (props.values[i] ?? 0) > 0; i--) n++;
  return n;
});
const average = computed(() => (activeDays.value ? total.value / activeDays.value : 0));
const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

<template>
  <figure class="day-heatmap">
    <div class="layout">
    <div class="calendar" role="img" :aria-label="`${label}: ${format(total)} over ${values.length} days, ${activeDays} active`">
      <!-- One grid, filled column by column: 8 rows (month + Mon..Sun), a label column, then one column per week. -->
      <div class="grid" :style="{ gridTemplateColumns: `28px repeat(${weeks.length}, minmax(0, 1fr))` }">
        <span class="month" />
        <span v-for="(d, j) in ['Mon', '', 'Wed', '', 'Fri', '', '']" :key="`l${j}`" class="day-label">{{ d }}</span>
        <template v-for="(week, i) in weeks" :key="i">
          <span class="month">{{ months[i] }}</span>
          <span
            v-for="(cell, j) in week"
            :key="j"
            class="cell"
            :class="cell ? `cell_level_${cell.level}` : 'cell_empty'"
            @mouseenter="hovered = cell"
            @mouseleave="hovered = null"
          />
        </template>
      </div>
    </div>
    <dl class="facts">
      <div><dt>Busiest day</dt><dd>{{ format(busiest.value) }}</dd><dd class="sub">{{ fmtDay(busiest.date) }}</dd></div>
      <div><dt>Average active day</dt><dd>{{ format(average) }}</dd></div>
      <div><dt>Current streak</dt><dd>{{ streak }} days</dd></div>
    </dl>
    </div>
    <figcaption class="caption">
      <span v-if="hovered" class="hover">{{ fmtDay(hovered.date) }} — <strong>{{ format(hovered.value) }}</strong></span>
      <span v-else class="hover">{{ activeDays }} active days · {{ format(total) }} in total</span>
      <span class="legend" aria-hidden="true">
        Less
        <span v-for="l in [0, 1, 2, 3, 4]" :key="l" class="cell" :class="`cell_level_${l}`" />
        More
      </span>
    </figcaption>
  </figure>
</template>

<style scoped>
  .day-heatmap {
    margin: 0;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 200px;
    gap: var(--acv-spacing-large);
    align-items: start;
  }





  .grid {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: 16px repeat(7, auto);
    gap: 3px;
  }

  .day-label {
    @mixin acv-text-ui-caption-2;
    align-self: center;
    color: var(--acv-color-glyph-tertiary);
  }

  .month {
    @mixin acv-text-ui-caption-2;
    /* Zero width, so a label never widens its week and opens a gap. */
    inline-size: 0;
    white-space: nowrap;
    color: var(--acv-color-glyph-tertiary);
  }

  .cell {
    display: block;
    inline-size: 100%;
    aspect-ratio: 1;
    border-radius: var(--acv-radius-small);

    &.cell_empty {
      background: transparent;
    }


    &.cell_level_0 {
      background: var(--acv-color-surface-tertiary);
    }

    &.cell_level_1 {
      background: var(--acv-color-decoration-blue-light);
    }

    &.cell_level_2 {
      background: var(--acv-color-decoration-blue-medium);
    }

    &.cell_level_3 {
      background: var(--acv-color-decoration-blue-strong);
    }

    &.cell_level_4 {
      background: var(--acv-color-decoration-blue-intense);
    }
  }

  .caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--acv-spacing-regular);
    margin-block-start: var(--acv-spacing-small);
  }

  .hover {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .facts {
    display: grid;
    gap: var(--acv-spacing-regular);
    margin: 0;
    padding-block-start: var(--acv-spacing-regular);

    dt {
      @mixin acv-text-ui-caption-1;
      color: var(--acv-color-glyph-tertiary);
    }

    dd {
      @mixin acv-text-subheading-2;
      margin: 0;
      color: var(--acv-color-glyph-primary);

      &.sub {
        @mixin acv-text-ui-caption-1;
        color: var(--acv-color-glyph-secondary);
      }
    }
  }

  .legend {
    @mixin acv-text-ui-caption-1;
    display: flex;
    align-items: center;
    gap: 3px;
    color: var(--acv-color-glyph-tertiary);

    .cell {
      inline-size: 12px;
    }
  }
</style>
