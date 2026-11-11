<script setup lang="ts">
import { GoButton } from '@constructor/ui/button';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { useRouter } from 'vue-router';
import { db, tenantById } from '@/state/db';
import { ROOT_TOUR, USER_TOUR, chooser, setupLater, startTour, tenantTour } from '@/state/onboarding';
import { enterTenant, enterUser, exitTo } from '@/state/session';

/**
 * The first thing the instance console shows: four ways to see Token Factory.
 * Each opens the right console as the right person and starts its own
 * onboarding; the instance setup tour covers what the other three do not.
 */
const router = useRouter();
const USER_TENANT = 't-acme';
const USER_ID = 'u-jane';
const NEW_ORG = 't-helix';
const EXISTING_ORG = 't-acme';

const SCENARIOS = [
  { id: 'user', title: 'Use AI as an employee', who: `${db.users.find((u) => u.id === USER_ID)?.name}, a developer at ${tenantById(USER_TENANT)?.name}`, text: 'Your limits, API keys, models and tools; set up Claude Code or Codex in a minute.', cta: 'Start as a user' },
  { id: 'setup', title: 'Set up a new organization', who: `Customer Admin of ${tenantById(NEW_ORG)?.name}, created but not set up`, text: 'The setup wizard: connect users, choose models, create licenses, set defaults.', cta: 'Start the setup' },
  { id: 'org', title: 'Run an organization', who: `Customer Admin of ${tenantById(EXISTING_ORG)?.name}, already in use`, text: 'Departments, users, licenses, models, provider keys, guardrails, tools and reports.', cta: 'Walk through it' },
  { id: 'instance', title: 'Run the instance', who: 'Instance Admin of this Token Factory', text: 'Tenants, the model catalog and lifecycle, benchmarks, routing, GPUs, evaluation, monitoring and settings.', cta: 'Tour the instance console' },
] as const;

function go(id: (typeof SCENARIOS)[number]['id']): void {
  chooser.open = false;
  exitTo('root');
  if (id === 'user') {
    const u = db.users.find((x) => x.id === USER_ID)!;
    enterUser(USER_TENANT, USER_ID, u.name, 'Onboarding: seeing Token Factory as a user');
    void router.push('/me/home').then(() => setTimeout(() => startTour(USER_TOUR), 400));
  } else if (id === 'setup') {
    setupLater.delete(NEW_ORG);
    enterTenant(NEW_ORG, 'Onboarding: setting up a new organization');
    void router.push(`/t/${NEW_ORG}/setup`);
  } else if (id === 'org') {
    enterTenant(EXISTING_ORG, 'Onboarding: walking through an organization');
    void router.push(`/t/${EXISTING_ORG}/overview`).then(() => setTimeout(() => startTour(tenantTour(EXISTING_ORG)), 400));
  } else {
    void router.push('/root/overview').then(() => setTimeout(() => startTour(ROOT_TOUR), 300));
  }
}
</script>

<template>
  <GoDialog v-model="chooser.open" size="l">
    <GoDialogWindow title="Welcome to Token Factory" header-border @close="chooser.open = false">
      <p class="intro">Pick how you want to see it. Each way opens the right console as the right person and shows you around. Come back to this from the instance overview at any time.</p>
      <div class="grid">
        <button v-for="s in SCENARIOS" :key="s.id" type="button" class="scenario" @click="go(s.id)">
          <span class="title">{{ s.title }}</span>
          <span class="who">{{ s.who }}</span>
          <span class="text">{{ s.text }}</span>
          <span class="cta">{{ s.cta }} →</span>
        </button>
      </div>
      <p class="sub">The user and organization ways open other consoles as an impersonation; the banner at the top takes you back here.</p>
      <template #footer>
        <div class="footer"><GoButton variant="secondary" size="m" @click="chooser.open = false">Explore on my own</GoButton></div>
      </template>
    </GoDialogWindow>
  </GoDialog>
</template>

<style scoped>
  .intro {
    @mixin acv-text-ui-body-2;
    margin: 0 0 var(--acv-spacing-regular);
    color: var(--acv-color-glyph-secondary);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--acv-spacing-regular);
  }

  .scenario {
    display: grid;
    gap: 4px;
    align-content: start;
    padding: var(--acv-spacing-regular);
    border: var(--acv-border-light);
    border-radius: var(--acv-radius-large);
    background: var(--acv-color-surface-primary);
    text-align: start;
    cursor: pointer;

    &:hover {
      border-color: var(--acv-color-glyph-brand);
      box-shadow: var(--acv-shadow-small);
    }
  }

  .title {
    @mixin acv-text-subheading-3;
  }

  .who {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-glyph-brand);
  }

  .text {
    @mixin acv-text-ui-body-2;
    color: var(--acv-color-glyph-secondary);
  }

  .cta {
    @mixin acv-text-ui-body-2-medium;
    margin-block-start: var(--acv-spacing-x-small);
    color: var(--acv-color-glyph-brand);
  }

  .sub {
    @mixin acv-text-ui-caption-1;
    margin: var(--acv-spacing-regular) 0 0;
    color: var(--acv-color-glyph-tertiary);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
