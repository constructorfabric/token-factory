# Token Factory PRD

## 1. Document information

| Field | Value |
| --- | --- |
| Product name | Token Factory |
| Version | 2.0 |
| Date | 2026-11-06 |
| Status | Draft |
| Author | Token Factory product team |
| Approved by | None |

## 2. Summary

Token Factory is open-source software that a company or a person installs on its own or rented servers. It runs AI language models there and gives people access to them through an API.

It is for companies that want their developers, students and customers to use AI models with control over access and cost. Today such teams pay rising fees to outside AI services, or run models by hand and hand out keys one by one. Token Factory checks each new model, puts it into service, decides who may use which model and how much, and counts every use.

## 3. Terms and abbreviations

| Term | Meaning |
| --- | --- |
| A/B test | A comparison of 2 versions that sends each version a share of the traffic. |
| Acceptance test | A short check that a model loads, gives sane answers and can call tools before it is served. |
| Active Directory | A directory of people and groups from Microsoft that many companies use to sign people in. |
| Admin Console | The administration website from Stage 2. It replaces the Admin page. |
| Admin page | The single administration web page of Stage 1, where the Instance Admin follows model checks and promotes models. |
| Admission | The checks that a model version passes before users can call it: license, source, format, capacity, acceptance tests and benchmarks. |
| Allowlist | A list of allowed items. Anything not on the list is refused. |
| Anthropic Messages | The request format of the Anthropic API for chat with models. Claude Code uses it. |
| Apache License 2.0 | A permissive open-source license that also grants rights to any patents of the authors. |
| API key | A secret text that a user or an application sends with each request to prove who it is. |
| Audit record | A stored entry that says who did what, to which object, when, and with what result. |
| Authentication error | The refusal for a missing, wrong, expired or revoked key, or for a suspended user or tenant. |
| Batch request | A set of model requests that the product runs in the background and returns as a file of results. |
| Benchmark | A standard set of tasks that measures how well a model works. |
| Break-glass account | A local admin account for emergencies, used while the identity provider is down. |
| Building block | An existing part that a stage uses first: open-source software, an existing company platform part, or a script. |
| Cache salt | A secret value per tenant that keeps cached prompt parts of different tenants apart. |
| Cached input token | An input token that the inference engine takes from its cache instead of processing it again. |
| Chat Completions | The OpenAI request format for chat with models, which many tools use. |
| Chat template | The text pattern that turns a conversation into model input. |
| Check-then-charge | Charging that checks before a request that credits remain and charges the real cost when the request ends. |
| Checksum | A short value computed from a file. It changes when the file changes. |
| Claims mapping | Rules that turn facts from the identity provider, such as roles, into a tenant and a role in the product. |
| Claude Code | An AI coding tool from Anthropic that talks to models in the Anthropic Messages format. |
| Client application | A program that calls the Inference API with a key, such as a coding tool, an AI agent or a chat app. |
| Cluster | A group of servers that Kubernetes runs as one system. One instance runs in one cluster. |
| Component plan | The company's list of target components with their priorities p1 to p5. |
| Component priority | The priority of a target component in the component plan: p1 for the first release, p2 for production at scale, p3 and higher for later. |
| Concurrency limit | The largest number of requests that can run at the same time for one user, tenant or engine. |
| Conformance set | A fixed set of API requests with expected results that shows whether the product follows an API format. |
| Constructor Fabric | The platform program under which Token Factory is built. It supplies reusable parts called gears. |
| Constructor Fabric Pass | The community sign-up service of Constructor Fabric, whose admins approve people and give them roles. |
| Constructor Tech | The first partner company, which runs its own instance for its users. |
| Context length | The largest number of tokens that a model can handle in one request, input and output together. |
| Copyleft license | A license that requires changed copies to use the same license. GPL and AGPL are strong copyleft licenses. |
| CPU | The main processor of a computer. |
| CPU test model | A small model that runs without GPUs and is used for tests. |
| Credit | The unit in which the product counts use. Each model has a credit price per 1 million tokens of each token class. |
| Credit counter | The credits used in the current period by one user, tenant or key. |
| CSV | A plain text table format in which commas separate the values. |
| Customer Admin | A person who manages one tenant: its users, rules and usage. |
| Customer Portal | The website where users sign in, manage keys, see models and usage, and copy snippets. Its short name is the Portal. |
| Data plane | The parts of an instance that process model requests, as opposed to the parts that manage it. |
| Default model | The model version that answers when a request names a family. |
| Deprovisioning notice | A signed message from the identity provider that says a person lost access. |
| DevOps engineer | A person who builds, installs and runs software systems. |
| Embedding | A list of numbers that a model returns to represent the meaning of a text. |
| Engine endpoint | The internal address at which one inference engine accepts requests. |
| Entitlement counter | A count, such as users or monthly tokens, that the vendor can use to offer paid services. |
| Envoy Gateway | Open-source software that receives outside traffic and routes it to the right part. |
| Eval instance | A separate inference engine used only for benchmarks, never for user traffic. |
| External model | A model that an external model provider runs and the product calls through that provider's API. |
| External model provider | A company that sells model use through its own API, such as OpenAI, Anthropic, Azure OpenAI or Google Gemini. |
| Fallback list | An ordered list of models that answer a family request when an earlier model cannot. |
| Family | A named group of model versions, such as GLM or Qwen. A request can name a family instead of one version. |
| First sign-in provisioning | Creating a user account in the product when a person signs in for the first time. |
| Flagship | The vendor's own production instance, named Constructor Fabric TF. |
| Gated model | A model on Hugging Face that can be downloaded only with an access token. |
| Gateway | The part of the inference service that receives every API call and routes it. |
| Gear | A reusable part of the Constructor Fabric platform. |
| GitHub | A public website for sharing source code. People can use their GitHub account to sign in to other websites. |
| GPU | A processor built for the heavy math that AI models need. |
| Grafana | Open-source software for dashboards, under the AGPL-3.0 license. |
| Guardrail | A rule that checks a prompt or an answer and blocks or flags it. |
| Helm | Open-source software that installs and upgrades programs on Kubernetes from packages. |
| HTTP | The basic way web browsers and servers exchange data, without encryption. |
| Hugging Face | A public website where model makers publish model files and model cards. |
| Identity provider | A system that signs people in and tells the product who they are. |
| Inference | Running a model to produce an answer for a request. |
| Inference API | The API that users and client applications call to get answers from models. |
| Inference engine | Software that loads a model on GPUs or CPUs and runs inference. |
| Insight view | The vendor's screen that shows the telemetry of opted-in instances. |
| Instance | One installed, running copy of Token Factory. |
| Instance Admin | A person of the TF Provider who installs, configures and runs an instance. |
| Instance configuration | The settings file of an instance. In Stage 1, the Instance Admin manages most settings there. |
| Instance contact | The support contact that the Instance Admin sets for the instance. |
| ISO 8601 | An international standard for writing dates and times. |
| Keep-alive message | An empty message that keeps a quiet connection open. |
| Keycloak | Open-source software that signs people in and connects to other identity providers. |
| Kubernetes | Open-source software that runs and manages programs across the servers of a cluster. Rancher, GKE, Virtuozzo Kubernetes, kubeadm and k3s are versions of it. |
| Langfuse | Open-source software that keeps traces of model calls for analysis. |
| LiteLLM | Open-source software that offers one API in front of many models and model providers. |
| Loki | Open-source software for logs, under the AGPL-3.0 license. |
| MCP | Model Context Protocol, a standard way for AI tools to call outside tools and data. |
| MCP server | A program that offers tools to AI clients through MCP. |
| Model card | The description page of a model on Hugging Face, including its license. |
| Model hub | A website that publishes models for download, such as Hugging Face. |
| Model license | The legal terms under which a model's files can be used. |
| Model version | One exact release of a model, such as GLM-5.3, with its files and settings. |
| Moderation model | A model that labels text as harmful or not. |
| Node | One server of a cluster. |
| Not-found error | The refusal for an unknown model or family, or for an endpoint that the product does not offer. |
| NVIDIA | The company that makes most GPUs used for AI. |
| Open Responses | An open, published format for model requests and answers, based on the OpenAI Responses format. |
| Open-weight model | A model whose files anyone can download and run. |
| OpenID Connect | A standard way for websites to sign people in through an identity provider. |
| Outage error | The refusal when no healthy engine exists or an external model provider does not answer. |
| Overuse allowance | Credits that a tenant can use after its plan's credits run out, up to a set amount. |
| Penetration test | A test in which security experts try to break into a system. |
| Performance test | A test that measures a model's tokens per second, time to first token and latency at a set number of parallel users. |
| Permission error | The refusal when the caller's tenant or key does not allow the requested model. |
| Permissive license | An open-source license that allows use, change and resale, also in closed products, with only notice duties. Examples are Apache-2.0, MIT, BSD, ISC and Zlib. |
| PII | Personally identifiable information, such as names, email addresses, phone numbers and card numbers. |
| PII redaction | Replacing PII in a prompt with markers before a model sees it. |
| Plan | From Stage 2, a set of allowed models and limits that the Instance Admin gives a tenant. |
| Policy | From Stage 2, a rule by a Customer Admin that allows or blocks models for users or groups. |
| Precision | The number format in which a model's numbers are stored. Lower precision saves memory and can lower quality. |
| Promotion | The Instance Admin's decision to put a checked model version into service. |
| Prompt caching | A provider function that reuses parts of earlier prompts and charges less for them. |
| Quota error | The refusal when the credits of the period are used up. |
| Rate limit | A limit on how many requests or tokens a user, tenant or key can send in a time window or at once. |
| Rate-limit error | The refusal when a rate limit is reached. It tells the client when to retry. |
| Reference cluster | The standard cluster of 5 servers that the vendor installs and tests every day. |
| Replica | One running copy of an inference engine for a model. |
| Reserve-then-commit | Charging that reserves a request's estimated cost first, charges the real cost at the end, and releases the rest. |
| Responses | The OpenAI request format for model answers that can use tools and keep state. |
| Rollout ring | A group of users that gets a new version before or after other groups. |
| Router | Software that sends model requests to the right model. |
| Runtime profile | The inference engine settings that an instance uses to serve self-hosted models. |
| SAML | An older standard for signing people in through an identity provider. |
| SBOM | Software bill of materials: a list of every software part inside a release. |
| SCIM | A standard way for an identity provider to create, change and remove user accounts in another system. |
| Service key | An API key that belongs to a tenant, not to a person, for applications and automated jobs. |
| Shadow test | A test that sends copies of real requests to a new model without showing its answers to users. |
| Single sign-on | Signing in once to use several systems. |
| Smoke test | A short automated test that checks the main functions after an install or upgrade. |
| Snippet | A short piece of text or a command that sets up a tool to use the instance. |
| Source-available license | A license that shows the source code but limits its use, so it is not open source. Examples are SSPL, BUSL and RSAL. |
| Stage | A release step of the product. Each stage adds capabilities for users. |
| Staged rollout | Moving a share of a family's traffic to a new model version in steps. |
| Standard profile | The installation layout of the reference cluster: 3 control nodes and 2 worker nodes. |
| Storage class | A cluster setting that tells the cluster where to keep data. |
| Streaming | Sending an answer in parts while the model produces it. |
| Structured output | An answer in a fixed data format that the request defines. |
| Target component | A purpose-built Constructor Fabric gear that replaces a building block. |
| Temporal | Open-source software that runs long, multi-step jobs and continues them after restarts. |
| Tenant | A customer account of an instance: a company, a department or a person. Every user belongs to one tenant. |
| Tenant settings | The Stage 1 settings of a tenant: allowed models, default credit limits and a concurrency limit. |
| Terminal Bench | A public benchmark that measures how well a model completes tasks in a computer terminal. |
| TF Provider | The company or person that installed and runs an instance. |
| Time to first token | The time from sending a request to receiving the first part of the answer. |
| TLS | The standard that encrypts traffic between two computers on a network. |
| Token | A small piece of text, often part of a word, that models read and write. |
| Token class | A kind of token with its own credit price: uncached input, cached input, output and cache write. |
| Tool calling | A model's way of asking the client application to run a named tool and return the result. |
| Tool matrix | A table of validated client tools and functions, such as streaming and tool calls, with a test result for each. |
| Tool-call probe | A test request that checks whether a model calls a tool correctly. |
| User | A person who uses models through an instance with their own keys. |
| UTC | Coordinated Universal Time, the world time standard. |
| Vector store | A database that finds texts by meaning, used for search over documents. |
| Vendor | The authors and owners of Token Factory, who publish its releases. |
| VictoriaLogs | Open-source software that collects and searches logs. |
| VictoriaMetrics | Open-source software that collects and stores measurements over time. |
| vLLM | Open-source inference engine software that serves many open-weight models. |
| WCAG | Web Content Accessibility Guidelines, a widely used accessibility standard. |
| Webhook | A web address of another system that the product calls to send it a notice. |
| Weights | The files that hold what a model has learned. |
| Weights cache | Storage in the instance that keeps downloaded weights, so that they are not downloaded again. |

## 4. Problem and context

- **Problem**: Teams that use AI models every day have these problems:
    - They depend on a few outside AI services. Fees rise, and the teams cannot predict or control the spend.
    - Companies that run models on their own servers set each model up once by hand. Every update becomes a project.
    - New model versions arrive without checks of license, source, quality or fit for the hardware.
    - No common rules decide who may use which model, how much, and at whose cost.
    - Shared model routers can reuse one company's cached prompts for another company.
- **Today's solution**:
    - Developers use outside AI tools and services directly and pay per seat or per token.
    - The current in-house setup runs models on 24 GPUs behind one router address.
    - People get keys by hand or from an email job, and few people use the setup.
    - Each new model version is installed by hand, without checks and without a way back.
- **Why now**:
    - The community event on 5 December 2026 needs a working service for contributors, students and partners.
    - In October 2026 the company decided to give qualified students access to models on its own hardware.
    - Outside AI services face rising compute costs, which can lead to higher prices or tighter lock-in.
    - The partner Constructor Tech wants to run the same service for its own users.
- **Evidence**:
    - About 17 to 18 keys exist for about 600 employees on the current router (internal meeting notes, 21 October 2026).
    - One ecosystem company spends up to $5 million a year on AI subscriptions (internal meeting notes, 26 October 2026).
    - 24 GPUs cost about $420,000 a year at $2 per GPU-hour (internal estimate, 2 October 2026).
    - About 10 active users per server with 8 GPUs work without problems today (internal meeting notes, 2 October 2026).
    - Teams already send prompts of 260,000 and 500,000 tokens (internal meeting notes, 26 October 2026).
    - The current router does not keep cached prompts of different companies apart (internal review, 26 October 2026).

## 5. Users and roles

- **Audience**:
    - Contributors of the Constructor Fabric community, who use the flagship.
    - Constructor Tech, the first partner, which runs its own instance for its users.
    - Students in education programs, who get qualified access on the flagship.
    - Engineering companies of the ecosystem, which run instances for their staff. One of them has about 600 employees.
    - Any company or person, after the public open-source release.

#### ROLE-01 Vendor
- **Description**: The authors and owners of Token Factory. They publish releases and offer paid services to TF Providers.
- **Needs**: Know how instances are used and how well they work. Know the counts that paid services depend on.
- **Use**: Weekly, when they publish a release. Monthly, when they review telemetry and entitlement counters.
- **Can do**: Publish releases and release notices. Receive telemetry and entitlement counters only from instances whose Instance Admin turned sharing on.
- **Cannot do**: Reach an instance, its data or its users without the Instance Admin's consent. Make an instance depend on a vendor connection.

#### ROLE-02 Instance Admin
- **Description**: A person of the TF Provider who installs, configures and runs one instance. DevOps engineers who install instances act in this role.
- **Needs**: Install and upgrade the instance repeatably. Bring models into service with evidence. Set who may use what, and see usage and health.
- **Use**: Daily for operations, for each new model version, and at each upgrade.
- **Can do**: Manage everything on their own instance: tenants, tenant settings, models, families, prices, limits, external model providers, upgrades and backups.
- **Cannot do**: Read prompt or response text. The product does not store it in Stage 1, and from Stage 2 stores it only for tenants that ask.

#### ROLE-03 Customer Admin
- **Description**: A person who manages one tenant for their company or department.
- **Needs**: Give their people access, set which models they may use and how much, and see the tenant's usage.
- **Use**: When people join or leave, when rules change, and monthly for usage.
- **Can do**: In Stage 1, the same as a user. From Stage 2, manage users, groups, policies, service keys and the tenant's identity provider, only in their own tenant and within its plan.
- **Cannot do**: See or change other tenants. Give more models or credits than the tenant's plan allows.

#### ROLE-04 User
- **Description**: A person who uses models through an instance, such as a developer, product manager, researcher, tester or student.
- **Needs**: Use approved models from their own tools with little setup. Know their limits before they reach them.
- **Use**: Daily, through coding tools, agents and their own applications.
- **Can do**: Create and revoke their own keys, see and call the models their tenant allows, and see their own usage and limits.
- **Cannot do**: See other users' keys or usage. Call models that their tenant or key does not allow.

#### ROLE-05 Client application
- **Description**: A program that calls the Inference API with a user's key or a service key. Examples are Claude Code, other coding tools, AI agents and chat apps.
- **Needs**: The same request formats, streaming, tool calling and errors as the model provider's own API.
- **Use**: All day, often with several parallel requests per user.
- **Can do**: Call allowed models with a valid key, within the limits of the key and its owner.
- **Cannot do**: Reach inference engines directly. Change any limit.

#### ROLE-06 Identity provider
- **Description**: An outside system that signs people in and tells the product who they are, such as a corporate directory or Constructor Fabric Pass.
- **Needs**: A standard connection, and a way to tell the product when a person loses access.
- **Use**: At every sign-in, and when a person is blocked or leaves.
- **Can do**: Confirm a person's identity and roles. Send signed deprovisioning notices for the people it signs in.
- **Cannot do**: Change tenants, models or limits.

## 6. Value and goals

- **Value for users**:
    - Users get approved models in their usual tools with one key. They see their limits before they reach them.
    - Students get free, qualified access to capable models, kept apart from other tenants.
    - Instance Admins run models on their own hardware, with checks, rules and usage counts in one place.
    - Customer Admins control their own people and credits without the Instance Admin, from Stage 2.
    - Constructor Tech runs its own instance under the same open-source license.
