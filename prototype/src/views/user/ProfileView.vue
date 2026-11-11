<script setup lang="ts">
import { GoAvatar } from '@constructor/ui/avatar';
import { GoDescriptionList, GoDescriptionListItem } from '@constructor/ui/description-list';
import { useNotificationsStore } from '@constructor/ui/notification';
import { GoSelect, GoSelectOption } from '@constructor/ui/select';
import { computed } from 'vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { approverFor } from '@/state/db';
import { LANGUAGES, languageLabel, prefs, type LanguageId } from '@/state/prefs';
import { USER_ROLE, roleLabel, rolesOf } from '@/state/roles';
import { useMe } from './useMe';

/** Who I am in Token Factory, and my own preferences. Details come from the users source. */
const { notify } = useNotificationsStore();
const { user, seat, unit } = useMe();
const manager = computed(() => {
  const m = user.value ? approverFor(user.value) : '';
  return m && m !== 'a license manager' ? m : '—';
});
const roles = computed(() => (user.value ? [USER_ROLE.label, ...rolesOf(user.value).map(roleLabel)] : []));

function setLanguage(id: LanguageId): void {
  prefs.language = id;
  notify(`Token Factory and its emails to you are now in ${languageLabel(id)}.`, 'success', 'Language changed');
}
</script>

<template>
  <div v-if="user">
    <PageHeader title="Profile" description="Your details come from your organization's users source; ask your administrator to change them." />
    <div class="grid">
      <Card title="Details">
        <div class="who">
          <GoAvatar :name="user.name" size="l" />
          <div>
            <span class="name">{{ user.name }}</span>
            <span class="sub">{{ user.title }}</span>
          </div>
        </div>
        <GoDescriptionList>
          <GoDescriptionListItem><template #name>Email</template><template #value>{{ user.email }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Unit</template><template #value>{{ unit?.name ?? '—' }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Manager</template><template #value>{{ manager }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>License</template><template #value>{{ seat.license?.name ?? '—' }}</template></GoDescriptionListItem>
          <GoDescriptionListItem><template #name>Roles</template><template #value>{{ roles.join(', ') }}</template></GoDescriptionListItem>
        </GoDescriptionList>
      </Card>
      <Card title="Preferences">
        <label class="label" for="pref-lang">Language</label>
        <GoSelect id="pref-lang" :model-value="prefs.language" size="m" aria-label="Language" @update:model-value="(v: LanguageId) => setLanguage(v)">
          <GoSelectOption v-for="l in LANGUAGES" :key="l.id" :value="l.id">{{ l.label }}</GoSelectOption>
        </GoSelect>
        <p class="sub hint">For Token Factory and the emails it sends you.</p>
      </Card>
    </div>
  </div>
</template>

<style scoped>
  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--acv-spacing-regular);
    align-items: start;
  }

  .who {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-small);
    margin-block-end: var(--acv-spacing-regular);
  }

  .name {
    @mixin acv-text-subheading-3;
    display: block;
    color: var(--acv-color-glyph-primary);
  }

  .label {
    @mixin acv-text-ui-body-2-medium;
    display: block;
    margin-block-end: var(--acv-spacing-xx-small, 4px);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    display: block;
    color: var(--acv-color-glyph-tertiary);
  }

  .hint {
    margin: var(--acv-spacing-x-small) 0 0;
  }
</style>
