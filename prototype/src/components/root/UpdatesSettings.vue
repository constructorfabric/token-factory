<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoMessage } from '@constructor/ui/message';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSegmentButton, GoSegmentButtonGroup } from '@constructor/ui/segment';
import { GoTag } from '@constructor/ui/tag';
import { GoToggle } from '@constructor/ui/toggle';
import { computed, ref } from 'vue';
import { IconArrowUpRightFromSquare } from '@/components/icons';
import Card from '@/components/ui/Card.vue';
import { fmtAgo, fmtDate } from '@/lib/format';
import { record } from '@/state/db';
import { RELEASE_NOTES, instance, latestRelease, pendingReleases, updateAvailable } from '@/state/instance';

/** Which Token Factory release runs here, what is new, and the update itself. */
const { notify } = useNotificationsStore();
const latest = computed(() => latestRelease());
const pending = computed(() => pendingReleases());
const KIND = { feature: { label: 'Features', color: 'blue' }, security: { label: 'Security', color: 'red' }, fix: { label: 'Fixes', color: 'neutral' } } as const;

const confirmOpen = ref(false);
const backup = ref(true);
const STEPS = ['Backing up configuration and the metering store', 'Pulling the new images', 'Migrating the database', 'Rolling the gateway, one replica at a time', 'Health checks'];
const step = ref(-1);
function update(): void {
  confirmOpen.value = false;
  instance.updating = true;
  step.value = backup.value ? 0 : 1;
  const tick = () => {
    step.value++;
    if (step.value < STEPS.length) setTimeout(tick, 800);
    else {
      const from = instance.version;
      instance.version = latest.value.version;
      instance.installedAt = new Date().toISOString().slice(0, 10);
      instance.updating = false;
      step.value = -1;
      record({ actor: 'Victor Batraev', actorRole: 'Instance Admin', action: `Updated Token Factory from ${from} to ${instance.version}`, target: 'Instance', tenantId: 'root' });
      notify(`Token Factory ${instance.version} is running. No requests were dropped.`, 'success', 'Updated');
    }
  };
  setTimeout(tick, 800);
}
function check(): void {
  instance.lastCheck = new Date().toISOString();
  notify(updateAvailable() ? `${latest.value.version} is the newest release.` : 'You run the newest release.', 'info', 'Checked for updates');
}
</script>