- **Value for the business**:
    - Companies of the ecosystem depend less on outside AI services and spend less on subscriptions.
    - The product makes the cost of every token visible, so a company self-hosts only where it pays off.
    - TF Providers can offer free or paid access to their tenants. Outside billing systems charge the money.
    - From Stage 3, the vendor can sell support, services and paid features per instance, based on entitlement counters.

#### GOAL-01 Self-service access for users
Users of an instance call approved models from their own tools, with their own keys, within minutes of signing in.

#### MET-01 Time to first successful call
- **Measure**: Median minutes from creating a key to the first successful answer, for new users in onboarding sessions.
- **Now**: None
- **Target**: Under 15 minutes in Stage 1. Under 5 minutes in Stage 2.
- **By**: The launch of each stage.

#### MET-02 Active users on the flagship
- **Measure**: Registered users, and users with at least one successful call in a calendar week, on the flagship.
- **Now**: About 17 to 18 keys on the current router.
- **Target**: 50 registered and 20 active users at Stage 1 launch. 500 registered and 200 weekly active users in Stage 3. Not decided yet: confirmation of the Stage 1 values.
- **By**: Stage 1 launch, then Stage 3 launch.

#### MET-03 Use instead of outside tools
- **Measure**: Share of the target community that uses Token Factory as its main source of coding models. Not decided yet: the survey method.
- **Now**: A baseline survey runs at Stage 1 launch.
- **Target**: 50%
- **By**: Stage 3 launch.

#### GOAL-02 Checked models without manual steps
Every model version passes license, security and quality checks before users get it, and new versions reach users within days.

#### MET-04 Model rollout lead time
- **Measure**: Days from adding a new model version to its becoming the family default.
- **Now**: None
- **Target**: 14 days in Stage 1, 7 days in Stage 2, and 2 days in Stage 4.
- **By**: The launch of each stage.

#### MET-05 Served models with full evidence
- **Measure**: Share of served self-hosted model versions that passed all admission checks and have stored benchmark results.
- **Now**: None
- **Target**: 100%
- **By**: Stage 1 launch.

#### GOAL-03 Repeatable installs anywhere
Any DevOps team installs and upgrades an instance on its own or rented cluster from the documentation alone.

#### MET-06 Working instances
- **Measure**: Instances known to the vendor that pass their smoke tests, counted at each stage launch.
- **Now**: 0
- **Target**: 2 in Stage 1, the flagship and the Constructor Tech instance. 5 in Stage 2. 10 outside the ecosystem in Stage 3.
- **By**: The launch of each stage.

#### MET-07 Install success rate
- **Measure**: Share of the vendor's daily installs from scratch on clean servers that pass the smoke tests.
- **Now**: None
- **Target**: 3 passes in a row before Stage 1 launch. 95% per month from Stage 2.
- **By**: Stage 1 launch, then every month.

#### MET-08 Install time
- **Measure**: Hours that a DevOps engineer outside the core team needs from bare servers to a served model, without model download time.
- **Now**: None
- **Target**: 8 hours, 1 working day, or less.
- **By**: Stage 1 launch.

#### GOAL-04 Measured and controlled spend
Every call is counted in credits per user, tenant, key and model, and limits keep use within agreed amounts.

#### MET-09 Cost per million output tokens
- **Measure**: Full serving cost per 1 million output tokens at actual load, divided by the list price of a reference outside model of similar quality. Not decided yet: the reference model.
- **Now**: Measured from Stage 1 launch.
- **Target**: 50% or less in Stage 3. 30% or less in Stage 4.
- **By**: Stage 3 launch, then Stage 4 launch.

#### MET-10 Calls without a usage record
- **Measure**: Completed calls per month that have no usage record, found by comparing credit counters with usage records.
- **Now**: None
- **Target**: 0
- **By**: Stage 1 launch.

#### GOAL-05 Tenant isolation and data protection
No tenant can see or affect another tenant, and the product keeps no prompt text unless a tenant asks for it.

#### MET-11 Cross-tenant exposure
- **Measure**: Confirmed cases per quarter in which one tenant saw or affected another tenant's data, cached prompts or capacity.
- **Now**: None
- **Target**: 0
- **By**: From Stage 1 launch.

#### GOAL-06 Early value with a stable API
Users get a working service in Stage 1 and keep using it unchanged while the product's inner parts are replaced.

#### MET-12 Client changes forced by part replacement
- **Measure**: Times that users had to change keys, connection settings or tool settings because an inner part was replaced.
- **Now**: None
- **Target**: 0
- **By**: Every stage.

#### MET-13 Inference availability
- **Measure**: Share of minutes in a calendar month in which the Inference API on the flagship answers without product-caused errors.
- **Now**: None
- **Target**: Measured from Stage 2. 99.5% per month in Stage 4.
- **By**: Stage 4 launch.

## 7. Scope

- **Included**:
    - An installer that sets up the product and its supporting services on any conformant cluster.
    - Model admission: download from Hugging Face, checks, benchmarks, deployment, promotion, default changes and retirement.
    - Models of external model providers, next to self-hosted models in one catalog.
    - An Inference API in OpenAI-compatible and Anthropic-compatible formats, with families, streaming and tool calling.
    - Sign-in through identity providers, tenants, roles and API keys.
    - Tenant isolation of data, cached prompts and capacity.
    - Credits, credit limits, rate limits, and usage records with reports.
    - A Customer Portal and an Admin page. From Stage 2, an Admin Console and a Management API.
    - Dashboards, alerts, audit records, backups and upgrades.
- **Not included**:
    - Billing: invoices, payments, taxes, money price books, subscriptions, rating and ledgers. The product counts use in credits and exports it, and outside systems bill.
    - A chat application. Chat apps are separate client applications that call the Inference API.
    - Search over tenant documents and vector stores, because the inference service does not need them.
    - Training or fine-tuning models. A separate research track does this, and its models enter through admission.
    - Tenants that upload their own models. Stages 1 to 4 do not need it, so it waits for a later version.
    - Keys of external model providers owned by a tenant or a user, because their value is not confirmed.
    - Seat licenses for chat users, because chat is not part of the product.
    - Changes to Constructor Fabric Pass. Pass is a separate product that this product connects to.
    - More than one inference engine type in Stages 1 and 2. Other engine types arrive as adapters in Stage 3.
    - A vendor-run service for many companies. The decision about it falls in Stage 4.
    - Training models on prompts from usage, because no consent rules exist yet.
- **Stages**: Stage 1 First tokens, Stage 2 Production core, Stage 3 Open factory, and Stage 4 Intelligent factory.

**How each stage is built.** A stage first delivers its scenarios end to end by connecting building blocks: open-source software, existing company platform parts and scripts. The vendor runs the result in production on the flagship.

Then target components replace the building blocks one at a time. Users keep the same API, keys, Portal and connection settings through every replacement.

**How requirements show their stage.** Each functional requirement has a Stage field with the first stage that delivers it. Its priority applies to that stage.

**Stage 1, First tokens.** Users get:

- Installation on any conformant cluster, also without GPUs.
- Admission for 2 open-weight model families, target GLM and Qwen, and for 1 embedding model.
- Admission checks of license, source, file format, capacity and acceptance, plus a performance test and Terminal Bench.
- Promotion of each model by the Instance Admin on the Admin page.
- OpenAI and Anthropic models next to self-hosted models, off by default and allowed per tenant.
- The Inference API with Chat Completions, Responses, Embeddings, the model list and Anthropic Messages, with streaming and tool calling.
- Families with a default model and an ordered fallback list.
- Sign-in through Constructor Fabric Pass on the flagship, a corporate identity provider, or the bundled identity provider.
- Tenants, tenant settings and API keys, managed in the instance configuration and the Portal.
- Basic tenant isolation of data, cached prompts and capacity.
- Credit prices per model, credit limits per user, tenant and key, check-then-charge charging, and rate limits.
- Usage records without loss, usage views, dashboards, alerts, basic audit records, and no stored prompt text.
- A minimal Customer Portal and an Admin page.
- 2 production instances: the flagship and the Constructor Tech instance.

**Stage 2, Production core.** Users get:

- Target components that replace building blocks, with traffic moved in steps and no change for users.
- Strict tenant isolation, deployments for one tenant only, and groups of users inside a tenant.
- Plans, policies, soft and hard limits, near-limit notices and token limits per minute.
- Reserve-then-commit charging, announced to users before it starts.
- Customer Admin self-service: sign-up, users, policies, service keys and the tenant's own identity provider.
- Directory sync, SCIM, and deletion of users and tenants.
- A rollout decision with benchmark thresholds, staged rollout, one-action rollback and deprecation notices.
- Fallback on model errors, concurrency limits per engine, routing by needed capabilities, and batch requests.
- Guardrails, PII redaction, an MCP registry, file storage, and download of files that models create.
- Azure OpenAI and Google Gemini models.
- An Admin Console, a Management API, a full audit log, notices and opt-in telemetry.
- Automatic upgrades, full backups, autoscaling, traffic drain, automatic switching to a working part, and measured service levels.

**Stage 3, Open factory.** Users get:

- A public open-source release with packaged releases, signed images and a vulnerability disclosure policy.
- Operation in an isolated network, with offline import of weights, updates and images.
- Choice of a model from the content of the prompt when a request asks for "auto".
- Image generation, speech-to-text and text-to-speech.
- An organization hierarchy with inherited policies, department sync from the company platform, and budget splits inside a tenant.
- Budgets in money, once credit prices carry currency values.
- A benchmark registry with scheduled re-runs, client-run benchmarks, rollout rings, and migration plans for retiring models.
- Existing outside inference endpoints as catalog models, and other inference engines as adapters.
- Administration through MCP, signed entitlement reports, in-product advice, and paid vendor offers.

**Stage 4, Intelligent factory.** Users get:

- Routing by cost, capability and load, with required models per task category, and shadow and A/B tests of models.
- Policy simulation before a rule changes.
- Enforced service levels and capacity forecasts.
- An MCP registry with verification and approval, a skills registry, and one lifecycle for models, MCP servers and skills.
- Cost views of self-hosted models compared with outside services.
- Version 1.0 and a decision about a vendor-run service.

Stages 3 and 4 get functional requirements when they are planned.

## 8. Scenarios

Scenarios marked "Stage 2" in their name start to work in Stage 2. All other scenarios work from Stage 1.

#### SC-01 Instance Admin installs a new instance
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-03
- **Start**: A TF Provider wants its own instance for its people.
- **Before start**: The Instance Admin has a cluster or bare servers that meet the prerequisites, and an identity provider to connect.
- **Steps**:
    1. The Instance Admin writes the instance configuration: mode, domains, identity provider, first admins, tenants, families and models.
    2. The Instance Admin runs the installer.
    3. The installer checks the prerequisites and reports that all are met.
    4. The installer sets up the product and its supporting services and starts them without GPUs.
    5. The product runs its smoke tests with the CPU test model and reports the result.
    6. The Instance Admin signs in to the Admin page through the identity provider.
    7. The product starts admission for each model in the instance configuration.
- **Result**: The instance runs, the first admin is signed in, the tenants exist, and model admission has started.
- **Other paths**:
    - A prerequisite is missing: the installer stops before any change and names each missing prerequisite.
    - The instance configuration has an error: the installer stops and names the wrong setting.
    - The identity provider does not answer: the Instance Admin signs in with the break-glass account.
    - The install stops halfway: the Instance Admin runs the installer again, and it completes the install.

#### SC-02 Instance Admin brings a new open-weight model into service
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-02
- **Start**: A new model version, such as GLM-5.3, appears on Hugging Face.
- **Before start**: The family GLM exists. Enough GPUs are free for the model under the runtime profile.
- **Steps**:
    1. The Instance Admin adds the model's Hugging Face ID to the GLM family in the instance configuration.
    2. The product reads the license from the model card and compares it with the allowed list.
    3. The product checks the source name, the free cache space, and whether the model fits the GPUs.
    4. The product downloads the weights once into the weights cache and checks file formats and checksums.
    5. The product runs acceptance tests, a performance test and Terminal Bench on the eval instance.
    6. The Admin page shows each check result, the benchmark scores, and the GPUs needed and free.
    7. The Instance Admin promotes the model and makes it the GLM default.
    8. The product deploys the model and answers new GLM requests of allowed tenants with it.
- **Result**: The new version answers requests for GLM, and its evidence stays on the Admin page.
- **Other paths**:
    - The license is not on the allowed list: the model fails before download, and the Admin page shows the reason.
    - The source name imitates a known source, or the files can run code: the model fails, and the Admin page shows the reason.
    - The model is too large for the cache or the GPUs: the model fails at the capacity check, with the sizes shown.
    - Hugging Face does not answer, or the download breaks: the product retries and resumes, and fails the model after the last attempt.
    - Terminal Bench fails or has no result: the Admin page shows a warning, and the Instance Admin can still promote.
    - Too few GPUs are free at promotion: the product refuses and shows the shortfall.
    - The Instance Admin retries a failed model without changing its inputs: the product refuses and says that the inputs must change.
    - A worker restarts during admission: admission resumes from the last finished check.

#### SC-03 Instance Admin offers an external model to chosen tenants
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-01, GOAL-04
- **Start**: Developers of one tenant need a model of an external model provider, such as an Anthropic model.
- **Before start**: The TF Provider has an account and an API key with that external model provider.
- **Steps**:
    1. The Instance Admin stores the provider's API key as a secret of the instance.
    2. The Instance Admin registers the provider's model in the catalog, with its credit prices per token class.
    3. The product makes a test call to the model and shows the result on the Admin page.
    4. The Instance Admin allows the model for the developers' tenant in its tenant settings.
    5. Users of that tenant see the model in the Portal and in the model list.
    6. A user calls the model, and the product counts the call in credits at the model's prices.
- **Result**: Only the chosen tenant uses the external model, and every call has a usage record.
- **Other paths**:
    - The test call fails: the product keeps the model unavailable and shows the provider's error.
    - A user of another tenant calls the model: the product refuses with the permission error.
    - The provider does not answer in time: the user gets the outage error, and the call is not charged.
    - The provider limits the TF Provider's account: the user gets the rate-limit error with a retry time.

#### SC-04 User gets a first answer in their coding tool
- **Role**: User (ROLE-04)
- **Goals**: GOAL-01
- **Start**: A person wants to use the instance's models in Claude Code.
- **Before start**: The identity provider has approved the person and has given them a role that maps to a tenant.
- **Steps**:
    1. The user signs in to the Customer Portal through the identity provider.
    2. The product creates the user's account in the mapped tenant at this first sign-in.
    3. The user creates an API key with an expiry date, and the Portal shows the key once.
    4. The user copies the Claude Code connection snippet from the Portal and runs it.
    5. The user gives Claude Code a coding task that uses tools.
    6. The product streams the answer from the family's default model, and the answer names the model version.
    7. The Portal shows the call in the user's remaining credits.
- **Result**: The user works in Claude Code with the instance's models.
- **Other paths**:
    - The person's roles match no mapping rule: the product refuses sign-in and names the instance contact.
    - The user loses the key: the user revokes it and creates a new one, because the product never shows a key twice.
    - The user asks for a model that the tenant does not allow: the product refuses with the permission error.
    - The user stops before running the snippet: the tool stays as it was, and the key stays valid.
    - The user works with the validated OpenAI-compatible tool instead: the same steps work with that tool's snippet.

#### SC-05 User reaches a credit limit
- **Role**: User (ROLE-04)
- **Goals**: GOAL-04
- **Start**: The user's credits for the period run out during a working day.
- **Before start**: The user has a valid key and a credit limit for the period.
- **Steps**:
    1. The user's tool sends a request while credits remain, and the product serves it in full.
    2. The product adds the request's cost to the user's counter when the request ends.
    3. The user's tool sends the next request.
    4. The product refuses it with the quota error, which states the limit, the use, the reset time and the instance contact.
    5. The tool shows the error at once and does not retry.
    6. The Portal shows 0 remaining credits and the reset time.
- **Result**: The user knows why the tool stopped and when credits return.
- **Other paths**:
    - The limit of the tenant or of the key runs out first: the error names that limit.
    - The Instance Admin raises the user's limit: the next request is served within 1 minute.
    - The period ends: the counter starts again at 0, and requests are served again.
    - From Stage 2, the user gets a notice before the limit, and a plan can allow some overuse.

#### SC-06 Client application completes a multi-step task
- **Role**: Client application (ROLE-05)
- **Goals**: GOAL-01
- **Start**: Claude Code runs an agent task that needs many model calls and tool calls.
- **Before start**: Claude Code is connected with a user's key. Its main model and its background model map to allowed families.
- **Steps**:
    1. Claude Code sends a streaming request in the Anthropic Messages format, with tool definitions.
    2. The product checks the key, the tenant, the model access and the limits.
    3. The product routes the request to a healthy engine of the family's default model.
    4. The product streams the answer, with a tool call, to Claude Code while the model generates it.
    5. Claude Code runs the tool and sends the result in the next request.
    6. The product sends the user's repeat requests to the same engine where it can, so cached prompts are reused.
    7. Claude Code finishes the task.
- **Result**: The task is complete, and each call has a usage record.
- **Other paths**:
    - The client disconnects during a stream: the product stops generation and charges the tokens produced so far.
    - The default model has no healthy engine: the product uses the next model of the family's fallback list, or returns the outage error.
    - The request is larger than the size limit: the product refuses it with the documented error.
    - The client calls an endpoint that the product does not offer: the product returns the not-found error with a message.

#### SC-07 Instance Admin runs students and contributors on one instance
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-05
- **Start**: The flagship must serve students and contributors at the same time.
- **Before start**: Constructor Fabric Pass gives students and contributors different roles.
- **Steps**:
    1. The Instance Admin sets claims mapping rules that place the student role in tenant "students" and the contributor role in "contributors".
    2. The Instance Admin sets tenant settings: allowed families, default credit limits, and a concurrency limit per tenant.
    3. A student signs in and sees only the families allowed for students.
    4. A student and a contributor send the same long prompt.
    5. The product reports no cached input tokens for the second tenant's request.
    6. Students send load at their tenant's concurrency limit.
    7. The product refuses the extra student requests with the rate-limit error, and contributors see no slowdown.
- **Result**: The two tenants share engines but not data, cached prompts or capacity.
- **Other paths**:
    - A person has both roles: the first matching rule decides the tenant.
    - A student's role changes to contributor: at the next sign-in the user moves tenant, and the old keys are revoked.
    - A student calls a family allowed only for contributors: the product refuses with the permission error.

