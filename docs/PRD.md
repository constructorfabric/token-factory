# Token Factory — Product Requirements Document

| | |
|---|---|
| **Document** | Product Requirements Document (PRD) for Token Factory |
| **Version** | 1.2 (Draft for approval) |
| **Date** | 2026-11-03 |
| **Status** | Draft for approval; scope baseline for the 5-Dec-2026 milestone. Priorities confirmed by: `<name, date>` TODO(PRODUCT_OWNER). Acceptance criteria confirmed testable by: `<name, date>` TODO(QA). |
| **Change control** | Changes are made by pull request to this document. |
| **Companions** | [DESIGN.md](DESIGN.md) — architecture, components, technology decisions, open design questions; [DELIVERY-PLAN.md](DELIVERY-PLAN.md) — cadence, weekly plan, team roles, delivery risks; [GO-TO-MARKET.md](GO-TO-MARKET.md) — launch and channel plan |

---

## 0. Conventions

- **IDs.** Functional requirements are `FR-<area><n>` (e.g., `FR-A1`), non-functional requirements `NFR-<n>`, requirements on the Constructor Fabric Pass dependency `PASS-<n>`. IDs are stable.
- **Parts.** A capability delivered in stages is split into parts `FR-X.1`, `FR-X.2`, …; each part is atomic and has exactly one milestone. A reference to `FR-X` means all of its parts.
- **Milestone (M).** `M1`–`M4` or `Later` (§10).
- **Priority (P)** within its milestone: **Must** (the milestone is not accepted without it), **Should** (planned; may slip to the next milestone with PO approval), **Could** (only if capacity allows).
- **Acceptance criteria (AC).** Every M1 and M2 requirement has acceptance criteria. Future directions (§7-K) get acceptance criteria when they are scheduled.
- **Verification (V):** **T** — automated or manual test; **D** — demonstration; **I** — inspection of documents, configuration or code; **A** — analysis or measurement report.
- **Placeholders.** `<…>` marks a value still to be decided. **`TODO(ROLE)`** names the role that fills it; the first role listed is accountable. M1 placeholders are filled by the dates in DELIVERY-PLAN.md §9 (design-critical values by 2026-11-10, all others by 2026-11-20). Roles:

  | Role | Who (see DELIVERY-PLAN.md §10) |
  |---|---|
  | `PRODUCT_OWNER` | Product Owner |
  | `PRODUCT_MANAGER` | Product Manager |
  | `ARCHITECT` | Architecture owner |
  | `DEVOPS` | Infrastructure / Kubernetes lead and Operations / SRE |
  | `DEVELOPER` | Control Plane lead and Gateway / platform integration |
  | `ML_LEAD` | ML / benchmarking lead |
  | `QA` | QA lead |
  | `SECURITY` | Security reviewer |
  | `LEGAL` | Legal counsel |
  | `PASS_OWNER` | Owner of Constructor Fabric Pass |
  | `CT_ADMIN` | Instance Admin at Constructor Tech |

- Product decisions are recorded in §14; undecided items in §15.

---

## 1. Executive summary

**Token Factory (TF)** fully automates the way any company or individual can host LLMs and provide LLM inference as a service to their customers. It is **downloadable, open-source software** that any DevOps team installs from GitHub onto **any Kubernetes cluster** — the company's own hardware or rented infrastructure — and operates as a self-service, governed LLM serving platform: a *factory* that takes open-weight models in and produces reliable inference services ("tokens") out, continuously.

The business case is independence and control: organizations today depend on expensive proprietary AI APIs and enterprise subscriptions, with spend that is hard to predict and govern. Token Factory replaces that dependency with an installable platform that serves open-weight model families (GLM, Qwen, DeepSeek, …) through a governed API with per-customer plans, quotas, usage metering, and a verified model pipeline (license → security → acceptance → benchmark → staged rollout → retirement). Savings are not assumed: TF makes the cost of every token measurable, so that self-hosting can be run at the utilization where it pays off (§2.3).

The first milestone is fixed: **a working end-to-end Token Factory demonstrated at the community event on 5 December 2026**, deployed both as the vendor's own production instance (**Constructor Fabric TF**) and at the first partner (**Constructor Tech**), with real users inferencing through it. Work then continues in 1–2 month phases (Feb / Apr / Jun 2027 community events) toward the full product: strict multi-tenancy, model operations maturity, hybrid commercial providers and intelligent routing — with weekly shippable increments throughout.

---

## 2. Problem and opportunity

### 2.1 Problems

| Problem | Impact |
|---|---|
| **Vendor lock-in and unpredictable spend** | Critical dependence on a few commercial AI providers; rising subscription, token and API costs without effective control. |
| **No controlled self-hosted serving** | Ad-hoc setups (a router on one box, manually issued keys) serve few users and see low adoption. |
| **Models arrive unverified** | Downloading weights risks typosquatted sources, license mismatch, vLLM incompatibility, or silent quality drift between versions (e.g., served vs Hugging Face variants of the same model). |
| **No governance** | No unified policies, quotas, per-team usage attribution, or audit; sensitive code flows to external providers without oversight. |
| **Fragmented infrastructure** | Corporate GPUs, cloud GPUs and external APIs managed separately; cache leakage between organizations on shared routers is a live security risk. |
| **One-off deployments don't scale** | Models "installed once" by hand; every update is a project. New model versions cannot be rolled out or rolled back safely. |

### 2.2 Business drivers

1. **Technological independence** from proprietary third-party APIs and their subscription and token costs.
2. **Cost control and predictability**: per-user quotas, credit accounting, and a path to cheaper tokens per task (self-hosted under load, benchmark-gated model choices, later intelligent routing).
3. **IP and data protection**: hosting on the organization's own infrastructure; nothing leaves the instance unless explicitly enabled (a hard requirement for security-sensitive organizations).
4. **Business continuity**: fallback models and alternative engines on outages, instead of work stoppage.
5. **Governance**: who may use which model, how much, at whose cost — with reports and audit.
6. **Education and community**: giving students, contributors and ecosystem engineers qualified access to good models.
7. **Platform economics**: the concept only works with *many* models and *many* consumers — a star architecture of models on one side, customers on the other, connected by the factory. A single model behind a router is not a product.

### 2.3 Economic rationale

Self-hosting replaces per-token and per-seat spend with the largely fixed cost of GPU capacity, owned or rented. It is cheaper only when that capacity is well utilized and the served models are good enough for the work; at low utilization it costs more per developer than commercial APIs or subscriptions. TF therefore does not assume savings — it makes them measurable and controllable:

- every token is metered per user, tenant and model (FR-H);
- plans, credits and quotas keep consumption within agreed bounds (FR-G);
- models are admitted on benchmark evidence, so cheaper models are used only where they are good enough (FR-D);
- later, routing selects models by cost, capability and load (FR-K6).

The break-even model (rent vs buy, hardware vendor, model mix, utilization) is an open question (OQ-8), answered with TF's own usage data. The measurable target is the cost-per-1M-tokens KPI in §12.

---

## 3. Vision and positioning

### 3.1 Vision

> **Token Factory fully automates the way any company or individual can host LLMs and provide LLM inference as a service to their customers.**

A company's DevOps gets TF from GitHub, installs it on any Kubernetes cluster — own or rented hardware — connects model families from open-weight sources (Hugging Face first), and the factory does the rest: downloads, verifies, benchmarks, deploys, serves, meters, updates and retires models, while tenants and users consume tokens through a familiar API with plans, policies and self-service keys.

### 3.2 Product definition and distribution model

- TF is **downloadable and installable open-source software**, obtained **from GitHub in source form** (packaged forms later).
- A TF installation must be installable into **any conformant Kubernetes server or cluster** that meets the prerequisites (§6.7) — from a single-server cluster to a full HA layout.
- The deployer and operator of an installation is the **TF Provider** (any company or individual), not the TF Vendor. TF has **no mandatory connection to a vendor control plane**.
- From M3 an instance can run in an isolated network with outbound internet blocked, with offline import of images, updates and model weights (FR-A8). Until then it needs outbound access to the container registry, Hugging Face and its IdP, directly or through an HTTP(S) proxy (FR-A11).
- One codebase, modular architecture. The same artifact serves internal (single organization), external (multi-customer) and — later — hybrid (self-hosted + commercial providers) deployments.

### 3.3 What Token Factory is **not** (v1 scope control)

- **Not a chat application.** The first externally visible capability is the **Inference API**. Chat Engine is a separate component on top of the factory, explicitly out of the first versions.
- **Not an intelligent router (yet).** Prompt-based automatic model selection ("auto-model") is explicitly **excluded from M1** (KV-cache invalidation when switching models mid-session; implementation complexity) — it arrives with intelligent routing in M4. M1 routes by requested model or family alias.
- **Not a GPU cloud orchestrator or a research project.** TF is an applied, engineering-utilitarian product: no research deliverables gate its milestones. Model research is a separate initiative that TF may later serve.
- **Not a from-scratch inference engine.** vLLM is the only runtime in the first phases; alternative runtimes integrate as adapters later. Off-the-shelf components (router, observability, identity) are used first behind stable facades and replaced with own components later.
- **Not a billing system.** Invoicing, payment collection and taxes are out of scope. TF meters usage in credits and exports it (FR-H2.2, FR-H8) for external billing; credits carry no currency until money budgets (FR-G7).
- **Not yet scheduled:** guardrails and PII redaction, request/response hook plugins, tenant RAG / vector stores. Target: `<milestone, or out of scope>` TODO(PRODUCT_OWNER).

### 3.4 Positioning

**Token Factory — the open-source factory for LLM inference.** Install on any Kubernetes; serve any open-weight model family to any user with governance.

- Not positioned as merely an *LLM Gateway* or a *GPU orchestrator* — mature single-purpose solutions exist for both. TF's differentiation is the **whole automated lifecycle** (model intake → verified rollout → metered serving → retirement) delivered as **installable open source** that any DevOps can run on their own hardware.
- Enterprise framing (later phases): as TF matures it becomes the organization's *hybrid AI control plane for developer productivity* — controlling cost, availability, security and use of AI models (self-hosted and commercial) while preserving developers' familiar tools.

---

## 4. Actors and target audience

### 4.1 Roles and terms

| Term | Definition |
|---|---|
| **TF** | Token Factory. |
| **TF Vendor** | The authors and owners of Token Factory's repositories. |
| **TF Provider** | Those who deployed and are operating a TF instance (a company or individual). |
| **TF Instance** | A deployed, running installation of Token Factory. |
| **TF Instance Admin** | A person from the Provider organization who deploys, configures and operates a TF Instance. |
| **TF Customer** (synonym: **tenant**) | A registered account in a TF instance; an individual or an organization; potentially free or paid. In internal mode a tenant usually represents an organizational unit (department). In M1 every user belongs to exactly one tenant. |
| **TF Customer Admin** (aka **tenant admin**) | A person from a TF Customer organization who provides access to the account to other TF Users of that organization. |
| **TF User** | A consumer of LLM tokens provided by the TF instance. A Customer may be represented by one or more Users. |
| **TF Customer Portal** | The web portal where Users sign in and manage their keys, see their usage and get connection instructions; from M2 also where Customers register and Customer Admins manage their tenant. Enable/disable per instance. |
| **Admin page** | The single administration web page of M1: model admission status, evidence and promotion (§6.2). Grows into the Admin Console from M2. |
| **Instance configuration** | The Helm values file of an instance. In M1 it is the administration interface for everything except the Admin page (§6.2). |
| **Inference API** | The API endpoints TF Users call to inference models (OpenAI-compatible and Anthropic-compatible). Enable/disable per instance. |
| **LLM family (alias)** | A named alias grouping models, e.g. `GLM`, `Qwen-Flash`. Users may request a family instead of a specific model. |
| **Default model (of a family)** | The model used when the user requested the family rather than a specific model. |
| **Retired model** | A model pulled out of the inference engines that can no longer be inferenced; traffic requesting it goes to the default model of the same family (FR-C4). |
| **Runtime profile** | The set of inference-engine settings used to serve models (§6.4). TF ships one default profile; the Instance Admin may adjust it. |
| **Model license** | The legal terms under which a model's weights may be used; checked at admission (FR-D1). |
| **Entitlement** | What a TF instance is commercially entitled to use from the Vendor (paid features, support, capacity tiers). Not enforced before M3; tracked with entitlement counters (FR-H7). |
| **Plan** | Per-Customer configuration set by an Instance Admin: limits the set of allowed models, brings a default policy, may set credit limits and overuse limits (M2). In M1 a simpler set of **tenant settings** applies (FR-G2.1). |
| **Credits** | Usage accounting unit: every model's 1M tokens of uncached input, cached input or output (and cache write, where applicable) equals some number of credits (§7-G). |
| **Policy** | Per-user / per-tenant rules (allow/disallow models, etc.) configured by Customer Admins within the plan's bounds (M2). |
| **Constructor Fabric** | The platform initiative under which Token Factory is developed; also supplies reusable platform components ("gears": identity, secrets, service directory, …) that TF may reuse behind open interfaces (NFR-21). |
| **Constructor Fabric Pass** | The community registration service at `pass.cfabric.org`. Users register there; Pass admins approve them and assign roles. Default IdP of the flagship instance (§6.5). |
| **Constructor Fabric TF** | The Vendor's own production TF instance (the flagship), serving the Vendor's teams and community (on Virtuozzo Cloud, GCore Cloud, or DigitalOcean). |
| **Model admission** | The pipeline a model passes before serving: license check → security scan → download & storage → acceptance tests → benchmarking → rollout decision. |
| **ML workers** | Services executing model admission stages: download, scanning, acceptance testing, benchmarking, trace collection. |

### 4.2 First adopters (in order)

1. **Constructor Fabric community** — contributors; the Constructor Fabric TF instance is the flagship deployment (M1).
2. **Constructor Tech** — first partner deployment for their own users (M1).
3. **Students and education programs** — qualified users get access on the flagship in their own tenant, isolated from contributors (M1), scaled later.
4. **Ecosystem engineering organizations** — internal-use deployments (M2–M3).
5. **Any company or individual** — public open-source release and self-service installation (M3+).

### 4.3 Role scenario summary

The role scenarios are restated as requirements in §7. In brief:

- **Vendor:** build & test TF with intensive AI-agent use; run own dev and prod instances; collect (opt-in) telemetry from other instances; track entitlement counters to enable paid services.
- **Instance Admin:** deploy and update instances; configure internal mode (corporate IdP, directory auto-registration, tenants for departments) or external mode (social IdP, portal registration, custom domain); manage the model catalog (families, add/retire, defaults); set tenant settings and plans; consume usage and operational reports; receive notifications.
- **Customer Admin:** register/login via Portal; connect own IdP; add users; set policies and credit limits within the plan; check usage.
- **User:** obtain API keys (with expiry); get connection strings and tool instructions; see available models/families; inference by model, family or auto-selection; see own usage and limits.

---

## 5. Product principles

