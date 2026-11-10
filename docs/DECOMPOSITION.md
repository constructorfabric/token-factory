# DECOMPOSITION

Components are taken from the [Model Factory architecture](img/model-factory.drawio.svg). Each owner is the top non-bot committer to the matching `gears/` folder in `gears-rust`. `TBD (new)` means the component has no gear yet.

Priorities: `p0` - demo in Q4'2026; `p1` - needed for the first release (manage models, serve the inference API); `p2` - needed for production at scale; `p3` - later.

![Model Factory](img/model-factory.drawio.svg)

# FW

## Nginx

- Owner: DevOps (Envoy gateway API)

- [ ] `p0` - #8 - Expose the OpenAI-compatible inference routes (`/v1/responses`, `/v1/chat/completions`, `/v1/embeddings`, `/v1/models`) on the single ingress and route them to model-gateway.
- [ ] `p0` - #9 - Pass SSE streams from model-gateway to the client without buffering, with keep-alive pings and correct handling of client disconnects.
- [ ] `p0` - #10 - Allow large request bodies on inference routes (long prompts, base64 images) with a configurable size limit per route.

# BSS

## products

- Owner: Diffora (`gears/bss/products`)

- [ ] `p3` - #11 - Define Model Factory product SKUs: L1 per GPU-hour, L2 per token (input, output, cached), dedicated endpoint, L3 per seat / per agent.
- [ ] `p3` - #12 - Define usage meters for model usage (input tokens, output tokens, cached tokens, embeddings tokens, GPU-hours, images) and link each meter to a SKU.
- [ ] `p4` - #13 - Link a product to one or more models from model-registry, so a model can be sold only when it is part of an active product.

## pricing

- Owner: Diffora (`gears/bss/pricing`)

- [ ] `p3` - #14 - Support per-model price books: a price per 1M input / output / cached tokens and per GPU-hour, set per tenant plan.
- [ ] `p3` - #15 - Publish the per-model price in AI credits so model-gateway plugins can compute the cost of a call from model settings.
- [ ] `p4` - #16 - Support tiered and volume prices (for example a lower token price after 100M tokens per month).

## quota-manager

### Quota management in Model Factory Backend

- Owner: TBD (new)

- [ ] `p0` - #17 - Simple/temporary implementation in Model Factory backend and pushing them to quota-enforcement.

### Standalone Quota management gear

- Owner: TBD (new)

- [ ] `p3` - #18 - Create the quota-manager gear that turns plans and entitlements into quota plans (AI-credit limits, token limits, rate limits per tenant and per user) and pushes them to quota-enforcement.
- [ ] `p3` - #19 - Let tenant admins split the tenant AI-credit budget between child tenants, users and API keys.
- [ ] `p4` - #20 - Support time windows for quotas (per day, per month) with automatic reset.
- [ ] `p4` - #21 - Send notifications when a tenant or user reaches 80% and 100% of a quota.

## payments

- Owner: TBD (new)

- [ ] `p4` - #22 - Create the payments gear with a PSP plugin interface and a Stripe plugin to charge cards and handle payment webhooks.
- [ ] `p4` - #23 - Support prepaid AI-credit top-ups: a tenant pays, and the credits are added to the tenant balance in ledger.
- [ ] `p5` - #24 - Add a bank transfer PSP plugin for enterprise invoices.

## subscriptions

- Owner: Diffora (`gears/bss/subscriptions`)

- [ ] `p3` - #25 - Implement the subscriptions gear (docs exist, no code yet): create, change and cancel a tenant subscription to a plan.
- [ ] `p3` - #26 - Grant entitlements from an active subscription (allowed models, seats, AI-credit packs) and remove them when the subscription ends.
- [ ] `p4` - #27 - Support trial subscriptions with a fixed AI-credit grant and an end date.

## rating

- Owner: capybutler (`gears/bss/rating`)

- [ ] `p3` - #28 - Implement the rating gear (docs exist, no code yet): read usage records from usage-collector and turn them into charges with the price book of the tenant.
- [ ] `p3` - #29 - Rate model usage per model, per tenant and per API key, so the cost is visible at each level.
- [ ] `p4` - #30 - Re-rate usage for a past period when a price was corrected.