#### SC-08 Identity provider ends a user's access
- **Role**: Identity provider (ROLE-06)
- **Goals**: GOAL-05
- **Start**: An admin of the identity provider blocks a person or removes their role for the instance.
- **Before start**: The identity provider knows the instance's notice address and shares a signing key with it.
- **Steps**:
    1. The identity provider sends a signed deprovisioning notice to the instance.
    2. The product checks the signature.
    3. The product disables the user and all of the user's keys.
    4. The product refuses the user's next request with the authentication error.
- **Result**: Within 60 seconds of the notice, the person can no longer call models.
- **Other paths**:
    - The signature is wrong or missing: the product rejects the notice and records it.
    - The same notice arrives twice: the product changes nothing the second time.
    - The identity provider sends no notice: the Instance Admin disables the user in the instance configuration.
    - From Stage 2, directory sync and SCIM also remove users.

#### SC-09 Instance Admin restores service after a part fails
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-06
- **Start**: A part of the instance, such as the gateway, starts to fail requests.
- **Before start**: Alerts go to the instance's alert channel.
- **Steps**:
    1. The product raises an alert that names the failing part.
    2. Health checks take failing engines out of routing.
    3. The Instance Admin tells the part's developers and records the incident.
    4. The Instance Admin restarts the part, or rolls it back to its previous release.
    5. The product confirms that the part is healthy and returns it to routing.
- **Result**: Users see at most a short drop in service, and the incident is recorded.
- **Other paths**:
    - The rollback also fails: the Instance Admin restores the last configuration backup.
    - From Stage 2, the product moves traffic to a working alternative part without manual action.

#### SC-10 Instance Admin replaces a building block with a target component, Stage 2
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-06
- **Start**: A target component, such as the purpose-built gateway, is ready to replace its building block.
- **Before start**: The target component passes the API conformance set on a test instance.
- **Steps**:
    1. The Instance Admin installs the target component next to the building block.
    2. The Instance Admin moves 10% of the traffic to the target component.
    3. The product runs the API conformance set and compares the error rates and latency of both parts.
    4. The Instance Admin moves 50% of the traffic, and the product repeats the checks.
    5. The Instance Admin moves all traffic, and the product repeats the checks.
    6. The Instance Admin removes the building block.
- **Result**: The target component serves all traffic. Users keep the same keys, snippets and tools.
- **Other paths**:
    - A check fails at any step: the Instance Admin moves all traffic back in one action.
    - The target component changes behavior that users notice: the change is announced before the first traffic step.

#### SC-11 Instance Admin rolls out a new model version in steps, Stage 2
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-02
- **Start**: GLM-5.4 has passed admission, and GLM-5.3 is the GLM default.
- **Before start**: The Instance Admin has chosen the benchmarks and thresholds for the GLM family.
- **Steps**:
    1. The Admin Console compares GLM-5.4 with GLM-5.3 on the same benchmarks and settings.
    2. The Instance Admin starts a staged rollout with 10% of GLM traffic on GLM-5.4.
    3. The product compares live error rates and latency of both versions.
    4. The Instance Admin raises the share in steps to 100%.
    5. The Instance Admin marks GLM-5.3 as deprecated, with an end date.
    6. The product warns callers of GLM-5.3 in responses and notifies its users.
    7. At the end date, the product retires GLM-5.3 and answers its requests with GLM-5.4.
- **Result**: GLM-5.4 is the default, and no request fails because of the change.
- **Other paths**:
    - GLM-5.4 misses a threshold: the product refuses promotion unless the Instance Admin overrides it with a reason.
    - Live metrics get worse: the Instance Admin rolls back in one action, and the old default serves all requests within 1 minute.

#### SC-12 Customer Admin sets up and manages a tenant, Stage 2
- **Role**: Customer Admin (ROLE-03)
- **Goals**: GOAL-01
- **Start**: A company wants to use an instance that runs in external mode.
- **Before start**: The instance allows sign-up in the Portal, and the Instance Admin offers plans.
- **Steps**:
    1. The Customer Admin signs the company up in the Customer Portal.
    2. The Instance Admin gives the new tenant a plan.
    3. The Customer Admin connects the company's identity provider, where the instance allows it.
    4. The Customer Admin adds users, or users sign in through the company's identity provider.
    5. The Customer Admin sets a policy that allows 2 families for one group of users.
    6. The Customer Admin creates a service key for the company's build system.
    7. The Customer Admin views usage per user for the month.
- **Result**: The company's people use allowed models within the plan, and the Customer Admin sees their usage.
- **Other paths**:
    - The Customer Admin tries to allow a model outside the plan: the product refuses and names the plan.
    - A user leaves the company: directory sync or SCIM removes the user and their keys.
    - The Customer Admin stops sign-up halfway: the product keeps no tenant until sign-up is complete.

#### SC-13 Customer Admin turns on PII redaction for external models, Stage 2
- **Role**: Customer Admin (ROLE-03)
- **Goals**: GOAL-05
- **Start**: The tenant's users call external models, and the company does not want personal data to leave.
- **Before start**: The tenant's plan allows external models.
- **Steps**:
    1. The Customer Admin turns on PII redaction for external model providers in the tenant settings.
    2. A user sends a prompt with an email address to an external model.
    3. The product replaces the email address with a marker before the call.
    4. The product puts the original value back in the answer, if the tenant chose that option.
- **Result**: The external model provider never receives the personal data.
- **Other paths**:
    - The PII redaction check fails or does not answer. Not decided yet: whether the product then blocks the call or sends it.
    - The user calls a self-hosted model: the product sends the prompt unchanged, as the tenant chose.

#### SC-14 Vendor learns how instances are used, Stage 2
- **Role**: Vendor (ROLE-01)
- **Goals**: GOAL-03
- **Start**: The vendor prepares the next release and wants to know which functions instances use.
- **Before start**: Some Instance Admins have turned telemetry sharing on.
- **Steps**:
    1. Each opted-in instance sends anonymized usage and quality data to the vendor.
    2. The vendor sees the data per instance in its insight view.
    3. The vendor publishes a release with upgrade notes.
    4. The product notifies Instance Admins of the new release.
- **Result**: The vendor plans releases from real usage, and Instance Admins learn about new releases.
- **Other paths**:
    - An Instance Admin keeps sharing off: the instance sends nothing.
    - The vendor's service does not answer: the instance keeps working, because serving never depends on the vendor.

#### SC-15 Instance Admin upgrades an instance
- **Role**: Instance Admin (ROLE-02)
- **Goals**: GOAL-03
- **Start**: The vendor publishes a new release.
- **Before start**: The instance runs the previous release, and today's configuration backup has succeeded.
- **Steps**:
    1. The Instance Admin reads the release notes, which name the release to upgrade from.
    2. The Instance Admin runs the documented upgrade.
    3. The product moves its stored data to the new release and restarts its parts.
    4. The product runs its smoke tests and reports the result.
- **Result**: The instance runs the new release with all tenants, keys, models and usage.
- **Other paths**:
    - The instance is more than 1 release behind: the product refuses the upgrade and names the release to install first.
    - The upgrade fails: the Instance Admin restores the backup to return to the previous release.
    - From Stage 2, automatic upgrades run without manual steps and with a scripted rollback.

## 9. Functional requirements

### Installation and upgrades

#### FR-01 Build from source
- **Requirement**: The Instance Admin must be able to build all product images and installer packages from the source code with the documented steps.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given a clean copy of the source code, when the Instance Admin runs the documented build steps, then all images and installer packages are built.

#### FR-02 Install on a cluster
- **Requirement**: The installer must install the product with all its supporting services onto a cluster that meets the prerequisites.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given a cluster that meets the prerequisites, when the installer runs, then all parts start and the smoke tests pass.
    - Given no outside managed service, such as a cloud database, when the installer runs, then the install still succeeds.

#### FR-03 Check prerequisites
- **Requirement**: The installer must check the cluster prerequisites before it changes anything.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given a cluster without a default storage class, when the installer starts, then it stops, changes nothing and names the missing prerequisite.
    - Given a cluster with an unsupported version, when the installer starts, then it stops and names the supported versions. Not decided yet: the supported versions.

#### FR-04 Start without GPUs
- **Requirement**: The product must start and pass its smoke tests on a cluster without GPUs, with a test model that runs on CPUs.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given a cluster without GPUs, when the installer runs, then all parts are ready and the smoke tests pass with the CPU test model.
    - Given a running instance, when a GPU node joins the cluster, then the product uses it without a new install.

#### FR-05 Build the reference cluster
- **Requirement**: The installer must turn 5 bare virtual machines into the reference cluster before it installs the product.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given 5 clean virtual machines, when the installer runs, then the reference cluster forms, the product installs and the smoke tests pass.

#### FR-06 Install on one node
- **Requirement**: The installer must install the product on a cluster of 1 node, without high availability.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given a cluster of 1 node, when the installer runs, then the install completes and the smoke tests pass.

#### FR-07 Apply configuration changes
- **Requirement**: The product must apply a changed instance configuration within 1 minute after the Instance Admin applies it with the installer.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given a new tenant in the instance configuration, when the Instance Admin applies it, then its mapped users can sign in within 1 minute.
    - Given a configuration with an error, when the Instance Admin applies it, then the product keeps the running configuration and names the wrong setting.

#### FR-08 Instance mode
- **Requirement**: The Instance Admin must be able to set the instance mode to internal or external, which sets that mode's documented defaults.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given the mode "external", when the Instance Admin applies it, then the instance uses the documented defaults of external mode.

#### FR-09 Turn the Customer Portal on or off
- **Requirement**: The Instance Admin must be able to turn the Customer Portal on or off for the instance.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given the Portal is off, when anyone opens its address, then the product does not serve it.
    - Given the Portal is off, when the Instance Admin turns it on, then it is reachable within 1 minute.

#### FR-10 Turn the Inference API on or off
- **Requirement**: The Instance Admin must be able to turn the Inference API on or off for the instance.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given the Inference API is off, when any key sends a request, then the product refuses it.
    - Given the Inference API is off, when the Instance Admin turns it on, then requests are served within 1 minute.

#### FR-11 Outbound proxy
- **Requirement**: The product must send all its downloads and identity provider calls through an outbound proxy when the Instance Admin sets one.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given direct outbound traffic is blocked and a proxy is set, when the install and a model admission run, then both succeed.

#### FR-12 Manual upgrade
- **Requirement**: The Instance Admin must be able to upgrade an instance from the previous release with a documented procedure that keeps all data.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-15
- **Acceptance criteria**:
    - Given a previous-release instance with data, when it is upgraded, then its tenants, keys, models and usage remain and smoke tests pass.
    - Given an upgrade, when it runs, then the downtime stays within the documented limit. Not decided yet: the downtime limit.
    - Given an instance more than 1 release behind, when the upgrade starts, then the product refuses it and names the release to install first.
    - Given a failed upgrade, when the Instance Admin restores the backup made before it, then the previous release runs with its data.

#### FR-13 Automatic upgrade
- **Requirement**: The product must upgrade itself to each new release when the Instance Admin turns automatic upgrades on.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-15
- **Acceptance criteria**:
    - Given automatic upgrades are on, when the vendor publishes a release, then the instance upgrades without manual steps.
    - Given a failed automatic upgrade, when the rollback script runs, then the previous release runs with its data.

#### FR-14 Daily configuration backup
- **Requirement**: The product must back up its configuration data every day to storage outside the cluster.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-09, SC-15
- **Acceptance criteria**:
    - Given the latest backup, when the Instance Admin restores it into a clean cluster, then tenants, users, keys, models, evidence and credit counters return.
    - Given a backup fails, when the failure happens, then the product raises an alert.
    - Given backups older than the number of days the Instance Admin set, when the daily backup runs, then the product deletes them.

#### FR-15 Full backup
- **Requirement**: The product must include the usage history in its daily backups.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given a backup, when the Instance Admin restores it into a clean cluster, then usage reports show the same totals as before.

#### FR-16 Own domain names
- **Requirement**: The Instance Admin must be able to serve the Customer Portal and the Inference API on their own domain names with valid certificates.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given domain names set by the Instance Admin, when users open the Portal and the API, then both use those names and valid certificates.

### Identity and tenants

#### FR-17 Sign-in through the default identity provider
- **Requirement**: The product must sign people in through the instance's default identity provider with OpenID Connect.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04, SC-07
- **Acceptance criteria**:
    - Given the flagship, when a person approved in Constructor Fabric Pass signs in, then sign-in succeeds.
    - Given the Constructor Tech instance, when a person signs in with the corporate identity provider, then sign-in succeeds.
    - Given the identity provider does not answer, when a person tries to sign in, then the Portal says so, and existing keys keep working.

#### FR-18 Bundled identity provider
- **Requirement**: The product must include its own identity provider, which works without any outside identity provider and offers GitHub sign-in.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given no outside identity provider, when an admin and a user sign in through the bundled identity provider, then both succeed.
    - Given a person with a GitHub account on the allowlist, when they sign in with GitHub, then sign-in succeeds.

#### FR-19 SAML sign-in
- **Requirement**: The product must sign people in through SAML identity providers, including Active Directory.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a SAML test identity provider and an Active Directory, when people sign in through each, then sign-in succeeds.

#### FR-20 Social sign-in
- **Requirement**: The product must sign people in with Google and GitHub accounts on instances in external mode.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given an instance in external mode, when people sign in with Google and with GitHub, then both succeed.

#### FR-21 Tenants in the instance configuration
- **Requirement**: The Instance Admin must be able to create and rename tenants in the instance configuration.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given a renamed tenant, when the Instance Admin applies the change, then its users, keys and usage stay with it.

#### FR-22 Suspend a tenant
- **Requirement**: The Instance Admin must be able to suspend a tenant, which blocks all keys of its users and keeps its data.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given a suspended tenant, when any of its users' keys sends a request within 1 minute after the change, then the product refuses it.
    - Given a suspended tenant, when the Instance Admin lifts the suspension, then its keys work again.

#### FR-23 Tenants through the Management API
- **Requirement**: The Instance Admin must be able to create tenants through the Management API.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a call that creates a tenant, when it succeeds, then the tenant is usable at once and an audit record exists.

#### FR-24 Delete a tenant
- **Requirement**: The product must delete a tenant with all its personal data when a grace period ends after the Instance Admin deletes it.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a deleted tenant, when the grace period ends, then no personal data of the tenant remains and its usage records are anonymized.
    - Given a deleted tenant within the grace period, when the Instance Admin undoes the deletion, then the tenant returns unchanged.
    - Not decided yet: the length of the grace period.

#### FR-25 First sign-in provisioning
- **Requirement**: The product must create a user account at the first sign-in of a person whom the claims mapping places in a tenant.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given a mapped person, when they sign in for the first time, then they land in the right tenant with the right role.
    - Given a person whom no rule matches, when they sign in, then the product refuses and names the instance contact.

#### FR-26 Claims mapping
- **Requirement**: The product must decide each user's tenant and role from identity provider claims with ordered rules, where the first matching rule wins.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:

    | Situation | Expected result |
    | --- | --- |
    | A person's roles match rules 2 and 3 | Rule 2 decides the tenant and the role. |
    | The identity provider sends no roles, and a rule names the person's email address | That rule decides, so the rules work as an allowlist. |
    | A user's role now maps to another tenant | At the next sign-in the user moves, old keys are revoked, and past usage stays with the old tenant. |
    | No rule matches | The product refuses sign-in and names the instance contact. |

#### FR-27 First admins
- **Requirement**: The product must give the Instance Admin role at first sign-in to the people listed as first admins in the instance configuration.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01
- **Acceptance criteria**:
    - Given a fresh install with one listed admin, when that person signs in, then they reach the Admin page.

#### FR-28 Break-glass account
- **Requirement**: The product must offer a local emergency admin account that signs in to the Admin page while the identity provider is down.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-01, SC-09
- **Acceptance criteria**:
    - Given the identity provider is unreachable, when the break-glass account signs in, then it can promote a model.
    - Given any use of the break-glass account, when it signs in, then the product creates an audit record and raises an alert.

#### FR-29 Disable a user
- **Requirement**: The Instance Admin must be able to disable a user in the instance configuration, which blocks the user and all their keys.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-08
- **Acceptance criteria**:
    - Given a disabled user, when one of their keys sends a request 1 minute after the change, then the product refuses it.

#### FR-30 Deprovisioning notice
- **Requirement**: The product must disable a user and all their keys when it receives a correctly signed deprovisioning notice from the identity provider.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-08
- **Acceptance criteria**:
    - Given a correctly signed notice, when it arrives, then the user's keys are refused within 60 seconds.
    - Given a notice with a wrong or missing signature, when it arrives, then the product rejects it and records it.
    - Given the same notice twice, when the second one arrives, then the product changes nothing.

#### FR-31 SCIM provisioning
- **Requirement**: The product must accept user and group changes from identity providers through SCIM 2.0.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a SCIM client, when it creates, changes and deactivates a user, then the product follows each change.
    - Given a deactivation, when it arrives, then the user's keys are refused within 60 seconds.

#### FR-32 Directory sync
- **Requirement**: The product must sync users from the organization's directory, so that joiners, movers and leavers follow the directory.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given changes in the directory, when the next sync runs, then joiners appear, movers change tenant, and leavers lose access and keys.
    - Not decided yet: which directory comes first, and the sync interval.

#### FR-33 Customer Admin adds users
- **Requirement**: The Customer Admin must be able to add users to their tenant by hand.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a user added by a Customer Admin, when the user signs in, then the user belongs to that tenant only.

#### FR-34 Delete a user's personal data
- **Requirement**: The product must delete a user's name, email address and keys on request, and keep the user's usage only in anonymized form.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a deleted user, when anyone searches the product's data, then the user's name, email address and keys are gone.
    - Given a deleted user, when the Instance Admin views tenant usage, then the totals are unchanged.

#### FR-35 Lock the identity provider list
- **Requirement**: The Instance Admin must be able to stop Customer Admins from adding or changing identity providers.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given the lock is on, when a Customer Admin tries to add an identity provider, then the product refuses.

#### FR-36 Tenant's own identity provider
- **Requirement**: The Customer Admin must be able to connect the tenant's own identity provider, where the instance allows it.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a tenant's identity provider, when its people sign in, then they land in that tenant only.

#### FR-37 Roles and permissions
- **Requirement**: The product must allow each action only to the roles that the permission table grants it to.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given the roles Instance Admin, Customer Admin and User, when each tries an action that the table denies, then the product refuses it.
    - Not decided yet: the permission table of roles and actions.

#### FR-38 Narrower roles
- **Requirement**: The Instance Admin must be able to define narrower roles, such as auditor or budget manager, by configuration alone.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a new role defined in configuration, when a person with that role acts, then only the actions of that role are allowed.

