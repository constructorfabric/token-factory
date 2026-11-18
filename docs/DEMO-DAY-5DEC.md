# Demo day, 5 December 2026: scenarios

Stage 1 only. Roles and scenario IDs come from [PRD.md](PRD.md) v2.0. Screens come from [BACKLOG.md](BACKLOG.md) Appendix A: `/me/…` is the Customer Portal, `/root/…` is the Admin page.

`may slip` and `slips first` mark steps whose backlog task can move past the event. Keep a fallback ready for each one.

## P1

### 1. First answer in Claude Code (SC-04, SC-06)
- **Who**: User (a contributor or a student)
- **Goal**: Get from sign-in to a working coding tool in under 15 minutes.
- **Shows**:
    - Portal: sign in through Pass (`/login`). Create a key with an expiry date, which is shown once (`/me/keys`). Copy the Claude Code snippet (`/me/connect`).
    - Terminal: Claude Code runs a multi-step coding task with tool calls. Answers stream, and each one names the model version.
    - Portal: the calls show up in used and remaining credits (`/me/home`).

### 2. User runs out of credits (SC-05)
- **Who**: User, Instance Admin
- **Goal**: Show spend control that the user understands.
- **Shows**:
    - Terminal: the headers `x-tf-credits-limit`, `x-tf-credits-remaining` and `x-tf-credits-reset` drop with each call.
    - Claude Code: the next request gets 402 with the limit, use, reset time and contact. The tool stops and does not retry.
    - Portal (`/me/home`): 0 credits remaining, plus the reset time.
    - Instance configuration and CLI: the admin raises the limit and runs `apply`. The next request is served within 1 minute.
- **Prep**: a demo user with a very small limit.

### 3. Install your own instance (SC-01)
- **Who**: Instance Admin (partner DevOps)
- **Goal**: Show that any team can run its own instance on its own cluster, even without GPUs.
- **Shows**:
    - CLI: the prerequisite check names a missing item and changes nothing (`may slip`).
    - CLI: install on a cluster with only CPUs. Smoke tests pass with the CPU test model.
    - Admin page: the first admin signs in through the identity provider. Tenants exist, and admission has started.
    - Live proof: the Constructor Tech instance, signed in through its corporate identity provider.
- **Prep**: show a recorded install, or start the install when the session opens.

### 4. External model for one tenant (SC-03)
- **Who**: Instance Admin, users of 2 tenants
- **Goal**: Offer an Anthropic or OpenAI model to one tenant only, counted in credits.
- **Shows**:
    - Instance configuration: the provider key as a secret, and the model with its credit prices.
    - Admin page: the test call result, and the model is Ready.
    - Portals of 2 tenants: tenant A lists the model, tenant B does not.
    - Terminal: tenant B gets 403. Tenant A's call creates a usage record.

### 5. Second tool through the OpenAI format (SC-04)
- **Who**: User
- **Goal**: Same flow as scenario 1 with the second validated tool (Codex CLI, pending D-13).
- **Shows**:
    - Portal (`/me/connect`): the Codex CLI snippet.
    - Terminal: a Codex task with tool calls through Responses.

### 6. Model fails admission (SC-02)
- **Who**: Instance Admin
- **Goal**: Show that unsafe or unfit models never reach users.
- **Shows**:
    - Admin page (`/root/models/:id`), one failed model per reason:
        - The license is not allowed, so the model fails before download.
        - The source name imitates a known source.
        - The files can run code.
        - The model is too large, with the sizes shown.
    - Admin page: Retry is refused until the inputs change. Promote is refused with the GPU shortfall.

### 7. Key lifecycle (FR-40 to FR-43)
- **Who**: User
- **Goal**: Users manage their own keys safely.
- **Shows**:
    - Portal (`/me/keys`): each key shows its prefix, creation date, expiry date and last use, and its own credit limit.
    - Terminal: a revoked or expired key gets 401.
    - Terminal: a key limited to some models gets 403 for the others (`slips first`).

### 8. Usage, health and audit (FR-140, FR-148, FR-158)
- **Who**: Instance Admin
- **Goal**: See who uses what, how the instance performs, and what changed.
- **Shows**:
    - Dashboards: capacity, latency, errors and refusals per endpoint, and GPU use, memory and power.
    - Usage views per tenant, user, key, model, family and period.
    - Audit records of model actions, key changes, configuration changes and refusals.
    - Langfuse traces and logs: one trace ID from ingress to engine, and no prompt text.

## P2