## invoicing

- Owner: TBD (new)

- [ ] `p4` - #31 - Create the invoicing gear that builds a monthly invoice per tenant from rated charges, with one line per model and SKU.
- [ ] `p4` - #32 - Export invoices and GL entries to the ERP / accounting system.

## ledger

- Owner: Diffora (`gears/bss/ledger`)

- [ ] `p3` - #33 - Keep a per-tenant AI-credit balance account: add credits on purchase or grant, and subtract credits on rated usage.
- [ ] `p4` - #34 - Provide a per-tenant statement of credit movements (grants, top-ups, usage, refunds) for the web console.

# OSS

## account-manager

- Owner: Diffora (`gears/system/account-management`)

<!-- need to decide how API keys should be managed in OSS
- [ ] `p1` - #{ID} - Let users create, list, rotate and revoke personal API keys for the inference API, with an optional expiry date and allowed models.
- [ ] `p1` - #{ID} - Let tenant admins create service API keys for tenant apps and agents, not bound to a user.
- [ ] `p2` - #{ID} - Show the last-used time and usage of each API key in the web console.
-->

## license-enforcement

- Owner: Alex T (`gears/system/license-enforcement`)

- [ ] `p0` - #35 - Implement the license-enforcement gear (docs exist, no code yet): check that a tenant has a valid grant before a model call.
- [ ] `p0` - #36 - Support seat grants for chat users and per-model grants for premium models.
- [ ] `p2` - #37 - Add resource groups support.

## quota-enforcement

- Owner: Vladan Gojgic (`gears/system/quota-enforcement`)

- [ ] `p0` - #38 - Add AI-credit quota types for model usage: reserve an estimated cost before the call and commit the real cost after the call.
- [ ] `p0` - #39 - Add token quota types (input + output tokens per period) per tenant, user and API key.
- [ ] `p2` - #40 - Add resource groups support.
- [ ] `p3` - #41 - Add concurrent-request limits per tenant for expensive models (for example max 5 parallel requests to a 70B model).

## usage-collector

- Owner: capybutler (`gears/system/usage-collector`)

- [ ] `p0` - #42 - Add usage record types for model calls: tenant, user, API key, model id, input / output / cached tokens, cost in AI credits, capabilities (reasoning effort, fast/normal), status.
- [ ] `p1` - #43 - Add usage records for GPU deployed models (GPU type, count, hours) per tenant and deployment.
- [ ] `p2` - #44 - Provide a usage query API grouped by model, tenant, user, API key and day, for the web and admin consoles.


## resource-groups

- Owner: ffedorof (`gears/system/resource-groups`)

???

## hw-usage-reporter

- Owner: TBD (`TBD`)

- [ ] `p1` - #45 - Collect GPU usage records for deployed models (GPU type, count, hours) per tenant and deployment.

<!--
Need to check with VZ team
-->


## policy-engine

- Owner: Fluid (`gears/system/policy-engine`)

<!--
Need to check with Virtuozzo team. Do we need it all in p1?

- [ ] `p1` - #{ID} - Add Rego policies for model access: which tenants, roles and API keys may call which models.
- [ ] `p1` - #{ID} - Add Rego policies for Model Ops actions: who may register, scan, benchmark, approve, deploy and undeploy models.
- [ ] `p2` - #{ID} - Add data-residency policies: allow a model only when its hosting region matches the tenant region.
-->

## admission-control

- Owner: Fluid (`gears/system/admission-control`)

<!--
Need to check with Virtuozzo team. Do we need it all in p1?

- [ ] `p1` - #{ID} - Check model deployments before IRM provisions them: the GPU type and count are allowed for the tenant and there is enough GPU capacity.
- [ ] `p2` - #{ID} - Reject deployments of models that have not passed model-scanner or are not approved in model-registry.
-->

# GenAI - Model endpoints

## llm-gateway

- Owner: pr0tey (`gears/llm-gateway`)