#### FR-39 Groups of users
- **Requirement**: The Customer Admin must be able to put users into groups, so that model access, roles and limits differ by group.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given groups with different allowed models, when users of each group call a model, then each user gets only their group's models.

### API keys

#### FR-40 Create an API key
- **Requirement**: The user must be able to create an API key with an optional expiry date, which the product shows in full only once.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given a new key, when the user looks at it again, then the Portal shows only its prefix.
    - Given an expired key, when it sends a request, then the product refuses it with the authentication error.
    - Given a user at the most active keys allowed, when they create one more, then the product refuses.

#### FR-41 Revoke an API key
- **Requirement**: The user must be able to revoke their own API key.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given a revoked key, when it sends a request 60 seconds after the revocation, then the product refuses it.
    - Given a key already revoked, when the user revokes it again, then nothing changes.

#### FR-42 Key format and storage
- **Requirement**: The product must give every key a fixed, recognizable prefix and store keys only as one-way hashes.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given a test instance, when an inspector searches storage and logs, then no full key is found.
    - Given a key in a code sample, when a secret scanner checks it, then the scanner recognizes the prefix.
    - Not decided yet: the prefix, the most active keys per user, and the longest and default expiry.

#### FR-43 Models allowed per key
- **Requirement**: The user must be able to limit a key to some of the models that their tenant allows.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given a key limited to the GLM family, when it calls a Qwen model, then the product refuses with the permission error.

#### FR-44 Service keys
- **Requirement**: The Customer Admin must be able to create service keys that belong to the tenant, not to a person.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a service key, when an application calls with it, then the call works and its usage counts for the tenant.
    - Given the person who created the key is deleted, when the key sends a request, then it still works.

### Tenant isolation

#### FR-45 Tenant data isolation
- **Requirement**: The product must keep each tenant's users, keys, usage and reports hidden from other tenants' users and admins in every interface.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given tenants A and B, when people of A try to see or change B's objects in any interface, then every attempt fails.

#### FR-46 Tenant cache isolation
- **Requirement**: The product must reuse cached prompt parts only within the tenant that sent them.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given tenant A sent a long prompt, when tenant B sends the same prompt, then B's response reports 0 cached input tokens.
    - Given tenant A sent a long prompt, when A sends it again, then A's response reports more than 0 cached input tokens.
    - Given a client sends its own cache salt, when the same tests run, then the results do not change.

#### FR-47 Tenant capacity isolation
- **Requirement**: The product must limit the parallel requests of each tenant to the tenant's concurrency limit.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given tenant A sends load at its limit, when A sends more requests, then the product refuses them with the rate-limit error.
    - Given tenant A sends load at its limit, when tenant B calls the same model, then B's errors and latency stay within the agreed margin.
    - Not decided yet: the margin, measured against a test without load.

#### FR-48 Strict tenant isolation
- **Requirement**: The product must keep each tenant's secrets, configuration, audit records and usage apart in every shared part.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given tenants A and B, when A tries to read B's secrets, configuration or audit records through any shared part, then every attempt fails.
    - Not decided yet: which tenants need a separate data plane.

#### FR-49 Deployment for one tenant
- **Requirement**: The Instance Admin must be able to deploy a model for one tenant only, on GPUs reserved for that tenant.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a deployment for tenant A, when other tenants list or call models, then they neither see nor reach it.

### Model catalog and families

#### FR-50 Families
- **Requirement**: The Instance Admin must be able to create families, each with one default model, in the instance configuration.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a request that names a family, when the user's tenant allows the default model, then the default model answers.
    - Given a request that names a family, when the tenant does not allow the default model, then the product refuses with the permission error.

#### FR-51 Add a model by its Hugging Face ID
- **Requirement**: The Instance Admin must be able to add a model to a family by its Hugging Face ID, which starts admission without manual steps.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a Hugging Face ID in the instance configuration, when it is applied, then admission starts and its stages show on the Admin page.

#### FR-52 Serve models only to allowed tenants
- **Requirement**: The product must serve a model only to tenants whose settings allow the model or its family.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02, SC-07
- **Acceptance criteria**:
    - Given a served model, when a user of an allowed tenant calls it, then the product serves the request.
    - Given a served model, when a user of another tenant calls it, then the product refuses with the permission error.

#### FR-53 Promote a model
- **Requirement**: The Instance Admin must be able to promote a model version that passed admission, which deploys it to the production engines.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a Ready version and enough free GPUs, when the Instance Admin promotes it, then allowed tenants can call it once its engines are ready.
    - Given a Failed version, when the Instance Admin tries to promote it, then the product refuses.
    - Given a version being promoted, when the Instance Admin presses Promote again, then the product starts no second deployment.

#### FR-54 Capacity check at promotion
- **Requirement**: The product must refuse a promotion or a default change when the free GPUs do not cover the model under the runtime profile.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given fewer free GPUs than a model needs, when it is promoted, then the product refuses and shows the GPUs needed and free.
    - Given the Instance Admin retired another model, when they promote again, then the promotion succeeds.

#### FR-55 Set the family default
- **Requirement**: The Instance Admin must be able to make a served model version the default of its family.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a new default, when new family requests arrive 1 minute after the change, then the new default answers them.
    - Given requests running on the old default, when the default changes, then they finish on the old default.
    - Given a version that is not served, when the Instance Admin tries to make it the default, then the product refuses.
    - Given an empty family, when the first model is promoted into it, then that model becomes the default.

#### FR-56 Retire a model
- **Requirement**: The Instance Admin must be able to retire a model version, which removes it from the engines.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a retired version, when a request names it and the tenant allows the family default, then the default answers and the response names it.
    - Given a retired version, when the Instance Admin checks the engines, then none runs that version.

#### FR-57 Fallback list of a family
- **Requirement**: The product must send a family request down the family's fallback list when a model has no healthy engine or is turned off.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a family with a fallback list, when its default has no healthy engine, then the next model answers and the response names it.
    - Given no model of the list is healthy, when a request arrives, then the product returns the outage error.
    - Given a family without a fallback list, when its default fails, then the product returns the outage error.

#### FR-58 Deprecation with an end date
- **Requirement**: The Instance Admin must be able to mark a model version as deprecated, with an end date and a replacement version.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a deprecated version, when users call it, then each response carries a deprecation warning with the end date.
    - Given the end date passes, when a request names the version, then the replacement answers and no request fails.

#### FR-59 Weights cache
- **Requirement**: The product must keep downloaded weights in the weights cache, so that restarts never download them again.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a served model, when its engine restarts or moves to another node, then the product downloads no weights.

#### FR-60 Weights cache retention
- **Requirement**: The product must delete the weights of models that were retired longer ago than a period the Instance Admin sets.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a model retired longer ago than the period, when the daily cleanup runs, then its weights are deleted.
    - Given a served model, when the cleanup runs, then its weights stay.

#### FR-61 Model metadata
- **Requirement**: The product must store, for each model version, its source and revision, license, size, precision, context length, and support for tool calling and streaming.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given an admitted model version, when the Instance Admin opens it on the Admin page, then every listed field is shown.

#### FR-62 Full model metadata
- **Requirement**: The product must also store, for each model version, the input and output types it supports and its support for structured output.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a model version, when a script reads it through the Management API, then all metadata fields are returned.

#### FR-63 List of allowed models
- **Requirement**: In the Portal and the model list, the product must show each user exactly the models and families it accepts from that user.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given users of 2 tenants with different settings, when each checks the Portal and the model list, then both lists equal what the product accepts.
    - Given a key limited to some models, when the model list is called with it, then only those models are listed.

#### FR-64 Runtime profile
- **Requirement**: The Instance Admin must be able to change the settings of the instance's runtime profile, which the product uses for every self-hosted model.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a fresh install, when the Instance Admin looks at the runtime profile, then it holds the vendor's default settings.
    - Given a changed setting, when a model is next deployed, then the engine runs with the new setting.

#### FR-65 Settings for one model
- **Requirement**: The Instance Admin must be able to override model-specific runtime settings for one model, such as how tool calls are read from its output.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given 2 families that need different tool-call settings, when users call each with tools, then both answer with correct tool calls.
    - Not decided yet: the list of settings that one model can override.

#### FR-66 Engine replicas per model
- **Requirement**: The Instance Admin must be able to set the number of engine replicas for each served model.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a new replica count, when the Instance Admin applies it, then the model runs with that number of replicas once free GPUs allow.

#### FR-67 Catalog changes without restart
- **Requirement**: The product must accept or refuse a model that is added or removed at runtime within 1 minute, without restarting any part.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a model added at runtime, when a user calls it 1 minute later, then the product serves the call and no part restarted.

#### FR-68 Autoscaling
- **Requirement**: The product must add or remove engine replicas of a model by load, within limits that the Instance Admin sets.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given the request queue of a model passes its set length, when the load lasts, then the product adds a replica.
    - Given a model with no requests for the set time, when the limit allows 0 replicas, then the product removes all its replicas.

#### FR-69 Updates without downtime
- **Requirement**: The product must replace a model's engines with a new engine release or model version without failing running requests.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given load on a model, when its engines are updated, then no request fails.

### Model admission

#### FR-70 License check before download
- **Requirement**: The product must compare a model's license from its model card with the instance's allowed-license list before any download.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a license that is not on the list, when admission starts, then the model fails before any weights are downloaded.
    - Given any model, when the license check ends, then the product records the license found.
    - Given a license that forbids commercial use, when the check ends, then the Admin page flags it.
    - Not decided yet: the default allowed-license list.

#### FR-71 Source and integrity checks
- **Requirement**: The product must fail a model whose source name imitates a known source, whose files hold no weights, or whose checksums do not match.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:

    | Test model | Expected result |
    | --- | --- |
    | Source name that imitates a known source | Failed, with the reason shown |
    | Source without weight files | Failed, with the reason shown |
    | Files whose checksums do not match the source revision | Failed, with the reason shown |

#### FR-72 Safe file formats
- **Requirement**: The product must admit only weight files in formats that cannot run code.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a model whose weights exist only in a format that can run code, when admission runs, then the model fails.

#### FR-73 Custom code in models
- **Requirement**: The product must refuse a model that needs to run its own code, unless the instance configuration allows that model by name.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a model that needs its own code and is not listed, when admission runs, then the model fails.
    - Given the same model listed in the instance configuration, when admission runs, then it passes this check.

#### FR-74 Gated models
- **Requirement**: The product must download gated models with a Hugging Face access token that the Instance Admin stores as a secret.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a stored token, when a gated test model is admitted, then it downloads.
    - Given no token, when the same model is admitted, then it fails with a clear reason.
    - Given any admission, when an inspector reads the logs and screens, then the token appears nowhere.

#### FR-75 Capacity checks at admission
- **Requirement**: The product must check that the weights fit the free cache space before download, and that the model fits the profile's GPUs before tests.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given weights bigger than the free cache or GPU memory, when admission runs, then the model fails with sizes shown, before download or deployment.

#### FR-76 Resumable download
- **Requirement**: The product must resume a broken download and retry it after errors, up to a set number of attempts.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a download that breaks, when the product retries, then it downloads only the missing parts.
    - Given every attempt fails, when the last attempt ends, then the model fails with the reason.

#### FR-77 Acceptance tests
- **Requirement**: The product must fail a model that does not load on the engine, fails the fixed sanity prompts, or fails the tool-call probe.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a model that fails loading, the sanity prompts or the tool-call probe, when tests run, then the product fails it and names the test.
    - Given a model that passes, when acceptance tests end, then its basic latency is recorded.
    - Not decided yet: the sanity prompt set and its pass rule.

#### FR-78 Performance test
- **Requirement**: The product must measure each model's tokens per second, time to first token and latency under set parallel load, on a temporary deployment.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a model that passed acceptance, when the performance test ends, then the results appear on the Admin page and the temporary deployment is gone.

#### FR-79 Terminal Bench
- **Requirement**: The product must run Terminal Bench on every model version that passes the acceptance tests.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a model that passed acceptance, when Terminal Bench ends, then its results are stored as evidence.
    - Given Terminal Bench fails or has no result, when the Instance Admin opens the model, then a warning shows and promotion stays possible.

#### FR-80 Separate eval instance
- **Requirement**: The product must run benchmarks only on an eval instance and never on production engines.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given benchmark runs, when an inspector reads the production engine logs, then they contain no benchmark requests.

#### FR-81 Comparison with the current default
- **Requirement**: The Admin page must show a candidate's benchmark scores next to the scores of the family's current default.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a family with a default, when a candidate finishes benchmarks, then the Admin page shows both scores and the difference.

#### FR-82 Admission failure details
- **Requirement**: The Admin page must show the failed check, the reason and the check's logs for every failed model.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given each failure case of the admission checks, when the Instance Admin opens the model, then the failed check and the reason are shown.

#### FR-83 Retry a failed admission
- **Requirement**: The Instance Admin must be able to run admission again for a failed model after its inputs changed.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a failed model with changed inputs, when the Instance Admin presses Retry, then admission starts again.
    - Given a failed model with unchanged inputs, when the Instance Admin presses Retry, then the product refuses and says the inputs must change.

#### FR-84 Resume after a restart
- **Requirement**: The product must resume an admission from its last finished check after any part restarts.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given an admission in the benchmark stage, when a worker is stopped and restarted, then admission continues with the benchmark stage.

#### FR-85 More quality benchmarks
- **Requirement**: The product must run at least 2 benchmark suites beyond Terminal Bench on every admitted model.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given an admitted model, when admission ends, then results of at least 3 suites are stored.

#### FR-86 Full comparison report
- **Requirement**: The product must compare a candidate with the family default on quality, latency, failure rate and cost per task.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a candidate and a default, when the report is ready, then it shows all 4 measures for both and stays available after promotion.

#### FR-87 GPU advice
- **Requirement**: The product must suggest a GPU type, a GPU count and engine settings for a model from its benchmark results.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given finished benchmarks, when the Instance Admin opens the model, then the suggested GPU type, count and settings are shown.

#### FR-88 Known incompatibility warning
- **Requirement**: The product must warn at admission when a model and the engine release are known not to work together.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a model on the known-incompatible list, when admission starts, then the Admin Console shows a warning.

#### FR-89 Admission failure notice
- **Requirement**: The product must notify the Instance Admin when an admission fails.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a failed admission, when it fails, then exactly one notice reaches the configured channel.

### Model rollout

#### FR-90 Rollout decision with thresholds
- **Requirement**: The product must refuse to promote a candidate that misses an admin-set threshold, unless the Instance Admin overrides it with a reason.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a candidate that misses a selected threshold, when the Instance Admin promotes it, then the product refuses.
    - Given the Instance Admin overrides with a reason, when they promote, then the product promotes and records the reason.

#### FR-91 Staged rollout
- **Requirement**: The Instance Admin must be able to send a set share of a family's traffic to a candidate while the product compares live metrics.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a 10% share, when 1,000 family requests arrive, then about 100 reach the candidate.
    - Given a staged rollout, when the Instance Admin opens it, then error rates and latency of both versions are shown.

#### FR-92 One-action rollback
- **Requirement**: The Instance Admin must be able to return all of a family's traffic to the previous default in one action.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11
- **Acceptance criteria**:
    - Given a staged rollout, when the Instance Admin rolls back, then the previous default serves all new requests within 1 minute.

### Inference API

#### FR-93 Chat Completions
- **Requirement**: The product must accept OpenAI-compatible Chat Completions requests, with and without streaming, including tool calling.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04, SC-06
- **Acceptance criteria**:
    - Given the OpenAI software kit, when it runs the conformance set for streaming, non-streaming and tool calls, then every case passes.
    - Not decided yet: the conformance set.

#### FR-94 Anthropic Messages
- **Requirement**: The product must accept Anthropic-compatible Messages requests with streaming and tool use.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04, SC-06
- **Acceptance criteria**:
    - Given Claude Code, when it runs a multi-step coding task with tools through the product, then the task completes.
    - Given the Anthropic software kit, when it runs streaming and tool-use round trips, then every case passes.
    - Given a token-count request, when the product does not offer it, then it returns the not-found error. Not decided yet: the Claude Code version.

#### FR-95 Responses
- **Requirement**: The product must accept Responses requests in the Open Responses format, with streaming and tool calling.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given the conformance set for Responses, when it runs, then every streaming and tool-calling case passes.

#### FR-96 Embeddings
- **Requirement**: The product must return embeddings from models that support them.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given the admitted embedding model, when a client asks for embeddings, then the product returns them with their token usage.
    - Given a model without embedding support, when a client asks it for embeddings, then the product refuses with a clear error.

#### FR-97 Provider format kept for the same provider
- **Requirement**: The product must forward a request in a model provider's own format to that provider's model without converting it.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03
- **Acceptance criteria**:
    - Given an Anthropic model, when Claude Code sends Messages with prompt caching, then the response reports cache tokens as the provider does directly.

#### FR-98 Capability losses per format
- **Requirement**: The product must document, for each API format and each validated tool, which model capabilities a format conversion loses.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given the published capability table, when testers check it, then each listed loss has a test that shows it.

#### FR-99 Model or family in a request
- **Requirement**: The product must accept a request that names either a model version or a family.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given a request with a version name and one with a family name, when both arrive, then both are served.
    - Given an unknown name, when the request arrives, then the product returns the not-found error.

#### FR-100 Name of the answering model
- **Requirement**: The product must name, in every response, the model version that answered.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given family requests, fallbacks and requests for retired versions, when they are answered in either format, then the model field names the answering version.

#### FR-101 Requests for "auto"
- **Requirement**: The product must handle a request for the model "auto" by one documented rule until routing by prompt exists.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given a request for "auto", when it arrives, then the product follows the documented rule.
    - Not decided yet: whether the rule refuses the request or serves it with a default model of the tenant.

#### FR-102 Order of checks
- **Requirement**: The product must check every call in this order: key, user and tenant status, model access, rate limits, credit limits.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a test that fails at each step, when it runs, then the product returns that step's error.
    - Given any call in Stages 1 and 2, when the entitlement counters update, then they never refuse the call.

#### FR-103 No direct engine access
- **Requirement**: The product must refuse calls to inference engines that do not come through its own checks.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a program in another part of the cluster without credentials, when it calls an engine endpoint, then the call is refused.

