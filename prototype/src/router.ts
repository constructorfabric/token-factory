import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import { tenantById } from '@/state/db';
import { setupLater } from '@/state/onboarding';
import { session } from '@/state/session';

/**
 * Three trees, one per context. A screen is reachable only from the context
 * it belongs to, so a regular user can never land on an admin page by URL,
 * and the root console is never shown while you are inside a tenant.
 */
const root: RouteRecordRaw[] = [
  { path: '', redirect: { name: 'root-overview' } },
  { path: 'notifications', name: 'root-notifications', component: () => import('@/views/shared/NotificationsView.vue'), meta: { title: 'Notifications' } },
  { path: 'overview', name: 'root-overview', component: () => import('@/views/root/RootOverview.vue'), meta: { title: 'Overview' } },
  { path: 'tenants', name: 'root-tenants', component: () => import('@/views/root/TenantsView.vue'), meta: { title: 'Tenants' } },
  { path: 'organization', name: 'root-org', component: () => import('@/views/tenant/OrganizationView.vue'), meta: { title: 'Departments' } },
  { path: 'organization/:unitId', name: 'root-unit', component: () => import('@/views/tenant/UnitView.vue'), meta: { title: 'Department' } },
  { path: 'users', name: 'root-users', component: () => import('@/views/tenant/UsersView.vue'), meta: { title: 'Users' } },
  { path: 'users/:userId', name: 'root-user', component: () => import('@/views/tenant/UserDetailView.vue'), meta: { title: 'User' } },
  { path: 'license-requests', name: 'root-approvals', component: () => import('@/views/tenant/LicenseRequestsView.vue'), meta: { title: 'License requests' } },
  { path: 'licenses', name: 'root-licenses', component: () => import('@/views/tenant/LicensesView.vue'), meta: { title: 'Licenses' } },
  { path: 'licenses/:id', name: 'root-license', component: () => import('@/views/tenant/LicenseEditView.vue'), meta: { title: 'License' } },
  { path: 'tenants/:id', name: 'root-tenant', component: () => import('@/views/root/TenantDetailView.vue'), meta: { title: 'Tenant' } },
  { path: 'models', name: 'root-models', component: () => import('@/views/root/ModelsView.vue'), meta: { title: 'Model catalog' } },
  { path: 'models/:id', name: 'root-model', component: () => import('@/views/root/ModelDetailView.vue'), meta: { title: 'Model' } },
  { path: 'lifecycle', name: 'root-lifecycle', component: () => import('@/views/root/LifecycleView.vue'), meta: { title: 'Lifecycle' } },
  { path: 'registry', name: 'root-registry', component: () => import('@/views/root/RegistryView.vue'), meta: { title: 'Tools & skills' } },
  { path: 'routing', name: 'root-routing', component: () => import('@/views/root/RoutingView.vue'), meta: { title: 'Aliases & routing' } },
  { path: 'providers', name: 'root-providers', component: () => import('@/views/root/ProvidersView.vue'), meta: { title: 'Providers' } },
  { path: 'deployments/new', name: 'root-deploy', component: () => import('@/views/root/DeployWizardView.vue'), meta: { title: 'New deployment' } },
  { path: 'deployments', name: 'root-deployments', component: () => import('@/views/root/DeploymentsView.vue'), meta: { title: 'Deployments' } },
  { path: 'evaluation', name: 'root-evaluation', component: () => import('@/views/root/EvalInfraView.vue'), meta: { title: 'Evaluation' } },
  { path: 'monitoring', name: 'root-monitoring', component: () => import('@/views/root/MonitoringView.vue'), meta: { title: 'Monitoring' } },
  { path: 'usage', name: 'root-usage', component: () => import('@/views/root/UsageView.vue'), meta: { title: 'Usage' } },
  { path: 'guardrails', name: 'root-guardrails', component: () => import('@/views/shared/GuardrailsView.vue'), meta: { title: 'Guardrails' } },
  { path: 'benchmarks/benchmarks/new', name: 'root-benchmark-new', component: () => import('@/views/root/BenchmarkEditView.vue'), meta: { title: 'New benchmark' } },
  { path: 'benchmarks/benchmarks/:id/edit', name: 'root-benchmark-edit', component: () => import('@/views/root/BenchmarkEditView.vue'), meta: { title: 'Edit benchmark' } },
  { path: 'benchmarks/suites/new', name: 'root-suite-new', component: () => import('@/views/root/SuiteEditView.vue'), meta: { title: 'New suite' } },
  { path: 'benchmarks/suites/:id/edit', name: 'root-suite-edit', component: () => import('@/views/root/SuiteEditView.vue'), meta: { title: 'Edit suite' } },
  { path: 'benchmarks/:kind(suites|benchmarks)/:id', name: 'root-benchmark', component: () => import('@/views/root/BenchmarkDetailView.vue'), meta: { title: 'Benchmark' } },
  { path: 'benchmarks', name: 'root-benchmarks', component: () => import('@/views/root/BenchmarksView.vue'), meta: { title: 'Benchmarks' } },
  { path: 'audit', name: 'root-audit', component: () => import('@/views/shared/AuditView.vue'), meta: { title: 'Audit log' } },
  { path: 'settings', name: 'root-settings', component: () => import('@/views/root/SettingsView.vue'), meta: { title: 'Settings' } },
];