- [ ] `p0` - #46 - Implement Open Responses API, normalize errors and completion statuses
- [ ] `p0` - #47 - Add pass-through APIs for OpenAI and Anthropic APIs.
- [ ] `p0` - #48 - Finalize pass-through design - ensure it's secure and doesn't expose other tenants documents.
- [ ] `p0` - #49 - Resolve each request through model-registry (or model-router), fetch the provider key from credstore, and call the provider plugin through oagw.
- [ ] `p0` - #50 - Run the request pipeline hooks in a fixed order: authn, tenant, authz, license, quota reserve, guardrails, provider call, quota commit, usage record.
- [ ] `p0` - #51 - Implement the embeddings API for all plugins that support it.
- [ ] `p0` - #52 - Add retries for provider calls that fail with transient errors.
- [ ] `p0` - #53 - Emit prometheus metrics per model (requests, errors, latency, time to first token, tokens per second).
- [ ] `p0` - #54 - Stream prompt and response metadata for model calls to LangFuse, with a retention period per tenant.
- [ ] `p2` - #55 - Add fallback/switch/balancing to the next model from model-router when the provider returns a retriable error (timeouts, 429, 5xx) before any output was streamed.
- [ ] `p2` - #56 - Support async jobs and batch requests with results stored in file-storage.
- [ ] `p3` - #57 - Support image generation, text-to-speech and speech-to-text APIs.

Plugin:

- [ ] `p0` - #58 - vLLM plugin, Owner: TBD (new)
- [ ] `p0` - #59 - OpenAI plugin, Owner: TBD (new)
- [ ] `p0` - #60 - Anthropic plugin, Owner: TBD (new)
- [ ] `p2` - #61 - Azure OpenAI plugin, Owner: TBD (new)
- [ ] `p2` - #62 - Gemini plugin, Owner: TBD (new)
- [ ] `p2` - #63 - Jev plugin, Owner: TBD (new)

## llm-gw-mngr

- Owner: TBD (new)

<!-- Need to decide where we store tokens  -->
- [ ] `p1` - #64 - Manage LLM gateway API
- [ ] `p2` - #65 - BYOK support

## tenant-resolver

- Owner: aviator5 (`gears/system/tenant-resolver`)

- [x] `p0` - #{ID} - Resolve the tenant and its ancestors from an API key in under a few milliseconds (cached), so model-gateway and model-registry can build the effective model catalog per request.

## license-resolver

- Owner: Alex T (`gears/system/license-resolver`)

- [x] `p0` - #{ID} - Answer "is this tenant / user licensed to call this model?" with a cached, low-latency call from the model-gateway pipeline.

## quota-enforcer-sdk

- Owner: TBD (new)

- [ ] `p0` - #66 - Create the quota-resolver hook for model-gateway: reserve the estimated AI-credit cost before the call, commit the real cost after it, and release the reservation on error or client disconnect.
- [ ] `p0` - #67 - Return a clear `quota_exceeded` error with the quota name and reset time when a request is over the limit.

## usage-collector SDK

- Owner: CommName (`gears/system/usage-collector`)

- [x] `p0` - #{ID} - Add an SDK helper for model-gateway that sends one usage record per model call with at-least-once delivery, also for streams that end early.
- [ ] `p0`- #{ID} - Add remote usage collection support for model-gateway.

## authn-resolver

- Owner: aviator5 (`gears/system/authn-resolver`)

- [ ] `p0` - #68 - Validate API keys (hashed lookup, expiry, revocation) and return the user, tenant and key scopes (allowed models).

## authz-resolver

- Owner: aviator5 (`gears/system/authz-resolver`)

- [x] `p0` - #{ID} - Add the `model:evaluate` permission check per model and the model-registry / Model Ops management permissions to the PEP / PDP flow.
- [ ] `p0` - #69 - Need to register two roles - `model:register` and `model:use`

## guardrails

- Owner: TBD (new)

- [ ] `p2` - #70 - Create the guardrails hook for model-gateway that checks input and output with configurable rules (blocked words, prompt-injection check, moderation model) and blocks or flags the request.
- [ ] `p2` - #71 - Let tenant admins enable guardrail rules per tenant and per model.

## PII redaction

- Owner: TBD (new)

- [ ] `p2` - #72 - Create the PII redaction hook that finds personal data (emails, phones, card numbers, names) in prompts and masks it before the provider call, with an option to restore it in the response.
- [ ] `p2` - #73 - Let tenant admins turn PII redaction on per tenant and per provider (for example only for external providers).