#### FR-104 Error answers
- **Requirement**: The product must answer each refusal with the status and error type of this table, and with a message that names the instance contact.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05, SC-06
- **Acceptance criteria**:
    - Client tools decide whether to retry from these exact values, so the product uses them exactly.

    | Condition | OpenAI-compatible formats | Anthropic-compatible format |
    | --- | --- | --- |
    | Credits of the period used up | 402, type "insufficient_quota", code "quota_exceeded", header "x-should-retry: false" | 402, type "billing_error", header "x-should-retry: false" |
    | Rate limit reached | 429, type "rate_limit_error", header "retry-after" of at most 60 seconds | 429, type "rate_limit_error", header "retry-after" of at most 60 seconds |
    | Model not allowed | 403, type "permission_error" | 403, type "permission_error" |
    | Missing, wrong, expired or revoked key, or suspended user or tenant | 401, type "authentication_error" | 401, type "authentication_error" |
    | Unknown model or family, or endpoint not offered | 404, code "model_not_found" | 404, type "not_found_error" |
    | No healthy engine, or no answer from the external model provider | 503 | 529, type "overloaded_error" |

    - Given a quota refusal, when it is sent, then its message states the limit, use, reset time in ISO 8601 UTC, and contact.

#### FR-105 Credit state in responses
- **Requirement**: The product must add the caller's credit limit, remaining credits and reset time to every inference response.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given any inference response, when the client reads the headers "x-tf-credits-limit", "x-tf-credits-remaining" and "x-tf-credits-reset", then they hold the current values.

#### FR-106 Versioned API paths
- **Requirement**: The product must serve the Inference API under the same versioned paths that client tools use with the model providers, such as "/v1".
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a breaking change, when the vendor releases it, then it appears only under a new version path.
    - Given a deprecated version, when clients call it within the stated period after the notice, then it still works. Not decided yet: the period.

#### FR-107 Request limits
- **Requirement**: The product must refuse requests that exceed the size or time limits, with a documented error for each limit.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a request over the body size limit of its route, when it arrives, then the product refuses it with the documented error.
    - Given a request exactly at the body size limit, when it arrives, then the product serves it.
    - Given a request that runs longer than its time limit, when the limit passes, then the product ends it with the documented error.
    - Given a stream that stays idle longer than its idle limit, when the limit passes, then the product ends it with the documented error.
    - Not decided yet: the size limit per route, the time limits for normal and streamed requests, and the idle limit.

#### FR-108 Endpoints not offered
- **Requirement**: The product must answer requests to endpoints that it does not offer with the not-found error and a message that says so.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given requests for images, audio, legacy completions or files, when they arrive, then each gets the not-found error with its message.

#### FR-109 Streaming while generating
- **Requirement**: The product must pass each streamed part to the client while the model is still generating, and keep idle streams open with keep-alive messages.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a streaming request, when the model generates the answer, then the client receives the first part before the model finishes.
    - Given a stream pauses within its idle limit, when the pause lasts, then the client receives keep-alive messages and the stream stays open.

#### FR-110 Same engine for repeat requests
- **Requirement**: The product must send a user's repeat requests to the same engine replica where its routing allows it.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a model with 2 or more replicas, when a user sends a series of requests, then the agreed share reaches the same replica. Not decided yet: the share.

#### FR-111 Same engine for all models with replicas
- **Requirement**: The product must send repeat requests to the same replica for every model with more than 1 replica.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given every model with more than 1 replica, when the test of FR-110 runs, then the agreed share is met.

#### FR-112 Fallback on errors
- **Requirement**: If a model fails before any output with a timeout, rate limit or server error, the product must retry on the next fallback model.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given the primary engine is stopped, when requests arrive, then the fallback model serves them and each switch is logged.
    - Given output already started, when the model fails, then the product returns the error and does not switch.
    - Given a fallback model that lacks a capability of the primary, when the Instance Admin saves the list, then the product refuses it.

#### FR-113 Concurrency limit per engine
- **Requirement**: The product must keep requests to each engine within its concurrency limit, by queueing them or sending them to the fallback.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given load above an engine's limit, when it lasts, then requests queue or go to the fallback, and the engine never runs out of memory.

#### FR-114 Routing by needed capabilities
- **Requirement**: The product must route a family request to its cheapest model that supports the request's needs, such as tools, images or context length.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a request with an image, when the family has one model that reads images, then that model answers.
    - Given a request longer than one model's context length, when another model of the family has enough, then that model answers.

#### FR-115 Batch requests
- **Requirement**: The product must accept batch requests, run them in the background, and keep their results as files for the tenant's retention period.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-06
- **Acceptance criteria**:
    - Given a submitted batch, when the user checks it, then the product shows its progress and, at the end, a link to the results.
    - Given some items fail, when the batch ends, then the results list each failed item with its reason.
    - Given the user cancels a batch, when the cancel arrives, then remaining items stop and are not charged.

### External models

#### FR-116 Register an external model
- **Requirement**: The Instance Admin must be able to register an OpenAI or Anthropic model, with the provider's API key stored as a secret.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03
- **Acceptance criteria**:
    - Given a registration, when the test call succeeds, then the model becomes Ready.
    - Given a registration, when the test call fails, then the model stays unavailable and the Admin page shows the provider's error.
    - Given a stored provider key, when anyone opens the configuration or the Admin page, then the key is not shown.

#### FR-117 External models off by default
- **Requirement**: The product must refuse an external model to every tenant whose settings do not allow it.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03
- **Acceptance criteria**:
    - Given default tenant settings, when a user calls an external model, then the product refuses with the permission error and records a security event.
    - Given a tenant that allows the model, when its user calls it, then the product serves the call.

#### FR-118 External provider failures
- **Requirement**: The product must return the outage error when an external model provider fails or does not answer within the request time limit.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03
- **Acceptance criteria**:
    - Given the provider is down, when a user calls its model, then the outage error arrives within the time limit, and nothing is charged.
    - Given the provider limits the account, when a user calls its model, then the user gets the rate-limit error with a retry time.

#### FR-119 More external model providers
- **Requirement**: The Instance Admin must be able to register Azure OpenAI and Google Gemini models in the same way as OpenAI and Anthropic models.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-03
- **Acceptance criteria**:
    - Given an Azure OpenAI model and a Gemini model, when the Instance Admin registers them, then both pass the test call and serve allowed tenants.

### Credits, limits and rate limits

#### FR-120 Token classes
- **Requirement**: The product must count, for every call, the uncached input, cached input, output and cache-write tokens that the engine or provider reports.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given test requests with and without cache hits, when they end, then the recorded tokens per class equal the reported usage.
    - Given a model that reasons before it answers, when the call ends, then reasoning tokens count as output tokens.

#### FR-121 Credit prices per model
- **Requirement**: The Instance Admin must be able to set, for each model, a credit price per 1 million tokens of each token class.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03, SC-05
- **Acceptance criteria**:
    - Given a call, when it ends, then its credits are the sum per token class of tokens divided by 1 million times the class price.
    - Given 2 models with different prices and the same usage, when both calls end, then each is charged at its own prices.
    - Not decided yet: the rounding and precision of credits.

#### FR-122 Credit limit per user
- **Requirement**: The product must refuse a user's request when the user's credits used in the period reach the user's limit.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:

    | Set limits | Limit that applies to the user |
    | --- | --- |
    | User limit, tenant default and instance default | The user limit |
    | Tenant default and instance default | The tenant default |
    | Instance default only | The instance default |

    - Given a user at their limit, when they send a request, then the product refuses it with the quota error.

#### FR-123 Credit limit per tenant
- **Requirement**: The product must refuse requests of a tenant's users when the tenant's credits used in the period reach the tenant's limit.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a tenant at its limit, when a user of it calls, then the product refuses with a quota error naming the tenant limit.

#### FR-124 Credit limit per key
- **Requirement**: The product must refuse requests with a key when the credits used with that key in the period reach the key's limit.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a key at its limit, when it sends a request, then the product refuses it with the quota error that names the key limit.
    - Not decided yet: who sets a key's limit.

#### FR-125 Credit period
- **Requirement**: The product must count credits per calendar period in UTC: a day, a week from Monday, or a month from the 1st.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given any period, when it starts, then it starts at 00:00 UTC.
    - Given the end of a period, when the boundary passes, then counters start again at 0 and unused credits do not carry over.
    - Given a request that starts before the boundary and ends after it, when it ends, then it counts in the new period.
    - Given Stage 1, when the Instance Admin sets the period, then one period applies to the whole instance. Not decided yet: the default period.

#### FR-126 Check-then-charge
- **Requirement**: Until reserve-then-commit starts, the product must check before each request that credits remain, and charge the real cost when the request ends.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:

    | Situation | Result |
    | --- | --- |
    | Credits used are under every limit that applies | The product serves the request and adds its real cost when it ends. |
    | Credits used reach a limit that applies | The product refuses the request with the quota error. |
    | A served request passes the limit while it runs | It finishes and is charged in full; the product never cuts a stream for credits. |
    | The client cancels or disconnects | Generation stops, and input and output tokens so far are charged. |
    | The request fails before any output | Nothing is charged. |

    - Given parallel requests that run when the limit is reached, then the overshoot is at most the user's concurrency limit times the profile's output cap.

#### FR-127 Reserve-then-commit
- **Requirement**: The product must reserve a request's estimated cost before it forwards the request, charge the real cost when it ends, and release the rest.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given an estimate larger than the remaining credits, when the request arrives, then the product refuses it with the quota error.
    - Given a request that fails or disconnects, when it ends, then the reservation is released except for the tokens produced.
    - Given the switch from check-then-charge, when the release before it ships, then its release notes and the Portal describe the change.
    - Not decided yet: the rule that estimates a request's cost.

#### FR-128 Remaining credits in the Portal
- **Requirement**: The Portal must show each user the remaining credits of the current period from the counter that the product enforces.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05, SC-04
- **Acceptance criteria**:
    - Given a completed request, when the user opens the Portal, then the remaining credits include that request's cost.

#### FR-129 Concurrency limit per user
- **Requirement**: The product must limit the parallel requests of each user to the user's concurrency limit.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a user at their limit, when they send one more request, then the product refuses it with the rate-limit error and a retry time.

#### FR-130 Requests per minute per key
- **Requirement**: The product must limit the number of requests per minute that each key can send.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a key that reached its limit for the minute, when it sends one more request, then the product refuses it with the rate-limit error.

#### FR-131 Capacity warning
- **Requirement**: The installer must warn when the concurrency limits of a model's allowed tenants add up to more than the model's engine capacity.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-07
- **Acceptance criteria**:
    - Given tenant limits above the replicas times the parallel requests per replica, when the Instance Admin applies them, then the installer warns.

#### FR-132 Tokens per minute
- **Requirement**: The product must limit the tokens per minute of each user and each tenant, counted apart for input and output.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a user or tenant over either token limit, when a request arrives, then the product refuses it with the rate-limit error.

#### FR-133 Plans
- **Requirement**: The Instance Admin must be able to give each tenant a plan of allowed models, default policy, period credit limit and overuse allowance.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a tenant on a plan, when its user calls a model outside the plan, then the product refuses with the permission error.
    - Given a tenant past its credits, when its use stays within the overuse allowance, then the product serves it, and beyond that it refuses.

#### FR-134 Policies
- **Requirement**: The Customer Admin must be able to allow or block models for users and groups of their tenant, within the plan.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a policy change, when the user sends a request 1 minute later, then the new policy applies.
    - Given a model outside the plan, when the Customer Admin tries to allow it, then the product refuses and names the plan.

#### FR-135 Soft and hard limits
- **Requirement**: The product must alert at a soft credit limit, and block or use the allowed fallback at a hard credit limit.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a user who passes the soft limit, when it happens, then the user and the Customer Admin get one alert.
    - Given a user at the hard limit, when they send a request, then the product blocks it or uses the allowed fallback, as set.

#### FR-136 Near-limit notice
- **Requirement**: The product must notify a user once per period when the user's use reaches a set share of their limit.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a user who reaches the share, when it happens, then the user gets exactly one notice in that period. Not decided yet: the share.

### Usage records and reports

#### FR-137 Usage record per call
- **Requirement**: The product must record every call, also refused, failed and cancelled calls, with user, tenant, key, model, family, tokens, credits, latency, status and options.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03, SC-05
- **Acceptance criteria**:
    - Given a user and a period, when their records' credits are added up, then the sum equals the counter, apart from running requests.
    - Given a call with options such as reasoning effort or speed mode, when it ends, then its record holds those options.

#### FR-138 No lost usage records
- **Requirement**: The product must deliver every usage record at least once and count it only once, also for streams that end early.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03
- **Acceptance criteria**:
    - Given the usage store stops during load, when it returns, then every call has exactly one record.

#### FR-139 GPU time records
- **Requirement**: The product must record GPU time per deployment: GPU type, GPU count and hours, with the tenant for deployments of one tenant.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-02
- **Acceptance criteria**:
    - Given a day of serving, when the day ends, then the records equal the GPU-hours of the running engines.

#### FR-140 Usage views
- **Requirement**: The Instance Admin must be able to see usage overall and per tenant, user, key, model and family, for a chosen period.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-03, SC-07
- **Acceptance criteria**:
    - Given calls made 1 hour ago, when the Instance Admin opens the views, then those calls are included in every breakdown.

#### FR-141 Usage within 5 minutes
- **Requirement**: The product must show each call in usage reports within 5 minutes after it ends.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-05
- **Acceptance criteria**:
    - Given a call that ended, when 5 minutes pass, then it appears in the user's usage report.

#### FR-142 Usage export
- **Requirement**: Admins must be able to export the usage reports of their scope for a period as CSV.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given an export for a period, when it is compared with the dashboard for the same period, then the totals match.

#### FR-143 Usage API for billing systems
- **Requirement**: The product must offer an API that returns credits and tokens per class per model, for each tenant and period.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: GOAL-04
- **Acceptance criteria**:
    - Given a period, when an outside billing system calls the API, then the totals equal the CSV export of that period.

#### FR-144 Cost views
- **Requirement**: The Instance Admin must be able to see estimated cost per model, user and tenant, computed from usage and credit prices.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: GOAL-04
- **Acceptance criteria**:
    - Given a test period, when the Instance Admin opens the cost views, then they equal the credits times the set prices.

#### FR-145 Tenant usage for the Customer Admin
- **Requirement**: The Customer Admin must be able to see usage per user and per key of their own tenant.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given 2 tenants, when each Customer Admin opens usage, then each sees only their own tenant's users and keys.

#### FR-146 No stored prompt text in Stage 1
- **Requirement**: The product must keep prompt and response text out of all records, logs and traces, with no setting that turns storing on.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: GOAL-05
- **Acceptance criteria**:
    - Given a test day with calls, when an inspector searches traces, logs, databases and file storage, then no prompt or response text is found.

#### FR-147 Content logging per tenant
- **Requirement**: The product must store prompt and response text only for tenants whose Customer Admin turns content logging on.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-13
- **Acceptance criteria**:
    - Given one tenant turned logging on, when users of 2 tenants send calls, then only that tenant's text is stored.
    - Given logging is turned on or off, when the change happens, then the product creates an audit record.

#### FR-148 Basic audit records
- **Requirement**: The product must record who did what and when for model actions, key changes, configuration changes, access refusals and break-glass sign-ins.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02, SC-08
- **Acceptance criteria**:
    - Given each of these actions, when it happens, then a record holds the person, the action, the object, the time and the result.

#### FR-149 Full audit log
- **Requirement**: The product must record every administrative change in the Admin Console and the Management API with its values before and after.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11, SC-12
- **Acceptance criteria**:
    - Given each administrative action, when it happens, then its record holds the values before and after.

#### FR-150 Audit search and export
- **Requirement**: Admins must be able to search the audit records of their scope and export them as CSV.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a search by person and period, when it runs, then it returns exactly the matching records of the admin's scope.

### Portal and administration

#### FR-151 Support contact
- **Requirement**: The product must show the instance's support contact in the Portal and in every refusal message.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given the contact set in the instance configuration, when a user opens the Portal or gets a refusal, then the contact is shown.

#### FR-152 Connection snippets
- **Requirement**: The Portal must give each user a ready snippet or 1 command per validated tool, holding no secret except the user's own key.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-04
- **Acceptance criteria**:
    - Given the Claude Code snippet, when the user runs it, then Claude Code's main and background models map to families the tenant allows.
    - Given a configured Claude Code session, when it runs, then it sends no request for a model the product does not serve.
    - Given a new user with each validated tool, when they start from a new key, then they get a first answer within 15 minutes.
    - Not decided yet: the second validated tool, which uses an OpenAI-compatible format.

#### FR-153 Admin page
- **Requirement**: The Admin page must show each model's admission stage, check results, evidence, and the GPUs it needs and that are free.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-02, SC-03
- **Acceptance criteria**:
    - Given a model added in the instance configuration, when admission runs, then the Instance Admin does all later onboarding steps on the Admin page.

#### FR-154 Admin Console
- **Requirement**: The Instance Admin must be able to manage tenants, plans, models, rollouts, usage reports and health in the Admin Console.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-11, SC-10
- **Acceptance criteria**:
    - Given each listed function, when the Instance Admin uses it, then it works in the Admin Console and creates an audit record.

#### FR-155 Management API
- **Requirement**: The product must offer a Management API operation for every Admin Console action.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given the documented examples, when a script runs them, then it creates a tenant, changes a plan and promotes a model.

#### FR-156 Tenant sign-up
- **Requirement**: The Customer Admin must be able to sign a company up as a new tenant in the Customer Portal, when the instance allows sign-up.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-12
- **Acceptance criteria**:
    - Given a completed sign-up, when it ends, then a tenant exists with the signer as its Customer Admin.
    - Given a sign-up stopped halfway, when the signer leaves, then no tenant exists.

#### FR-157 Notices
- **Requirement**: The product must send notices by email and webhook for new releases, admission failures, near-limit warnings, deprecations and fallback switches.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-11, SC-14
- **Acceptance criteria**:
    - Given each notice type, when its event happens, then the notice reaches the configured channel.
    - Given the mail server does not answer, when a notice fails, then the product records the failure for the Instance Admin.

### Operations and part replacement

#### FR-158 Dashboards
- **Requirement**: The product must show live dashboards of capacity, latency, errors and refusals for the gateway, each endpoint, the GPU pool and admission.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given a fresh install with no extra setup, when the dashboards open, then they show live data for the last hour, day and week.

#### FR-159 Basic alerts
- **Requirement**: The product must send an alert to the Instance Admin's channel for each basic fault.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-09
- **Acceptance criteria**:
    - Basic faults: the instance, the API or an engine is down, or error rate or storage use passes its level.
    - Other basic faults: a backup fails, or the break-glass account signs in.
    - Given each fault in a test, when it happens, then its alert reaches the channel.
    - Not decided yet: the default levels for error rate and storage use.

