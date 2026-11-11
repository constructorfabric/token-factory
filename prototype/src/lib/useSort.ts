import { computed, ref, type ComputedRef, type Ref } from 'vue';

export type SortValue = string | number | null | undefined;
export type SortDir = 'asc' | 'desc';

export interface Sorter<T> {
  rows: ComputedRef<T[]>;
  key: Ref<string | null>;
  dir: Ref<SortDir>;
  toggle: (key: string) => void;
  sortable: (key: string) => boolean;
}

/**
 * Header sorting for a table. Rows keep their natural order until a header is
 * clicked; clicking cycles ascending → descending → back to natural, so the
 * order a screen chose on purpose (hierarchy, newest first) is never lost.
 */
export function useSort<T>(rows: () => T[], keys: Record<string, (row: T) => SortValue>): Sorter<T> {
  const key = ref<string | null>(null);
  const dir = ref<SortDir>('asc');

  const sorted = computed(() => {
    const list = rows();
    const pick = key.value ? keys[key.value] : undefined;
    if (!pick) return list;
    const factor = dir.value === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const x = pick(a);
      const y = pick(b);
      // Empty values sink to the bottom in both directions.
      if (x === y) return 0;
      if (x === null || x === undefined || x === '') return 1;
      if (y === null || y === undefined || y === '') return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * factor;
      return String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' }) * factor;
    });
  });

  function toggle(k: string): void {
    if (key.value !== k) {
      key.value = k;
      dir.value = 'asc';
    } else if (dir.value === 'asc') {
      dir.value = 'desc';
    } else {
      key.value = null;
    }
  }

  return { rows: sorted, key, dir, toggle, sortable: (k) => k in keys };
}
