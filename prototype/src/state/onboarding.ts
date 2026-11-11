import { reactive } from 'vue';
import type { Id } from '@/data/types';

/**
 * First-run guidance. A user gets a guided tour of their pages on first sign-in;
 * a tenant admin of a tenant that is not set up yet gets the setup wizard.
 * The demo remembers both for the session.
 */
export interface TourStep {
  /** CSS selector of the element to point at; none centers the card. */
  target?: string;
  title: string;
  text: string;
  /** What the user can do there. */
  actions?: string[];
}

export const USER_TOUR: TourStep[] = [
  { title: 'Welcome to Token Factory', text: 'One place for the AI models your organization lets you use, from your coding agent, your scripts or chat. Here is a quick look around; it takes a minute.' },
  { target: '.sidebar a[href="#/me/home"]', title: 'My usage', text: 'Your limits and what you have used of them, for platform credits and your company’s own credits, with when they reset.', actions: ['See how much is left today', 'Request a license upgrade when you need more'] },
  { target: '.sidebar a[href="#/me/keys"]', title: 'API keys', text: 'Keys let your tools act as you, within your license.', actions: ['Create one key per tool or machine', 'Give a key its own limit', 'Revoke a key you no longer use'] },
  { target: '.sidebar a[href="#/me/models"]', title: 'My models', text: 'Every model your license allows, its price in credits and which credits it draws.', actions: ['Copy a model ID or alias to call it'] },
  { target: '.sidebar a[href="#/me/tools"]', title: 'MCP servers', text: 'Tools your agent can use. Your organization marks some as required and some as recommended.', actions: ['See what is required for you', 'Add recommended servers'] },
  { target: '.sidebar a[href="#/me/connect"]', title: 'Setup agent', text: 'Ready-made settings for Claude Code and Codex CLI, with your key filled in.', actions: ['Copy the snippet and start your agent'] },
  { target: '.sidebar a[href="#/me/docs"]', title: 'Documentation', text: 'The SDKs, other tools and the API reference, and what each error means.' },
  { target: '.sidebar .account', title: 'Your profile', text: 'Your details, your language, and this tour if you want to see it again.', actions: ['Change your language', 'Take the tour again'] },
];

export const tour = reactive({ open: false, index: 0, steps: [] as TourStep[] });
const toured = reactive(new Set<Id>());

export function startTour(steps: TourStep[] = USER_TOUR): void {
  tour.steps = steps;
  tour.index = 0;
  tour.open = true;
}

/** The first time a user signs in, the tour starts by itself. */
export function tourOnFirstSignIn(userId: Id): void {
  if (toured.has(userId)) return;
  toured.add(userId);
  startTour();
}

export function closeTour(): void {
  tour.open = false;
}

/** Tenants whose admin chose to finish setup later; the wizard stops opening by itself. */
export const setupLater = reactive(new Set<Id>());

// ---- instance console: a scenario chooser on first start, then a tour per scenario

/** The four ways in, offered when the instance console opens for the first time. */
export const chooser = reactive({ open: false });
const SEEN_KEY = 'tf-demo-onboarding-seen';
let seenThisSession = false;
function seen(): boolean {
  try {
    return seenThisSession || localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return seenThisSession;
  }
}
/** Called when the instance console opens: shows the chooser the first time only. */
export function chooserOnFirstStart(): void {
  if (seen()) return;
  seenThisSession = true;
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* private window or blocked storage: once per session is enough */
  }
  chooser.open = true;
}

/** A Customer Admin's tour of an organization that is already set up. */
export function tenantTour(tenantId: Id): TourStep[] {
  const a = (path: string) => `.sidebar a[href="#/t/${tenantId}/${path}"]`;
  return [
    { title: 'Your organization in Token Factory', text: 'As a Customer Admin you decide who in your company gets which models, how much they may use, and with which tools. A quick look around.' },
    { target: a('overview'), title: 'Overview', text: 'What needs you now — limits running out, keys expiring, models retiring — and how credits and seats stand this month.' },
    { target: a('organization'), title: 'Departments', text: 'Departments and teams, synced from your HR system or directory. Each can have a default license that its people inherit.', actions: ['Set a default license per department'] },
    { target: a('users'), title: 'Users', text: 'Everyone with access, their license, limits, usage and roles.', actions: ['Override a license for one person', 'Give someone an admin role'] },
    { target: a('licenses'), title: 'Licenses', text: 'Seat types for your people: which models and model aliases, and limits in platform credits and your own credits.', actions: ['Create a license for a team', 'Tighten limits for interns'] },
    { target: a('approvals'), title: 'License requests', text: 'Users ask for more models or higher limits here; their manager or you decide.', actions: ['Approve or decline with a note'] },
    { target: a('models'), title: 'Models', text: 'Models your organization license brings, and models behind your own provider keys.', actions: ['Switch a model off for your organization'] },
    { target: a('keys'), title: 'Provider keys', text: 'Bring your own OpenAI, Anthropic or Azure keys; models behind them are billed by your provider.', actions: ['Add a key and pick its models', 'See its cost by token class'] },
    { target: a('guardrails'), title: 'Guardrails', text: 'The platform’s checks apply to you; add your own on top — personal data, topics, your own webhook.' },
    { target: a('tools'), title: 'Tools & skills', text: 'Which MCP servers and skill sets each department gets; register servers of your own.', actions: ['Register your helpdesk MCP server'] },
    { target: a('reports'), title: 'Reports', text: 'Usage by department, person, model and credit type, with export.' },
    { target: a('settings'), title: 'Settings', text: 'Sign-in and SSO, integrations, notifications, support access and your organization license.' },
  ];
}

