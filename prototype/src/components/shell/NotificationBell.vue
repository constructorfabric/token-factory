<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IconBell } from '@/components/icons';
import { fmtAgo } from '@/lib/format';
import { markAllRead, markRead, noticesFor, type Notice } from '@/state/inbox';

/** The admin's bell: unread count, the latest few, and the way to all of them. */
const props = defineProps<{ scope: string; allTo: string; placement?: 'down' | 'up'; labelled?: boolean }>();
const router = useRouter();
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const notices = computed(() => noticesFor(props.scope));
const unread = computed(() => notices.value.filter((n) => !n.read).length);
const latest = computed(() => notices.value.slice(0, 5));

function go(n: Notice): void {
  markRead(props.scope, n.id);
  open.value = false;
  if (n.to) void router.push(n.to);
}
function all(): void {
  open.value = false;
  void router.push(props.allTo);
}
const onDoc = (e: MouseEvent) => {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false;
};
onMounted(() => document.addEventListener('click', onDoc));
onBeforeUnmount(() => document.removeEventListener('click', onDoc));
</script>

<template>
  <div ref="root" class="bell" :class="{ bell_up: placement === 'up', bell_labelled: labelled }">
    <button type="button" class="bell-button" :aria-label="`Notifications, ${unread} unread`" :aria-expanded="open" @click="open = !open">
      <IconBell />
      <span v-if="labelled" class="bell-label">Notifications</span>
      <span v-if="unread" class="count">{{ unread > 99 ? '99+' : unread }}</span>
    </button>
    <div v-if="open" class="panel" role="dialog" aria-label="Notifications">
      <div class="panel-head">
        <span class="panel-title">Notifications</span>
        <GoButton v-if="unread" variant="ghost" size="s" @click="markAllRead(scope)">Mark all as read</GoButton>
      </div>
      <ul class="list">
        <li v-for="n in latest" :key="n.id">
          <button type="button" class="row" :class="[`row_${n.tone}`, { row_unread: !n.read }]" @click="go(n)">
            <span class="title">{{ n.title }}</span>
            <span class="meta">{{ n.live ? 'Needs attention' : fmtAgo(n.at) }}</span>
          </button>
        </li>
      </ul>
      <div class="panel-foot"><GoButton variant="secondary" size="s" @click="all">See all notifications</GoButton></div>
    </div>
  </div>
</template>

<style scoped>
  .bell {
    position: relative;
  }

  .bell-button {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: 36px;
    block-size: 36px;
    border: 0;
    border-radius: var(--acv-radius-medium);
    background: transparent;
    color: var(--acv-color-glyph-secondary);
    cursor: pointer;

    &:hover {
      background: var(--acv-color-surface-secondary);
    }
  }

  .bell_labelled {
    margin-block-end: var(--acv-spacing-xx-small, 4px);

    & .bell-button {
      display: flex;
      justify-content: flex-start;
      gap: var(--acv-spacing-x-small);
      inline-size: 100%;
      padding-inline: var(--acv-spacing-x-small);
    }

    & .count {
      position: static;
      margin-inline-start: auto;
    }
  }

  .bell-label {
    @mixin acv-text-ui-body-2;
  }

  .bell_up {
    & .bell-button {
      color: var(--acv-color-nav-glyph, rgb(255 255 255 / 80%));

      &:hover {
        background: var(--acv-color-nav-hover);
      }
    }

    & .panel {
      position: fixed;
      inset-block-start: auto;
      inset-block-end: 16px;
      inset-inline-end: auto;
      inset-inline-start: 272px;
    }
  }

  .count {
    @mixin acv-text-ui-caption-1;
    position: absolute;
    inset-block-start: 2px;
    inset-inline-end: 0;
    min-inline-size: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--acv-color-status-danger-strong);
    color: #fff;
    line-height: 18px;
    text-align: center;
  }

  .panel {
    position: absolute;
    inset-block-start: calc(100% + 6px);
    inset-inline-end: 0;
    z-index: 1000;
    inline-size: 380px;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    box-shadow: 0 12px 32px rgb(0 0 0 / 18%);
  }

  .panel-head,
  .panel-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
  }

  .panel-foot {
    border-block-start: var(--acv-border-light);
  }

  .panel-title {
    @mixin acv-text-ui-body-2-medium;
  }

  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .row {
    display: grid;
    gap: 2px;
    inline-size: 100%;
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border: 0;
    border-block-start: var(--acv-border-light);
    border-inline-start: 3px solid transparent;
    background: transparent;
    text-align: start;
    cursor: pointer;

    &:hover {
      background: var(--acv-color-surface-secondary);
    }

    &.row_danger {
      border-inline-start-color: var(--acv-color-status-danger-strong);
    }

    &.row_warning {
      border-inline-start-color: var(--acv-color-status-warning-strong, #d97706);
    }

    &.row_info {
      border-inline-start-color: var(--acv-color-decoration-blue-intense);
    }

    &.row_unread .title {
      @mixin acv-text-ui-body-2-medium;
    }
  }

  .title {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-primary);
  }

  .meta {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-tertiary);
  }
</style>
