<script setup lang="ts">
import markUrl from '@constructor/globals/themes/constructor/icons/favicon.svg';
import { GoAvatar } from '@constructor/ui/avatar';
import { injectGoColorSchemeProvider } from '@constructor/ui/color-scheme';
import { GoDropdownMenuDivider, GoDropdownMenuItem, GoDropdownMenuPopover } from '@constructor/ui/dropdown-menu';
import { GoMainNavigation, GoMainNavigationItem, GoMainNavigationItems, GoMainNavigationSection } from '@constructor/ui/main-navigation';
import { GoNav } from '@constructor/ui/nav';
import { GoNavBreadcrumbs, GoNavBreadcrumbsLink } from '@constructor/ui/nav-breadcrumbs';
import { GoTag } from '@constructor/ui/tag';
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { IconCircleCheck, IconExit, IconGlobe, IconLogOutNewui, IconMoon, IconSun, IconUserNewui } from '@/components/icons';
import { GoDialog, GoDialogWindow } from '@constructor/ui/dialog';
import { GoRadioGroup, GoRadioOption } from '@constructor/ui/radio';
import { useNotificationsStore } from '@constructor/ui/notification';
import { LANGUAGES, languageLabel, prefs } from '@/state/prefs';
import { db, licenseById, modelById, tenantById, unitById } from '@/state/db';
import { benchmarkById } from '@/state/benchRuns';
import { exitTo, session, signOut } from '@/state/session';
import GuidedTour from './GuidedTour.vue';
import NotificationBell from './NotificationBell.vue';
import ImpersonationBanner from './ImpersonationBanner.vue';
import { chooserOnFirstStart, startTour, tourOnFirstSignIn } from '@/state/onboarding';
import OnboardingChooser from './OnboardingChooser.vue';
import { licenseOfTenant } from '@/state/tenantLicenses';
import { NAV } from './nav';
import ScopeSwitch from './ScopeSwitch.vue';
import { scope, screenInScope } from '@/state/scope';
import { homeFor } from '@/router';

const route = useRoute();
const router = useRouter();
const { isColorScheme, toggleColorScheme } = injectGoColorSchemeProvider();

const current = computed(() => session.current.value);
const sections = computed(() => {
  if (!current.value) return [];
  const t = tenantById(current.value.tenantId);
  // Provider keys only when the tenant license allows own keys.
  const hide = current.value.kind === 'tenant' && t && t.tier !== 'root' && !licenseOfTenant(t)?.ownKeys ? ['tenant-keys'] : [];
  // In v1 mode only the screens the 5 December demo covers stay; a section left empty goes too.
  return NAV[current.value.kind]
    .map((s) => ({ ...s, items: s.items.filter((i) => !hide.includes(i.name) && screenInScope(i.name)) }))
    .filter((s) => s.items.length > 0);
});
const tenant = computed(() => tenantById(current.value?.tenantId));

const contextLabel = computed(() => {
  if (!current.value) return '';
  if (current.value.kind === 'root') return 'Instance console';
  if (current.value.kind === 'tenant') return tenant.value?.name ?? '';
  return `${current.value.person} · ${tenant.value?.name}`;
});