#### FR-160 Full alerts
- **Requirement**: The product must also alert on capacity, latency and refusals above their levels, failed endpoints, failed deployments and a full GPU pool.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given each fault in a test, when it happens, then its alert reaches the channel.

#### FR-161 Health checks
- **Requirement**: The product must stop sending traffic to an engine that fails its health check, and send traffic to it again when it passes.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given a stopped replica, when the set time passes, then it is out of routing, and both changes are logged. Not decided yet: the set time.
    - Given the replica restarts, when it passes the check, then it is back in routing.

#### FR-162 Drain before removal
- **Requirement**: The product must let running requests finish on an engine that it takes out of routing.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given a replica taken out of routing, when it drains, then it gets no new requests and its running requests finish.

#### FR-163 Roll back one part
- **Requirement**: The Instance Admin must be able to restart one part, or roll it back to its previous release, without reinstalling the instance.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given a faulty gateway release, when the Instance Admin rolls the gateway back, then the previous gateway release serves calls and all data stays.

#### FR-164 Automatic switch to a working part
- **Requirement**: The product must move traffic from a failing part to a working alternative part without manual action.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-09
- **Acceptance criteria**:
    - Given a fault in a part with an alternative, when the fault happens, then traffic moves to the alternative without manual action.

#### FR-165 Replace a part behind the same API
- **Requirement**: The Instance Admin must be able to move traffic from a building block to its target component in steps of 10%, 50% and 100%.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-10
- **Acceptance criteria**:
    - Given each traffic step, when it is active, then the API conformance set passes and no client needs a change.
    - Given any step, when the Instance Admin moves traffic back, then the building block serves all traffic within 1 minute.

#### FR-166 Notice of behavior changes
- **Requirement**: The product must show in the Portal, from the release before, every change that users notice which a replacement brings.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-10
- **Acceptance criteria**:
    - Given a replacement that changes how charging works, when the release before it ships, then the Portal and the release notes describe the change.

### Content safety

#### FR-167 Guardrails
- **Requirement**: The product must check prompts and answers against the tenant's guardrail rules for the model, and block or flag what breaks a rule.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-13
- **Acceptance criteria**:
    - Given a blocked word rule, when a prompt contains the word, then the product blocks it with an error that names the rule.
    - Given a flag rule, when a prompt breaks it, then the product serves the call and marks the usage record.
    - Given a moderation model rule, when the model labels a prompt as harmful, then the product blocks or flags it as the rule says.
    - The product acts on moderation labels on its own and asks no person first.
    - Not decided yet: what the product does when the moderation model fails or does not answer.

#### FR-168 Guardrail settings
- **Requirement**: The Customer Admin must be able to turn guardrail rules on for their tenant, per model.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-13
- **Acceptance criteria**:
    - Given a rule turned on for one model, when users call another model, then the rule does not apply.

#### FR-169 PII redaction
- **Requirement**: The product must replace PII in prompts, such as email addresses, phone numbers, card numbers and names, with markers before it calls a model.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-13
- **Acceptance criteria**:
    - Given a prompt with an email address, when PII redaction is on, then the model provider receives a marker instead.
    - Given the restore option is on, when the answer contains the marker, then the user sees the original value.
    - Not decided yet: whether the product blocks or sends a call when PII redaction fails.

#### FR-170 PII redaction settings
- **Requirement**: The Customer Admin must be able to turn PII redaction on for their tenant per model provider, for example only for external model providers.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: SC-13
- **Acceptance criteria**:
    - Given redaction on for external model providers only, when a user calls a self-hosted model, then the prompt is sent unchanged.

### Tools and files

#### FR-171 MCP registry
- **Requirement**: The Customer Admin must be able to register MCP servers for their tenant, with each server's address, credentials and allowed tools.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: GOAL-01
- **Acceptance criteria**:
    - Given a registered server, when anyone opens its entry, then the credentials are not shown.
    - Given a tool that is not allowed, when a client calls it, then the product refuses.

#### FR-172 Use of registered MCP tools
- **Requirement**: The product must let client applications list the MCP tools allowed for their tenant and call them through the product.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: GOAL-01
- **Acceptance criteria**:
    - Given a tenant with 2 allowed tools, when a client lists tools, then it sees exactly those 2.
    - Given an MCP server that does not answer, when a client calls its tool, then the product returns an error that names the server.

#### FR-173 File links for model input
- **Requirement**: The product must store images and documents that users send, and give models a short-lived link to each file instead of its content.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: GOAL-01
- **Acceptance criteria**:
    - Given a stored file, when its link is older than the set lifetime, then the link no longer works.
    - Given a stored file of tenant A, when a user of tenant B opens its link, then access is refused.

#### FR-174 Files that models create
- **Requirement**: The product must download files that an external model provider creates, store them, and give the user the product's own link to each.
- **Priority**: Must have
- **Stage**: 2
- **Supports**: GOAL-01
- **Acceptance criteria**:
    - Given an answer with a provider file link, when the user opens the product's link with their own key, then the file opens.
    - Given the provider fails during the download, when the user opens the link, then the product returns an error that names the file.

### Vendor services and releases

#### FR-175 Entitlement counters
- **Requirement**: The product must count the instance's models, users, admins, API keys and monthly tokens, and show the counts to the Instance Admin.
- **Priority**: Should have
- **Stage**: 1
- **Supports**: SC-14
- **Acceptance criteria**:
    - Given a running instance, when the Instance Admin opens the dashboard, then the current counts are shown.

#### FR-176 Opt-in telemetry
- **Requirement**: The product must send anonymized usage and quality data to the vendor only after the Instance Admin turns sharing on.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-14
- **Acceptance criteria**:
    - Given the default configuration, when an inspector reads outbound traffic for a day, then no telemetry leaves the instance.
    - Given sharing is on, when telemetry is sent, then it holds only the documented anonymized fields.

#### FR-177 Vendor insight view
- **Requirement**: The vendor must be able to see the telemetry of opted-in instances, per instance, in an insight view.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-14
- **Acceptance criteria**:
    - Given an opted-in test instance, when it sends telemetry, then the data appears in the insight view.

#### FR-178 Release notices
- **Requirement**: The product must notify the Instance Admin of each new release with its upgrade notes, when the Instance Admin turns release notices on.
- **Priority**: Should have
- **Stage**: 2
- **Supports**: SC-14, SC-15
- **Acceptance criteria**:
    - Given a new release, when the vendor publishes it, then the test instance shows a notice with the upgrade notes.

#### FR-179 Third-party notices
- **Requirement**: Every release must include a third-party notices file and a license list of all third-party parts that it contains or deploys.
- **Priority**: Must have
- **Stage**: 1
- **Supports**: GOAL-03
- **Acceptance criteria**:
    - Given a release, when an inspector reads its notices file, then it lists every part with its version, license and source address.

## 10. Interfaces

#### IF-01 Inference API
- **Type**: API
- **Roles**: ROLE-04, ROLE-05
- **Scenarios**: SC-03, SC-04, SC-05, SC-06, SC-07
- **Purpose**: Client applications send model requests and get answers, embeddings and the list of allowed models.
- **Main parts**:
    - Outside contracts: the OpenAI Chat Completions, Responses, Embeddings and Models formats, the Open Responses format, and the Anthropic Messages format. Not decided yet: the exact versions that the conformance set pins.
    - Operations: send a chat request, send a Responses request, send a Messages request, get embeddings, and list allowed models. Batch requests follow in Stage 2.
    - Sent: the key, the model or family, the messages, the tools and the options.
    - Returned: the answer or stream, the answering model, the tokens used, and the credit state.
    - Paths and errors follow the model providers' APIs, because client tools work only with those.

#### IF-02 Customer Portal
- **Type**: Website
- **Roles**: ROLE-04, ROLE-03
- **Scenarios**: SC-04, SC-05, SC-12, SC-13
- **Purpose**: Users manage their keys, see models and usage, and copy connection snippets. From Stage 2, Customer Admins manage their tenant here.
- **Main parts**:
    - Sign-in through the identity provider.
    - Keys: create with an expiry date, see prefixes, and revoke.
    - Models: the allowed models and families.
    - Usage: the period's usage, remaining credits and reset time.
    - Connect: a snippet for each validated tool.
    - Help: the instance's support contact.
    - From Stage 2: sign-up, users, groups, policies, service keys, tenant usage, guardrails, PII redaction, content logging and MCP servers.

#### IF-03 Admin page
- **Type**: Website
- **Roles**: ROLE-02
- **Scenarios**: SC-02, SC-03
- **Purpose**: In Stage 1, the Instance Admin follows model admission and puts models into service here.
- **Main parts**:
    - Model list with each model's stage and status.
    - Check results, reasons and logs for each model.
    - Benchmark and performance results, with the comparison to the family default.
    - GPUs needed and GPUs free.
    - Actions: Promote, Set as family default, Retry and Retire.

#### IF-04 Admin Console
- **Type**: Website
- **Roles**: ROLE-02
- **Scenarios**: SC-10, SC-11
- **Purpose**: From Stage 2, the Admin Console replaces the Admin page for all administration.
- **Main parts**: Tenants and plans, models and rollouts, usage and cost reports, health, the audit log, and the traffic steps of part replacements.

#### IF-05 Installer and instance configuration
- **Type**: CLI
- **Roles**: ROLE-02
- **Scenarios**: SC-01, SC-02, SC-03, SC-07, SC-15
- **Purpose**: The Instance Admin installs and upgrades the instance and applies its configuration.
- **Main parts**:
    - Commands: check prerequisites, install, apply configuration, upgrade, back up, restore, and roll back one part.
    - Configuration sections: mode, domains, identity provider, claims mapping, first admins, support contact, tenants and tenant settings.
    - More configuration sections: families, models, external models, prices, limits, runtime profile, admission rules, backups and alerts.
    - Secrets go into the instance's secret store, and the configuration only refers to them.

#### IF-06 Dashboards and alerts
- **Type**: Website
- **Roles**: ROLE-02
- **Scenarios**: SC-09, SC-10
- **Purpose**: The Instance Admin watches health, capacity and usage, and gets alerts.
- **Main parts**: Dashboards for inference, engines, the GPU pool, admission, usage and entitlement counters. Alerts go to the channel that the Instance Admin sets.

#### IF-07 Management API
- **Type**: API
- **Roles**: ROLE-02, ROLE-03
- **Scenarios**: SC-12
- **Purpose**: From Stage 2, scripts administer the instance in the same way as the Admin Console.
- **Main parts**: Operations for tenants, plans, policies, models, rollouts, keys and usage export, each limited to the caller's role. Administration through MCP follows in Stage 3.

#### IF-08 Identity provider connection
- **Type**: Connection to another system
- **Roles**: ROLE-06, ROLE-04
- **Scenarios**: SC-04, SC-07, SC-08
- **Purpose**: People sign in, and the identity provider tells the product when a person loses access.
- **Main parts**:
    - Sign-in follows OpenID Connect Core 1.0. The product reads the subject, email address, name and roles.
    - Deprovisioning notices arrive signed at the instance's notice address.
    - From Stage 2, sign-in also follows SAML 2.0, and accounts also arrive through SCIM 2.0.

#### IF-09 Model hub connection
- **Type**: Connection to another system
- **Roles**: ROLE-02
- **Scenarios**: SC-02
- **Purpose**: The product gets model cards and weights from Hugging Face for admission.
- **Main parts**: The product sends the model ID and, for gated models, the access token. It receives the model card, the license and the files.

#### IF-10 External model provider connection
- **Type**: Connection to another system
- **Roles**: ROLE-02, ROLE-04
- **Scenarios**: SC-03, SC-13
- **Purpose**: Users call models that the instance does not host, such as Anthropic and OpenAI models.
- **Main parts**: The product sends requests with the TF Provider's provider key and receives answers and token usage. Stage 1 connects OpenAI and Anthropic. Stage 2 adds Azure OpenAI and Google Gemini.

#### IF-11 Notices
- **Type**: Email or text messages
- **Roles**: ROLE-02, ROLE-03, ROLE-04
- **Scenarios**: SC-05, SC-11, SC-14
- **Purpose**: From Stage 2, the product tells people about events by email or webhook.
- **Main parts**:

    | Event | Who gets it | What it says |
    | --- | --- | --- |
    | Use reaches the near-limit share | The user | Use, limit and reset time |
    | Use passes the soft limit | The user and the Customer Admin | Use, limit and what happens at the hard limit |
    | An admission fails | The Instance Admin | The model, the failed check and the reason |
    | A model is deprecated | Users who called it in the last period | The end date and the replacement |
    | A fallback model answered | The user | The requested and the answering model |
    | A new release exists | The Instance Admin | The version and the upgrade notes |

#### IF-12 Vendor connection
- **Type**: Connection to another system
- **Roles**: ROLE-01, ROLE-02
- **Scenarios**: SC-14, SC-15
- **Purpose**: The vendor sends release notices and receives opt-in telemetry.
- **Main parts**: Release notices go to the instance. Anonymized telemetry goes to the vendor. Signed entitlement reports follow in Stage 3. The instance uses each flow only after the Instance Admin turns it on.

## 11. Data

Users of the current router setup move by invitation and create new keys. Not decided yet: whether existing keys and usage move too.

#### DATA-01 Tenant
- **Meaning**: A customer account of the instance: a company, a department or a person.
- **Created by**: Instance Admin (ROLE-02). From Stage 2 also sign-up and the Management API.
- **Access**: The Instance Admin sees and changes all tenants. From Stage 2, a Customer Admin sees their own tenant and changes its users, groups and policies.
- **Kept for**: Until the Instance Admin deletes it and the grace period ends.
- **Personal data**: Only when the tenant is one person. Then its name is personal data, needed to identify the account.
- **States**:
    - Active is the first state.
    - Suspend moves Active to Suspended, and all its keys are refused. Lifting the suspension moves it back to Active.
    - Delete moves it to Deleted. Undo within the grace period moves it back to Active.
    - The end of the grace period moves Deleted to Removed: personal data is deleted and usage is anonymized.
    - Any other change, such as suspending a Removed tenant, is refused with a message.

#### DATA-02 User account
- **Meaning**: A person's account in one tenant, with their role.
- **Created by**: The product at first sign-in. From Stage 2 also a Customer Admin (ROLE-03), directory sync or SCIM.
- **Access**: The user sees their own account. The Instance Admin sees all accounts. From Stage 2, the Customer Admin sees the accounts of their tenant.
- **Kept for**: Until the person is deleted. Their usage stays in anonymized form for the usage retention period.
- **Personal data**: Yes: name, email address and identity provider ID, needed to sign the person in and to assign their usage.
- **States**:
    - Active is the first state.
    - The instance configuration, a deprovisioning notice or directory sync moves it to Disabled, and its keys are refused.
    - The Instance Admin moves a Disabled account back to Active.
    - A deletion request moves it to Deleted: name, email address and keys are removed.
    - A sign-in while Disabled or Deleted is refused with the instance contact.

#### DATA-03 API key
- **Meaning**: A secret that a user or a tenant sends with each call.
- **Created by**: User (ROLE-04). From Stage 2, the Customer Admin creates service keys.
- **Access**: The owner sees the prefix, creation date, expiry date and last use. Nobody sees the full key after creation. The owner, the Instance Admin and, from Stage 2, the Customer Admin can revoke it.
- **Kept for**: Until it is revoked or expires. After that, only its audit records remain.
- **Personal data**: No. The key links to a user account, which holds the personal data.
- **States**:
    - Active is the first state.
    - The expiry date moves it to Expired.
    - Revocation, a disabled owner, or a tenant change of the owner moves it to Revoked.
    - No change leads back to Active. A call with an Expired or Revoked key gets the authentication error.

#### DATA-04 Family
- **Meaning**: A named group of model versions with one default model and an optional fallback list.
- **Created by**: Instance Admin (ROLE-02)
- **Access**: The Instance Admin changes families. Users see the families that their tenant allows.
- **Kept for**: Until the Instance Admin removes it.
- **Personal data**: No
- **States**: None

#### DATA-05 Model version
- **Meaning**: One exact model release that the product checks and serves, self-hosted or from an external model provider.
- **Created by**: Instance Admin (ROLE-02), by adding a Hugging Face ID or registering an external model.
- **Access**: The Instance Admin sees all versions and changes their state. Users see the served versions that their tenant allows.
- **Kept for**: The record and its evidence stay after retirement, for audit.
- **Personal data**: No
- **States**:
    - Registered is the first state.
    - A self-hosted version moves through License check, Source and capacity check, Downloading, Format check, Testing and Benchmarking to Ready.
    - Each move happens when the earlier check passes. A failed or missing benchmark result moves it to Ready with a warning.
    - A failed check moves it to Failed. A retry after changed inputs moves Failed to Registered.
    - An external model moves from Registered to Ready after a successful test call.
    - Promotion moves Ready to Serving. From Stage 2, a deprecation moves Serving to Deprecated.
    - Retirement, or the end date of a deprecation, moves it to Retired.
    - Any other change, such as promoting a Failed version, is refused with the reason.

#### DATA-06 Admission evidence
- **Meaning**: The results, logs and benchmark scores of each admission check of a model version.
- **Created by**: The product, during admission.
- **Access**: The Instance Admin sees it. Nobody changes it.
- **Kept for**: As long as the model version's record.
- **Personal data**: No
- **States**: None

#### DATA-07 Runtime profile
- **Meaning**: The engine settings for self-hosted models. They include engine release, GPU type, GPUs per replica, context length, output cap, memory share and precision. They also include cache, tool-call and reasoning settings, the chat template, and the custom-code switch.
- **Created by**: The vendor ships one default profile. The Instance Admin (ROLE-02) changes it.
- **Access**: The Instance Admin.
- **Kept for**: As long as the instance runs.
- **Personal data**: No
- **States**: None

#### DATA-08 Credit prices
- **Meaning**: The credit price per 1 million tokens of each token class, for each model.
- **Created by**: Instance Admin (ROLE-02)
- **Access**: The Instance Admin sees and changes them.
- **Kept for**: Each version is kept as long as the usage records that it priced.
- **Personal data**: No
- **States**: None

#### DATA-09 Credit counter
- **Meaning**: The credits used in the current period by one user, one tenant or one key.
- **Created by**: The product.
- **Access**: A user sees their own. The Instance Admin sees all. From Stage 2, the Customer Admin sees those of their tenant.
- **Kept for**: The current period. Usage records keep the history.
- **Personal data**: No
- **States**: None. A counter starts at 0 at each period start and grows when each call ends.