1. **Installable, repeatable, everywhere.** The factory must produce systems that are installable and deployable in many places — never a one-time, hand-maintained setup. Instances update and grow automatically.
2. **Stable facades, replaceable internals.** External APIs (Inference API, management API) stay fixed while internal components (router, engine, storage) are replaced — e.g., the off-the-shelf router is later replaced by an own gateway in A/B mode without changing external APIs.
3. **Off-the-shelf first.** Use ready components; cover gaps with one-off scripts (explicitly allowed in M1) with a tracked replacement plan.
4. **Open source core.** Base pipelines and infrastructure tooling are open; nothing needed to install and run TF depends on non-open components (NFR-21); the open/private split criteria get a legal review before the public release (OQ-9).
5. **Inference first.** The API and tokens are the product; chat UIs and advanced routing come later.
6. **Verified quality.** No model reaches users unverified (license, security, acceptance, benchmark); no model version change reaches all users at once (staged rollout, rollback) — from M2.
7. **Privacy-safe defaults.** Usage metadata only by default; prompt/response content is never stored in M1 and only when explicitly enabled per tenant, audited, from M2 (FR-H5).
8. **Tenants are isolated from day one.** Users, data, inference cache and capacity of one tenant are protected from other tenants from M1 (FR-B7); isolation becomes strict in M2 (NFR-4.2).

---

## 6. Solution scope

Component architecture and technology choices are in [DESIGN.md](DESIGN.md). This section fixes what the product exposes, how it is administered in M1, how models move through it, and where it can be installed.

### 6.1 Product surfaces

| Surface | Used by | Purpose | M1 form |
|---|---|---|---|
| **Inference API** | TF Users, their tools and applications | Inference models and families (FR-E). Enable/disable per instance. | OpenAI-compatible Chat Completions + minimal Anthropic-compatible Messages (streaming, tool use) |
| **TF Customer Portal** | Users | Sign-in, API keys, allowed models, usage and remaining credits, connection instructions, support contact (FR-F1–F2, FR-I9). Enable/disable per instance. | Minimal pages |
| **Admin page / Admin Console** | Instance Admins | M1: model admission status, evidence and promotion (FR-F4.1). From M2: tenants, plans, policies, reports, health (FR-F4.2). | One page |
| **Instance configuration** | Instance Admins | Declarative administration through the Helm values file (§6.2). | Helm values |
| **Management API / MCP** | Scripts and AI tools acting for admins | Programmatic administration (FR-F5). | — (API in M2, MCP in M3) |
| **Installer** | The Provider's DevOps | Installs and updates TF on a Kubernetes cluster, including all supporting services and GPU support (FR-A, §6.7). | Helm-based |
| **Vendor services** | TF Vendor | Opt-in telemetry ingestion, update and model notifications, entitlement-counter reports (FR-J). | — |

### 6.2 M1 administration interfaces

M1 uses the smallest possible administration surface: **everything is declared in the instance configuration (Helm values) and applied with `helm upgrade`, except model admission and promotion, which is the only administration UI page.** The control plane applies a changed configuration within 1 minute. No separate CLI is built in M1.

| M1 admin action | Who | Interface |
|---|---|---|
| Install and upgrade the instance | Instance Admin (DevOps) | Helm |
| Instance mode (internal/external); enable/disable Portal and Inference API; domains and TLS | Instance Admin | Helm values |
| Connect the default IdP (OIDC issuer, client ID, client-secret reference); claim → tenant/role mapping | Instance Admin | Helm values (+ Kubernetes Secret) |
| First Instance Admins (bootstrap) and break-glass admin | Instance Admin | Helm values (+ Kubernetes Secret) |
| Instance contact and support channel shown in the Portal and error messages | Instance Admin | Helm values |
| Create, rename and suspend tenants | Instance Admin | Helm values |
| Tenant settings: allowed families/models, default per-user credit limit, per-tenant concurrency cap | Instance Admin | Helm values |
| Grant Instance Admin and Customer Admin roles | Instance Admin | IdP roles through the claim mapping; otherwise a list of users in Helm values |
| Create families; add a model to a family by Hugging Face ID/URL (starts admission) | Instance Admin | Helm values |
| Admission policy: allowed-license list, Hugging Face access token, models allowed to run custom code | Instance Admin | Helm values (+ Kubernetes Secret) |
| Adjust the runtime profile (§6.4) | Instance Admin | Helm values |
| Credit price table; instance default per-user credit limit; quota period; rate limits (§7-G) | Instance Admin | Helm values |
| Per-user credit-limit override; disable a user (revokes all keys) | Instance Admin | Helm values |
| Backup schedule and alert channel | Instance Admin | Helm values |
| **View admission status and evidence; promote a model; set the family default; retry a failed admission; retire a model** | Instance Admin | **Admin page (UI)** |
| View usage and operational health | Instance Admin | Dashboards (read-only) |
| Create and revoke own API keys; view allowed models, usage, remaining credits, connection snippets | User | Portal |

Not in M1: Customer Admin self-service (adding users, policies — M2); users arrive through IdP sign-in (FR-B3.1). The Customer Admin role can already be assigned in M1 (so no re-mapping is needed later), but until M2 it has no capabilities beyond those of a User.

### 6.3 Model lifecycle (admission → retirement)

All managed model changes follow one lifecycle:

```text
Discovered → In verification (license → security → acceptance → benchmark)
  → Verified / Failed → Approved / Declined (rollout decision, evidence attached)
  → Rolling out (canary → pilot → broad) → Generally available
  → Deprecated (traffic → family default) → Retired (EOL)
```

Stage detail:

1. **Intake** — Instance Admin adds a model by Hugging Face identifier/URL and assigns it to a family.
2. **License check** — license extracted from the model card/API and checked against the instance's allowed-license list *before* download.
3. **Security scan** — artifact integrity, weights format, custom-code policy, source authenticity (anti-typosquatting), and capacity checks (weights size vs free cache).
4. **Download & storage** — weights downloaded once into the weights cache (object storage; in-cluster storage option for closed environments), not re-fetched on restarts.
5. **Acceptance tests** — inference works on vLLM with the runtime profile; eval/serve endpoints respond; outputs are sane; basic latency measured; tool availability checked.
6. **Benchmarking** — standard suites (Terminal Bench first; SWE, MMLU, coding next; toward a ~10-suite set) run on an **isolated eval instance**, compared against the incumbent model of the family; results stored as evidence.
7. **Rollout decision** — an admin reviews evidence and promotes the model to production.
8. **Operate & retire** — serve, meter, monitor; on new versions or provider EOL, traffic migrates to the new default; the old model is deprecated then retired; retirement of the previous family version follows defined conditions with reversibility.

**M1 admission and promotion rule:**

- License, security and acceptance failures **block** the model: it becomes *Failed*, cannot be promoted, and can only be re-run (Retry) after its inputs change. The Admin page shows the failing stage and the reason.
- Benchmark results are **recorded as evidence but do not gate** promotion. A failed or missing benchmark run is shown as a warning on the Admin page.
- The Instance Admin **promotes** a *Verified* model **manually on the Admin page**. Promotion deploys it to the production engines and makes it available to the tenants whose settings allow the model or its family. Promotion needs free GPU capacity for the model under the runtime profile; if capacity is missing, the Admin page shows the shortfall and the admin must retire or stop another model first.
- The Instance Admin sets the family default on the same page, at promotion or later. The first model promoted into a family becomes its default automatically.
- No automatic thresholds and no staged rollout in M1: switching the family default switches all of the family's new requests. Thresholds and staged rollout arrive with FR-C8 (M2).

### 6.4 Runtime profile

vLLM is the only inference runtime in the first phases. A **runtime profile** holds the engine settings used to serve models. TF ships **exactly one default runtime profile** with its distribution (sources and installer); the Instance Admin may adjust it in the instance configuration. All models of an instance are served with this one profile. Changes apply when a model is next (re)deployed.

Model-specific keys (marked ◆) may be overridden per model in the model's catalog entry, because model families need different parsers and templates (FR-C13; confirm — OQ-19). Multiple named profiles come with alternative runtimes (FR-C10).

| Parameter | Meaning | Default value |
|---|---|---|
| Engine | Inference runtime | vLLM |
| Engine version / image | Pinned vLLM release; must support per-request cache salting (FR-B7.2) | `<vLLM vX.Y.Z>` TODO(ML_LEAD) |
| GPU type | Accelerator the profile targets | `<GPU model, X GB>` TODO(DEVOPS) |
| GPUs per replica (tensor parallel size) | GPUs one model replica uses | `<N>` TODO(ML_LEAD) |
| Pipeline parallel size | Nodes one replica spans | `<N>` TODO(ML_LEAD) |
| Replicas per model | Engine replicas behind the router | `<N>` TODO(DEVOPS) |
| Max context length ◆ | Longest prompt + output accepted | `<N tokens>` TODO(ML_LEAD) |
| Max output tokens per request | Cap applied when the request asks for more or sets none | `<N tokens>` TODO(ARCHITECT) |
| GPU memory utilization | Share of GPU memory the engine may use | `<0.xx>` TODO(DEVOPS) |
| Weights dtype / quantization ◆ | Precision served | `<auto / bf16 / fp8 / …>` TODO(ML_LEAD) |
| KV-cache dtype | KV-cache precision | `<auto / fp8>` TODO(ML_LEAD) |
| Prefix caching | Reuse of cached prompt prefixes (reported as cached input tokens), isolated per tenant (FR-B7.2) | On |
| Max concurrent sequences | Sequences batched per replica | `<N>` TODO(DEVOPS) |
| Tool-call parser ◆ | Parser that turns model output into tool calls | `<parser>` TODO(ML_LEAD) |
| Reasoning parser ◆ | Parser that separates reasoning content | `<parser or none>` TODO(ML_LEAD) |
| Chat template ◆ | Prompt template | `<model default>` TODO(ML_LEAD) |
| Trust remote code ◆ | Allow a model repository to run custom code; only for models the admission policy allows (FR-D2.2) | Off — confirm TODO(SECURITY) |
| Usage details | Report cached prompt tokens in usage | On |
| Readiness timeout | Time allowed for a model to load before it is marked failed | `<N min>` TODO(DEVOPS) |
| CPU-mode settings | Settings used without GPUs (CPU-only bootstrap, CI) | `<…>` TODO(DEVOPS) |
| Extra engine arguments / environment | Anything not covered above | `<…>` TODO(ML_LEAD) |

### 6.5 Identity for the flagship instance — Constructor Fabric Pass

Constructor Fabric Pass (`pass.cfabric.org`) is where community members register. Today it accepts GitHub accounts only. Pass admins approve users and assign them roles and permissions. **The flagship instance (Constructor Fabric TF) uses Pass as its default IdP** (D-17).

Pass does not yet expose a standard IdP interface. As part of this project Pass is extended to act as a standard **OpenID Connect provider** and to accept Google, Microsoft and Apple sign-up (§7-L). TF connects to Pass like to any OIDC IdP (FR-B1.1) and contains no Pass-specific code. Other instances (e.g., Constructor Tech) use their own corporate OIDC IdP the same way.

How it works on the flagship:

1. A person registers in Pass with GitHub, Google, Microsoft or Apple. A Pass admin approves them and assigns Pass roles. Approval is how students and other users get *qualified* access.
2. At first sign-in to the TF Portal, TF creates the user (FR-B3.1) and takes the tenant and TF role from the Pass `roles` claim through the mapping in the instance configuration (FR-B10). Mapping rules are evaluated in order and the first match wins, so every user lands in exactly one tenant. Students and contributors are separate tenants (FR-B7). Example mapping (role names `<…>` TODO(PASS_OWNER, PRODUCT_OWNER)):

   | Pass role | Effect in TF |
   |---|---|
   | `tf:instance-admin` | Instance Admin. |
   | `tf:tenant-admin:<name>` | Customer Admin of tenant `<name>`. |
   | `tf:tenant:contributors` | Member of tenant `contributors`. |
   | `tf:tenant:students` | Member of tenant `students`. |
   | `tf:tenant:vendor` | Member of tenant `vendor` (the Vendor's own teams). |
   | none of the above | Sign-in refused with a message naming the instance contact. |

3. When a Pass admin blocks a user or removes their TF roles, Pass notifies TF (PASS-6.1); TF disables the user and all of their keys within 1 minute (FR-B11).
4. API keys are validated by TF itself. If Pass is unavailable, inference keeps working; Portal sign-in is affected, and admins use the break-glass account (FR-B12).

### 6.6 Deployment topologies

| Topology | Description | Phase |
|---|---|---|
| **Internal use** | One organization; corporate IdP default; tenants = departments; portal optional. | M1 |
| **External use** | Provider serves outside customers; social IdP default; portal registration; custom domain; per-customer plans. | M1 (basic: flagship with Pass and basic tenant isolation) → M2 (full) |
| **Hybrid (self-hosted + commercial providers)** | External commercial models (Anthropic, OpenAI, OpenRouter overflow) registered as adapter-backed models in the same catalog and gateway. | M3 |
| **Managed multi-tenant SaaS** | Vendor-operated instance serving many organizations. | Decision in M4 window |

### 6.7 Deployment profiles and prerequisites

**What TF installs.** TF is installed with Helm into an existing Kubernetes cluster that meets the prerequisites below. For the reference layout only, TF also provides a cluster bootstrap that turns bare VMs into the reference cluster; it is used by nightly CI and by NFR-1 (D-23; confirm TODO(ARCHITECT)).

**Deployment profiles:**

| Profile | Nodes | Per-node size (vCPU / RAM / disk) | GPU nodes | HA | Use |
|---|---|---|---|---|---|
| Dev | 1 | `<…>` TODO(DEVOPS) | 0–1 | No | Evaluation, development, CI with the CPU test model |
| Standard (reference) | 5: 3 control-plane + 2 workers | `<…>` TODO(DEVOPS) | `<N>` TODO(DEVOPS) | Control plane yes | Flagship, partners, nightly CI |
| HA | `<N>` TODO(ARCHITECT) | `<…>` TODO(DEVOPS) | `<N>` | Full, `<multi-zone or not>` TODO(ARCHITECT) | Large production instances (M2+) |

**Cluster prerequisites** (checked by the installer, FR-A12):

| Prerequisite | Requirement |
|---|---|
| Kubernetes version | `<≥ 1.xx, ≤ 1.yy>` TODO(DEVOPS) |
| Networking | CNI with NetworkPolicy support |
| Storage | Default StorageClass for databases (`<X GB>` TODO(DEVOPS)); storage for the weights cache — object storage or read-write-many volume (`<X TB>` TODO(DEVOPS)) |
| Ingress | Ingress controller or LoadBalancer service; DNS names for Portal, API and Admin page |
| TLS | Certificates from ACME (cert-manager) or provided by the admin |
| Backup target | Object storage or file share outside the cluster for configuration backups (FR-A7.1), `<X GB>` TODO(DEVOPS) |
| Outbound access | Container registry, Hugging Face, IdP — directly or through an HTTP(S) proxy (FR-A11); none from M3 with offline import (FR-A8) |
| GPU | NVIDIA GPUs supported by the pinned vLLM version (NFR-19); drivers installed by the bundled GPU operator unless already present |

**Support tiers:**

| Tier | Meaning | Platforms |
|---|---|---|
| 1 — CI-tested | Installed and smoke-tested every night | Standard profile on `<VM platform>` TODO(DEVOPS) |
| 2 — Validated | Installed and smoke-tested at least once per milestone | Rancher/RKE, GKE, Virtuozzo Kubernetes (cloud and bare metal), kubeadm, k3s (FR-A2.3) |
| 3 — Best effort | Any conformant cluster meeting the prerequisites | — |

---

## 7. Functional requirements

Columns: **M** milestone, **P** priority, **AC** acceptance criteria, **V** verification (§0).

### A. Distribution, installation & instance lifecycle

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-A1.1 | TF source code is available from a GitHub repository with build and install instructions, under the terms of §11. | M1 | Must | A clean checkout builds all TF images and charts with the documented commands. | T |
| FR-A1.2 | Packaged distributions (Helm chart repository, OCI images) are published for every release. | M3 | Must | — | — |
| FR-A2.1 | The installer installs TF onto the Standard profile (§6.7), including the reference cluster bootstrap from bare VMs. | M1 | Must | Nightly install on clean reference VMs completes and its smoke tests pass (FR-I5.1). | T |
| FR-A2.2 | The installer installs TF onto the Dev profile (single node). | M1 | Should | Install on one node completes; smoke tests pass; HA is not required. | T |
| FR-A2.3 | The installer works on the Tier 2 platforms (§6.7). | M1 | Should | Install + smoke tests pass at least once on each Tier 2 platform before the milestone; results recorded in the support matrix. | T |
| FR-A3 | **CPU-only bootstrap**: all components start and see each other without GPUs; the NVIDIA GPU operator ships in the distribution so GPU support activates when GPU hardware appears. | M1 | Must | On a cluster without GPUs, install completes, all TF pods are Ready and the smoke tests pass using the CPU test model; adding a GPU node later needs no reinstall. | T |
| FR-A4 | **Reproducible installs**: nightly automated install-from-scratch on clean VMs with pass/fail reporting. | M1 | Must | A nightly job installs from scratch, runs smoke tests and publishes pass/fail; history kept ≥ 30 days. | I |
| FR-A5 | All supporting services deploy with the instance — relational database (highly available in multi-node profiles), cache, messaging, usage analytics store, metrics and logs, object storage / weights cache; no external managed service is required. | M1 | Must | Install succeeds with no external managed service; in the Standard profile, losing any one node does not lose data or stop the control plane. | T |
| FR-A6.1 | Manual update to a newer TF version by a documented procedure. | M1 | Must | Upgrading from the previous release keeps tenants, catalog, keys and usage; downtime ≤ `<N min>` TODO(ARCHITECT). | T |
| FR-A6.2 | **Automatic updates** (opt-in per instance) with scripted rollback. | M2 | Should | With auto-update on, the instance upgrades without manual steps; the rollback script restores the previous release with data intact. | T |
| FR-A6.3 | **Versioning and upgrade path**: releases follow `<versioning scheme>` TODO(ARCHITECT); an upgrade is supported from the previous release; database migrations run automatically and only forward; downgrade means restoring a backup (FR-A7). | M1 | Must | Release notes state the version and supported upgrade source; an upgrade test runs for every release (FR-I5.2). | I |
| FR-A7.1 | **Configuration backup**: daily backup of the configuration database (tenants, users, keys, catalog, admission evidence, quota counters) to storage outside the cluster; retention `<N days>` TODO(DEVOPS); documented restore. | M1 | Must | Restoring the latest backup into a clean cluster brings back tenants, users, keys and the catalog; a failed backup raises an alert (FR-H3.2). | T |
| FR-A7.2 | **Full backup and restore**, including usage history. | M2 | Must | Restoring a backup into a clean cluster reproduces tenants, catalog, policies, keys and usage history by the documented procedure. | T |
| FR-A8.1 | **Air-gapped operation**: the instance runs with outbound internet blocked; no mandatory outbound connection to any vendor control plane. | M3 | Must | — | — |
| FR-A8.2 | Offline import of model weights. | M3 | Must | — | — |
| FR-A8.3 | Offline update bundles and installation from a private image registry mirror. | M3 | Must | — | — |
| FR-A9.1 | Instance modes: *internal* and *external* configuration profiles. | M1 | Must | Setting the mode in the instance configuration applies the documented profile defaults. | T |
| FR-A9.2 | The TF Customer Portal can be enabled/disabled per instance. | M1 | Must | With the Portal disabled, its URL is not served; enabling it makes it reachable after `helm upgrade`. | T |
| FR-A9.3 | The Inference API can be enabled/disabled per instance. | M1 | Must | With the API disabled, every inference request is refused for all keys; enabling restores service. | T |
| FR-A10 | Custom domain for the Portal and the Inference API endpoint. | M2 | Should | Portal and API are served on admin-configured domains with valid TLS certificates. | T |
| FR-A11 | Outbound HTTP(S) proxy support for all downloads (images, model weights, IdP calls). | M1 | Should | With direct egress blocked and a proxy configured, install and model admission succeed. | T |
| FR-A12 | **Prerequisite check**: the installer verifies the cluster prerequisites (§6.7) before installing and stops with a clear message naming each missing one. | M1 | Must | On a cluster missing a StorageClass, ingress or the required Kubernetes version, the installer stops before changing anything and names the gap. | T |

### B. Identity, tenants & access

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-B1.1 | **Default IdP per instance** through standard OpenID Connect, configured in the instance configuration. | M1 | Must | Portal and Admin page sign-in work with Constructor Fabric Pass on the flagship and with the corporate OIDC IdP on the Constructor Tech instance. | T |
| FR-B1.2 | A bundled IdP allows fully standalone operation without an external IdP; it offers GitHub sign-in, so it can serve as the flagship's fallback IdP (R-9). | M1 | Must | A fresh install with no external IdP configured lets an admin and a user sign in through the bundled IdP, including with a GitHub account. | T |
| FR-B1.3 | SAML IdPs, including Active Directory, as default IdP. | M2 | Should | Sign-in works with a SAML test IdP and with AD. | T |
| FR-B1.4 | Social IdP as default in external mode. | M2 | Should | Sign-in with at least Google and GitHub works on an external-mode instance. | T |
| FR-B2.1 | Tenants (TF Customers) are created and renamed by the Instance Admin in the instance configuration. | M1 | Must | A tenant added to the configuration exists within 1 minute after `helm upgrade`; users mapped to it can sign in. | T |
| FR-B2.2 | Tenants can be created via the Management API. | M2 | Must | A tenant created by an API call is usable at once; the call is audited. | T |
| FR-B2.3 | Tenants can be created via MCP, driven by AI tools. | M3 | Must | — | — |
| FR-B2.4 | **Suspend a tenant** in the instance configuration: all of its users' keys are refused; its data is kept. | M1 | Should | Within 1 minute of `helm upgrade` every key of the tenant is refused; un-suspending restores access. | T |
| FR-B2.5 | **Delete a tenant** with all of its data after a grace period of `<N days>` TODO(PRODUCT_OWNER, LEGAL). | M2 | Must | After the grace period, no personal data of the tenant remains; usage records are anonymized (NFR-18). | T |
| FR-B3.1 | **Just-in-time provisioning**: a user approved in the IdP and mapped to a tenant gets a TF account at first sign-in. | M1 | Must | A mapped user signs in and lands in the right tenant with the right role; a user with no mapping is refused with a message naming the instance contact. | T |
| FR-B3.2 | Customer Admins add users manually. | M2 | Must | A user added by a Customer Admin can sign in and belongs to that tenant only. | T |
| FR-B3.3 | **Directory auto-registration** with joiner/mover/leaver sync. | M2 | Must | At the next sync a joiner appears, a mover changes tenant, and a leaver loses access and keys. | T |
| FR-B3.4 | Disabling a user in the instance configuration blocks the user and all of the user's keys. | M1 | Must | After `helm upgrade`, the user's keys are refused within 1 minute. | T |
| FR-B3.5 | **Delete a user** and their personal data on request; their usage records are anonymized and kept per NFR-18. | M2 | Must | After deletion the user's name, e-mail and keys are gone; usage totals per tenant are unchanged. | T |
| FR-B4 | Instance Admin can **lock the IdP list** so tenants cannot redefine it (internal-mode default). | M2 | Should | With the lock on, a Customer Admin cannot add or change an IdP. | T |
| FR-B5 | A tenant can connect **its own IdP** for its users where the instance allows it. | M2 | Should | Users of that tenant sign in through the tenant's IdP and land in that tenant only. | T |
| FR-B6.1 | RBAC with three roles: Instance Admin, Customer Admin (tenant admin), User — per the permission matrix `<roles × actions>` TODO(PRODUCT_OWNER, ARCHITECT). | M1 | Must | Each role's allowed actions follow the matrix; denied actions are refused in tests. | T |
| FR-B6.2 | Granular permissions under the roles, so narrower roles (auditor, budget manager) can be split out without redesign. | M2 | Must | A narrower role is defined by configuration only, with no code change. | T |
| FR-B7.1 | **Tenant data isolation**: users, keys, usage and reports of one tenant are invisible to and unaffectable by another tenant's users and admins through the Portal, Admin page and APIs. | M1 | Must | An automated test shows that tenant A's users and Customer Admins cannot see or change tenant B's objects. | T |
| FR-B7.2 | **Tenant inference-cache isolation**: cached prompt prefixes are never reused across tenants. The gateway sets a secret per-tenant cache salt on every request and discards any salt supplied by the client. | M1 | Must | The same long prompt sent by tenant A and then by tenant B reports 0 cached input tokens for B, and more than 0 for a second request from A; a client-supplied salt does not change the result. | T |
| FR-B7.3 | **Tenant capacity isolation**: per-tenant concurrency caps (FR-G8.2) ensure one tenant cannot use up the engines of a shared model. | M1 | Must | With tenant A sending load at its cap, tenant B's error rate and latency stay within `<X%>` TODO(ARCHITECT) of a no-load baseline; A's excess requests are refused with the rate-limit error. | T |
| FR-B7.4 | **Strict tenant isolation**, including per-tenant secrets and a dedicated data-plane tier (NFR-4.2). | M2 | Must | See NFR-4.2. | T |
| FR-B8.1 | API keys: users generate keys with an optional expiry date; a key is shown only once at creation. | M1 | Must | Later views show only a key prefix; an expired key is refused. | T |
| FR-B8.2 | A user's key revocation takes effect within 1 minute. | M1 | Must | A revoked key is refused within 60 s. | T |
| FR-B8.3 | **Key format and storage**: keys carry a recognizable prefix `<prefix>` TODO(SECURITY) for secret scanners and are stored only as hashes; at most `<N>` active keys per user; maximum expiry `<N days>`, default `<N days>` TODO(SECURITY, PRODUCT_OWNER). | M1 | Must | Inspection finds no plain key in storage or logs; creating a key over the limit or with a longer expiry is refused. | T |
| FR-B8.4 | **Service keys** owned by a tenant for applications and CI, managed by Customer Admins and metered to the tenant. | M2 | Must | A service key works without a personal user; its usage appears under the tenant. | T |
| FR-B9 | Organization hierarchy (Platform → Tenant → Team → Project → User) with policy inheritance, per-node delegation, lock and override. | M3 | Must | — | — |
| FR-B10 | **Claims mapping**: tenant membership and TF role are derived from IdP claims (e.g., `roles` or `groups`) through ordered rules in the instance configuration; the first matching rule wins. A rule can also match a user's subject or e-mail, so a list of rules works as an allowlist when the IdP provides no roles (e.g., the bundled IdP). | M1 | Must | Changing a user's IdP role changes their TF tenant/role at next sign-in; a tenant change revokes the user's existing keys and keeps past usage under the old tenant; a user whose claims match no rule is refused. | T |
| FR-B11.1 | **Deprovisioning webhook**: TF accepts a signed IdP notification that a user was blocked, deleted or lost access, and disables the user and all keys. | M1 | Must | A signed notification makes the user's keys refused within 60 s; an unsigned or wrongly signed notification is rejected and logged. | T |
| FR-B11.2 | **SCIM 2.0** endpoint for provisioning and deprovisioning users and groups. | M2 | Should | A SCIM client creates, updates and deactivates users; deactivation blocks keys within 60 s. | T |
| FR-B12 | **Break-glass admin**: a local Instance Admin account, with credentials in a Kubernetes Secret created at install, can sign in to the Admin page when the IdP is unavailable; every use is logged and raises an alert. | M1 | Must | With the IdP unreachable, the break-glass account signs in and promotes a model; the use appears in logs and alerts. | T |
| FR-B13 | **Admin bootstrap**: users listed as Instance Admins in the instance configuration (by IdP subject or e-mail) get the role at first sign-in, in addition to the claims mapping. | M1 | Must | A fresh install with one listed admin lets that person sign in to the Admin page. | T |

### C. Model catalog & lifecycle management

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-C1 | **Families (aliases)**: families are declared in the instance configuration; every family has a default model; requests naming the family resolve to the default if the user's tenant allows it, and are refused with the policy error otherwise. | M1 | Must | A request with the family name as `model` is served by the family's current default; for a tenant not allowed that default it is refused (403). | T |
| FR-C2.1 | **Add a model** to a family by Hugging Face ID or URL in the instance configuration; the admission pipeline (§6.3) then runs without manual steps. | M1 | Must | After `helm upgrade`, admission starts and its stage-by-stage status appears on the Admin page. | T |
| FR-C2.2 | A promoted model is deployed to the inference nodes and exposed **only** to tenants whose settings allow the model or its family (FR-G2.1; plans from M2). | M1 | Must | After promotion a user of an allowed tenant is served; a user of another tenant is refused (policy error, §7-G). | T |
| FR-C2.3 | Model sources other than Hugging Face. | Later | Should | — | — |
| FR-C3 | **Default model management**: the Instance Admin sets or changes a family's default on the Admin page; the new default must be Ready before the switch; changing the default is the primary rollout lever for upgrades. | M1 | Must | New requests for the family go to the new default within 1 minute; requests already running finish on the old model; a default that is not Ready cannot be selected. | T |
| FR-C4.1 | **Retire a model** on the Admin page: it is removed from the engines and no longer inferenced; requests naming it are served by the family default if the tenant allows it, otherwise refused. | M1 | Should | After retirement, a request naming the model is served by the family default (response names the model that answered, FR-E10); the model's engines are gone. | T |
| FR-C4.2 | Retirement with a deprecation notice and an EOL date; migration completes before any announced retirement. | M2 | Must | Users of a deprecated model are notified before the EOL date; no request fails because of the retirement. | T |
| FR-C5.1 | **Weights cache**: weights are downloaded once, stored (object storage; in-cluster option for closed environments) and kept across restarts. | M1 | Must | Restarting or rescheduling an engine does not download the weights again. | T |
| FR-C5.2 | Configurable retention policy for the weights cache. | M2 | Should | Weights of models retired longer than the configured period are deleted; weights in use never are. | T |
| FR-C6.1 | **Minimal model metadata**: version, license, max context length, tool-calling and streaming support. | M1 | Must | The metadata is stored per model and shown on the Admin page. | I |
| FR-C6.2 | **Full model metadata**: adds modalities, structured output, and credit prices per token class (§7-G). | M2 | Must | All fields are stored per model version and returned by the Management API. | I |
| FR-C7 | Users see the list of models/families **they are allowed to use**, matching exactly what the gateway will accept. | M1 | Must | For users of two tenants with different settings, the Portal list and the API model list equal the set the gateway accepts. | T |
| FR-C8.1 | **Rollout decision point**: the admin selects relevant benchmarks and thresholds, reviews the evidence report and promotes "to production"; basic staged rollout with traffic split and live-metric comparison; one-action rollback. | M2 | Must | A candidate below a selected threshold cannot be promoted without an override; a 10/90 split routes about 10% of requests to the candidate; rollback restores the previous default within 1 minute. | T |
| FR-C8.2 | Rollout rings (canary → pilot → broad) and a compliance view of who runs which version. | M3 | Must | — | — |
| FR-C9 | **Forced retirement migration**: a provider-announced EOL automatically produces a migration plan (candidate replacements, benchmark evidence, rollout schedule completing before the retirement date). | M3 | Must | — | — |
| FR-C10 | **Alternative runtimes**: specialized engines and quantizations integrate as adapters with their own runtime profiles; a changed quantization or runtime counts as a new model version and re-enters verification. | M3 | Should | — | — |
| FR-C11 | **Dynamic catalog**: models and families are added and removed at runtime; model lists replicate/inherit down the tenant hierarchy; the gateway's view is updated by events, without re-fetch storms. | M2 | Must | A model added or revoked at runtime is accepted or refused within 1 minute, with no gateway restart. | T |
| FR-C12 | **Runtime profile**: TF ships one default vLLM runtime profile (§6.4); the Instance Admin adjusts it in the instance configuration; all models of the instance are served with it. | M1 | Must | A changed profile parameter is applied to a model's engines at its next deployment and is visible in the engine's effective settings. | T |
| FR-C13 | **Per-model overrides** of the model-specific runtime-profile keys (◆ in §6.4) in the model's catalog entry (confirm — OQ-19). | M1 | Must | Two families needing different tool-call parsers are both served correctly on one instance. | T |
| FR-C14 | **Capacity check at promotion**: promotion and default switches need free GPU capacity for the model under the runtime profile; the Admin page shows required vs free GPUs. | M1 | Must | With too few free GPUs, promotion is refused and the shortfall is shown; after retiring another model it succeeds. | T |
| FR-C15 | **Bring-your-own endpoint**: register an existing OpenAI-compatible inference endpoint (outside the cluster) as a catalog model; it passes acceptance tests but no download or security scan. Milestone: `<M2 / M3 / out of scope>` TODO(PRODUCT_OWNER). | M3 | Should | — | — |
| FR-C16 | **Dedicated per-customer deployments**: a model deployed only for one tenant on reserved GPUs. (A model visible to one tenant only is already possible through tenant settings, FR-G2.1.) Milestone: `<…>` TODO(PRODUCT_OWNER). | Later | Could | — | — |

### D. Model verification & benchmarking (ML workers)

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-D1 | **License scanner**: extracts the license from the model card/API **before** download and checks it against the allowed-license list; default list `<licenses>` TODO(LEGAL, PRODUCT_OWNER). | M1 | Must | A model whose license is not on the list becomes *Failed* before any weights are downloaded; the license found is recorded. | T |
| FR-D2.1 | **Security scanner (basic)**: artifact integrity, presence of actual weights, source authenticity (typosquat protection on source URLs). | M1 | Must | Test fixtures — a typosquatted repository name, a repository without weights, a hash mismatch — each end in *Failed*. | T |
| FR-D2.2 | **Weights format and custom-code policy**: only safetensors weights are admitted; a model that needs custom code is refused unless the instance configuration allows that model explicitly (default: refused; confirm TODO(SECURITY)). | M1 | Must | A pickle-only repository and an unlisted custom-code model each end in *Failed*; a listed custom-code model passes this stage. | T |
| FR-D3 | **Acceptance tests**: the model loads on vLLM with the runtime profile; eval/serve endpoints respond; outputs to a fixed sanity prompt set are sane (prompt set and pass criteria `<…>` TODO(ML_LEAD)); basic latency measured; tool calling checked. | M1 | Must | A model that fails to load, fails the sanity set or fails the tool-call probe becomes *Failed*; latency is recorded. | T |
| FR-D4.1 | **Terminal Bench** runs on every model version that passes acceptance. | M1 | Must | Terminal Bench results are stored as evidence for every model that reached the benchmark stage. | T |
| FR-D4.2 | The standard benchmark set grows (SWE, MMLU, coding suites) toward a maintained set of ~10 suites mapped to user scenarios (priority: text for software development — code generation, specification generation, Q&A). | M2 | Should | At least two suites beyond Terminal Bench run on every admitted model. | T |
| FR-D5 | **Isolated eval infrastructure**: benchmarks run on a separate eval engine instance with a parallel eval endpoint — never on the production engines. | M1 | Must | Production engine request logs contain no benchmark requests. | T |
| FR-D6.1 | **Basic comparison report**: candidate vs incumbent of the family on the same suites and settings, with the difference shown. | M1 | Should | When the family has an incumbent, the Admin page shows both scores and the difference. | T |
| FR-D6.2 | **Full comparison report**: quality, latency, failure rate and cost per task, stored as evidence attached to the version. | M2 | Must | The report shows all four measures for candidate and incumbent and stays retrievable after promotion. | T |
| FR-D7 | **Custom client benchmarks**: an external client is triggered by the new model's eval endpoint URL, runs its own scripts/datasets autonomously, and publishes the report back via a return URL (defined schema, validation, storage). | M3 | Must | — | — |
| FR-D8 | **Benchmark registry**: suites are versioned and owned; scenarios map to required suites; judge models pinned per suite; scheduled re-runs on production models detect silent drift and alert. | M3 | Must | — | — |
| FR-D9.1 | **Runtime compatibility tracking (manual)**: a maintained list of model versions known to work with the pinned vLLM version, plus known vLLM incidents. | M1 | Should | The list exists, is reviewed weekly, and is checked before a model is added. | I |
| FR-D9.2 | Runtime compatibility tracking tooling fed into admission decisions. | M2 | Should | Admission warns when a model/vLLM combination is known to be incompatible. | T |
| FR-D10 | Benchmark runs are charged to a dedicated budget with a pre-run cost estimate. | M3 | Must | — | — |
| FR-D11 | **Gated models**: a Hugging Face access token stored as a secret in the instance configuration is used for downloads; it never appears in logs or the UI. | M1 | Must | A gated test model downloads with the token configured and fails with a clear reason without it; inspection finds the token in no log. | T |
| FR-D12 | **Capacity checks at admission**: before download, the weights size is checked against free weights-cache space; before acceptance tests, the model is checked to fit the GPUs of the runtime profile (weights plus KV cache for the max context length). | M1 | Must | A model too large for the cache or the GPUs ends in *Failed* at the check, with the sizes shown, before any download or deployment. | T |
| FR-D13.1 | **Admission failure reasons**: the Admin page shows the failing stage, the reason and the stage logs for every *Failed* model. | M1 | Must | Each fixture failure of FR-D1–D3 and FR-D11–D12 shows its stage and reason. | D |
| FR-D13.2 | Admission failures notify the admin (FR-F6). | M2 | Must | A failed admission produces one notification to the configured channel. | T |

### E. Inference service & API

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-E1.1 | **OpenAI-compatible API**: Chat Completions (streaming and non-streaming, tool calling) and the model list. | M1 | Must | The OpenAI SDK passes a conformance set `<list>` TODO(QA) for streaming, non-streaming and tool-call round trips; the model list follows FR-C7. | T |
| FR-E1.2 | **Anthropic-compatible API (minimal)**: Messages (`/v1/messages`) with streaming and tool use; token counting (`/v1/messages/count_tokens`) is optional. | M1 | Must | Claude Code `<version>` TODO(QA) completes a multi-step, tool-using coding task through TF; the Anthropic SDK passes streaming and tool_use/tool_result round trips. | T |
| FR-E1.3 | **Anthropic-compatible API (full)** and per-format documentation of capability losses (e.g., reasoning pass-through, context caching), minimized per format. | M2 | Should | A capability matrix per API format and validated tool is published; every listed loss has a test. | I |
| FR-E2.1 | A request may name a **specific model** or a **family alias** (→ default model). | M1 | Must | Both forms are served; an unknown name is refused with a not-found error. | T |
| FR-E2.2 | A request may ask for **auto-selection**; the model is chosen by intelligent routing (FR-K6). Before M4, `auto` behaves per OQ-16: `<refused / tenant default family>` TODO(PRODUCT_OWNER). | M4 | Must | — | — |
| FR-E3 | Streaming, tool calling and structured output work as supported by the engine and are validated end-to-end for every supported client tool. | M1 | Must | The tool-validation matrix (tools × streaming / tool calls / structured output) is green for both M1 tools. | T |
| FR-E4.1 | Every inference call passes the check chain: authentication → authorization (user/tenant/model) → tenancy → entitlement → rate limits → quota. In M1 the entitlement step always allows the request and only updates entitlement counters (FR-H7.1). | M1 | Must | A test for each failing step returns the error specified for it (§7-G error table); no request is refused by the entitlement step in M1. | T |
| FR-E4.2 | **No bypass**: internal engine endpoints cannot be called without authentication, even from inside the cluster. | M1 | Must | A call to an engine endpoint without credentials from a pod in another namespace is refused. | T |
| FR-E5.1 | **Sticky routing** of a user's repeat requests to the same engine replica, where the router supports it. | M1 | Should | With ≥ 2 replicas, at least `<X%>` TODO(ARCHITECT) of a user's consecutive requests reach the same replica. | T |
| FR-E5.2 | Sticky routing guaranteed for all models with more than one replica. | M2 | Must | Same test as FR-E5.1 with the target met for every multi-replica model. | T |
| FR-E6 | **Concurrency caps** per engine/endpoint; requests over the cap queue or fail over — they never overload the engine. | M2 | Must | A load above the cap produces queued or failed-over requests and no engine out-of-memory or crash. | T |
| FR-E7.1 | Throttling and refusals return **distinct, actionable errors** (authentication vs policy vs rate limit vs quota vs outage) naming who can help (instance contact). | M1 | Must | Each refusal class returns the status, type and message specified in §7-G; messages include the instance contact. | T |
| FR-E7.2 | Near-limit notices reach the user's tool or mail. | M2 | Must | At `<X%>` TODO(PRODUCT_OWNER) of the limit the user is notified once per period. | T |
| FR-E8 | **Fallback**: configurable per family/model — re-route to an alternative (including an external model, once FR-K1 exists) on outage, quota exhaustion or capacity shortage; automatic switching on unexpected failure is optional and configurable; with no safe fallback a controlled error is returned and an incident recorded. | M2 | Must | With the primary engine stopped, requests are served by the configured fallback; with fallback disabled they get the outage error; each case is logged. | T |
| FR-E9 | **File storage** for user attachments (images, Markdown, PDF) and model-generated files, re-usable across requests; provider-returned links replaced by own-storage links; long asynchronous tasks survive service restarts. RAG/vector stores explicitly out of scope. | M3 | Must | — | — |
| FR-E10 | Responses identify the model version that actually answered (alias transparency), including for family requests and retired-model redirects. | M1 | Must | The response's model field equals the version that served the request, in both API formats. | T |
| FR-E11 | **API versioning and deprecation**: the Inference API is versioned in its path (`/v1`); breaking changes only come with a new version; a deprecated version keeps working for at least `<N months>` TODO(PRODUCT_OWNER) after the notice. | M1 | Must | The API reference states the version and the deprecation policy. | I |
| FR-E12 | **Request limits**: maximum request body `<X MB>`, maximum request duration `<N s>` for non-streaming and `<N min>` for streaming requests, idle-stream timeout `<N s>` TODO(ARCHITECT); exceeded limits return documented errors. | M1 | Must | A request over each limit returns its documented error. | T |
| FR-E13 | **Supported endpoints in M1**: Chat Completions, model list, Messages (and optionally token counting). Not supported in M1: embeddings, legacy Completions, Responses API, images, audio, batch, files — target milestones `<…>` TODO(PRODUCT_OWNER). Unsupported endpoints return 404 with a clear message. | M1 | Must | Each unsupported endpoint returns 404 with the documented message. | T |

### F. Portals & self-service

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-F1.1 | **TF Customer Portal (minimal)**: sign in, create and revoke API keys with expiry, view allowed models/families, view usage and remaining credits for the current period, find the support channel. | M1 | Must | A new user completes scenario S-03 using only the Portal and a snippet. | D |
| FR-F1.2 | **Portal (full)**: Customer Admin functions — tenant users, policies, service keys, tenant usage per user. | M2 | Must | A Customer Admin adds a user, sets a policy and sees per-user usage of their tenant only. | T |
| FR-F2 | **Connection snippets and instructions** for ≥ 2 tools validated end-to-end: Claude Code (Anthropic-compatible endpoint) and `<one OpenAI-compatible tool>` TODO(PRODUCT_OWNER) (OQ-1). A copied snippet or one command per tool; no secret beyond the user's own TF key reaches the user's machine. The Claude Code snippet maps both its main model and its background (small, fast) model to TF families the user's tenant allows. | M1 | Must | A new user goes from key to first successful inference in < 15 minutes with each tool; a Claude Code session sends no request for a model TF does not serve. | D |
| FR-F3 | Usage freshness: usage reports current within 5 minutes. | M2 | Must | A request appears in the user's usage report within 5 minutes. | T |
| FR-F4.1 | **Admin page** (M1, the only administration UI page): models with admission stage status, failure reasons and evidence; GPU capacity needed vs free; actions Promote, Set as family default, Retry, Retire (§6.3). | M1 | Must | The Instance Admin performs every action of scenario S-02 after intake on this page. | D |
| FR-F4.2 | **Admin Console**: tenants & plans, policies, usage reports, operational health. | M2 | Must | Each listed function is available in the UI and audited. | D |
| FR-F5.1 | **Management API** so administration — tenant creation, catalog operations, plan changes — can be driven by scripts. | M2 | Must | Every Admin Console action has an API equivalent, documented with examples. | T |
| FR-F5.2 | **MCP interface** for administration by AI tools. | M3 | Must | — | — |
| FR-F6 | Notifications to admins and users by e-mail (SMTP settings in the instance configuration) and webhook: new TF versions, new promising models from the vendor, admission failures, near-limit warnings, fallback/switch notices. | M2 | Should | Each notification type is delivered to the configured channel in a test. | T |

### G. Plans, credits, quotas, rate limits & budgets

#### G.0 Metering, quota and rate-limit specification (M1)

Proposed minimal model; confirm with OQ-17. Options considered and industry practice are in Appendix B. The gateway must implement this specification exactly; where the off-the-shelf router cannot, a gateway extension is built. Router capability check: `<result>` TODO(ARCHITECT) by 2026-11-10.

1. **Token classes** (counted per request from engine-reported usage):
   - **uncached input** — prompt tokens not served from the prefix cache;
   - **cached input** — prompt tokens served from the prefix cache (OpenAI: `prompt_tokens_details.cached_tokens`; Anthropic: `cache_read_input_tokens`);
   - **output** — generated tokens, including reasoning tokens;
   - **cache write** — Anthropic-style cache-creation tokens; always 0 on vLLM, kept for commercial providers (FR-K1).
2. **Unit — credits.** Credits = Σ (tokens of a class ÷ 1M × credit price of the class). M1: one instance-wide price table in the instance configuration, the same for all models: uncached input `<a>`, cached input `<b>`, output `<c>`, cache write `<d>` credits per 1M tokens TODO(PRODUCT_OWNER). M2: per-model prices (FR-G1.3).
3. **Scope.** M1: per user, across all of the user's keys. The limit comes from the user's override, else the tenant default, else the instance default `<N credits>` TODO(PRODUCT_OWNER). M2 adds per-tenant limits and plans.
4. **Period.** Calendar periods in **UTC**: day (00:00 UTC), week (Monday 00:00 UTC) or month (1st, 00:00 UTC). M1: one period for the whole instance, default `<month>` TODO(PRODUCT_OWNER). Counters reset at the boundary; unused credits do not roll over.
5. **Enforcement — check-then-charge.** Before forwarding a request, the gateway compares the user's credits consumed in the current period with the limit. If consumed ≥ limit, the request is refused. Otherwise it is forwarded, and its actual cost is added to the user's counter when it completes. There is no up-front reservation in M1.
6. **Tolerance.** A user can exceed the limit only by the cost of requests that were already running when the limit was reached: at most the per-user concurrency limit (item 10) × the per-request output cap of the runtime profile.
7. **Mid-stream behaviour.** A request that passed the check runs to completion and is charged in full, even if it crosses the limit; streams are never cut for quota. If the client disconnects or cancels, generation is stopped and the input plus the output tokens generated so far are charged. A request that fails before producing output is not charged. For streamed requests the gateway always obtains the final usage from the engine.
8. **Visibility.** The enforcement counter is updated when each request completes and applies to the user's next request. The Portal shows remaining credits from the enforcement counter, so it is current after every completed request. Usage reports and dashboards lag by at most 1 hour in M1 and 5 minutes in M2 (FR-F3).
9. **Errors.** Quota refusals are **not retryable**; rate-limit refusals are. Every inference response carries the user's credit state.

   | Condition | OpenAI-compatible API | Anthropic-compatible API |
   |---|---|---|
   | Credits for the period exhausted | `402`, `error.type: "insufficient_quota"`, `error.code: "quota_exceeded"` | `402`, `error.type: "billing_error"` |
   | Rate limit exceeded (item 10) | `429`, `error.type: "rate_limit_error"`, `retry-after` in seconds | `429`, `error.type: "rate_limit_error"`, `retry-after` in seconds |
   | Model not allowed for the user's tenant | `403`, `error.type: "permission_error"` | `403`, `error.type: "permission_error"` |
   | Missing, invalid, expired or revoked key; suspended user or tenant | `401`, `error.type: "authentication_error"` | `401`, `error.type: "authentication_error"` |
   | Unknown model or family; unsupported endpoint | `404`, `error.code: "model_not_found"` | `404`, `error.type: "not_found_error"` |
   | No healthy engine for the model | `503` | `529`, `error.type: "overloaded_error"` |

   - Quota refusals also carry `x-should-retry: false`, so clients such as Claude Code show the error at once instead of retrying.
   - Rate-limit refusals carry `retry-after` ≤ 60 s, so clients retry automatically.
   - The message states the limit, the amount consumed, the reset time (ISO 8601, UTC) and the instance contact.
   - Every inference response carries `x-tf-credits-limit`, `x-tf-credits-remaining` and `x-tf-credits-reset`.
10. **Rate limits (M1).** Concurrent requests per user `<N>`; concurrent requests per tenant `<N>` per tenant (set in tenant settings); requests per minute per key `<N>` TODO(PRODUCT_OWNER, ARCHITECT). For each model, the sum of the caps of the tenants allowed to use it should not exceed the model's engine capacity (replicas × max concurrent sequences); the installer warns when the configuration exceeds it. Token-per-minute limits arrive in M2 (FR-G8.4).

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-G1.1 | **Metering of token classes** per request as defined in G.0. | M1 | Must | For fixture requests with and without prefix-cache hits, recorded uncached, cached and output tokens equal the engine-reported usage. | T |
| FR-G1.2 | **Credits** computed from token classes with one instance-wide price table set in the instance configuration. | M1 | Must | For fixture requests, credits charged equal Σ tokens × class price. | T |
| FR-G1.3 | Per-model credit prices per token class. | M2 | Must | Two models with different prices are charged accordingly for identical usage. | T |
| FR-G2.1 | **Tenant settings** in the instance configuration: allowed families/models, default per-user credit limit, per-tenant concurrency cap; plus per-user credit-limit overrides. | M1 | Must | A student and a contributor see and can use only their tenants' allowed models; each is limited by override, else tenant default, else instance default. | T |
| FR-G2.2 | **Plans** per TF Customer: allowed model set, default policy, per-tenant credit limit per period, and overuse limits (allowed spend beyond exhausted credits). | M2 | Must | A tenant on a plan is refused models outside the plan; overuse beyond the plan's allowance is refused. | T |
| FR-G3 | **Policies**: Customer Admins allow/disallow specific models/families per user, within plan bounds. | M2 | Must | A policy change applies to the user's requests within 1 minute. | T |
| FR-G4.1 | **Per-user quota enforcement** at the gateway on every request, per G.0. | M1 | Must | Fixture scenario: requests are served until the limit, then refused with the specified error; overshoot stays within the G.0 tolerance; the counter resets at the period boundary. | T |
| FR-G4.2 | Per-tenant quota enforcement. | M2 | Must | Same scenario as FR-G4.1 at tenant level. | T |
| FR-G5 | **Soft and hard limits**: soft-limit alerts to user and admin; the hard limit blocks or downgrades to the authorized fallback. | M2 | Must | Crossing the soft limit alerts once; crossing the hard limit blocks or falls back as configured. | T |
| FR-G6 | **Temporary overrides** with reason and expiry, recorded in the audit log; they lapse automatically. | M3 | Must | — | — |
| FR-G7 | **Money budgets** (organization/team/project/user; daily/weekly/monthly/custom periods; child ≤ parent) once credit prices carry currency values; chargeback/showback reporting. | M3 | Must | — | — |
| FR-G8.1 | **Per-user concurrency limit** per G.0 item 10. | M1 | Must | Requests beyond the limit get the rate-limit error with `retry-after`; others are served. | T |
| FR-G8.2 | **Per-tenant concurrency cap** per G.0 item 10. | M1 | Must | See FR-B7.3. | T |
| FR-G8.3 | **Requests per minute per key** per G.0 item 10. | M1 | Should | Requests beyond the limit in a minute get the rate-limit error. | T |
| FR-G8.4 | Input and output tokens per minute per user and per tenant. | M2 | Must | Requests beyond either limit get the rate-limit error until the window allows them. | T |

### H. Metering, reports & analytics

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-H1 | **Usage events**: every request — including refused, failed and cancelled ones — records user, tenant, key, model, family, token classes, credits, latency and status; events are stored durably for reporting. | M1 | Must | Per user and period, the sum of event credits equals the enforcement counter (difference ≤ requests in flight). | T |
| FR-H2.1 | **Usage views** for the Instance Admin: overall, per tenant, per user, per model, per family, with period filters. | M1 | Must | Dashboards show each breakdown; data is at most 1 hour old. | D |
| FR-H2.2 | CSV export of usage reports. | M2 | Must | An export for a period matches the dashboard totals for that period. | T |
| FR-H3.1 | **Operational dashboards**: capacity, latency, error rates and refusals per endpoint and for the gateway, over the last hour/day/week. | M1 | Must | Dashboards exist after install with no extra setup and show live data. | D |
| FR-H3.2 | **Basic alerts** to `<channel>` TODO(DEVOPS): instance or API down, engine down, error rate above `<X%>`, storage above `<X%>` full, backup failed, break-glass login. | M1 | Must | Each alert fires in a fault-injection test and reaches the channel. | T |
| FR-H3.3 | **Full alerts**: not enough capacity, high latency, too many refused requests, endpoint failures. | M2 | Must | Each alert fires in a fault-injection test and reaches the configured channel. | T |
| FR-H4 | **Cost estimation**: credit prices × usage → cost views per model/user/tenant; input to FinOps. | M2 | Must | Cost views equal credits × configured prices for a fixture period. | T |
| FR-H5.1 | **No content storage in M1**: traces, logs and usage events carry metadata only; prompt and response text is not stored anywhere and content capture cannot be enabled. | M1 | Must | After a test day with inference, a search of traces, logs, databases and object storage finds no prompt or response text. | T |
| FR-H5.2 | **Opt-in content logging per tenant**: enabled explicitly per tenant; the toggle is audited; retention per NFR-18. | M2 | Must | Turning it on for one tenant stores only that tenant's content and creates an audit record. | T |
| FR-H6 | **Vendor telemetry (opt-in)**: an instance may share anonymized usage/quality telemetry with the vendor to receive in-product suggestions; off by default. | M2 | Should | With the default configuration no telemetry leaves the instance; when enabled, only the documented anonymized fields are sent. | T |
| FR-H7.1 | **Entitlement counters** tracked per instance: number of models, users, admins, API keys, tokens per month. | M1 | Should | The Instance Admin sees the current counter values on a dashboard. | D |
| FR-H7.2 | Entitlement counters reach the Vendor without a mandatory connection: as a signed report the Instance Admin exports on demand, or through opt-in telemetry (FR-H6); used for commercial vendor services. | M3 | Must | — | — |
| FR-H8 | **Usage API** for external billing systems: per tenant and period, credits and token classes per model. | M2 | Should | API totals for a period equal the CSV export for the same period. | T |

### I. Observability & operations

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-I1 | Full-stack observability ships with the instance: metrics, logs, LLM-call traces (metadata only, FR-H5.1), and dashboards for the gateway, engines and admission pipeline. | M1 | Must | After install, the three dashboards show live data with no external service. | D |
| FR-I2.1 | **Health checks**: the gateway and every engine endpoint are checked continuously; a failing endpoint stops receiving traffic and returns when healthy; both transitions are logged. | M1 | Must | Stopping an engine replica removes it from routing within `<N s>` TODO(ARCHITECT); restarting it brings it back. | T |
| FR-I2.2 | Health-driven traffic drain and alerting on both transitions. | M2 | Must | A replica being drained finishes running requests and gets no new ones; alerts fire on removal and return. | T |
| FR-I3.1 | **Failure handling runbooks**: operations does not fix application components — on failure it notifies developers, reports the health violation in `<channel>` TODO(DEVOPS), and restarts the component or rolls it back to the previous release; recovery confirmation is defined per component. | M1 | Must | A runbook exists per component and was rehearsed once. | I |
| FR-I3.2 | Traffic switching to a working alternative component per the runbooks, automated (uses FR-I4). | M2 | Must | Fault injection on a component triggers the switch without manual action. | T |
| FR-I4 | **A/B component replacement**: procedure and tooling to swap an internal component (e.g., replacing the off-the-shelf router with an own gateway) while external APIs stay unchanged. | M2 | Should | A swap at 10/50/100% traffic passes the API conformance tests at each step. | T |
| FR-I5.1 | Nightly install + smoke tests on clean infrastructure (FR-A4). | M1 | Must | Same as FR-A4; smoke tests cover sign-in, key creation, inference through both API formats, quota and rate-limit refusals, and cross-tenant cache isolation. | T |
| FR-I5.2 | Scheduled upgrade tests from the previous release. | M1 | Should | A weekly job upgrades the previous release to the current one and runs the smoke tests. | T |
| FR-I6 | **Update channel**: instance admins are notified of new TF versions (and, if opted in, new promising models) with upgrade notes. | M2 | Should | A new release produces a notification with upgrade notes on a test instance. | T |
| FR-I7 | **Audit log**: every administrative change and every refusal records who, what, when, before/after values; immutable; exportable. | M2 | Must | Each admin action of the Admin Console and API creates an entry; entries cannot be changed through any interface; export works. | T |
| FR-I8.1 | **Capacity management (manual placement)**: model placement and resource allocation guided by usage, priorities and request load; Kubernetes cluster-autoscaling supported. | M2 | Must | The admin places a model on chosen nodes; with autoscaling enabled, a pending engine triggers a node scale-up. | T |
| FR-I8.2 | Capacity planning and forecasting analytics. | M4 | Must | — | — |
| FR-I9 | **User support**: a support channel `<channel>` TODO(PRODUCT_MANAGER) is linked from the Portal and named in error messages; each production instance has an on-call owner during `<hours>` TODO(DEVOPS). | M1 | Must | The Portal shows the channel; the on-call rota for both M1 production instances is published. | I |

### J. Vendor capabilities

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| FR-J1 | The Vendor builds and tests TF with intensive use of AI agents, and deploys every new version to its own **dev infrastructure** for review. | M1 | Must | Every weekly release runs on the vendor dev instance before production. | I |
| FR-J2 | Versions passing review deploy to the Vendor's own production instance (**Constructor Fabric TF**, on Virtuozzo Cloud / GCore / DigitalOcean), supplying the Vendor's teams (PMs, developers, researchers, testers) with LLM tokens. | M1 | Must | Constructor Fabric TF runs the latest release that passed dev review. | I |
| FR-J3.1 | Telemetry ingestion from own dev/prod and opted-in third-party instances into product-quality insights. | M2 | Should | Telemetry from an opted-in test instance appears in the vendor's insight view. | T |
| FR-J3.2 | In-product suggestions and advice to Providers based on telemetry. | M3 | Must | — | — |
| FR-J4 | Entitlement-based commercial offers (support, services, or per-instance paid features) become possible. | M3 | Must | — | — |
| FR-J5 | **Migration from the current setup**: users of the existing ad-hoc model-serving setup are invited to the flagship; the old setup is switched off on `<date>` TODO(PRODUCT_OWNER) after announcement. | M1 | Should | Every known user of the old setup received the invitation; the switch-off date is announced. | I |

### K. Future directions (not committed)

Capabilities beyond the core inference factory. The milestone column is a **target, not a commitment**; each item gets acceptance criteria and a committed milestone when it is scheduled.

| ID | Capability | Target | P |
|---|---|---|---|
| FR-K1 | **Commercial provider adapters**: register external models (Anthropic, OpenAI, OpenRouter as overflow) in the same catalog; callable through the same gateway; credentials in the secret store; admin can mark tenants/projects **self-hosted-only** (requests to external providers refused and logged as security events). | M3 | Should |
| FR-K2.1 | **MCP Registry V0**: the gateway proxies approved external MCP servers and offers tools for interacting with platform components. | M3 | Should |
| FR-K2.2 | **MCP Registry V1**: import, verification (dependency/vulnerability scan, tool-poisoning checks), scoped approval, per-tool allow/deny, central credentials, browse/request/install into clients, audit of tool use, versioned lifecycle. | M4 | Should |
| FR-K3 | **Skills registry**: skills (packaged agent instructions/resources) organized into **skill sets**, with review, scoped approval, assignment (Required/Recommended/Available/Blocked) inherited down the org hierarchy with precedence rules, versioned sets pinning member versions, rollout rings, rollback, compliance reports. | M4 | Could |
| FR-K4 | **One lifecycle engine** shared by models, MCP servers and skills: states, change types (security/patch/minor/major), rings, approvals with evidence, rollback, deprecation/retirement, compliance reporting — manageable via API (CI/CD-friendly). | M4 | Should |
| FR-K5 | **Org-hierarchy synchronization**: departments, teams and members synced from the organization's platform/HR system (Constructor Platform adapter first; TF never connects to HR systems directly); reorganizations reflected at next sync; rules on removed teams reported, not dropped. | M3 | Should |
| FR-K6 | **Intelligent routing**: cost-aware, capability-aware and load-aware model selection by task category; mandatory-model rules for task categories; shadow and A/B testing of models. | M4 | Should |
| FR-K7 | **Policy simulation**: preview of affected users/requests and estimated savings before applying a routing or policy change. | M4 | Could |
| FR-K8 | **FinOps**: TCO views of self-hosted models (GPU rental, idle time, operations, depreciation) enabling commercial-vs-self-hosted comparisons; subscription/API usage reconciliation where providers offer official admin APIs. | M4 | Could |
| FR-K9 | **Fine-tuned own models**: the telemetry dataset (errors, prompts, traces — consent-gated) feeds the separate model-research/fine-tuning track; fine-tuned models re-enter TF through the same admission pipeline. | Later | Could |

### L. Constructor Fabric Pass extensions (dependency of the flagship instance)

Work on Pass delivered as part of this project so that Pass can serve as the flagship's IdP (§6.5). TF itself depends only on standard OIDC (FR-B1.1) and on the deprovisioning webhook contract (FR-B11.1).

| ID | Requirement | M | P | AC | V |
|---|---|---|---|---|---|
| PASS-1.1 | Registration and sign-in with Google and Microsoft accounts, in addition to GitHub. | M1 | Must | New users register with each provider; an approved user signs in to TF through Pass with each. | T |
| PASS-1.2 | Registration and sign-in with Apple accounts, including Apple's private-relay e-mail addresses. | M2 | Should | A user registered with Apple and a hidden e-mail signs in to TF. | T |
| PASS-2 | **Account linking**: one Pass account can link several upstream identities; the Pass user ID (`sub`) is stable, never reused, and independent of the upstream provider. | M1 | Must | Linking Google to an existing GitHub-based account keeps the same `sub`; TF sees one user. | T |
| PASS-3 | **OpenID Connect provider**: discovery document (`/.well-known/openid-configuration`), authorization code flow with PKCE, token endpoint, JWKS with key rotation, userinfo endpoint; signed ID tokens. | M1 | Must | TF's standard OIDC client signs in through Pass with no Pass-specific code; an OIDC conformance check of the basic profile passes using `<tool>` TODO(PASS_OWNER). | T |
| PASS-4 | **Claims**: `sub`, `email`, `email_verified`, `name`, `preferred_username` (GitHub login where available) and `roles` (Pass roles relevant to the client). | M1 | Must | An ID token for an approved user contains all listed claims with correct values. | T |
| PASS-5 | **Client registration and access control**: Pass admins register relying parties (redirect-URI allowlist, client secret) and decide which approved users or roles may sign in to each client. | M1 | Must | A user without access to the TF client is refused by Pass before reaching TF. | T |
| PASS-6.1 | **Deprovisioning notification**: when a user is blocked or deleted, or loses a role granted to a client, Pass sends a signed notification to that client's registered webhook (TF contract, FR-B11.1) within 1 minute. | M1 | Must | Blocking a user in Pass makes their TF keys refused within 2 minutes end to end. | T |
| PASS-6.2 | **SCIM 2.0 client**: Pass pushes users and role changes to relying parties that expose SCIM (FR-B11.2). | M2 | Should | Role changes in Pass appear in TF without user sign-in. | T |
| PASS-7 | RP-initiated logout. | M1 | Should | Signing out of the TF Portal also ends the Pass session when requested. | T |
| PASS-8 | Terms-of-service and privacy-notice acceptance recorded at registration, per Pass client where required. | M1 | Should | A user cannot complete registration without accepting the current terms; acceptance is recorded with a date. | T |
| PASS-9 | **Availability of sign-in**: Pass sign-in and token endpoints are available `<X%>` per month, with planned maintenance announced `<N days>` ahead TODO(PASS_OWNER). | M1 | Should | Availability is measured from the flagship's sign-in attempts for one month. | A |

---

## 8. Non-functional requirements

| ID | Attribute | Requirement | M | P | AC | V |
|---|---|---|---|---|---|---|
| NFR-1 | **Installability** | From bare VMs to a running instance with a served model in ≤ 1 working day using only the documented procedure; CPU-only bootstrap; nightly clean-install tests green. | M1 | Must | A DevOps engineer outside the core team installs the Standard profile on fresh VMs and serves a model within 1 working day, excluding weight download time. | D |
| NFR-2.1 | **Scalability** | Gateway and control-plane components scale horizontally; engines replicate per model; cluster autoscaling is supported. | M1 | Must | Scaling the gateway from 1 to 3 replicas under load causes no failed requests. | T |
| NFR-2.2 | **Scalability** | Initial capacity target per instance: ~1,000 registered users and ~100 concurrent active sessions on reference hardware (planning assumption, to be validated: ~10 active users per 8-GPU node). | M2 | Must | A load test with the workload model `<active-user definition, requests/s, prompt and output length distribution, agents per user>` TODO(ARCHITECT, QA) on reference hardware meets the latency SLOs of NFR-3.2. | A |
| NFR-2.3 | **Scalability** | Long contexts (256k practical; 500k–1M) supported within hardware limits; the maximum context length is documented and enforced per model. | M1 | Should | A request above a model's documented maximum is refused with a clear error; one at the maximum succeeds. | T |
| NFR-3.1 | **Performance** | Per-model TTFT and throughput envelopes are published from admission benchmarks on reference hardware. | M1 | Should | Each promoted model shows TTFT and tokens/s on the Admin page. | I |
| NFR-3.2 | **Performance** | Gateway-added latency and end-to-end latency SLOs are defined and measured (values: OQ-10). | M2 | Must | Load test shows gateway-added latency p95 ≤ `<X ms>` TODO(ARCHITECT); SLOs published with one month of measurements. | A |
| NFR-3.3 | **Performance** | Latency SLOs are enforced (error budget, alerting, release gating). | M4 | Must | — | — |
| NFR-4.1 | **Multi-tenancy & isolation (basic)** | Tenant data, inference-cache and capacity isolation (FR-B7.1–B7.3); automated isolation tests in CI. | M1 | Must | The isolation test suite runs on every build and nightly, and passes. | T |
| NFR-4.2 | **Multi-tenancy & isolation (strict)** | Strict isolation of data, configuration, secrets, usage and reports between tenants; no cross-tenant leakage through any shared component. Dedicated data planes available as a deployment tier where logical isolation is insufficient (OQ-3). | M2 | Must | Extended isolation tests (secrets, configuration, audit, every shared component) pass on every build; a tenant can be placed on a dedicated data plane. | T |
| NFR-5.1 | **Security** | TLS on every external endpoint. | M1 | Must | No external endpoint answers over plain HTTP except a redirect. | T |
| NFR-5.2 | **Security** | Secrets only in the secret store; never displayed again after entry. | M1 | Must | Inspection finds no secret in Helm values, ConfigMaps, logs or UI responses. | I |
| NFR-5.3 | **Security** | mTLS for internal service-to-service traffic. | M2 | Should | Inter-service calls without a valid client certificate are refused. | T |
| NFR-5.4 | **Security** | Least privilege for every component and role. | M1 | Must | Each component's service account has only the permissions listed in its design. | I |
| NFR-5.5 | **Security** | Security review / penetration test before external-facing production use. | M1 | Must | The review report has no open critical findings before the flagship admits users outside the Vendor's teams. | A |
| NFR-6.1 | **Availability** | No single point of failure in the control plane in multi-node profiles; engine failure → traffic moves to healthy endpoints; controlled degradation instead of hard outage. | M1 | Must | Stopping any single control-plane node keeps sign-in, key checks and routing working. | T |
| NFR-6.2 | **Availability** | Availability SLOs are defined and measured on the flagship. | M2 | Must | SLOs are published with one month of measurements. | A |
| NFR-6.3 | **Availability** | Availability SLOs are enforced (target 99.5%, §12). | M4 | Must | — | — |
| NFR-7 | **Reliability** | Health checks, circuit breakers, bounded retries with backoff, controlled errors; long workflows (admission, rollouts) survive restarts. | M1 | Must | Killing an admission worker mid-run resumes the workflow from its last completed stage. | T |
| NFR-8 | **Portability** | Runs on the platforms of §6.7; on VMs and bare metal with GPU passthrough; no hard dependency on any single cloud or vendor service. | M1 | Must | Inspection finds no component that requires a cloud-provider-specific service. | I |
| NFR-9 | **Observability** | Metrics, logs, traces and cost monitoring ship with the product and require no external services. | M1 | Must | See FR-I1. | D |
| NFR-10 | **Data residency & privacy** | An instance processes and stores everything within its own boundaries; nothing leaves the instance unless a feature is explicitly enabled by its admin (opt-in telemetry, external providers). Default retention: usage metadata only (FR-H5.1). | M1 | Must | With default configuration, egress logs over a test day show only IdP calls, image pulls and model downloads. | T |
| NFR-11 | **Extensibility** | Adapter interfaces for inference engines, routers, model sources, identity providers, storage backends and (later) commercial providers; temporary components are replaceable **without changing external APIs**. | M1 | Must | A design review confirms an adapter boundary for each listed area. | I |
| NFR-12 | **Maintainability / self-growth** | No hand-maintained production pets; the platform scales and grows without manual rebuilding (explicit review criterion for every design); automatic updates per FR-A6.2. | M1 | Must | Every design document has a scalability and self-growth section approved by the architecture owner. | I |
| NFR-13.1 | **License hygiene** | Third-party dependencies do not force commercial licenses for core use (e.g., the temporary router's enterprise/SSO features are not relied upon). | M1 | Must | The third-party license inventory shows no dependency that needs a commercial license for core features. | I |
| NFR-13.2 | **Open source** | Core distributed under an open-source license (choice: OQ-9.2). | M3 | Must | — | — |
| NFR-14 | **Usability** | A developer goes from key to first successful inference in minutes using portal snippets; a DevOps engineer installs using only the documented procedure; every refusal explains itself. | M1 | Must | Covered by FR-F2, NFR-1 and FR-E7.1. | D |
| NFR-15 | **Internationalization** | UI and docs English-first; architecture must not preclude localization. | M1 | Should | UI strings are kept outside the code. | I |
| NFR-16 | **UI technology** | Portal and Admin UI are built with `<Constructor UI Kit if its license allows open-source distribution; otherwise …>` TODO(PRODUCT_OWNER) (OQ-20). | M1 | Must | The chosen UI technology's license allows distribution with the open-source core. | I |
| NFR-17.1 | **Supply-chain security** | Every release's container images are scanned for vulnerabilities; no known critical vulnerability with an available fix ships. | M1 | Must | The release pipeline publishes a scan report per image; a critical finding blocks the release. | I |
| NFR-17.2 | **Supply-chain security** | SBOM published per release. | M1 | Should | Each release has an SBOM per image. | I |
| NFR-17.3 | **Supply-chain security** | Signed images and a published vulnerability-disclosure policy. | M3 | Must | — | — |
| NFR-18 | **Data retention** | Default retention, configurable per instance: usage events `<N months>`, operational logs `<N days>`, traces `<N days>`, audit records `<N years>`, anonymized usage after user deletion `<N months>` TODO(LEGAL, PRODUCT_OWNER). | M1 | Must | Data older than its retention period is deleted by a scheduled job; inspection of a test instance confirms it. | T |
| NFR-19 | **Hardware support** | NVIDIA GPUs of generations `<…>` TODO(ARCHITECT, ML_LEAD) supported by the pinned vLLM version, with driver/CUDA versions per release notes; CPU-only mode for evaluation and CI; other accelerators (e.g., AMD) `<target milestone>` TODO(PRODUCT_OWNER). | M1 | Must | Release notes list supported GPUs and driver versions; the nightly CPU run passes. | I |
| NFR-20.1 | **Browsers** | Portal and Admin page work in the last two major versions of Chrome, Edge, Firefox and Safari. | M1 | Must | A smoke test of the Portal and Admin page passes in each listed browser. | T |
| NFR-20.2 | **Accessibility** | Portal and Admin Console meet `<WCAG 2.1 AA or other level>` TODO(PRODUCT_OWNER). | M2 | Should | An accessibility audit finds no blocking issue at the chosen level. | A |
| NFR-21 | **No mandatory non-open dependency** | Every component needed to install and run TF is open source or replaceable through an open adapter. Components to check: `<e.g., Gears-based gateway, adapted platform installer, Constructor Platform adapter, Constructor UI Kit>` TODO(ARCHITECT) (OQ-21). | M1 | Must | The component inventory marks each component's license; none needed for core install and operation is closed. | I |

---

## 9. Key end-to-end scenarios

Scenarios are the acceptance spine of the milestones; each lists the requirement areas it exercises.

**S-01 — First install (internal mode).** DevOps provisions 5 VMs (or a single node), writes the instance configuration and runs the installer; the installer checks the prerequisites and boots the cluster CPU-only with all supporting services; the configuration connects the corporate OIDC IdP, lists the first Instance Admin, declares the department tenants with their allowed families and limits, and the families and models to admit. *Exercises: FR-A, FR-B1–B3, FR-B13, FR-C1–C2, FR-G2.1.* **M1**

**S-02 — Model onboarding.** An Instance Admin adds `GLM-5.3` by Hugging Face URL to family `GLM` in the instance configuration. The pipeline runs license check → security scan and capacity checks → download to weights cache → acceptance tests → Terminal Bench on the isolated eval instance; evidence is attached. On the Admin page the admin reviews the evidence and the GPU capacity, promotes the model and makes it the family default; the router starts serving it to the allowed tenants. *Exercises: FR-C1–C3, FR-C5–C6, FR-C12–C14, FR-D1–D6, FR-D11–D13, FR-F4.1.* **M1**

**S-03 — Developer's first token.** A user signs in to the Portal (through Pass on the flagship), generates an API key, copies the Claude Code snippet, and completes a streaming, tool-calling inference against `GLM` (family default) through the Anthropic-compatible endpoint; the response names the model that answered; the same works with the validated OpenAI-compatible tool. *Exercises: FR-F1–F2, FR-E1–E5, FR-E10, FR-B3.1, FR-B10.* **M1**

**S-04 — Quota hit.** The user's credits for the period run out; the next request is refused with the quota error (402) stating the reset time and the instance contact; the Portal shows zero remaining credits. In M1 the Instance Admin raises the user's limit in the instance configuration; from M2 the plan's overuse limit and near-limit notices apply. *Exercises: FR-G1–G4, FR-E7, FR-F1.1; FR-F6 and FR-G2.2 in M2.* **M1 (refusal + limits); M2 (notices, plans)**

**S-05 — New model version rollout.** `GLM-5.4` is admitted, benchmarks compare it against `GLM-5.3` on the same suites; the admin moves the family default through staged rollout; live metrics are compared; on regression, one action rolls the alias back; the old version is deprecated then retired, its traffic cleanly redirected. *Exercises: FR-C3–C4, FR-C8, FR-D4–D6, FR-E8/E10.* **M2 (decision point); M3 (rings, compliance)**

**S-06 — Component failure.** The router misbehaves; operations is alerted, notifies developers, and per runbook restarts it or rolls it back to the previous release (M1); from M2 traffic switches to a working alternative automatically. Users see at most a brief degradation; the incident is logged. *Exercises: FR-H3.2, FR-I2–I4, NFR-6/7.* **M1 (manual); M2 (automation)**

**S-07 — External provider mode.** A company stands TF up as a paid service: social login, portal registration, custom domain, per-customer plans with credit limits and overuse; customers connect their own IdPs and manage their users' policies. *Exercises: FR-A9–A10, FR-B, FR-G.* **M2**

**S-08 — Vendor flywheel.** The Vendor ships a weekly release, deploys it to dev, then to Constructor Fabric TF; an opted-in partner instance sends telemetry; the vendor sees entitlement counters and quality signals and issues an in-product suggestion. *Exercises: FR-J, FR-H6–H7, FR-A6.* **M2–M3**

**S-09 — Hybrid overflow (future).** At peak, a tenant's policy allows overflow to an OpenRouter-backed external model; the gateway routes the surplus out, marks it in the catalog, and meters it like any model; a self-hosted-only project's request to the external provider is refused and logged. *Exercises: FR-K1, FR-E8.* **Target M3**

**S-10 — Governed tools & skills (future).** MCP servers and skill sets go through the same verified, ring-based lifecycle and are assigned down the org hierarchy (Required/Recommended/Available/Blocked) with explanations of every user's effective set. *Exercises: FR-K2–K5.* **Target M4+**

**S-11 — Students and contributors on one instance.** On the flagship, Pass roles place a student in tenant `students` and a contributor in tenant `contributors`. The student sees only the families allowed for students and has a lower credit limit. Both send the same long prompt: the contributor's request gets no cached tokens from the student's. A student load test at the `students` concurrency cap does not slow contributors' requests beyond the agreed margin. Neither can see the other tenant's users, keys or usage. *Exercises: FR-B7, FR-B10, FR-G2.1, FR-G8, NFR-4.1.* **M1**

---

## 10. Milestones

### 10.1 Milestone cadence

Milestones align with community events, which take place every 1–2 months: **M1 = 5 Dec 2026**, then approximately **early Feb 2027 (M2)**, **early Apr 2027 (M3)** and **early Jun 2027 (M4)** — exact dates set by the community calendar. Each milestone must show significant, demonstrated value: working software used by real users. Inside every milestone, delivery runs in weekly shippable increments. The cadence, the weekly plan, team roles and the M1 cut line are in [DELIVERY-PLAN.md](DELIVERY-PLAN.md). A milestone's scope is the set of requirements tagged with it in §7–§8; the lists below summarize them.

### 10.2 Milestone 1 — "First Tokens" — **5 December 2026**

**Goal:** a working end-to-end Token Factory: selected open-weight models automatically downloaded, verified, benchmarked, launched on abstracted infrastructure (Kubernetes), and used by real people through API tokens with quotas, metering and tenant isolation. Deployed as **Constructor Fabric TF** (vendor production, Pass sign-in, separate tenants for contributors, students and the Vendor's teams) and at **Constructor Tech**, and demonstrated at the 5-Dec community event.

**Scope summary:**

1. Installer (Helm-based) with prerequisite checks and the reference cluster bootstrap; all supporting services and the NVIDIA GPU operator; CPU-only bootstrap verified; GPU used where hardware exists.
2. Administration through the instance configuration (Helm values) plus the Admin page (§6.2); first-admin bootstrap and break-glass admin.
3. End-to-end admission chain for **2 open-weight model families** (target: GLM, Qwen): license → security and capacity checks → download (gated models supported) → acceptance → Terminal Bench on an isolated eval instance; evidence and failure reasons on the Admin page; manual promotion with a GPU capacity check (§6.3).
4. One default runtime profile with per-model overrides of model-specific keys (§6.4).
5. Inference service on vLLM: OpenAI-compatible Chat Completions and minimal Anthropic-compatible Messages, both with streaming and tool calling; responses name the model that answered; versioned API with documented limits and endpoint list.
6. Access: OIDC sign-in (Constructor Fabric Pass on the flagship, corporate IdP at Constructor Tech, bundled IdP for standalone); tenants and tenant settings from the instance configuration; just-in-time user provisioning with ordered claims mapping; API keys with expiry, prefix and hashing; deprovisioning webhook.
7. **Basic tenant isolation**: data, inference cache (per-tenant cache salt) and capacity (per-tenant concurrency caps), with isolation tests in CI (FR-B7.1–B7.3, NFR-4.1).
8. Quotas, rate limits and metering per §7-G G.0; usage views; operational dashboards; basic alerts; no content storage.
9. Operational readiness of the two production instances: daily configuration backup, basic alerts, on-call owner, user support channel.
10. Minimal Portal (keys, model list, remaining credits, connection snippets, support channel).
11. Constructor Fabric Pass extensions PASS-1.1, PASS-2 – PASS-6.1 (§7-L).
12. Nightly automated installs on clean VMs; smoke tests incl. isolation; image vulnerability scanning per release; security review before outside users.
13. Docs: install guide with prerequisites; API reference with versioning policy; user onboarding with snippets for the 2 validated tools.

**Allowed shortcuts (tracked for replacement):** one-off scripts for missing components (model deployer, parts of admission); configuration through Helm values instead of admin UI (except the Admin page); no Customer Admin self-service and no policies (M2); tenant settings instead of plans; restart-or-rollback runbooks instead of failover to an alternative component.

**M1 reference environment and models** (fill before design sign-off):

| Instance / environment | Purpose | GPU type | GPUs (count × memory) | Nodes | Filled by |
|---|---|---|---|---|---|
| Constructor Fabric TF — production | Serving the flagship's users | `<GPU model>` | `<N> × <X GB>` | `<N>` | TODO(DEVOPS) |
| Constructor Fabric TF — eval | Isolated benchmarks (FR-D5) | `<GPU model>` | `<N> × <X GB>` | `<N>` | TODO(DEVOPS) |
| Vendor dev | Review of weekly releases | `<GPU model or CPU only>` | `<N> × <X GB>` | `<N>` | TODO(DEVOPS) |
| Constructor Tech — production | Serving Constructor Tech users | `<GPU model>` | `<N> × <X GB>` | `<N>` | TODO(CT_ADMIN) |
| Constructor Tech — eval | Isolated benchmarks | `<GPU model or shared with …>` | `<N> × <X GB>` | `<N>` | TODO(CT_ADMIN) |
| Nightly CI | Clean installs and smoke tests | CPU only | — | 5 VMs × `<vCPU / RAM / disk>` | TODO(DEVOPS) |

| Family | Model (Hugging Face ID) | Parameters (total / active) | Quantization | Context length served | Weights size | GPUs per replica | Tool-call / reasoning parser |
|---|---|---|---|---|---|---|---|
| GLM | `<org/model>` TODO(PRODUCT_OWNER, ML_LEAD) | `<N B / N B>` TODO(ML_LEAD) | `<bf16 / fp8 / …>` TODO(ML_LEAD) | `<N k tokens>` TODO(ML_LEAD) | `<X GB>` TODO(ML_LEAD) | `<N>` TODO(ML_LEAD) | `<parser / parser>` TODO(ML_LEAD) |
| Qwen | `<org/model>` TODO(PRODUCT_OWNER, ML_LEAD) | `<N B / N B>` TODO(ML_LEAD) | `<bf16 / fp8 / …>` TODO(ML_LEAD) | `<N k tokens>` TODO(ML_LEAD) | `<X GB>` TODO(ML_LEAD) | `<N>` TODO(ML_LEAD) | `<parser / parser>` TODO(ML_LEAD) |
| CPU test model (CI, CPU-only bootstrap) | `<org/model>` TODO(ML_LEAD) | `<N B>` TODO(ML_LEAD) | `<…>` TODO(ML_LEAD) | `<N k tokens>` TODO(ML_LEAD) | `<X GB>` TODO(ML_LEAD) | 0 | `<parser>` TODO(ML_LEAD) |

| Tenant on the flagship | Allowed families | Default per-user credit limit | Concurrency cap | Filled by |
|---|---|---|---|---|
| `contributors` | `<…>` | `<N credits / period>` | `<N>` | TODO(PRODUCT_OWNER) |
| `students` | `<…>` | `<N credits / period>` | `<N>` | TODO(PRODUCT_OWNER) |
| `vendor` | `<…>` | `<N credits / period>` | `<N>` | TODO(PRODUCT_OWNER) |

GPUs available on production and eval by `<YYYY-MM-DD>`, owner `<name>` TODO(DEVOPS). If they are not available by then: `<which acceptance criteria are demonstrated on the CPU test model>` TODO(PRODUCT_OWNER).

**Acceptance criteria:**

- [ ] Fresh 5-VM cluster → running TF with a served model in ≤ 1 working day, using only documentation (NFR-1).
- [ ] 2 model families pass license, security, capacity and acceptance checks and Terminal Bench without manual steps; each is promoted on the Admin page; benchmark evidence is retrievable.
- [ ] A user signs in (through Pass on the flagship), obtains a key, connects Claude Code through the Anthropic-compatible endpoint and the second validated tool through the OpenAI-compatible endpoint, and completes streaming + tool-calling inference with each.
- [ ] Per-user quotas and rate limits are enforced per §7-G G.0: refusals with the specified errors; remaining credits in the Portal current after every completed request; dashboards at most 1 hour behind.
- [ ] Scenario S-11 passes on the flagship: students and contributors are isolated in data, inference cache and capacity.
- [ ] Blocking a user in Pass makes their keys refused within 2 minutes.
- [ ] Both production instances have a tested configuration backup, basic alerts, an on-call owner and a support channel; the security review has no open critical findings.
- [ ] Constructor Fabric TF live on production infrastructure with Pass sign-in; Constructor Tech instance deployed; first real users onboarded: ≥ `<50>` registered and ≥ `<20>` users with at least one successful inference by the event TODO(PRODUCT_OWNER).
- [ ] Nightly clean-install test green on 3 consecutive nights.
- [ ] Every M1 **Must** requirement in §7–§8 meets its acceptance criteria.

### 10.3 Milestone 2 — "Production Core" — early Feb 2027

**Theme:** from prototype to operable product. Target date: the community event ~2 months after M1. Must items below; Should items in §7–§8 may move to M3.

- Strict multi-tenancy: tenant registry, strict isolation tests, per-tenant secrets, dedicated data-plane tier (NFR-4.2).
- Full plans/credits: per-model credit prices, plan model-set limits, default policies, per-tenant limits, overuse limits; per-user policies by Customer Admins; soft/hard limits; token-per-minute rate limits.
- Identity: directory auto-registration and joiner/mover/leaver sync; Customer Admins add users; service keys; user and tenant deletion.
- Model ops maturity: rollout decision UI (benchmarks, thresholds, "to production", reports widget); family-default migration; retirement with deprecation notices.
- Operations maturity: full alerts, health-driven traffic drain, automated traffic switching, full backup/restore, Admin Console and Management API, audit log.
- Measured latency and availability SLOs (NFR-3.2, NFR-6.2).
- Evidence: ≥ 5 running instances (vendor dev, vendor prod, Constructor Tech, ≥2 more internal-use deployments); model rollout lead time ≤ 1 week; every M2 **Must** requirement meets its acceptance criteria.

### 10.4 Milestone 3 — "Open Factory" — early Apr 2027

**Theme:** public release and air-gapped operation.

- **Public open-source release** (license decision executed, legal review of the open/private split done; docs site; packaged Helm/OCI artifacts; signed images; vulnerability-disclosure policy).
- Air-gapped installs, offline weights and update bundles, private registry mirror (FR-A8).
- Money budgets and cost allocation (FR-G7, FR-H4); organization hierarchy (FR-B9).
- Benchmark registry (FR-D8); custom client benchmark interface (FR-D7); forced-retirement migration (FR-C9); file storage v1 (FR-E9).
- Vendor commercial groundwork: entitlement reports, in-product advice, entitlement-based offers (FR-H7.2, FR-J3.2, FR-J4).
- Targets from future directions (§7-K), if scheduled: commercial provider adapters, MCP Registry V0, org-hierarchy sync; image-modality and specialized-engine pilots (FR-C10).

### 10.5 Milestone 4 — "Intelligent Factory" — early Jun 2027

**Theme:** optimization and v1.0.

- Latency and availability SLOs enforced (NFR-3.3, NFR-6.3); capacity planning and forecasting (FR-I8.2).
- Auto-selection (FR-E2.2) with intelligent routing.
- Targets from future directions (§7-K), if scheduled: intelligent routing, automated A/B and shadow testing, policy simulation, FinOps TCO views, MCP Registry V1, skills registry and the unified lifecycle engine.
- **v1.0** declared; decision point for the managed multi-tenant SaaS option.

### 10.6 Beyond (H2 2027+)

Multimodal depth (image → video generation models); specialized inference engines and a quantization/compression program; fine-tuned own models from consented telemetry through the standard admission pipeline; OpenRouter channel (TF instances as token providers); students program at scale; managed SaaS if validated; marketplace of gears/adapters.

---

## 11. Business model & licensing

- **Core product**: open source from GitHub (license choice: OQ-9.2; the open/private code split — base pipelines and infra tooling open, unique benchmarks and proprietary extensions private — gets legal review before M3).
- **Before the public release**: partner deployments (from M1, e.g., Constructor Tech) use the code under `<license or agreement>` TODO(LEGAL, PRODUCT_OWNER); contributions from all participating companies are accepted under `<CLA or DCO>` TODO(LEGAL) — both decided before the Constructor Tech deployment (OQ-9.1).
- **Vendor revenue paths (from M3, built on FR-H7 entitlement counters):** paid support and services per TF instance; paid features or capacity tiers keyed to counters (models, users, admins, API keys, monthly token volume); telemetry-based advice; later, a managed SaaS tier.
- **Provider economics**: a Provider may offer free or paid access to its tenants (plans, credits, overuse) — the product supports both from M2; billing itself is out of scope (§3.3).

The go-to-market plan is in [GO-TO-MARKET.md](GO-TO-MARKET.md).

---

## 12. Success metrics

| KPI | Definition | M1 target | Later targets |
|---|---|---|---|
| Working instances | Deployed TF instances passing nightly smoke | 2 (vendor prod + Constructor Tech) | 5 @ M2; 10+ external @ M3 |
| Registered / weekly active users | Per flagship instance; weekly active = at least one successful inference in a calendar week | `<50>` registered and `<20>` with a successful inference by the event; WAU from the first full week after the event TODO(PRODUCT_OWNER) | 500 / 200 @ M3 (flagship) |
| Tokens served | Output tokens/week through instances | tracked from week 1 | growth curve published monthly |
| Install success rate | Nightly clean-install pass rate | 3 consecutive greens | ≥ 95% |
| Time to first successful call | New user: key → first successful inference | < 15 min with docs | < 5 min @ M2 |
| Limit hits | Share of weekly active users refused for quota at least once in a week (signals limits that are too tight or too loose) | tracked | `<X%>` TODO(PRODUCT_OWNER) @ M2 |
| Model rollout lead time | New model version: intake → production default | ≤ 2 weeks (manual decision) | ≤ 1 week @ M2; ≤ 2 days @ M4 |
| Availability of inference service | Successful vs attempted inference minutes | tracked | measured @ M2; 99.5% @ M4 |
| Cost per 1M output tokens | Fully loaded serving cost per 1M output tokens at actual utilization (GPU and operations cost ÷ tokens served), compared with the list price of a reference commercial model of comparable quality (reference fixed per milestone — OQ-8) | measured | ≤ 50% @ M3; ≤ 30% @ M4 (with routing) |
| Adoption vs external tools | Share of the target community using TF as primary coding-model source, measured by `<survey method and sample>` TODO(PRODUCT_MANAGER) | baseline survey | 50% @ M3 |
| Community growth | GitHub stars / contributors / external PRs | — | tracked from M3 |

---

## 13. Risks & mitigations

Product risks. Delivery and staffing risks are tracked in [DELIVERY-PLAN.md](DELIVERY-PLAN.md).

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R-1 | **Tenant cache/data leakage** on shared engines (known industry failure). | Security incident, blocked external mode | Basic isolation from M1: per-tenant cache salt, data isolation, capacity caps, isolation tests in CI (FR-B7, NFR-4.1); strict isolation and dedicated data planes in M2 (NFR-4.2). |
| R-2 | **Model quality drift** (served vs Hugging Face variants; silent provider-side changes). | User trust loss | Benchmark on admission vs incumbent; benchmark registry with scheduled re-runs (M3); version pinning; telemetry watch. |
| R-3 | **Router dependency license** (temporary router's enterprise features are paid above small SSO counts). | Legal/cost exposure | Use only its open capabilities behind a stable facade; swap to an own gateway planned from M2 (FR-I4). |
| R-4 | **Adoption failure** (users stay with external tools). | Business case collapse | Minutes-to-first-call UX; validated tool snippets; weekly value narration; quotas not walls (overuse limits from M2); flagship instance used by the vendor's own team daily. |
| R-5 | **Benchmark cost & credibility** (full verification expensive; synthetic benchmarks distrusted). | Verification theater | Stage-gated benchmark budget; start with Terminal Bench + internal tasks on real hardware/workflows; benchmark cost controls (FR-D10). |
| R-6 | **Storage & closed-environment constraints** (no cloud S3 on-prem; unknown retention needs). | Blocked closed-network installs | In-cluster storage option; offline weight import in M3 (FR-A8). |
| R-7 | **API fidelity loss** in format transformation (reasoning, context caching). | Degraded UX for advanced tools | Minimal Anthropic-compatible endpoint in M1 validated with Claude Code; per-format capability matrix and full endpoint in M2; document losses honestly per tool. |
| R-8 | **On-prem-only constraint vs external overflow** (some organizations require that data be processed only on their own hardware). | Architectural conflict | Self-hosted-first design; external providers strictly opt-in per tenant (FR-K1) and off by default (NFR-10). |
| R-9 | **Pass extensions not ready for M1** (OIDC provider, new sign-in providers, deprovisioning notification). | Flagship users cannot sign in | Pass work tracked as M1 Must items (§7-L) with an owner (OQ-18) and a go/no-go date in the delivery plan; fallback: the bundled IdP with GitHub sign-in and an allowlist of approved users in the instance configuration. |
| R-10 | **One runtime profile does not fit all models** (different parsers, templates, context lengths). | A family cannot be served correctly | Per-model overrides of model-specific keys (FR-C13); multiple profiles with alternative runtimes (FR-C10). |
| R-11 | **Off-the-shelf router cannot implement the quota and rate-limit specification** (token-class credits, UTC calendar periods, 402 errors, credit headers, per-tenant cache salt). | M1 behaviour differs from the PRD | Router capability check by 2026-11-10 (§7-G G.0); missing parts built as a gateway extension. |
| R-12 | **M1 scope exceeds capacity** (about 100 Must requirements in 4.5 weeks). | M1 slip or quality loss | Cut line and go/no-go points in the delivery plan; Should items slip first; PO decides further cuts at the 2026-11-23 checkpoint. |

---

## 14. Decisions log

Product decisions. Architecture and technology decisions are in [DESIGN.md](DESIGN.md).

| # | Topic | Decision | Rationale |
|---|---|---|---|
| D-1 | Standalone vs embedded in a platform | TF is a **standalone installable product on Kubernetes**, not embedded into an existing platform; reusable platform components are used behind open interfaces where available (NFR-21). | Any Provider can install it; no platform prerequisite. |
| D-2 | Self-hosted vs commercial providers | **Self-hosted open-weight models first**; commercial provider adapters are a future direction (FR-K1), opt-in per tenant. | Independence and data protection come first; hybrid serving adds value only once self-hosted serving works. |
| D-3 | Inference API vs chat UI | **Inference API only** for M1; Chat Engine is a separate later component. | The API and tokens are the product; chat UIs build on top of it. |
| D-4 | Smart "auto-model" routing | **Excluded from M1**; delivered as intelligent routing in M4. Family-alias resolution covers user needs until then. | KV-cache invalidation on mid-session model switches; implementation complexity. |
| D-5 | Billing vs quotas | **Quota enforcement + credit metering**; billing (invoicing, payments) is out of scope; usage is exported for external billing. | Limit control matters more than invoicing; billing systems exist. |
| D-6 | Budgets in money vs credits | **Credits are the accounting unit** (per-model token prices); money budgets layered on once currency values exist (M3). | Credits work before currency prices are set; money budgets build on them. |
| D-7 | Off-the-shelf components | Ready components (router, identity provider, observability, workflow engine) are used first **behind stable external APIs** and replaced later in A/B mode without external API change; features under commercial licenses are not relied upon. | Speed to M1 without lock-in; license risk R-3. |
| D-8 | Inference engine | **vLLM is the only runtime in the first phases**; specialized engines and quantizations are later optimizations entering through the same verification. | Broad model support; specialized engines are optimizations, not prerequisites. |
| D-9 | Runtime platform | **Kubernetes** (any conformant distribution meeting §6.7) is the runtime target, installed via Helm; long-running workflows (admission, rollouts) are durable; no Docker Compose path in the product. | Scaling, fault tolerance, GPU autoscaling and background jobs; repeatable installs. |
| D-10 | Identity | **Pluggable IdP with a per-instance default** (corporate OIDC/SAML internal; social external; bundled IdP for standalone). A platform SSO (e.g., Constructor Platform) is one adapter, not a mandatory dependency. | Standalone installability (D-1). |
| D-11 | MCP | MCP support is a future direction, starting as gateway proxying of approved MCP servers (FR-K2.1). | Avoid early complexity. |
| D-12 | One-off scripts in M1 | Explicitly **allowed** to cover missing components, each with a tracked replacement plan; stable external facades make replacement safe. | Deliver M1 on time without blocking on complete components. |
| D-13 | Benchmark-gated verification | Benchmarks run as part of admission **from M1** (Terminal Bench minimum) as evidence; they gate promotion from M2 (FR-C8.1). | A lifecycle that cannot verify a new version before rollout cannot roll it out safely; M1 needs evidence first, thresholds later. |
| D-14 | Auto-registration & directory sync | Just-in-time provisioning from the IdP in M1; directory auto-registration with JML sync and SCIM in M2. | Sign-in-time provisioning is sufficient for M1 user numbers. |
| D-15 | Anthropic-compatible API in M1 | A **minimal Anthropic-compatible Messages endpoint** (streaming, tool use) ships in M1; the full endpoint in M2. | Claude Code, a target M1 tool, speaks only the Anthropic Messages format. |
| D-16 | M1 administration | **Instance configuration (Helm values) for everything, plus one Admin page** for model admission and promotion; no CLI and no other admin UI in M1. | Minimal effort; the promotion decision is the one action that needs evidence on screen. |
| D-17 | Flagship identity | **Constructor Fabric Pass is the default IdP of the flagship**, connected through standard OIDC; Pass is extended to provide it (§7-L). | The community already registers in Pass; Pass approval provides qualified access; TF stays IdP-agnostic. |
| D-18 | Runtime profile | **One runtime profile per instance**, shipped with TF and adjustable by the Instance Admin; model-specific keys overridable per model (OQ-19). | vLLM is the only runtime in the first phases; one profile keeps operations simple. |
| D-19 | M1 promotion rule | License, security and acceptance failures block; benchmarks are evidence only; the Instance Admin promotes manually on the Admin page (§6.3). | Promotion stays a human decision until thresholds exist (M2). |
| D-20 | Quota and rate-limit model (proposed) | Credits from token classes; per-user limits with tenant defaults; UTC calendar periods; check-then-charge; no mid-stream cut-off; non-retryable 402 on exhaustion; concurrency limits per user and tenant (§7-G G.0). To be confirmed (OQ-17). | Smallest model that is predictable for users and consistent with common industry practice (Appendix B). |
| D-21 | Tenant isolation in M1 | **Basic tenant isolation ships in M1**: data, inference cache (per-tenant cache salt) and capacity (per-tenant concurrency caps); strict isolation in M2. | Students and contributors share the flagship and must not be mixed. |
| D-22 | Entitlement | TF commercial entitlements are **not enforced before M3**; the M1 entitlement step always allows and only counts; counters reach the Vendor by export or opt-in telemetry, never by a mandatory connection. | Open-source core; no vendor control plane (§3.2). |
| D-23 | Cluster provisioning | TF installs into an existing conformant cluster; a cluster bootstrap is provided only for the reference layout (§6.7). Confirm TODO(ARCHITECT). | Keeps "any Kubernetes" honest while giving CI and NFR-1 a reproducible start from bare VMs. |

---

## 15. Open questions

Items needing a decision, with owner and suggested deadline.

| # | Question | Owner | Due |
|---|---|---|---|
| OQ-1 | M1 demo content and readiness criteria: the second validated tool (OpenAI-compatible; Claude Code is the first), tool versions, the two models, hardware, flagship tenant settings and the CPU/GPU demo configuration (§10.2 tables). | PRODUCT_OWNER + PRODUCT_MANAGER | 2026-11-06 |
| OQ-2 | Which corporate directory feeds auto-registration first (AD/Entra? other), and sync direction/mode. | ARCHITECT | M2 planning |
| OQ-3 | Tenant isolation tiers: where is logical isolation sufficient, and which tenants (if any) need dedicated data planes? | ARCHITECT + SECURITY | M2 planning |
| OQ-4 | Weights storage technology for closed environments (in-cluster options, cache management, retention period). | DEVOPS | M2 planning |
| OQ-5 | API format transformation strategy to preserve model-specific capabilities (reasoning pass-through, context caching) per tool. | DEVELOPER | M2 planning |
| OQ-6 | Management API/MCP contract surface (what AI tools may administer). | ARCHITECT | M2 planning |
| OQ-7 | Subscription usage reconciliation feasibility via official admin APIs (Claude/ChatGPT plans). | PRODUCT_MANAGER | M3 planning |
| OQ-8 | TCO and break-even model: rent vs buy, NVIDIA vs AMD, provider mix, utilization — using TF's own metering data; also fixes the reference commercial price for the cost KPI (§12). | PRODUCT_MANAGER + Finance | M3 planning |
| OQ-9.1 | Terms under which partners use the code before the public release, and the contribution agreement (CLA or DCO) (§11). | LEGAL + PRODUCT_OWNER | 2026-11-20 |
| OQ-9.2 | Open-source license choice and open/private code-split criteria for the public release. | LEGAL + PRODUCT_OWNER | before M3 |
| OQ-10 | Latency/availability SLO values (after load testing on reference hardware). | ARCHITECT + QA | M2 |
| OQ-11 | External overflow vs strict on-prem: final position for organizations that require on-prem-only processing. | PRODUCT_OWNER | M3 planning |
| OQ-12 | Static client model lists vs dynamic discovery protocol. | ARCHITECT | M2 |
| OQ-13 | Skills format standardization vs per-client adaptation at delivery. | ARCHITECT | when FR-K3 is scheduled |
| OQ-14 | Judge models for subjective benchmarks (choice, ownership, change policy). | ML_LEAD | M3 planning |
| OQ-15 | Should the org-unit assignment rules for tools and skills (FR-K3, FR-K5) also govern model access and default models per team? | PRODUCT_OWNER | when FR-K3 is scheduled |
| OQ-16 | What does a request for `auto` do before M4: refused with a clear error, or resolved to a default family per tenant? | PRODUCT_OWNER | 2026-11-10 |
| OQ-17 | Confirm the quota and rate-limit specification §7-G G.0 (Appendix B options) and fill its values. | PRODUCT_OWNER + ARCHITECT | 2026-11-10 |
| OQ-18 | Owner and delivery dates of the Constructor Fabric Pass extensions (§7-L), and the role names used in the claims mapping (§6.5). | PRODUCT_OWNER + PASS_OWNER | 2026-11-07 |
| OQ-19 | Confirm per-model overrides of model-specific runtime-profile keys (FR-C13), and the list of overridable keys. | ARCHITECT + ML_LEAD | 2026-11-10 |
| OQ-20 | UI technology for Portal and Admin page (NFR-16): Constructor UI Kit or another kit, depending on license. | PRODUCT_OWNER | 2026-11-07 |
| OQ-21 | Inventory of components that are not open source today, and for each: open-source it, make it optional, or replace it (NFR-21). | ARCHITECT | 2026-11-14 |

---

## Appendix A — Glossary

See §4.1 for canonical role and concept definitions. Additional technical terms: **gears** (reusable Constructor Fabric platform components: identity, secrets/CredStore, service directory, …); **weights cache** (model-weights object storage preventing re-downloads); **eval instance** (isolated vLLM deployment for benchmarks); **stable facade** (fixed external API behind which internals are replaceable); **admission** (the verified path from model source to production, §6.3); **A/B component swap** (traffic-split replacement of an internal component); **nightly install** (automated from-scratch deployment test on clean VMs); **check-then-charge** (quota enforcement that checks the counter before a request and charges the actual cost after it, §7-G); **JIT provisioning** (creating a user account at first sign-in from IdP claims); **cache salt** (a per-tenant secret added to prefix-cache keys so cached prompts are reused only within one tenant, FR-B7.2); **break-glass account** (local emergency admin account used when the IdP is unavailable, FR-B12).

## Appendix B — Quota design options and industry practice

Options considered for §7-G G.0. The recommended option is the first in each row. Industry practice as documented by each provider on 2026-11-03.

| Dimension | Recommended (minimal) | Alternatives | Industry practice |
|---|---|---|---|
| Unit | Credits from token classes, one price table per instance in M1 | Raw tokens (one budget per class, or weighted); money | Commercial APIs and gateways budget in money computed from per-class token prices; OpenRouter calls its prepaid balance "credits". |
| Token classes | Uncached input, cached input, output (incl. reasoning), cache write | Input + output only | OpenAI reports cached tokens as part of prompt tokens and reasoning tokens as part of completion tokens; Anthropic reports `input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` and `output_tokens` separately and prices them differently. |
| Scope (M1) | Per user across all keys, with tenant defaults | Per key; per user + per tenant | OpenAI: organization and project; Anthropic: organization and workspace; OpenRouter: account balance plus optional per-key limits; LiteLLM: key, user, team, team member, organization, end customer. |
| Period | UTC calendar day / week (Monday) / month; one per instance | Rolling window; per-tenant time zone | OpenRouter key limits reset daily, weekly (Monday) or monthly in UTC; LiteLLM budget windows reset at UTC midnight, Monday or the 1st; OpenAI and Anthropic spend limits are monthly. |
| Enforcement | Check-then-charge, actual cost charged on completion | Reserve an estimate (input + `max_tokens`) up front and settle after; per-minute token bucket | OpenRouter charges on completion and additionally holds an up-front estimate (input + `max_tokens`) against an in-flight budget; LiteLLM checks current spend before a request and adds the cost after; OpenAI rate limits count `max(max_tokens, estimate)`; Anthropic rate limits use a token bucket and count actual output tokens. |
| Mid-stream | Finish and charge in full; on cancel, charge tokens generated so far | Cut the stream at the limit | Gateways charge after completion; cutting streams breaks agent tool loops. |
| Error on exhaustion | `402`, not retryable (`x-should-retry: false`) | `429` without `retry-after` plus an error code; `403` | OpenRouter: `402` for insufficient credits, `403` for admin-set budgets; OpenAI: `429` with type `insufficient_quota` and codes such as `credit_balance_exhausted`; Anthropic: `429` with `enforced_spend_limit_reached` for spend caps, `400` for self-set spend limits, `402` `billing_error` for billing problems; LiteLLM: `budget_exceeded` with `400` or `429`. SDKs retry `429` automatically; Claude Code stops retrying when `x-should-retry: false` or `retry-after` > 60 s. |
| Rate limits | Concurrency per user and per tenant, requests per minute per key; tokens per minute from M2 | Tokens per minute from M1 | OpenAI: requests and tokens per minute per organization/project; Anthropic: requests, input tokens and output tokens per minute, token bucket; LiteLLM: `rpm_limit`, `tpm_limit` and `max_parallel_requests` per key, user and team. |
| Visibility | Real-time enforcement counter shown in the Portal; reports ≤ 1 h (M1), ≤ 5 min (M2) | All views from the reporting store | OpenRouter exposes per-key usage per UTC day/week/month through an API; LiteLLM exposes spend and the next reset time per key and user. |