const crumbs = computed(() => {
  const c = current.value;
  const list: { label: string; to?: string }[] = [{ label: 'Constructor Fabric TF', to: c?.kind === 'root' ? '/root/overview' : undefined }];
  if (c && c.kind !== 'root') list.push({ label: tenant.value?.name ?? '', to: c.kind === 'tenant' ? `/t/${c.tenantId}/overview` : undefined });
  if (c?.kind === 'user') list.push({ label: c.person });
  // A detail page shows its section, then the item's own name.
  const t = c?.tenantId;
  const p = route.params;
  const DETAIL: Record<string, () => [string, string, string | undefined]> = {
    'tenant-unit': () => ['Departments', `/t/${t}/organization`, unitById(String(p.unitId))?.name],
    'root-unit': () => ['Departments', '/root/organization', unitById(String(p.unitId))?.name],
    'root-user': () => ['Users', '/root/users', db.users.find((u) => u.id === p.userId)?.name],
    'root-license': () => ['Licenses', '/root/licenses', p.id === 'new' ? 'New license' : licenseById(String(p.id))?.name],
    'tenant-user': () => ['Users', `/t/${t}/users`, db.users.find((u) => u.id === p.userId)?.name],
    'tenant-license': () => ['Licenses', `/t/${t}/licenses`, p.id === 'new' ? 'New license' : licenseById(String(p.id))?.name],
    'root-tenant': () => ['Tenants', '/root/tenants', tenantById(String(p.id))?.name],
    'root-model': () => ['Model catalog', '/root/models', modelById(String(p.id))?.name],
    'root-benchmark-new': () => ['Benchmarks', '/root/benchmarks?tab=benchmarks', 'New benchmark'],
    'root-benchmark-edit': () => ['Benchmarks', `/root/benchmarks/benchmarks/${p.id}`, `Edit ${benchmarkById(String(p.id))?.name ?? ''}`],
    'root-suite-new': () => ['Benchmarks', '/root/benchmarks?tab=suites', 'New suite'],
    'root-suite-edit': () => ['Benchmarks', `/root/benchmarks/suites/${p.id}`, `Edit ${db.suites.find((x) => x.id === String(p.id))?.name ?? ''}`],
    'root-benchmark': () => ['Benchmarks', `/root/benchmarks?tab=${p.kind}`, p.kind === 'suites' ? db.suites.find((x) => x.id === String(p.id))?.name : benchmarkById(String(p.id))?.name],
  };
  const detail = DETAIL[String(route.name)]?.();
  if (detail) {
    list.push({ label: detail[0], to: detail[1] });
    list.push({ label: detail[2] ?? String(route.meta.title ?? '') });
  } else {
    list.push({ label: String(route.meta.title ?? '') });
  }
  return list;
});

// A detail page keeps its section highlighted: tenants/:id lights "Tenants".
function isActive(name: string): boolean {
  const current = String(route.name ?? '');
  // Detail pages light their section: tenants/:id → Tenants, organization/:unit → Organization.
  const PARENT: Record<string, string> = { 'tenant-unit': 'tenant-org', 'root-unit': 'root-org', 'root-benchmark-new': 'root-benchmarks', 'root-benchmark-edit': 'root-benchmarks', 'root-suite-new': 'root-benchmarks', 'root-suite-edit': 'root-benchmarks' };
  return current === name || PARENT[current] === name || (name.endsWith('s') && current === name.slice(0, -1));
}

// Only tenant pages carry the tenant in their address; personal and root ones do not.
function to(name: string) {
  return { name, params: name.startsWith('tenant-') ? { tenantId: current.value?.tenantId } : {} };
}

function leaveAll(): void {
  exitTo('root');
  void router.push('/root/overview');
}

const { notify } = useNotificationsStore();

// Switching to v1 while on a screen outside it goes to the home of this console.
watch(() => scope.mode, () => {
  const name = String(route.name ?? '');
  if (name && !screenInScope(name)) void router.replace(homeFor());
});

// A user's first sign-in starts the guided tour of their pages.
watch(() => session.current.value, (c) => {
  if (c?.kind === 'user' && c.userId) setTimeout(() => tourOnFirstSignIn(c.userId!), 400);
  // The instance console's first start offers the onboarding scenarios.
  if (c?.kind === 'root' && session.stack.value.length === 1) setTimeout(() => chooserOnFirstStart(), 500);
}, { immediate: true });
function takeTour(): void {
  if (!String(route.name ?? '').startsWith('user-')) void router.push('/me/home');
  setTimeout(() => startTour(), 300);
}

// Language, picked from the avatar menu; the same setting is on the profile page.
const languageOpen = ref(false);
function setLanguage(id: string): void {
  prefs.language = id as typeof prefs.language;
  languageOpen.value = false;
  notify(`Token Factory and its emails to you are now in ${languageLabel(prefs.language)}.`, 'success', 'Language changed');
}

