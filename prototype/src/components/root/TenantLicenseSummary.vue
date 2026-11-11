<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { IconCircleCheck, IconCircleXmark } from '@/components/icons';
import { aliasesOf, modelsOf, ruleText, type TenantLicense } from '@/state/tenantLicenses';

/** What a tenant license includes, compactly: what the tenant may do, and its models. */
const props = defineProps<{ license: TenantLicense }>();
const models = computed(() => modelsOf(props.license));
const own = computed(() => models.value.filter((m) => props.license.extraIds.includes(m.id)));
const all = ref(false);
watch(() => props.license.id, () => (all.value = false));
const SHOWN = 6;
const shown = computed(() => (all.value ? models.value : models.value.slice(0, SHOWN)));
const RIGHTS = computed(() => [
  { on: props.license.createTenants, label: 'Creates tenants' },
  { on: props.license.ownKeys, label: 'Own provider keys' },
  { on: props.license.ownModels, label: 'Deploys own models' },
]);
</script>

<template>
  <div class="summary">
    <p class="desc">{{ license.description }}</p>
    <ul class="rights">
      <li v-for="r in RIGHTS" :key="r.label" :class="{ off: !r.on }">
        <component :is="r.on ? IconCircleCheck : IconCircleXmark" class="mark" aria-hidden="true" />{{ r.label }}
      </li>
    </ul>
    <div class="models">
      <span class="models-head">{{ models.length }} {{ models.length === 1 ? 'model' : 'models' }} · {{ ruleText(license) }}<template v-if="own.length"> · {{ own.length }} own</template></span>
      <span v-if="aliasesOf(license).length" class="models-head">Model aliases: <code v-for="a in aliasesOf(license)" :key="a.id" class="alias-chip">{{ a.name }}</code></span>
      <span class="chips">
        <span v-for="m in shown" :key="m.id" class="chip" :class="{ chip_own: license.extraIds.includes(m.id) }">{{ m.name }}</span>
        <button v-if="models.length > SHOWN" type="button" class="more" @click="all = !all">{{ all ? 'Show fewer' : `+${models.length - SHOWN} more` }}</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
  .summary {
    display: grid;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-small) var(--acv-spacing-regular);
    border-radius: var(--acv-radius-medium);
    background: var(--acv-color-surface-secondary);
  }

  .desc {
    @mixin acv-text-ui-caption-1;
    margin: 0;
    color: var(--acv-color-glyph-secondary);
  }

  .rights {
    @mixin acv-text-ui-caption-1;
    display: flex;
    flex-wrap: wrap;
    gap: var(--acv-spacing-regular);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--acv-color-glyph-primary);

    & li {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    & .off {
      color: var(--acv-color-glyph-tertiary);
    }
  }

  .mark {
    inline-size: 12px;
    block-size: 12px;
  }

  .models {
    display: grid;
    gap: 4px;
  }

  .models-head {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-secondary);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .chip {
    @mixin acv-text-ui-caption-1;
    padding: 1px 6px;
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-small);
    background: var(--acv-color-surface-primary);
    color: var(--acv-color-glyph-primary);

    &.chip_own {
      border-color: var(--acv-color-decoration-blue-intense);
    }
  }

  .alias-chip {
    margin-inline-start: 4px;
  }

  .more {
    @mixin acv-text-ui-caption-1;
    padding: 0 4px;
    border: none;
    background: none;
    color: var(--acv-color-glyph-brand);
    cursor: pointer;
  }
</style>