## chat-engine

- Owner: Dmitry Matveev (`gears/chat-engine`)

- [ ] `p3` - #74 - Call models only through model-gateway and list models through model-registry, so chat uses the same access, quota and usage rules as the API.
- [ ] `p3` - #75 - Let users pick a model, or "auto", per chat session; "auto" uses model-router.

## file-downloader

- Owner: TBD (new)

- [ ] `p2` - #76 - Create the file-downloader gear that downloads provider files (generated images, batch results) and stores them in file-storage, linked to the request.

## model-router

- Owner: TBD (new)

- [ ] `p3` - #77 - Semantic router by prompt ("prompt -> best model") using a small classifier model.

## model-registry

- Owner: Qilin101 (`gears/model-registry`)

- [ ] `p0` - #78 - Create the model-router gear with model aliases (for example `glm-latest` -> `vllm::glm-4.6`), so clients keep working when a model is upgraded or removed.
- [ ] `p0` - #79 - Implement the model-registry service (only the SDK exists today): provider and model CRUD, sharing, shadowing, approval, effective catalog and resolve API, as defined in the model-registry PRD.
- [ ] `p0` - #80 - Register self-hosted models with a link to their deployment: when model-deployer creates or removes an endpoint, the model `base_url` and status are updated.
- [ ] `p0` - #81 - Store model lifecycle status (registered, downloading, scanning, benchmarking, ready, deployed, deprecated, retired) and show it in the admin console.
- [ ] `p0` - #82 - Store model metadata from the model card: source (Hugging Face repo and revision), license, size, quantization, context window, capabilities.
- [ ] `p0` - #83 - Support Redis through `cluster` gear for caching.
- [ ] `p2` - #84 - Support model deprecation with a retirement date and a replacement model, and warn callers of deprecated models in the response headers.
- [ ] `p2` - #85 - Store benchmark and scan results per model version and show them in the catalog.
- [ ] `p2` - #86 - Record a change audit for every provider and model change (create, update, delete, approve, share).
- [ ] `p2` - #87 - Route by request features: pick a model that supports the needed capabilities (tools, vision, context size) and is cheapest.
- [ ] `p2` - #88 - Support weighted routing between deployments of the same model (canary, A/B test).

## MCP registry

- Owner: TBD (new)

- [ ] `p2` - #89 - Create the MCP registry gear: tenant admins register external and internal MCP tool servers with their URL, auth (via credstore) and allowed tools.
- [ ] `p2` - #90 - Let chat-engine and agents list the MCP tools allowed for the tenant and call them through oagw.

## file-storage

- Owner: Roland From (`gears/file-storage`)

- [ ] `p2` - #91 - Provide short-lived signed URLs for images and documents, so model-gateway can pass them to providers instead of base64.
- [ ] `p2` - #92 - Store model-gateway batch inputs and outputs with a retention period per tenant.

# GenAI - Model Ops

## Model Factory backend

- Owner: TBD (new)

- [ ] `p0` - #93 - Let admins set which tenants are allowed to use each deployed model (writes the sharing and approval settings in model-registry).
- [ ] `p0` - #94 - Map models to subscription licenses and create licenses if needed.
- [ ] `p1` - #95 - Run each lifecycle step (register, download, scan, benchmark, approve, deploy, promote, retire) as a task-engine job/pipeline.
- [ ] `p2` - #96 - Promote a model version from staging to production after benchmarks pass, and switch the model-router alias to it.
- [ ] `p2` - #97 - Price and AI tokens configurator for self-hosted and third-party models.
- [ ] `p2` - #98 - Show a per-model dashboard: requests, latency, errors, GPU usage and cost.
- [ ] `p3` - #99 - Compute the cost of a self-hosted model call from the token prices in the model settings.

## model-scanner

- Owner: TBD (new)

<!-- NOTE: p0 - the scanner supposed to be fully 'manual' and ad-hoc, ML engineers should just provide the list of approved models -->