/** The instance console: what the user, setup and organization tours do not cover. */
export const ROOT_TOUR: TourStep[] = [
  { title: 'Running a Token Factory instance', text: 'This console runs the whole instance: tenants, the models it serves, where they run, how they are checked and routed, and what it all costs. The user and Customer Admin tours cover the rest.' },
  { target: '.sidebar a[href="#/root/overview"]', title: 'Overview', text: 'What needs you now across the instance, credits used, tenants and GPU capacity. Start this onboarding again from here.' },
  { target: '.sidebar a[href="#/root/tenants"]', title: 'Tenants', text: 'Every organization on the instance, partners and their customers beneath them.', actions: ['Create a tenant with a tenant license, seats and credits', 'Enter a tenant to help its admin'] },
  { target: '.sidebar a[href="#/root/models"]', title: 'Model catalog', text: 'Every model the instance serves, with its capabilities, prices per token class, usage and benchmark results.', actions: ['Add a model through a provider key', 'Deploy an open-weight model on your GPUs'] },
  { target: '.sidebar a[href="#/root/lifecycle"]', title: 'Lifecycle', text: 'Models move like patches: admitted, approved, rolled out ring by ring, deprecated with notice, retired.', actions: ['Move a model to its next stage'] },
  { target: '.sidebar a[href="#/root/benchmarks"]', title: 'Benchmarks', text: 'Suites and single benchmarks, loaded from public registries, files, Git or real traffic; compare models side by side.', actions: ['Compare models on the suites you care about'] },
  { target: '.sidebar a[href="#/root/routing"]', title: 'Aliases & routing', text: 'Callers name an alias, not a model: model aliases follow one model line, scenario aliases pick the best model for a task.' },
  { target: '.sidebar a[href="#/root/guardrails"]', title: 'Guardrails', text: 'Checks every request and answer passes, set for all tenants or enforced on them.' },
  { target: '.sidebar a[href="#/root/registry"]', title: 'Tools & skills', text: 'MCP servers and skill sets offered to tenants; every version is scanned and approved first.' },
  { target: '.sidebar a[href="#/root/providers"]', title: 'Providers', text: 'GPU clouds and your own hardware, and the API keys of commercial model providers.' },
  { target: '.sidebar a[href="#/root/deployments"]', title: 'Deployments', text: 'Models running on your GPUs: replicas, utilization against limits, scaling.' },
  { target: '.sidebar a[href="#/root/evaluation"]', title: 'Evaluation', text: 'Where benchmark runs happen: the eval GPUs, sandboxes, judges, the queue, schedules and the budget.' },
  { target: '.sidebar a[href="#/root/monitoring"]', title: 'Monitoring', text: 'Provider bills for the platform keys, hosted models against their limits, and alerts.' },
  { target: '.sidebar a[href="#/root/usage"]', title: 'Usage and audit', text: 'Credits by tenant and model, and every change anyone made, in the audit log.' },
  { target: '.sidebar a[href="#/root/settings"]', title: 'Settings', text: 'The instance itself: domain and mail, tenant licenses, model rollout rings, gateway behaviour, data retention, updates and roles.', actions: ['Define tenant licenses before creating tenants', 'Install updates'] },
  { target: '.sidebar a[href="#/root/organization"]', title: 'Your own organization', text: 'The instance team: its departments, users and licenses — the same pages a Customer Admin has.' },
  { target: '.sidebar .bell-row', title: 'Notifications', text: 'Everything that needs an instance admin: budgets, failed admissions, degraded clusters, new releases.' },
];