function logout(): void {
  signOut();
  void router.push('/login');
}
</script>

<template>
  <div class="app-shell">
    <ImpersonationBanner v-if="session.impersonating.value" />
    <GuidedTour />
    <OnboardingChooser />
    <div class="frame">
      <aside class="sidebar">
        <div class="brand">
          <img :src="markUrl" alt="Constructor" class="logo" />
          <span class="product">Token Factory</span>
        </div>
        <div class="context" :class="`context_${current?.kind}`">
          <span class="context-kind">{{ current?.kind === 'root' ? 'Instance' : current?.kind === 'tenant' ? 'Tenant' : 'Personal' }}</span>
          <span class="context-name">{{ contextLabel }}</span>
        </div>
        <GoMainNavigation aria-label="Main">
          <template v-for="(section, i) in sections" :key="i">
            <GoMainNavigationItems v-if="!section.title">
              <GoMainNavigationItem v-for="item in section.items" :key="item.name" :component="RouterLink" :component-props="{ to: to(item.name) }" :active="isActive(item.name)">
                <template #icon><component :is="item.icon" /></template>
                {{ item.label }}
              </GoMainNavigationItem>
            </GoMainNavigationItems>
            <GoMainNavigationSection v-else>
              <template #title>{{ section.title }}</template>
              <GoMainNavigationItem v-for="item in section.items" :key="item.name" :component="RouterLink" :component-props="{ to: to(item.name) }" :active="isActive(item.name)">
                <template #icon><component :is="item.icon" /></template>
                {{ item.label }}
              </GoMainNavigationItem>
            </GoMainNavigationSection>
          </template>
        </GoMainNavigation>
        <div class="account-slot">

          <NotificationBell v-if="current?.kind === 'root' && screenInScope('root-notifications')" scope="root" all-to="/root/notifications" placement="up" labelled class="bell-row" />
          <NotificationBell v-else-if="current?.kind === 'tenant' && screenInScope('tenant-notifications')" :scope="current.tenantId" :all-to="`/t/${current.tenantId}/notifications`" placement="up" labelled class="bell-row" />
          <div class="account-row">
            <div class="account-menu">
              <GoDropdownMenuPopover position="top-left" aria-label="Account" :expand-icon="false">
                <template #handle="{ toggle }">
                  <button type="button" class="account" :aria-label="`Account of ${current?.person}`" @click="toggle">
                    <GoAvatar :name="current?.person" size="s" />
                    <span class="account-text">
                      <span class="account-name">{{ current?.person }}</span>
                      <span class="account-role">{{ current?.role }}</span>
                    </span>
                  </button>
                </template>
                <GoDropdownMenuItem @select="router.push('/me/profile')">
                  <template #icon><IconUserNewui /></template>
                  Profile
                </GoDropdownMenuItem>
                <GoDropdownMenuItem @select="languageOpen = true">
                  <template #icon><IconGlobe /></template>
                  Language
                  <template #description>{{ languageLabel(prefs.language) }}</template>
                </GoDropdownMenuItem>
                <GoDropdownMenuItem @select="takeTour">
                  <template #icon><IconCircleCheck /></template>
                  Take the tour
                </GoDropdownMenuItem>
                <GoDropdownMenuItem @select="toggleColorScheme()">
                  <template #icon>
                    <IconSun v-if="isColorScheme('dark')" />
                    <IconMoon v-else />
                  </template>
                  {{ isColorScheme('dark') ? 'Light theme' : 'Dark theme' }}
                </GoDropdownMenuItem>
                <GoDropdownMenuItem v-if="session.impersonating.value" @select="leaveAll">
                  <template #icon><IconExit /></template>
                  Exit impersonation
                </GoDropdownMenuItem>
                <GoDropdownMenuDivider />
                <GoDropdownMenuItem danger @select="logout">
                  <template #icon><IconLogOutNewui /></template>
                  Sign out
                </GoDropdownMenuItem>
              </GoDropdownMenuPopover>
            </div>
          </div>
              <GoDialog v-model="languageOpen" size="s">
                <GoDialogWindow title="Language" header-border @close="languageOpen = false">
                  <GoRadioGroup :model-value="prefs.language" aria-label="Language" @update:model-value="(v: string) => setLanguage(v)">
                    <GoRadioOption v-for="l in LANGUAGES" :key="l.id" :value="l.id">{{ l.label }}</GoRadioOption>
                  </GoRadioGroup>
                </GoDialogWindow>
              </GoDialog>

        </div>
      </aside>

      <div class="main">
        <GoNav>
          <template #start>
            <GoNavBreadcrumbs :key="route.fullPath">
              <GoNavBreadcrumbsLink v-for="(c, i) in crumbs" :key="i" :to="c.to">{{ c.label }}</GoNavBreadcrumbsLink>
              <template #end>
                <GoTag v-if="session.impersonating.value" size="s" color="orange" variant="strong">Impersonated</GoTag>
              </template>
            </GoNavBreadcrumbs>
          </template>
          <template #end>
            <ScopeSwitch />
          </template>
        </GoNav>
        <main class="content">
          <RouterView :key="route.fullPath" />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .app-shell {
    display: flex;
    flex-direction: column;
    block-size: 100%;
  }

  .frame {
    display: grid;
    flex: 1;
    grid-template-columns: 264px minmax(0, 1fr);
    min-block-size: 0;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--acv-spacing-small);
    padding: var(--acv-spacing-regular) var(--acv-spacing-small);
    background: var(--acv-color-nav-primary);
    overflow-y: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
    padding: 0 var(--acv-spacing-x-small);
  }

  .logo {
    block-size: 28px;
  }

  .product {
    @mixin acv-text-subheading-2;
    color: var(--acv-color-fixed-white);
  }

  .context {
    display: flex;
    flex-direction: column;
    padding: var(--acv-spacing-x-small) var(--acv-spacing-small);
    border-inline-start: 3px solid transparent;
    border-radius: var(--acv-radius-regular);
    background: var(--acv-color-nav-hover);

    &.context_tenant,
    &.context_user {
      border-inline-start-color: var(--acv-color-status-warning-strong);
    }
  }

  .context-kind {
    @mixin acv-text-ui-caption-2-medium;
    color: var(--acv-color-nav-tertiary);
    text-transform: uppercase;
  }

  .context-name {
    @mixin acv-text-ui-body-2-medium;
    @mixin ellipsis;
    color: var(--acv-color-fixed-white);
  }

  .main {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
    min-block-size: 0;
  }

  .content {
    flex: 1;
    padding: var(--acv-spacing-large) var(--acv-spacing-x-large);
    overflow-y: auto;
  }

  .account-slot {
    margin-block-start: auto;
    padding-block-start: var(--acv-spacing-small);
    border-block-start: 1px solid var(--acv-color-nav-hover);
  }

  .account-row {
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-xx-small, 4px);
  }

  .account-menu {
    flex: 1;
    min-inline-size: 0;
  }

  .account {
    inline-size: 100%;
    display: flex;
    align-items: center;
    gap: var(--acv-spacing-x-small);
    padding: var(--acv-spacing-xx-small) var(--acv-spacing-x-small);
    border: 0;
    border-radius: var(--acv-radius-regular);
    background: none;
    color: inherit;
    cursor: pointer;

    &:hover {
      background: var(--acv-color-nav-hover);
    }
  }

  .account-text {
    display: flex;
    flex-direction: column;
    text-align: start;
  }

  .account-name {
    @mixin acv-text-ui-body-2-medium;
    color: var(--acv-color-fixed-white);
  }

  .account-role {
    @mixin acv-text-ui-caption-1;
    color: var(--acv-color-nav-tertiary);
  }
</style>