- [ ] `p1` - #100 - Create the model-scanner gear that checks downloaded model files for unsafe formats (pickle) and known malware before deployment, and blocks unsafe models.
- [ ] `p1` - #101 - Read the model license from the model card and store it in model-registry; flag licenses that do not allow commercial use.
- [ ] `p1` - #102 - Check model country origin.
- [ ] `p3` - #103 - Check model files against the expected checksums of the source revision to find changed files or backdoors.

## model-benchmark

- Owner: TBD (new)

<!-- NOTE: p0 - the benchmark supposed to be fully 'manual' and ad-hoc, ML engineers should just provide the list of approved models -->

- [ ] `p1` - #104 - Create the model-benchmark gear that starts a temporary vLLM deployment, runs a performance test (throughput, time to first token, latency at N parallel users) and removes the deployment.
- [ ] `p2` - #105 - Run quality benchmarks (for example MMLU, GSM8K, a tenant test set) and compare the result with the current production model.
- [ ] `p2` - #106 - Recommend a GPU type, GPU count and vLLM settings for a model based on benchmark results.
- [ ] `p2` - #107 - Make benchmark runs retriable and resumable after a failure.

## model-deployer

- Owner: TBD (new)

<!-- NOTE: p0 - deploy is done by DevOps team manually, based on input from ML team, status reported to graph-storage -->

- [ ] `p1` - #108 - Create the model-deployer gear that deploys a model to the GPU pool as a vLLM endpoint through IRM / Kubernetes + Helm, with GPU type, GPU count and vLLM settings.
- [ ] `p1` - #109 - Manage deployments: list, scale (replicas, GPU count), restart and remove model endpoints per tenant.
- [ ] `p1` - #110 - Track deployment status (pending, starting, ready, failed, stopped), run health checks, and update the endpoint and status in model-registry.
- [ ] `p1` - #111 - Register the endpoint in oagw as an approved destination, and set its auth (API key in credstore or network-only access).
- [ ] `p2` - #112 - Autoscale replicas by load (queue length, GPU usage) and scale to zero for rarely used models.
- [ ] `p2` - #113 - Do rolling updates when a model version or vLLM version changes, without downtime.
- [ ] `p2` - #114 - Support dedicated endpoints for one tenant and shared endpoints for many tenants.

## model-downloader

- Owner: TBD (new)

<!-- NOTE: p0 - download is done by DevOps team manually, based on input from ML team, status reported to graph-storage -->

- [ ] `p1` - #115 - Create the model-downloader gear that downloads a model from Hugging Face (or the internal mirror) by repo and revision and stores it in object storage.
- [ ] `p1` - #116 - Make downloads retriable and resumable, check file checksums, and report progress.
- [ ] `p2` - #117 - Support private Hugging Face repos with a token from credstore.
- [ ] `p2` - #118 - Keep an internal mirror: download a model once and reuse it for all deployments and tenants.

# Core

## oagw

- Owner: striped-zebra (`gears/system/oagw`)

- [ ] `p0` - #119 - Support long-lived streaming responses (SSE) from providers and vLLM endpoints without timeouts or buffering.
- [ ] `p1` - #120 - Let model-deployer add and remove approved destinations for vLLM endpoints at runtime.
- [ ] `p2` - #121 - Add per-destination circuit breakers, so model-router can skip a failing provider.

## credstore

- Owner: Roland (`gears/credstore`)

- [ ] `p0` - #122 - Store provider API keys (OpenAI, Anthropic, Azure, Gemini, Hugging Face) per tenant and share them down the tenant tree, referenced from model-registry.
- [ ] `p0` - #123 - Store credentials in HashiCorp Vault.
- [ ] `p2` - #124 - Support key rotation without downtime: keep the old and new key valid for a grace period.

## settings-service

- Owner: shaneemberton (`gears/settings-service`)

<!-- NOTE: do we really need it? If yes, are there missing features? -->

- [ ] `p1` - #125 - Add tenant and user settings for Model Factory: default model,
- [ ] `p1` - #{ID} guardrails and PII redaction on/off, data region.

## graph-storage

- [ ] `p0` - #126 - Custom model metadata - deployment status, benchmark results, etc.

## event-broker

- Owner: Striped Zebra (`gears/system/event-broker`)