<template>
  <div class="updates">
    <Card title="Installed version">
      <GoDescriptionList>
        <GoDescriptionListItem><template #name>Version</template><template #value>Token Factory {{ instance.version }} <GoTag v-if="!updateAvailable()" size="s" color="green">up to date</GoTag></template></GoDescriptionListItem>
        <GoDescriptionListItem><template #name>Installed</template><template #value>{{ fmtDate(instance.installedAt) }}</template></GoDescriptionListItem>
        <GoDescriptionListItem><template #name>Channel</template><template #value>
          <GoSegmentButtonGroup v-model="instance.channel" size="s" aria-label="Update channel">
            <GoSegmentButton value="stable">Stable</GoSegmentButton>
            <GoSegmentButton value="preview">Preview</GoSegmentButton>
          </GoSegmentButtonGroup>
        </template></GoDescriptionListItem>
        <GoDescriptionListItem><template #name>Last checked</template><template #value>{{ fmtAgo(instance.lastCheck) }}</template></GoDescriptionListItem>
      </GoDescriptionList>
      <div class="card-actions">
        <GoButton variant="secondary" size="m" @click="check">Check for updates</GoButton>
        <GoButton variant="ghost" size="m" :is="'a'" :href="RELEASE_NOTES" target="_blank" rel="noopener">
          <template #icon><IconArrowUpRightFromSquare /></template>
          All release notes
        </GoButton>
      </div>
    </Card>

    <Card v-if="instance.updating" :title="`Updating to ${latest.version}`" subtitle="The gateway keeps serving; replicas restart one at a time" class="spaced">
      <ol class="steps">
        <li v-for="(s, i) in STEPS" :key="s" :class="{ done: i < step, now: i === step }">{{ s }}</li>
      </ol>
    </Card>

    <Card v-else-if="pending.length" :title="`Token Factory ${latest.version} is available`" :subtitle="`Released ${fmtDate(latest.date)} · ${pending.length} ${pending.length === 1 ? 'release' : 'releases'} since yours`" class="spaced">
      <GoMessage v-if="pending.some((r) => r.kind === 'security')" variant="warning" rounded class="msg">Includes a security fix — update soon.</GoMessage>
      <section v-for="r in pending" :key="r.version" class="release">
        <div class="release-head">
          <span class="release-title">{{ r.version }}</span>
          <GoTag size="s" :color="KIND[r.kind].color">{{ KIND[r.kind].label }}</GoTag>
          <span class="sub">{{ fmtDate(r.date) }}</span>
          <a class="link" :href="`${RELEASE_NOTES}/tag/v${r.version}`" target="_blank" rel="noopener">Release notes</a>
        </div>
        <p class="summary">{{ r.summary }}</p>
        <ul class="notes">
          <li v-for="n in r.notes" :key="n">{{ n }}</li>
        </ul>
      </section>
      <div class="card-actions">
        <GoButton size="m" @click="confirmOpen = true">Update to {{ latest.version }}</GoButton>
      </div>
    </Card>

    <GoDialog v-model="confirmOpen" size="m">
      <GoDialogWindow :title="`Update to Token Factory ${latest.version}?`" header-border @close="confirmOpen = false">
        <div class="fields">
          <p class="text">The update takes about 10 minutes. The gateway keeps answering while its replicas restart one at a time; the admin console may be unavailable for a minute during the database migration.</p>
          <GoToggle v-model="backup">Back up configuration and the metering store first (recommended)</GoToggle>
          <p class="sub">The backup lets you restore {{ instance.version }} if the new version misbehaves.</p>
        </div>
        <template #footer>
          <div class="footer">
            <GoButton variant="secondary" size="m" @click="confirmOpen = false">Cancel</GoButton>
            <GoButton size="m" @click="update">Update now</GoButton>
          </div>
        </template>
      </GoDialogWindow>
    </GoDialog>
  </div>
</template>

<style scoped>
  .spaced {
    margin-block-start: var(--acv-spacing-regular);
  }

  .card-actions {
    display: flex;
    gap: var(--acv-spacing-x-small);
    margin-block-start: var(--acv-spacing-regular);
  }

  .msg {
    margin-block-end: var(--acv-spacing-regular);
  }

  .release + .release {
    margin-block-start: var(--acv-spacing-regular);
    padding-block-start: var(--acv-spacing-regular);
    border-block-start: var(--acv-border-light);
  }

  .release-head {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
  }

  .release-title {
    @mixin acv-text-subheading-3;
  }

  .summary {
    @mixin acv-text-ui-body-2-medium;
    margin: var(--acv-spacing-x-small) 0;
  }

  .notes {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: 2px;
    margin: 0;
    padding-inline-start: var(--acv-spacing-large);
    color: var(--acv-color-glyph-secondary);
  }

  .link {
    @mixin acv-text-ui-caption-1;
    margin-inline-start: auto;
    color: var(--acv-color-glyph-brand);
  }

  .steps {
    @mixin acv-text-ui-body-2;
    display: grid;
    gap: var(--acv-spacing-small);
    margin: 0;
    padding-inline-start: var(--acv-spacing-large);
    color: var(--acv-color-glyph-tertiary);

    & .done {
      color: var(--acv-color-glyph-primary);
    }

    & .now {
      color: var(--acv-color-glyph-brand);
      font-weight: 600;
    }
  }

  .fields {
    display: grid;
    gap: var(--acv-spacing-regular);
  }

  .text {
    @mixin acv-text-ui-body-2;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--acv-spacing-x-small);
  }
</style>