#### DATA-10 Usage record
- **Meaning**: One record per call: who called, which model, tokens per class, credits, latency, status and options.
- **Created by**: The product.
- **Access**: Users see their own. The Instance Admin sees all. From Stage 2, the Customer Admin sees those of their tenant. Nobody changes them.
- **Kept for**: The usage retention period. Not decided yet: its length.
- **Personal data**: Yes: the user link, needed for limits and reports. Deleting the user removes the link.
- **States**: None

#### DATA-11 GPU usage record
- **Meaning**: The GPU type, GPU count and hours of each deployment per day.
- **Created by**: The product.
- **Access**: The Instance Admin.
- **Kept for**: The usage retention period.
- **Personal data**: No
- **States**: None

#### DATA-12 Tenant settings and plan
- **Meaning**: In Stage 1, a tenant's allowed models, default credit limits and concurrency limit. From Stage 2, a plan with allowed models, a default policy, a tenant limit and an overuse allowance.
- **Created by**: Instance Admin (ROLE-02)
- **Access**: The Instance Admin changes them. From Stage 2, the Customer Admin sees the plan.
- **Kept for**: As long as the tenant.
- **Personal data**: No
- **States**: None

#### DATA-13 Policy
- **Meaning**: From Stage 2, rules that allow or block models for users and groups of one tenant, within the plan.
- **Created by**: Customer Admin (ROLE-03)
- **Access**: The Customer Admin of the tenant and the Instance Admin.
- **Kept for**: As long as the tenant.
- **Personal data**: No
- **States**: None

#### DATA-14 Instance configuration
- **Meaning**: The settings file that the Instance Admin applies with the installer.
- **Created by**: Instance Admin (ROLE-02)
- **Access**: The Instance Admin only.
- **Kept for**: The product keeps the applied version and backs it up every day.
- **Personal data**: Yes, when it lists first admins or users by email address, needed for admin bootstrap and to disable users.
- **States**: None

#### DATA-15 Secret
- **Meaning**: Keys of external model providers, the Hugging Face token, identity provider client secrets, and the break-glass account's password.
- **Created by**: Instance Admin (ROLE-02)
- **Access**: Only the parts that use a secret read it. Nobody sees it after entry.
- **Kept for**: Until the Instance Admin replaces or deletes it.
- **Personal data**: No
- **States**: None

#### DATA-16 Audit record
- **Meaning**: Who did what, to which object, when, and with what result. From Stage 2, also the values before and after.
- **Created by**: The product.
- **Access**: The Instance Admin sees all records. From Stage 2, the Customer Admin sees those of their tenant. Nobody changes or deletes a record before its retention ends.
- **Kept for**: The audit retention period. Not decided yet: its length.
- **Personal data**: Yes: the person who acted, needed to trace each change.
- **States**: None

#### DATA-17 Prompt and response text
- **Meaning**: The text of prompts and answers.
- **Created by**: Users and models.
- **Access**: Not stored in Stage 1. From Stage 2, stored only for tenants that turn content logging on. Not decided yet: who may read it.
- **Kept for**: The content retention period of the tenant.
- **Personal data**: Yes, it can hold any personal data. It is kept only by the tenant's choice.
- **States**: None

#### DATA-18 Stored file
- **Meaning**: From Stage 2, images and documents that users send, files that models create, and batch inputs and results.
- **Created by**: Users, models and the product.
- **Access**: The owner and, through short-lived links, the model that uses it. Other tenants have no access.
- **Kept for**: The file retention period of the tenant.
- **Personal data**: It can hold personal data that users chose to send.
- **States**: None

#### DATA-19 MCP server entry
- **Meaning**: From Stage 2, a registered MCP server with its address, its credentials and its allowed tools.
- **Created by**: Customer Admin (ROLE-03)
- **Access**: The Customer Admin of the tenant. Credentials are never shown after entry.
- **Kept for**: Until the Customer Admin removes it.
- **Personal data**: No
- **States**: None

#### DATA-20 Entitlement counters and telemetry
- **Meaning**: Counts of models, users, admins, keys and monthly tokens, and from Stage 2 anonymized usage and quality data.
- **Created by**: The product.
- **Access**: The Instance Admin. The vendor (ROLE-01) receives them only when the Instance Admin turns sharing on.
- **Kept for**: Not decided yet: the period.
- **Personal data**: No
- **States**: None

## 12. Quality requirements

#### QR-01 Gateway latency
- **Category**: Speed
- **Requirement**: From Stage 2, the product adds at most a set number of milliseconds to the 95th percentile of call latency. A load test with the agreed workload on reference hardware measures it. Not decided yet: the value and the workload.
- **Applies to**: IF-01

#### QR-02 No single point of failure
- **Category**: Availability
- **Requirement**: In the Standard profile, sign-in, key checks and routing keep working when any 1 node stops. A test stops each node in turn at each release.
- **Applies to**: Whole product

#### QR-03 Inference availability
- **Category**: Availability
- **Requirement**: In Stage 4, the Inference API on the flagship works in 99.5% of the minutes of each calendar month. A minute works when no call in it gets a server error caused by the product. Announced maintenance and outages of external model providers do not count.
- **Applies to**: IF-01

#### QR-04 Limited retries
- **Category**: Availability
- **Requirement**: The product retries a failed engine or provider call only on passing errors before any output, at most a set number of times. Not decided yet: the number.
- **Applies to**: IF-01, IF-10

#### QR-05 Users per instance
- **Category**: Capacity
- **Requirement**: From Stage 2, one instance on reference hardware serves 1,000 registered users with 100 sessions at the same time and meets QR-01. Planning assumes 10 active users per server with 8 GPUs. Not decided yet: the workload model.
- **Applies to**: Whole product

#### QR-06 Gateway growth
- **Category**: Capacity
- **Requirement**: In Stage 1, growing the gateway from 1 to 3 replicas under load causes no failed requests, measured in a load test.
- **Applies to**: IF-01

#### QR-07 Long prompts
- **Category**: Capacity
- **Requirement**: Each model's maximum context length is documented and enforced. A request at the maximum succeeds, and one above it is refused with a clear error. The target is 256,000 tokens where the hardware allows.
- **Applies to**: IF-01

#### QR-08 Encrypted connections
- **Category**: Security
- **Requirement**: 100% of the instance's outside addresses use TLS. A plain HTTP address only redirects. A scan of all outside addresses checks it at each release.
- **Applies to**: Whole product

#### QR-09 Secret handling
- **Category**: Security
- **Requirement**: An inspection of a test instance at each release finds 0 secrets in the instance configuration, logs or screens after entry.
- **Applies to**: IF-05, IF-03, IF-02

#### QR-10 Least access
- **Category**: Security
- **Requirement**: At each release, a review finds 0 permissions beyond those that the architecture document lists for each part. From Stage 2, each part refuses calls from parts that cannot prove their identity.
- **Applies to**: Whole product

#### QR-11 Security review
- **Category**: Security
- **Requirement**: Before people outside the vendor's teams get access to an instance, a security review and a penetration test end with 0 open critical findings.
- **Applies to**: Whole product

#### QR-12 Image scanning
- **Category**: Security
- **Requirement**: Each release scans every image and ships 0 images with a known critical weakness that has an available fix. Each release publishes 1 SBOM per image.
- **Applies to**: Whole product

#### QR-13 Data stays in the instance
- **Category**: Privacy
- **Requirement**: With default settings, the outbound traffic of 1 test day goes only to identity providers, image registries, model hubs and registered external model providers.
- **Applies to**: Whole product

#### QR-14 Retention
- **Category**: Privacy
- **Requirement**: Every 24 hours, the product deletes usage records, logs, traces, audit records, anonymized usage and stored text older than their retention periods. An inspection of a test instance checks it. Not decided yet: the periods and the laws that set them.
- **Applies to**: DATA-10, DATA-16, DATA-17, DATA-18

#### QR-15 Audit records stay unchanged
- **Category**: Records of actions
- **Requirement**: 0 interfaces can change or delete an audit record before its retention ends. A test tries this through every interface at each release.
- **Applies to**: FR-148, FR-149

#### QR-16 Data loss and restore time
- **Category**: Recovery
- **Requirement**: Lost data: at most 24 hours of configuration changes, and from Stage 2 also of usage history. Time to work again after a full loss: Not decided yet: the restore time target.
- **Applies to**: FR-14, FR-15

#### QR-17 Accessibility
- **Category**: Accessibility
- **Requirement**: From Stage 2, the Customer Portal and the Admin Console meet WCAG at a set level, checked by an accessibility audit. Not decided yet: the WCAG version and level. Stage 1 has no level, because its pages are minimal.
- **Applies to**: IF-02, IF-04

#### QR-18 Language and time
- **Category**: Languages and regions
- **Requirement**: Screens and documents are in English. All screen text sits outside the code, so translations need no code change. Times are shown in UTC in ISO 8601.
- **Applies to**: IF-02, IF-03, IF-04

#### QR-19 Supported clusters
- **Category**: Compatibility
- **Requirement**: Tier 1: the Standard profile, installed and smoke-tested every day. Tier 2: Rancher, GKE, Virtuozzo Kubernetes, kubeadm and k3s, each tested once per stage. Tier 3: any conformant Kubernetes cluster, best effort. Not decided yet: the supported Kubernetes versions.
- **Applies to**: IF-05

#### QR-20 Browsers
- **Category**: Compatibility
- **Requirement**: The Portal and both admin websites work in the last 2 major versions of Chrome, Edge, Firefox and Safari, checked by a smoke test.
- **Applies to**: IF-02, IF-03, IF-04

#### QR-21 Client tools
- **Category**: Compatibility
- **Requirement**: At each release, Claude Code and 1 OpenAI-compatible tool pass the tool matrix for streaming, tool calls and structured output. Not decided yet: the second tool and the tool versions.
- **Applies to**: IF-01

#### QR-22 GPUs
- **Category**: Compatibility
- **Requirement**: The product runs on NVIDIA GPUs that the pinned engine release supports, and in CPU-only mode with 0 GPUs for evaluation. Release notes list the GPUs and driver versions. Not decided yet: the GPU generations and other GPU makers.
- **Applies to**: Whole product

#### QR-23 Same API through replacements
- **Category**: Compatibility
- **Requirement**: The API conformance set and the tool matrix pass before, at the 10%, 50% and 100% traffic steps, and after every part replacement. Paths, key format, error table and snippets do not change.
- **Applies to**: IF-01, FR-165

#### QR-24 Install by an outside engineer
- **Category**: Ease of use
- **Requirement**: An outside engineer installs the Standard profile on fresh servers and serves a model within 1 working day, from the documents alone. Model download time does not count.
- **Applies to**: IF-05

#### QR-25 First call from the Portal
- **Category**: Ease of use
- **Requirement**: In onboarding sessions, new users reach a first answer through the Portal within 15 minutes in Stage 1 and 5 minutes in Stage 2.
- **Applies to**: IF-02

#### QR-26 Model quality evidence
- **Category**: AI result quality
- **Requirement**: Every served self-hosted version has Terminal Bench and performance results from the eval instance. In Stage 1, a version with a failed benchmark can be served, with a warning. From Stage 2, admin-set thresholds apply, as FR-90 states.
- **Applies to**: FR-79, FR-78, FR-90

#### QR-27 Guardrail accuracy
- **Category**: AI result quality
- **Requirement**: From Stage 2, the guardrail moderation model meets a set rate of wrong blocks on a fixed test set. Not decided yet: the test set and the rate.
- **Applies to**: FR-167

## 13. Constraints

#### CON-01 Community event date
- **Constraint**: Stage 1 must serve real users on the flagship and on the Constructor Tech instance at the community event on 5 December 2026.
- **Source**: The fixed date of the Constructor Fabric community event.

#### CON-02 Product license
- **Constraint**: All Token Factory code, installer packages, configuration, scripts and documents must use the Apache License 2.0, also while the source is private. Each source file names this license.
- **Source**: Company licensing decision for the open-source product.

#### CON-03 Third-party licenses
- **Constraint**:
    - Third-party code and deployed parts must use permissive licenses: Apache-2.0, MIT, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Zlib, PostgreSQL or CC0-1.0.
    - Strong copyleft licenses, such as GPL and AGPL, are not allowed in the shipped product.
    - Source-available licenses, such as SSPL, BUSL and RSAL, are not allowed.
    - A weak copyleft part is allowed only unchanged, as a separate part, with a recorded and time-limited exception.
    - Commercial "enterprise" features of building blocks must stay off.
    - GPU drivers, operating system packages of base images, and model weights follow their own terms.
    - FR-179 lists every part. Not decided yet: the final allowlist and the weak copyleft list.
- **Source**: Company licensing policy for the open-source product.

#### CON-04 Model licenses
- **Constraint**: The product must serve a model only when its license allows the instance's intended use. FR-70 checks this before download.
- **Source**: The license of each model.

#### CON-05 External model provider terms
- **Constraint**: Calls to external models must follow the provider's terms. The TF Provider pays for each call, so FR-138 must record every call.
- **Source**: Contracts between the TF Provider and each external model provider.

#### CON-06 Personal data on request
- **Constraint**: The product must delete a person's personal data on request, as FR-34 states, and keep only anonymized usage. Not decided yet: which privacy laws apply to the first instances.
- **Source**: Privacy laws in the countries where instances run.

#### CON-07 Constructor Fabric Pass
- **Constraint**: The flagship must sign people in through Constructor Fabric Pass, connected only by OpenID Connect and deprovisioning notices. FR-17 and FR-30 cover it.
- **Source**: Existing system: the community's sign-up service.

#### CON-08 No required vendor connection
- **Constraint**: An instance must install and run with no connection to the vendor. Telemetry and release notices are opt-in, as FR-176 and FR-178 state.
- **Source**: Company policy for the open-source product.

#### CON-09 No code from models
- **Constraint**: The product must not run code that comes with a model, unless the Instance Admin allows that model by name. FR-73 does this.
- **Source**: Company security policy.

## 14. Solution overview

1. **Main parts**:
    - Inference service: the single API entry for all models. It checks each call, sends it to a self-hosted engine or an external model provider, and records usage.
    - Model factory: it takes a model from Hugging Face, checks and benchmarks it, deploys it, and retires it.
    - Customer Portal, Admin page and, from Stage 2, Admin Console and Management API.
    - Identity and tenants: identity provider connections, tenants, users and keys.
    - Limits and usage: credit prices, limits, counters, usage records and reports.
    - Installer and instance configuration.
    - Monitoring: dashboards, alerts and audit records.
    - Vendor services: release notices, opt-in telemetry and entitlement reports.

    The Instance Admin sets up the instance with the installer and the instance configuration. The model factory fills the catalog that the inference service uses. Each call passes identity, tenant and limit checks before it reaches a model. Usage records feed the limits, the Portal and the reports.

2. **Technology decisions**: 7 decisions, each with its reason.

#### TD-01 Building blocks first, target components later
- **Decision**:
    - Each stage first delivers its scenarios end to end by connecting building blocks: open-source software, existing company platform parts and scripts.
    - The vendor runs the result in production on the flagship. One-off scripts are allowed, each with a named target component.
    - Target components then replace building blocks one at a time, as FR-165 states.
    - The Inference API, keys, Portal and instance configuration stay unchanged, as QR-23 states.
- **Reason**: Time to launch. Stage 1 must serve users at the community event (CON-01), before most target components exist. Unchanged interfaces protect users from the replacements.

#### TD-02 LiteLLM as the Stage 1 gateway
- **Decision**: LiteLLM, open-source edition, serves the Inference API in Stage 1. It covers API formats, routing, keys, rate limits, credit limits and usage logs, with extensions where it falls short. Its enterprise parts stay off. llm-gateway replaces it from Stage 2.
- **Reason**: Time to launch: it already supports the needed API formats and model providers. License: its core uses MIT, while its enterprise parts need a paid license above 5 single sign-on users.

#### TD-03 Target components from Constructor Fabric
- **Decision**: Target components are Constructor Fabric gears, named as in the component plan and the architecture diagram.

    | Capability | Stage 1 building block | Target component | Component priority |
    | --- | --- | --- | --- |
    | Single entry point for API and web traffic | Envoy Gateway | api-gateway | p1 |
    | Inference API formats and request checks | LiteLLM | llm-gateway with authn-resolver, tenant-resolver, authz-resolver and license-resolver | p1 |
    | Calls to engines and external model providers | LiteLLM provider connections | llm-gateway plugins for vLLM, OpenAI and Anthropic, through oagw | p1 |
    | More external model providers | None | llm-gateway plugins for Azure OpenAI and Gemini | p2 |
    | API keys and rate limits | LiteLLM keys and limits | llm-gw-mngr | p1 |
    | Families, defaults and fallback lists | LiteLLM model groups and fallbacks | model-router | p1 |
    | Routing by capability, weight and prompt | None | model-router | p2 and p3 |
    | Credit limits and charging | LiteLLM budgets with extensions, set in the instance configuration | quota-enforcement and quota-resolver, with first quota settings in Model Factory backend | p1 |
    | Budget splits and quota plans | None | quota-manager | p3 |
    | Model access per tenant | LiteLLM team model lists | license-enforcement | p1 |
    | Usage records | LiteLLM usage logs sent to the usage store | usage-collector and its client library | p1 |
    | GPU usage records | Scripts that read engine metrics | hw-usage-collector | Not decided yet |
    | Model catalog and states | Instance configuration and LiteLLM model list | model-registry | p1 |
    | Admission and deployment steps | Scripts run as Temporal workflows | Model Factory backend, model-downloader, model-scanner, model-benchmark and model-deployer, on task-engine | p1 |
    | GPU workloads and capacity | Helm releases made by scripts | infrastructure-resource-manager | p1 |
    | Inference engines | vLLM with a standard chart | vLLM, no replacement planned | p1 |
    | Sign-in, users and tenants | Keycloak, and OpenID Connect to outside identity providers | account-manager, authn-resolver and tenant-resolver | p1 |
    | Secrets | Kubernetes Secrets | credstore | p1 |
    | Tenant and user settings | Instance configuration | settings-service | p1 |
    | Events between parts | None | event-broker | p1 |
    | Audit records | Log entries with audit fields | audit | p1 |
    | Schemas of settings and events | None | types-registry | p1 |
    | Guardrails and PII redaction | Not decided yet | guardrails and PII redaction hooks | p2 |
    | MCP tools | MCP proxy inside the gateway | MCP registry | p2 |
    | File storage and model-created files | Object storage | file-storage and file-downloader | p2 |
    | Access policies and deployment admission | None | policy-engine and admission-control | Not decided yet |

    - The component priority sets the order of replacement. A p1 component replaces its building block first.
    - A building block can serve a capability before its target component has it. For example, LiteLLM limits each tenant's parallel requests in Stage 1, while quota-enforcement adds this at p3.
    - A building block retires only when target components cover every capability that it serves.
    - The billing components of the component plan are not part of this product. They are products, pricing, payments, subscriptions, rating, invoicing and ledger.