- [ ] `p0` - #127 - Define typed events for the model lifecycle (model registered, scanned, benchmarked, approved, deployed, failed, retired) so other gears and the console can react.
- [ ] `p2` - #128 - Define events for quota warnings and quota exceeded, for notifications.

## audit

- Owner: TBD (new)

- [ ] `p0` - #129 - Define audit topic that can be used for model management (register, approve, deploy, retire), API key changes and access denials.

## task-engine / temporal

- Owner: Artifizer (`gears/task-engine`)

<!-- NOTE: do we use Temporal of Task Engine? -->

- [ ] `p1` - #130 - Implement the task-engine gear (docs exist, no code yet): queues, leases, retries, timeouts and progress, as defined in the task-engine PRD.
- [ ] `p1` - #131 - Support long-running jobs (hours) with heartbeats and checkpoints, for model downloads and benchmarks.
- [ ] `p1` - #132 - Support parent and child tasks, so the Model Factory backend can run a pipeline (download -> scan -> benchmark -> deploy) as one job.

## types-registry

- Owner: Aviator5 (`gears/system/types-registry`)

- [ ] `p0` - #133 - Register GTS schemas for provider settings of each model-gateway plugin, model metadata, deployment specs and Model Ops events.

# Infrastructure

## vLLM (compute infra, GPU nodes pool)

- Owner: TBD

<!-- NOTE: p0 - vLLM is managed by Infra team entirely -->

- [ ] `p1` - #134 - Disable models' code execution
- [ ] `p1` - #135 - Set up the GPU node pool and a standard vLLM Helm chart (model from object storage, GPU settings, metrics, health checks).
- [ ] `p1` - #136 - Decide and set up auth in front of vLLM endpoints (auth proxy, gateway or network policy only), so only oagw can call them.
- [ ] `p2` - #137 - Enable KV cache and prefix caching settings per model and measure the gain.
- [ ] `p2` - #138 - Support hosted, cloud and hybrid GPU pools (on-prem nodes plus cloud GPUs).

## Kubernetes API + Helm

- Owner: TBD

<!-- NOTE: p0 - Kubernetes API + Helm is managed by Infra team entirely -->

- [ ] `p1` - #139 - Provide a cluster with GPU operator, a namespace per environment and RBAC for model-deployer to install and remove Helm releases.

## Vault / KMS

- Owner: TBD

- [ ] `p0` - #140 - Set up Vault / KMS as the credstore backend for provider keys and Hugging Face tokens.

## Database

- Owner: TBD

- [ ] `p0` - #141 - Deploy database for gears.
- [ ] `p1` - #142 - Set up database replication and backups.

## Redis

- Owner: TBD (cluster cache/locks via `gears/system/cluster`: Andre Smith)

- [ ] `p0` - #143 - Provide Redis for low-latency caches on the inference path (API keys, tenant tree, resolved models, quota counters) and for distributed locks.

## ClickHouse

- Owner: DevOps

- [ ] `p0` - #144 - Store usage and metering records in ClickHouse, with tables and views for usage by tenant, model, API key and day.

## Victoria Metrics

- Owner: DevOps

- [ ] `p0` - #145 - Collect metrics from model-gateway, vLLM endpoints and GPU nodes (GPU usage, memory, power in watts).
- [ ] `p1` - #146 - Add alerts for high error rate, high latency, failed deployments and full GPU pool.

## Perses

- Owner: DevOps

- [ ] `p0` - #147 - Create dashboards for inference (requests, latency, tokens per second, errors per model) and for the GPU pool (usage, free capacity).

## Object storage (S3, SeaWeedFS)

- Owner: DevOps

- [ ] `p0` - #148 - Provide buckets for model weights, benchmark results and file-storage, with access only for the gears that need them.

## Victoria Logs

- Owner: DevOps

- [ ] `p0` - #149 - Collect logs from all Model Factory gears, with one trace id from api-gateway to the vLLM endpoint.

## Victoria Trace

- Owner: DevOps

- [ ] `p0` - #150 - Collect traces from all Model Factory gears, with one trace id from api-gateway to the vLLM endpoint.

## Langfuse

- Owner: DevOps

- [ ] `p0` - #151 - Send model call traces (model, tokens, latency, cost) to Langfuse for prompt and quality analysis, without prompt content by default.