### 9. New open-weight model goes into service (SC-02)
- **Who**: Instance Admin
- **Goal**: Turn a Hugging Face model into the family default, with every check done and its evidence kept, without manual steps.
- **Shows**:
    - Instance configuration and CLI: add the Hugging Face ID to the GLM family, then run `apply`.
    - Admin page (`/root/models/:id`): the checks pass one by one: license, source, file format, capacity, download, acceptance tests, performance test and Terminal Bench (`may slip` for the second family). It also shows the GPUs needed and free.
    - Admin page: click Promote, then Set as family default.
    - Terminal: send a `curl` request with model `glm`. The response names the new version.
- **Prep**: admission takes hours, so start it the day before. On stage, walk through the evidence and click Promote.

### 10. Students and contributors on one instance, kept apart (SC-07)
- **Who**: Instance Admin, a student, a contributor
- **Goal**: Show that tenants share engines but not data, cached prompts or capacity.
- **Shows**:
    - Instance configuration: claims mapping from Pass role to tenant, and tenant settings (allowed families, credit limits, concurrency limit).
    - Two Portals side by side (`/me/models`): the student sees only the student families.
    - Terminal: both users send the same long prompt. The second tenant's usage shows 0 cached input tokens.
    - Terminal and dashboard: a load script pushes students to their concurrency limit. Extra student requests get 429, and contributor latency stays flat.
    - Terminal: the student calls a contributor-only family and gets 403.

### 11. Fallback and retire within a family (SC-06, FR-56, FR-57), `slips first`
- **Who**: Instance Admin, Client application
- **Goal**: Keep requests working when a model is down or retired.
- **Shows**:
    - Terminal: stop the default model's engine. Requests to `glm` go to the next model on the fallback list, and the response names it.
    - Terminal: with no healthy model left, requests get 503 or 529.
    - Admin page: Retire. Requests that name the old version get the family default.

### 12. Upgrade an instance (SC-15)
- **Who**: Instance Admin
- **Goal**: Move to a new release and keep all data.
- **Shows**:
    - CLI: upgrade, then the smoke tests pass.
    - Admin page and Portal: tenants, keys, models and usage are all still there.
    - CLI: an instance 2 releases behind is refused, with the release to install first named.

## Fallbacks (DELIVERY-PLAN §7)

- Pass not ready (decided 20 Nov): sign in through Keycloak with GitHub and an allowlist.
- No GPUs (decided 16 Nov): run the API scenarios on the CPU test model, with admission evidence from earlier runs.
- Open critical security findings on 2 Dec: run the demo in the `vendor` tenant only.

## Out of the 5 December demo

### 13. Own application calls the API (SC-06)
- **Who**: Client application (a developer's script)
- **Goal**: Show that standard SDKs work unchanged.
- **Shows**:
    - Terminal, with the OpenAI and Anthropic SDKs: `/v1/models` lists only the allowed models.
    - Terminal: Chat Completions, Responses, Embeddings and Messages, with streaming and tool calls.
    - Terminal: calls by family, by exact version, and with `auto`. An unknown endpoint returns 404 with a message.
    - Portal (`/me/docs`): the API reference with the error table.

### 14. Identity provider ends access (SC-08), `may slip`
- **Who**: Identity provider (Pass admin)
- **Goal**: A blocked person loses API access within 60 seconds.
- **Shows**:
    - The Pass admin blocks the user. Their Claude Code gets 401 within 60 seconds.
    - A repeated notice changes nothing. A forged notice is rejected and recorded.
    - A role change from student to contributor moves the user's tenant at the next sign-in and revokes their old keys.
- **Fallback**: the Instance Admin disables the user in the configuration.

### 15. Restore service after a part fails (SC-09)
- **Who**: Instance Admin
- **Goal**: Users see at most a short drop, and recovery is fast.
- **Shows**:
    - Kill an engine: the health check takes it out of routing, and traffic continues.
    - Break the gateway: an alert in the alert channel names the part.
    - CLI: restart the part or roll it back. It returns to routing.

### 16. Configuration backup and restore (FR-14)
- **Who**: Instance Admin
- **Goal**: Recover the instance after losing the cluster.
- **Shows**:
    - The daily backup sits in storage outside the cluster.
    - A failed backup raises an alert.
    - A restore into a clean cluster brings the configuration back.

### 17. Live configuration change (FR-07, FR-09, FR-10, FR-22)
- **Who**: Instance Admin
- **Goal**: Change the instance without a restart.
- **Shows**:
    - CLI `apply`: add a tenant, change a limit, or turn the Portal off. Each change works within 1 minute.
    - CLI `apply`: suspend a tenant, and its keys get 401 (`slips first`).
    - CLI `apply`: a wrong setting is named, and the running configuration stays.

### 18. Break-glass sign-in (FR-28), `may slip`
- **Who**: Instance Admin
- **Goal**: Reach the Admin page while the identity provider is down.
- **Shows**:
    - Stop the identity provider. The local admin account still signs in to the Admin page.
    - The sign-in creates an audit record.
