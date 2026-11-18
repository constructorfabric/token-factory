# Token Factory — UI prototype

A clickable prototype of **Token Factory**, Constructor's platform for serving AI models to organizations: the console of the instance administrator, the console of a customer organization, and the pages of an end user. It is built with the Constructor UI Kit (`@constructor/ui`, Vue 3, Vite).

The product specification it follows is in [`../docs`](../docs): [PRD](../docs/PRD.md), [DESIGN](../docs/DESIGN.md) and [DECOMPOSITION](../docs/DECOMPOSITION.md).

Everything runs in the browser on **mock data**. There is no backend: nothing you do is sent anywhere, and a page reload starts from the same data again.

## Run it locally

You need:

- **Node.js 22 LTS** (20.19 or newer works). `nvm use` picks the version from `.nvmrc`.
- **pnpm 11**. The easiest way is Corepack, which ships with Node: run `corepack enable` once, and the version pinned in `package.json` is used automatically.
- **Access to Constructor's npm registry** for the `@constructor/*` packages: `https://nexus.constr.dev/repository/npm-gitlab-frontend/` (already set in `.npmrc`; no login needed). If it is not reachable from your network, connect to the Constructor VPN.

Then:

```sh
git clone https://github.com/constructorfabric/token-factory.git
cd token-factory/prototype
corepack enable        # once per machine
pnpm install
pnpm dev
```

Open **http://localhost:5180** and press **Continue with Constructor Fabric Pass** — there is no password to enter.

## First start: pick a scenario

The first time the instance console opens, it offers four ways to see the product. Each opens the right console as the right person and starts its own guided tour:

| Scenario | You become | What you see |
|---|---|---|
| **Use AI as an employee** | Jane Doe, a developer at Acme Corp | Limits and usage, API keys, models, MCP servers, ready-made settings for Claude Code and Codex |
| **Set up a new organization** | Customer Admin of Helix Pharma, not set up yet | The setup wizard: connect users, choose models, create licenses, set defaults |
| **Run an organization** | Customer Admin of Acme Corp | Departments, users, licenses, license requests, models, provider keys, guardrails, tools, reports, settings |
| **Run the instance** | Instance Admin | Tenants, model catalog and lifecycle, benchmarks, routing, GPUs, evaluation, monitoring, settings |

The first three open another console as an **impersonation**: an orange banner at the top shows who you are acting as, and **Exit to root console** brings you back. Start the scenarios again any time with **Start onboarding** on the instance overview. The chooser opens by itself only once per browser; to see it again on start, clear the site's data for `localhost:5180`.

## Scope: v1 or Future

The **Scope** switch at the top right of every screen picks which product you see:

- **Future** (the default) shows everything designed so far, Stage 1 to Stage 4.
- **v1 · 5 Dec** shows only what the first release covers for the community demo on 5 December 2026 (PRD Stage 1, "First tokens"). Screens that need a backend capability Stage 1 does not build are hidden from the menu, and their addresses lead back to the console's overview; screens that need nothing from the backend, such as the documentation and the agent setup, stay. A few more are cut or kept by product decision: v1 also hides deployments, benchmarks (including everything about them on a model's page), aliases and routing, providers, evaluation, the lifecycle board, and the mail, notification, configuration, model rollout, gateway and data retention settings, and it keeps departments.

The choice is kept per browser. The list of v1 screens and hidden settings sections, with the requirement or decision behind each, is in `src/state/scope.ts`.

## What is in it

**Instance console** (`/root`)

- **Tenants:** partners and their customers, tenant licenses, seats and credits, impersonation.
- **Models:**
  - the model catalog, with admission, capabilities, prices per token class, usage and benchmarks;
  - the lifecycle board (move models between stages);
  - benchmarks: suites, single benchmarks loaded from registries, files, Git or real traffic, and a side-by-side comparison;
  - aliases and routing;
  - guardrails, and tools and skills.
- **Infrastructure:** GPU and API providers, deployments, the evaluation environment (where benchmarks run), and monitoring.
- **Governance:** usage, the audit log, and settings: instance, tenant licenses, model rollout, gateway, data retention, updates, roles.
- **Organization:** the instance team's own departments, users, licenses and license requests.

**Organization console** (`/t/<tenant>`): overview, departments, users, licenses, license requests, models, provider keys (bring your own key), guardrails, tools and skills, reports, audit log, settings.

**Personal pages** (`/me`): usage and limits, API keys, models and aliases, MCP servers, agent setup, documentation, profile. Every role has them, for its own seat.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server on http://localhost:5180 with hot reload |
| `pnpm typecheck` | Type-checks the whole app with `vue-tsc` |
| `pnpm build` | Type-checks, then builds static files into `dist/` |
| `pnpm preview` | Serves the built `dist/` locally |

The build is a static single-page app with hash-based routes, so `dist/` can be hosted on any static file server.

## Troubleshooting

- **`@constructor/...` packages fail to install (404, ETIMEDOUT):** the Constructor registry is not reachable. Connect to the VPN and run `pnpm install` again.
- **pnpm complains about its version or `minimumReleaseAge`:** use pnpm 11 through Corepack (`corepack enable`), not an older global pnpm.
- **Port 5180 is taken:** `pnpm dev --port 5181`.
- **A screen looks stale after pulling changes:** stop the server, delete `node_modules/.vite`, start again.

## Project structure

```
src/
  data/        mock data and types: tenants, models, users, licenses, benchmarks, catalog entries
  state/       reactive state and the rules derived from it: session and impersonation,
               tenant licenses, aliases, lifecycle moves, rollout, benchmark runs,
               evaluation setup, onboarding tours
  views/       one route tree per console: root/ (instance), tenant/, user/, shared/
  components/  shell (sidebar, banner, tours), dialogs, charts and shared UI such as
               the searchable item picker
  router.ts    routes; a screen from another console redirects home
```

## Design rules

Every screen follows these; keep them when you add one.

1. **AI credits, not money.** Usage, limits and model prices are in AI credits (1 credit = $0.01 in the demo). Only infrastructure costs — GPU hours, provider bills, the evaluation budget — stay in dollars.
2. **Every figure states its period.** Usage blocks have a Today / 7 / 30 / 90-day switch that every tile follows.
3. **One usage layout for everyone:** a person, a tenant and the instance get the same block.
4. **Row actions live in the "…" menu;** a card's main action sits at its bottom.
5. **One-sentence descriptions;** no fact shown twice on a page.
6. **Every data table sorts by its headers,** unless its order means something.
7. **Long lists are picked from a searchable, one-per-row picker,** never a grid of checkboxes.
8. **Records with several sections are edited on their own page,** not in a dialog.
9. **Names say what a thing is;** no development-phase marks (milestones, priorities, requirement IDs) on screens.
10. **Every role is also a user:** the Personal section is there for everyone.