const tenant: RouteRecordRaw[] = [
  { path: '', redirect: { name: 'tenant-overview' } },
  { path: 'notifications', name: 'tenant-notifications', component: () => import('@/views/shared/NotificationsView.vue'), meta: { title: 'Notifications' } },
  { path: 'overview', name: 'tenant-overview', component: () => import('@/views/tenant/TenantOverview.vue'), meta: { title: 'Overview' } },
  { path: 'organization', name: 'tenant-org', component: () => import('@/views/tenant/OrganizationView.vue'), meta: { title: 'Departments' } },
  { path: 'organization/:unitId', name: 'tenant-unit', component: () => import('@/views/tenant/UnitView.vue'), meta: { title: 'Unit' } },
  { path: 'settings', name: 'tenant-settings', component: () => import('@/views/tenant/TenantSettingsView.vue'), meta: { title: 'Settings' } },
  { path: 'licenses', name: 'tenant-licenses', component: () => import('@/views/tenant/LicensesView.vue'), meta: { title: 'Licenses' } },
  { path: 'licenses/:id', name: 'tenant-license', component: () => import('@/views/tenant/LicenseEditView.vue'), meta: { title: 'License' } },
  { path: 'setup', name: 'tenant-setup', component: () => import('@/views/tenant/SetupWizardView.vue'), meta: { title: 'Setup' } },
  { path: 'approvals', name: 'tenant-approvals', component: () => import('@/views/tenant/LicenseRequestsView.vue'), meta: { title: 'License requests' } },
  { path: 'users', name: 'tenant-users', component: () => import('@/views/tenant/UsersView.vue'), meta: { title: 'Users' } },
  { path: 'users/:userId', name: 'tenant-user', component: () => import('@/views/tenant/UserDetailView.vue'), meta: { title: 'User' } },
  { path: 'models', name: 'tenant-models', component: () => import('@/views/tenant/TenantModelsView.vue'), meta: { title: 'Models' } },
  { path: 'keys', name: 'tenant-keys', component: () => import('@/views/tenant/ProviderKeysView.vue'), meta: { title: 'Provider keys (BYOK)' } },
  { path: 'reports', name: 'tenant-reports', component: () => import('@/views/tenant/ReportsView.vue'), meta: { title: 'Reports' } },
  { path: 'tools', name: 'tenant-tools', component: () => import('@/views/tenant/ToolsView.vue'), meta: { title: 'Tools & skills' } },
  { path: 'guardrails', name: 'tenant-guardrails', component: () => import('@/views/shared/GuardrailsView.vue'), meta: { title: 'Guardrails' } },
  { path: 'audit', name: 'tenant-audit', component: () => import('@/views/shared/AuditView.vue'), meta: { title: 'Audit log' } },
];

const user: RouteRecordRaw[] = [
  { path: '', redirect: { name: 'user-home' } },
  { path: 'home', name: 'user-home', component: () => import('@/views/user/UserHome.vue'), meta: { title: 'My usage' } },
  { path: 'keys', name: 'user-keys', component: () => import('@/views/user/UserKeysView.vue'), meta: { title: 'API keys' } },
  { path: 'models', name: 'user-models', component: () => import('@/views/user/UserModelsView.vue'), meta: { title: 'My models' } },
  { path: 'tools', name: 'user-tools', component: () => import('@/views/user/MyToolsView.vue'), meta: { title: 'MCP servers' } },
  { path: 'connect', name: 'user-connect', component: () => import('@/views/user/ConnectView.vue'), meta: { title: 'Setup agent' } },
  { path: 'profile', name: 'user-profile', component: () => import('@/views/user/ProfileView.vue'), meta: { title: 'Profile' } },
  { path: 'docs', name: 'user-docs', component: () => import('@/views/user/DocsView.vue'), meta: { title: 'Documentation' } },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
    {
      path: '/',
      component: () => import('@/components/shell/AppShell.vue'),
      children: [
        { path: '', redirect: () => homeFor() },
        { path: 'root', children: root, meta: { context: 'root' } },
        { path: 't/:tenantId', children: tenant, meta: { context: 'tenant' } },
        // Personal pages belong to whoever is acting, in every context: an
        // admin has keys and limits of their own, like any user.
        { path: 'me', children: user, meta: { context: 'personal' } },
      ],
    },
    // An unknown address goes home rather than to a blank page.
    { path: '/:pathMatch(.*)*', redirect: () => homeFor() },
  ],
});

export function homeFor(): string {
  const current = session.current.value;
  if (!current) return '/login';
  if (current.kind === 'root') return '/root/overview';
  if (current.kind === 'tenant') return `/t/${current.tenantId}/overview`;
  return '/me/home';
}

router.beforeEach((to) => {
  if (to.name === 'login') return session.signedIn.value ? homeFor() : true;
  if (!session.signedIn.value) return { name: 'login' };
  const context = to.matched.find((r) => r.meta.context)?.meta.context;
  if (context && context !== 'personal' && context !== session.current.value?.kind) return homeFor();
  // A tenant not set up yet opens the setup wizard, unless its admin chose to do it later.
  const name = String(to.name ?? '');
  if (name.startsWith('tenant-') && name !== 'tenant-setup') {
    const id = String(to.params.tenantId ?? '');
    if (tenantById(id)?.setupDone === false && !setupLater.has(id)) return `/t/${id}/setup`;
  }
  return true;
});
