import { computed, reactive, watch } from 'vue';

/**
 * Which product the prototype shows.
 *
 * - `future` (default): everything designed so far, Stage 1 to Stage 4.
 * - `v1`: only what the first release covers, at least in part, for the
 *   community demo on 5 December 2026 (PRD Stage 1, "First tokens").
 *
 * The choice is kept per browser, so a reload keeps the mode.
 */
export type ScopeMode = 'future' | 'v1';

const KEY = 'tf-scope-mode';

function load(): ScopeMode {
  try {
    return localStorage.getItem(KEY) === 'v1' ? 'v1' : 'future';
  } catch {
    return 'future';
  }
}

export const scope = reactive({ mode: load() as ScopeMode });

watch(
  () => scope.mode,
  (mode) => {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* private window: the mode lasts for this page only */
    }
  },
);

export const isV1 = computed(() => scope.mode === 'v1');

/**
 * Screens in the 5 December scope. Every other screen, and its menu item, is
 * hidden in v1 mode. Detail pages are listed with the list they belong to.
 *
 * The cut is made on the backend: a screen is hidden only when it needs a
 * backend capability or API that Stage 1 does not build. A screen that needs
 * nothing from the backend (documentation, agent setup, profile) stays, and so
 * does a screen whose backend exists in Stage 1 even where Stage 1 drives it
 * from the configuration file rather than from a screen.
 */
export const V1_SCREENS = new Set<string>([
  // Instance console. Stage 1 has one "Admin page" for models (IF-03) and does
  // tenants, users, prices, limits and families in the configuration (IF-05);
  // a screen stays when Stage 1 delivers what it shows, in whichever form.
  'root-overview',
  'root-tenants', 'root-tenant', // FR-21, FR-22: tenants, allowed models, default limits
  'root-users', 'root-user', // FR-29: users created at first sign-in, disabled by the Instance Admin
  'root-org', 'root-unit', // departments: kept by product decision (18 Nov 2026), see below
  'root-models', 'root-model', // IF-03, FR-61, FR-70-84, FR-153: catalog, checks, evidence, promote
  'root-monitoring', // FR-158, FR-159, IF-06: dashboards and basic alerts
  'root-usage', // FR-137, FR-140: usage per tenant, user, key, model, family
  'root-audit', // FR-148: basic audit records
  'root-settings', // IF-05: instance configuration, sign-in (FR-17-28)

  // Organization console. In Stage 1 a Customer Admin is a user (PRD line 236);
  // the tenant's own settings exist (allowed models, limits), its users sign in.
  'tenant-overview',
  'tenant-users', 'tenant-user', // FR-29
  'tenant-org', 'tenant-unit', // departments: kept by product decision (18 Nov 2026), see below
  'tenant-models', // FR-22, FR-63: the models allowed for the tenant

  // Personal pages: the Customer Portal (IF-02).
  'user-home', // FR-128: usage, remaining credits, reset time
  'user-keys', // FR-40-43: create, show once, revoke, limit to models
  'user-models', // FR-63: allowed models and families
  'user-connect', // FR-152: a snippet per validated tool
  'user-docs', // FR-151, FR-93-109: support contact, API formats, errors
  'user-profile',
  'login',
]);

/*
 * Hidden in v1, with the stage that brings them:
 * licenses and license requests (plans Stage 2, seats excluded, line 389),
 * guardrails (FR-167-170, Stage 2), tools, skills and MCP servers (FR-171/172 Stage 2, skills Stage 4),
 * provider keys of a tenant (excluded, line 388), tenant reports, audit and settings (Stage 2),
 * notifications (FR-157, Stage 2), the setup wizard (sign-up FR-156, Stage 2),
 * creating and editing benchmarks and suites (the benchmark registry, Stage 3).
 *
 * Cut from the v1 UI by product decision (17 and 18 Nov 2026), though Stage 1
 * builds part of their backend: deployments (done by scripts), benchmarks
 * (Terminal Bench runs inside admission), aliases and routing (families come
 * from the configuration), the mail server and email notification settings,
 * the lifecycle board (promote and retire stay on the model page), providers
 * (OpenAI and Anthropic models are registered in the configuration), and the
 * evaluation environment (it runs only the admission benchmarks).
 *
 * Kept in v1 by product decision (18 Nov 2026) although the PRD brings their
 * backend later: departments (the organization hierarchy is Stage 3, line 440).
 */

/**
 * Sections of the instance settings hidden in v1 (product decision, 17 and
 * 18 Nov 2026): email notifications, and the configuration, model rollout,
 * gateway and data retention sections, which Stage 1 sets in the
 * configuration file (IF-05) rather than on a screen.
 */
export const V1_HIDDEN_SETTINGS = new Set<string>(['org-notifications', 'instance', 'rollout', 'gateway', 'data']);

/** True when the screen with this route name is shown in the current mode. */
export function screenInScope(name: string): boolean {
  return scope.mode === 'future' || V1_SCREENS.has(name);
}
