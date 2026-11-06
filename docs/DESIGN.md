# DESIGN

## Architecture

![Model Factory](img/model-factory.drawio.svg)

### Conceptual component view

Text view of the components named in the PRD. Reconcile it with the diagram above: the diagram also shows guardrails, PII redaction, hook plugins, BSS/OSS integration and tenant RAG, which are not covered here.

```text
                         TF Vendor
      GitHub (source) · update & model notifications · opt-in telemetry · licence counters
                 |                          ^                                   |
                 v                          |                                   |
  ┌───────────────────────────── TF Instance (any Kubernetes cluster) ────────────────────┐
  │                                                                                        │
  │  TF Customer Portal          Admin Console            Management API / MCP (later)     │
  │        │  Inference API (OpenAI-compatible; Anthropic-compatible later)                │
  │        v                          v                              v                    │
  │  ┌──────────────────────── Control Plane ────────────────────────────────┐             │
  │  │ API Gateway · AuthN/AuthZ · Tenant & Account Mgmt · Plans/Quotas/     │             │
  │  │ Licence checks · Model Registry · Model Deployer · Usage Collector    │             │
  │  │ Workflow orchestration (Temporal) · Secrets (Vault/OpenBao) · IdP     │             │
  │  └───────┬───────────────────────────────┬───────────────────────────────┘             │
  │          v                               v                                               │
  │   LLM Gateway / Router            ML workers (admission pipeline)                       │
  │   (off-the-shelf now;             license · security · acceptance ·                     │
  │    own Gears-based later)         benchmark (isolated eval instance)                    │
  │          |                               |                                              │
  │          v                               v                                              │
  │   Inference engines (vLLM on GPU;  Model weights cache (object storage /                │
  │   light models on CPU; alternatives   in-cluster storage for closed envs)               │
  │   as adapters later)                                                                    │
  │                                                                                        │
  │  Base services: HA Postgres · Redis · NATS · ClickHouse · Prometheus · Grafana · Loki   │
  │  Infrastructure: Kubernetes (any distro) · NVIDIA GPU operator (CPU-only bootstrap OK)  │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Responsibility | M1 form |
|---|---|---|
| **Installer** | Installs/updates TF into a target Kubernetes cluster (Helm-based); includes base services and the NVIDIA GPU operator so the stack runs CPU-only until GPUs appear. | Helm packaging + adapted platform installer |
| **API Gateway** | Single entry point; TLS; routes Portal/API/management traffic; protects internal services (no bypass of auth by direct engine access). | Included |
| **Identity & Tenant management** | IdP integration (OIDC/SAML/social; corporate AD default in internal mode); tenants; user registration & directory sync; RBAC. | Keycloak (bundled) + one corporate OIDC IdP; manual tenant creation |
| **Model Registry** | Catalog of families, models, versions, capabilities, statuses, credit prices; source of truth for "what can be served to whom". | Minimal service/db |
| **Model Deployer** | Places verified models onto inference nodes (Kubernetes API/Helm), reports readiness and route. | Scripts acceptable |
| **ML workers** | Admission pipeline executors: license scanner, security scanner, download & weights storage, acceptance tests, benchmarking, trace collection. | Scripts + eval vLLM instance |
| **LLM Gateway / Router** | Request routing by model/family alias; auth/key verification; quota & licence enforcement; metering emission; (later: fallback, caps, MCP proxy). | Off-the-shelf router (LiteLLM) behind a stable facade |
| **Inference engines** | vLLM on GPU nodes; lightweight models on CPU; sticky routing for cache affinity. | vLLM |
| **Usage Collector & metering** | Per-request usage events → NATS → ClickHouse; reports and dashboards. | Included (stabilized by 30-Nov-2026) |
| **Plans / Quotas / Licence enforcement** | Per-customer plans, credit limits, overuse limits, per-user quotas; licence gate (stub in M1). | Gateway-integrated enforcement |
| **TF Customer Portal** | Self-service: registration/login, API keys, model list, usage, connection instructions. | Minimal pages |
| **Admin Console** | Tenants, plans, policies, catalog operations, reports, health. | Minimal pages |
| **Workflow orchestration** | Long-running, restart-surviving pipelines (model admission, rollouts) via Temporal + management backend. | Included; one-off scripts may cover gaps |
| **Observability** | Prometheus/Grafana metrics, Loki logs, Langfuse LLM traces, health checks, alerts. | Base stack |
| **Secrets** | Vault/OpenBao integration; keys and credentials never displayed after entry. | Existing plugin |
| **File Storage** *(later)* | User attachments and generated files with own links; long async tasks. | Out of M1/M2 |

The vendor additionally operates: **telemetry ingestion** (opt-in), the **update/notification channel**, and **entitlement-counter reports**.

## Technology decisions

| # | Topic | Decision |
|---|---|---|
| TD-1 | Router | Off-the-shelf router (**LiteLLM**) as the **temporary** component behind a stable facade; replaced by the own Gears-based LLM Gateway in A/B mode without external API change. Its enterprise-licensed features are not relied upon. |
| TD-2 | Orchestration | Kubernetes (any distro; Rancher reference) + **Temporal** for long-running workflows; no Docker Compose in the product path. |
| TD-3 | Off-the-shelf stack | vLLM, LiteLLM, Keycloak, Prometheus/Grafana, Loki, Langfuse, ClickHouse, NATS, Temporal, Vault/OpenBao, HA Postgres (3 replicas), Redis, object storage. |
| TD-4 | MCP | MCP engine **temporarily inside the Gateway module**; split out later if needed. |
| TD-5 | Model Registry vs Deployer boundary | Leading option: registry = catalog, capabilities, status; deployer = placement and routes (see open question 1). |
| TD-6 | Tenant cache isolation | The gateway adds a secret per-tenant `cache_salt` to every vLLM request and drops any client-supplied salt; vLLM then reuses cached prefixes only within one tenant (PRD FR-B7.2). The pinned vLLM version must support request cache salting. |
| TD-7 | Quota, rate limits, credit headers | Implemented in the gateway per PRD §7-G G.0; whatever the off-the-shelf router cannot do is built as a gateway extension. Capability check result: `<…>` TODO(ARCHITECT), due 2026-11-10. |

## Open questions

1. who owns model deployment & status? Model deployer or model-registry?
2. Model names aliases (e.g. any GLM) - if GLM disappears, need to route GLM traffic somewhere. E.g. model upgrades
3. should vLLM have authetication on front? — **Decided by PRD FR-E4.2:** engine endpoints must refuse unauthenticated calls, including from inside the cluster. Mechanism (NetworkPolicy, mTLS or engine API key): `<…>` TODO(ARCHITECT).
4. Should we have file downloader? or better introduce proxy for files access + files registry?
5. How to issue/revoke and authenticate/authorize LLM Gateway API clients?
6. How to organize LLM tokens rate limits - inbound / outbound? Check how LiteLLM is doing that.
7. How to collect usage from model gateway - use outbox or use sync API to usage collector?
8. Need to check how hw-usage-collector can collect GPU usage from vLLM and who owns it?
9. How to integrat policy engine, admission control, approvals and licensing?
10. Do we need to support Anthropic and OpenAI APIs in addition to Open Responses API?