- **Reason**: Existing company platform: the gears are shared with other Constructor Fabric products. They remove the license limits of the building blocks and add multi-tenant control.

#### TD-04 Kubernetes and Helm
- **Decision**: The product runs on Kubernetes and installs with Helm. A cluster bootstrap exists only for the reference cluster.
- **Reason**: Customer demand: TF Providers run their own or rented clusters from any supplier. Time to launch: the company's existing installer uses Helm.

#### TD-05 vLLM as the only engine in Stages 1 and 2
- **Decision**: vLLM serves all self-hosted models in Stages 1 and 2. Its pinned release must support a cache salt per request, for FR-46.
- **Reason**: Time to launch: it serves most open-weight models with one setup.

#### TD-06 Monitoring building blocks
- **Decision**: VictoriaMetrics and VictoriaLogs collect metrics and logs. Langfuse, open edition, keeps model-call traces without prompt text. Not decided yet: the dashboard tool.
- **Reason**: License: Grafana and Loki use the AGPL-3.0 license, which CON-03 does not allow in the shipped product.

#### TD-07 Keycloak as the bundled identity provider
- **Decision**: Keycloak is the identity provider that ships with the product, for FR-18.
- **Reason**: Customer demand: instances must run without an outside identity provider. Time to launch: it offers GitHub sign-in and OpenID Connect today. License: Apache-2.0.

Architects choose all other technologies and describe them in the architecture document.

## 15. Assumptions and risks

#### ASM-01 GPUs in time
- **Assumption**: GPUs for the flagship's production and eval instances are ready in time for Stage 1.
- **If false**: Stage 1 shows admission and serving with the CPU test model, and GPU serving follows after the event.
- **Affects**: FR-78, FR-79, MET-06

#### ASM-02 Pass ready as an identity provider
- **Assumption**: Before Stage 1, Constructor Fabric Pass offers OpenID Connect, Google and Microsoft sign-in, account linking, a roles claim and deprovisioning notices.
- **If false**: The flagship uses the bundled identity provider with GitHub sign-in and an allowlist of approved people.
- **Affects**: FR-17, FR-18, FR-30, CON-07

#### ASM-03 LiteLLM covers Stage 1
- **Assumption**: LiteLLM, open-source edition, covers the Stage 1 needs, or small extensions close its gaps. The needs are per-model prices, limits per user, tenant and key, concurrency limits, cache salts, credit headers and the error table.
- **If false**: Stage 1 needs larger extensions, or llm-gateway takes over earlier. Users see no difference.
- **Affects**: TD-02, FR-46, FR-104, FR-105

#### ASM-04 Models fit one profile
- **Assumption**: The chosen open-weight models run on the pinned engine release with one runtime profile and per-model settings.
- **If false**: A family waits for a profile change, and Stage 1 serves fewer families.
- **Affects**: FR-64, FR-65

#### ASM-05 Load per server
- **Assumption**: About 10 active users fit on one server with 8 GPUs, with up to 30 to 40 agent calls per user at peaks.
- **If false**: The flagship needs more GPUs or lower concurrency limits.
- **Affects**: QR-05, FR-47

#### ASM-06 Constructor Tech ready
- **Assumption**: Constructor Tech provides hardware, an identity provider and an Instance Admin in time for Stage 1.
- **If false**: Stage 1 has 1 production instance, and MET-06 misses its Stage 1 target.
- **Affects**: MET-06, CON-01

#### ASM-07 Target components in priority order
- **Assumption**: Target components become ready in the order of their component priority.
- **If false**: Building blocks serve longer, and users see no difference.
- **Affects**: TD-01, TD-03

#### ASM-08 Tools accept family names
- **Assumption**: Claude Code and the second validated tool work with family names and the instance's API address, including Claude Code's background model.
- **If false**: Snippets need tool-specific workarounds.
- **Affects**: FR-152, QR-21

#### RISK-01 Cross-tenant leak
- **Risk**: Shared engines leak cached prompts or data between tenants, as happened in other products.
- **Likelihood**: Medium
- **Impact**: High
- **Response**: Stage 1 isolates data, cached prompts and capacity, with isolation tests on every build. Stage 2 adds strict isolation.
- **Affects**: FR-45, FR-46, FR-47, GOAL-05

#### RISK-02 Model quality drift
- **Risk**: A served model differs from the version that was tested, or a provider changes a model without notice.
- **Likelihood**: Medium
- **Impact**: Medium
- **Response**: Admission benchmarks compare each version with the family default. Versions are pinned. Stage 3 adds scheduled benchmark re-runs.
- **Affects**: FR-79, FR-81, GOAL-02

#### RISK-03 Building block licenses
- **Risk**: Some planned building blocks are not under permissive licenses, and LiteLLM and Langfuse contain commercial parts.
- **Likelihood**: High
- **Impact**: Medium
- **Response**: A license list of all parts, replacements before parts are connected, recorded exceptions, and enterprise features kept off.
- **Affects**: CON-03, TD-02, TD-06

#### RISK-04 Low adoption
- **Risk**: Users stay with outside AI tools.
- **Likelihood**: Medium
- **Impact**: High
- **Response**: Ready snippets, a first answer within minutes, external models behind the same key, weekly release notes, and daily use by the vendor's own teams.
- **Affects**: GOAL-01, MET-03

#### RISK-05 Benchmark cost and trust
- **Risk**: Full benchmarks cost too much, or users distrust synthetic benchmark results.
- **Likelihood**: Medium
- **Impact**: Medium
- **Response**: A benchmark budget per stage. Terminal Bench and internal tasks on real hardware come first, and client-run benchmarks follow in Stage 3.
- **Affects**: FR-79, FR-85

#### RISK-06 Closed networks
- **Risk**: Instances in closed networks have no cloud object storage and no internet access for downloads.
- **Likelihood**: Medium
- **Impact**: Medium
- **Response**: Weights can sit in storage inside the cluster. Stage 3 adds offline import.
- **Affects**: FR-59

#### RISK-07 Features lost in format conversion
- **Risk**: Converting between API formats loses features such as reasoning output or prompt caching.
- **Likelihood**: Medium
- **Impact**: Medium
- **Response**: Requests to a provider's model keep the provider's own format. Claude Code is tested at each release. Stage 2 publishes a table of losses.
- **Affects**: FR-94, FR-97, FR-98

#### RISK-08 Prompts leave the instance
- **Risk**: External models send prompts outside the instance, against the rules of some companies.
- **Likelihood**: Medium
- **Impact**: High
- **Response**: External models are off by default and allowed per tenant. Refusals are recorded as security events. Stage 2 adds PII redaction.
- **Affects**: FR-117, FR-169, SC-03

#### RISK-09 External model spend
- **Risk**: External models cost real money per token, and their use can pass the TF Provider's budget.
- **Likelihood**: Medium
- **Impact**: Medium
- **Response**: Credit prices per model, limits per user, tenant and key, and usage records without loss.
- **Affects**: FR-121, FR-122, MET-10

#### RISK-10 Flagship sign-in blocked
- **Risk**: Constructor Fabric Pass is not ready, so flagship users cannot sign in.
- **Likelihood**: Medium
- **Impact**: High
- **Response**: The bundled identity provider with GitHub sign-in and an allowlist takes over, as ASM-02 states.
- **Affects**: FR-17

#### RISK-11 One profile does not fit
- **Risk**: One runtime profile does not fit all models, because families need different parsers, templates or context lengths.
- **Likelihood**: Medium
- **Impact**: Medium
- **Response**: Per-model settings in Stage 1, and more profiles with other engines in Stage 3.
- **Affects**: FR-64

#### RISK-12 A replacement changes behavior
- **Risk**: A target component behaves differently from its building block in a way that users notice, such as in charging or errors.
- **Likelihood**: Medium
- **Impact**: Medium
- **Response**: The conformance set and the tool matrix run at each traffic step. Changes are announced, and traffic moves back in one action.
- **Affects**: FR-165, FR-166, QR-23

## 16. Open questions

#### Q-01 Stage 1 content
- **Type**: Product decision
- **Question**: Which open-weight models, embedding model, second validated tool, tool versions and hardware does Stage 1 use, and with which flagship tenant settings?
- **Why it matters**: Admission, snippets, tests and capacity depend on these choices.
- **Affects**: FR-152, FR-94, QR-21, ASM-08
- **Options**: Families GLM and Qwen as targets. Second tool not chosen.

#### Q-02 Limit values
- **Type**: Product decision
- **Question**: What are the credit prices per model, default credit limits, default period, concurrency limits, requests per minute and near-limit share?
- **Why it matters**: Limits decide how much each user can do and how well tenants are protected.
- **Affects**: FR-121, FR-122, FR-125, FR-129, FR-130, FR-136, FR-47
- **Options**: Default period: day, week or month.

#### Q-03 Conformance set
- **Type**: Missing fact
- **Question**: Which requests make up the conformance set, and which versions of the OpenAI, Open Responses and Anthropic formats does it pin?
- **Why it matters**: Tests of the Inference API need a fixed target.
- **Affects**: IF-01, FR-93, FR-95
- **Options**: None

#### Q-04 Sanity prompts
- **Type**: Missing fact
- **Question**: Which prompts make up the sanity set of the acceptance tests, and what result counts as a pass?
- **Why it matters**: The acceptance tests fail or pass models with this set.
- **Affects**: FR-77
- **Options**: None

#### Q-05 Credit rounding
- **Type**: Product decision
- **Question**: How many decimal places do credits keep, and how does the product round them?
- **Why it matters**: Counters, reports and exports must agree to the last credit.
- **Affects**: FR-121
- **Options**: None

#### Q-06 Owner of key limits
- **Type**: Product decision
- **Question**: Who sets a key's credit limit: the user, the Customer Admin or the Instance Admin?
- **Why it matters**: The Portal and the instance configuration need the setting in the right place.
- **Affects**: FR-124
- **Options**: The user, within their own limit. The Instance Admin in Stage 1, and the Customer Admin from Stage 2.

#### Q-07 Cost estimate for reservations
- **Type**: Product decision
- **Question**: How does reserve-then-commit estimate a request's cost?
- **Why it matters**: A high estimate refuses requests that would fit. A low estimate lets use pass the limit.
- **Affects**: FR-127
- **Options**: Input tokens plus the requested output cap. Input tokens plus the profile's output cap.

#### Q-08 Requests for "auto"
- **Type**: Product decision
- **Question**: Until routing by prompt exists, does a request for "auto" get a refusal or a default model of the tenant?
- **Why it matters**: Some tools send "auto", and users need a clear result.
- **Affects**: FR-101
- **Options**: Refuse with a clear error. Serve with a default model set per tenant.

#### Q-09 Settings for one model
- **Type**: Product decision
- **Question**: Which runtime settings can one model override?
- **Why it matters**: Families need different parsers and templates.
- **Affects**: FR-65
- **Options**: Context length, precision, tool-call and reasoning settings, chat template, and the custom-code switch.

#### Q-10 Key format
- **Type**: Product decision
- **Question**: What are the key prefix, the most active keys per user, and the longest and default expiry?
- **Why it matters**: Secret scanners and key rules depend on these values.
- **Affects**: FR-42
- **Options**: None

#### Q-11 Request limits and API notice period
- **Type**: Product decision
- **Question**: What are the body size limit per route, the time limits, the idle limit, and the notice period before an API version stops?
- **Why it matters**: Long prompts, images and long agent tasks must fit, while engines stay protected.
- **Affects**: FR-107, FR-106
- **Options**: None

#### Q-12 Retention and privacy
- **Type**: Missing fact
- **Question**: Which privacy laws apply, what are the retention periods, how long is the tenant grace period, and who may read stored text?
- **Why it matters**: Deletion jobs, storage size and legal duties depend on the answers.
- **Affects**: QR-14, DATA-10, DATA-16, DATA-17, DATA-20, FR-24, CON-06
- **Options**: None

#### Q-13 License lists
- **Type**: Missing fact
- **Question**: What are the default allowed model licenses, the final third-party allowlist, and the allowed weak copyleft licenses?
- **Why it matters**: Admission and the license scan need exact lists.
- **Affects**: FR-70, CON-03
- **Options**: None

#### Q-14 Contribution agreement
- **Type**: Product decision
- **Question**: Do contributors sign a contributor license agreement, or do they certify each change?
- **Why it matters**: Partner companies contribute before the public release.
- **Affects**: CON-02
- **Options**: Contributor license agreement. Developer Certificate of Origin.

#### Q-15 Screen technology
- **Type**: Product decision
- **Question**: Do the Portal and admin screens use Constructor UI Kit, and is its license permissive?
- **Why it matters**: The license rules apply to the screens too.
- **Affects**: IF-02, IF-03
- **Options**: Constructor UI Kit, if its license is permissive. Another kit otherwise.

#### Q-16 Cluster prerequisites
- **Type**: Missing fact
- **Question**: Which Kubernetes versions, node sizes, storage sizes and GPU generations does each profile need?
- **Why it matters**: The installer checks them, and TF Providers plan hardware with them.
- **Affects**: FR-03, QR-19, QR-22
- **Options**: None

#### Q-17 Service levels and thresholds
- **Type**: Missing fact
- **Question**: What are the latency, availability and restore targets, the workload model, the health-check time, the same-engine share, the alert levels and the upgrade downtime?
- **Why it matters**: Load tests and alerts need numbers.
- **Affects**: QR-01, QR-05, QR-16, QR-04, FR-161, FR-110, FR-159, FR-12
- **Options**: None

#### Q-18 Separate data planes
- **Type**: Product decision
- **Question**: Where is shared infrastructure with logical isolation enough, and which tenants need a separate data plane?
- **Why it matters**: Separate data planes cost more and change the installer.
- **Affects**: FR-48, FR-49
- **Options**: None

#### Q-19 First directory
- **Type**: Missing fact
- **Question**: Which directory does sync support first, and does it pull or receive changes?
- **Why it matters**: Directory sync is built for one directory first.
- **Affects**: FR-32
- **Options**: Active Directory on company servers, or its cloud version.

#### Q-20 Format conversion
- **Type**: Product decision
- **Question**: How does the product keep reasoning output and prompt caching through format conversions, per tool?
- **Why it matters**: Advanced tools lose features when formats are converted.
- **Affects**: FR-98
- **Options**: None

#### Q-21 Management API scope
- **Type**: Product decision
- **Question**: Which administration actions can AI tools perform through the Management API and MCP?
- **Why it matters**: AI tools with admin rights can cause wide changes.
- **Affects**: FR-155
- **Options**: None

#### Q-22 Pass delivery
- **Type**: Outside dependency
- **Question**: When does Constructor Fabric Pass deliver its changes, and which role names does it send?
- **Why it matters**: The flagship's sign-in and claims mapping depend on Pass.
- **Affects**: FR-17, FR-26, ASM-02
- **Options**: None

#### Q-23 Building block licenses
- **Type**: Product decision
- **Question**: Which permissive part replaces each non-permissive building block, including the secret store, object storage and dashboard tool?
- **Why it matters**: CON-03 forbids some planned parts.
- **Affects**: CON-03, TD-06, TD-03
- **Options**: The design document lists permissive candidates for each part.

#### Q-24 Permission table
- **Type**: Product decision
- **Question**: Which actions does each role have?
- **Why it matters**: Tests and screens follow the table.
- **Affects**: FR-37
- **Options**: None

#### Q-25 Stage 1 user targets
- **Type**: Product decision
- **Question**: Are 50 registered users and 20 active users the right Stage 1 targets?
- **Why it matters**: The targets decide whether Stage 1 succeeded.
- **Affects**: MET-02
- **Options**: None

#### Q-26 Adoption survey
- **Type**: Missing fact
- **Question**: How is use instead of outside tools measured: which survey, which people, and how often?
- **Why it matters**: The metric has no value without a method.
- **Affects**: MET-03
- **Options**: None

#### Q-27 Cost reference
- **Type**: Missing fact
- **Question**: Which outside model is the cost reference, and what break-even model applies: rent or buy, hardware maker, model mix and load?
- **Why it matters**: The cost metric compares with the reference.
- **Affects**: MET-09
- **Options**: None

#### Q-28 Guardrail and redaction failures
- **Type**: Product decision
- **Question**: When a guardrail check or PII redaction fails or does not answer, does the product block the call or send it? Which moderation model and accuracy apply?
- **Why it matters**: Blocking stops work. Sending can leak personal data.
- **Affects**: SC-13, FR-167, FR-169, QR-27
- **Options**: Block always. Follow a tenant setting.

#### Q-29 Accessibility level
- **Type**: Product decision
- **Question**: Which WCAG version and level do the Portal and Admin Console meet?
- **Why it matters**: Screens are designed and audited against it.
- **Affects**: QR-17
- **Options**: WCAG 2.1 level AA. WCAG 2.2 level AA.

#### Q-30 Data region per tenant
- **Type**: Product decision
- **Question**: Does a tenant need a setting that limits its models to one data region?
- **Why it matters**: The component plan lists a data region setting, but no adopter has asked for it.
- **Affects**: DATA-12
- **Options**: Not needed in Stages 1 and 2. Needed from Stage 2.

#### Q-31 Moving from the current router
- **Type**: Product decision
- **Question**: Do existing keys and usage of the current router move to the flagship?
- **Why it matters**: Moving keys saves users a step but carries old keys into the new product.
- **Affects**: DATA-03
- **Options**: Invite users to create new keys. Import existing keys.

#### Q-32 Undecided target components
- **Type**: Product decision
- **Question**: What do policy-engine, admission-control and hw-usage-collector do in this product, and which building blocks cover guardrails until then?
- **Why it matters**: The replacement plan needs a target for every capability.
- **Affects**: TD-03
- **Options**: None

#### Q-33 Stages 3 and 4
- **Type**: Product decision
- **Question**: When are Stages 3 and 4 detailed? Do they include subscription usage reports, judge models for benchmarks, skill formats, and team rules for models?
- **Why it matters**: Those stages have no functional requirements yet.
- **Affects**: GOAL-02, GOAL-04
- **Options**: None
