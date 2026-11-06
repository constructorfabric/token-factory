# Token Factory — Go-to-Market Plan

> Internal planning document. Review it before the public open-source release (M3) and remove anything that must stay private.

Companion to [PRD.md](PRD.md) v1.2: positioning (§3.4), first adopters (§4.2), business model and licensing (§11), success metrics (§12). Go-to-market runs in parallel with design and implementation; dates and checkpoints come from [DELIVERY-PLAN.md](DELIVERY-PLAN.md).

## 1. Positioning

**Token Factory — the open-source factory for LLM inference.** Install on any Kubernetes; serve any open-weight model family to any user with governance (PRD §3.4).

Messages for M1, each backed by an M1 requirement:

| Message | Backed by |
|---|---|
| The whole lifecycle is automated: models are checked, benchmarked and promoted before anyone uses them. | PRD §6.3, FR-D |
| Works with the tools developers already use: Claude Code and an OpenAI-compatible tool, connected with one snippet. | FR-E1.1–E1.2, FR-F2 |
| Every tenant is isolated: data, cached prompts and capacity are not shared. | FR-B7.1–B7.3 |
| Usage is metered and limited per user; nobody's prompts are stored. | §7-G G.0, FR-H5.1 |
| Runs on your own Kubernetes with no connection to the vendor. | §3.2, NFR-10 |

Not to be claimed before it ships: intelligent routing (M4), hybrid commercial providers, MCP and skills registries (future directions, PRD §7-K), air-gapped operation (M3), cost savings without measured data (PRD §2.3).

## 2. Audiences and timing

Aligned with PRD §4.2.

| Audience | How they get access | When |
|---|---|---|
| Constructor Fabric community (contributors) | Register in Constructor Fabric Pass; after approval, tenant `contributors` on the flagship (PRD §6.5) | M1 |
| Constructor Tech | Own instance, run by their Instance Admin, under the partner code terms (PRD §11) | M1 |
| Students and education programs | Register in Pass; approval by Pass admins is the qualification; tenant `students` on the flagship, isolated from contributors | M1, scaled later |
| Ecosystem engineering organizations — Virtuozzo, Acronis, `<Kronis — confirm the company name; it may be a misspelling of Acronis>` TODO(PRODUCT_MANAGER) | Own internal-use instances | M2–M3 |
| Any company or individual | Public open-source release; self-service installation | M3+ |

## 3. Launch and channels

1. **Community-first launch at the 5-Dec-2026 event.**
   - The flagship (Constructor Fabric TF) is live, and Constructor Tech runs the first partner deployment.
   - Attendees register in Pass and get access once a Pass admin approves them.
   - Contributors and students are admitted only after the security review has no open critical findings (PRD NFR-5.5). If it doesn't pass by 2026-12-02, the demo runs on the `vendor` tenant and other tenants open after the fixes (DELIVERY-PLAN §7).
   - If Pass is not ready, sign-in uses the fallback (bundled IdP with GitHub sign-in and an allowlist, PRD R-9).
2. **Weekly value narration.** Every release is explained publicly: what shipped, how to use it, what's next. Docs and snippets keep the time to first successful call under 15 minutes (PRD §12).
3. **Ecosystem rollout (M2–M3).** Internal-use deployments at ecosystem engineering organizations, each referenceable.
4. **Education channel.** Student programs with qualified access through Pass approval.
5. **Public open-source launch (M3).** Repository made public under the chosen license (PRD OQ-9.2); packaged Helm/OCI artifacts; signed images; docs site; contribution guide with the agreed contribution agreement (PRD OQ-9.1); vulnerability-disclosure policy.
6. **Partner deployment program.** Until M3, partners use the code under the partner terms of PRD §11. Install workshops use the same installer and Standard profile the nightly tests exercise (PRD §6.7).
7. **Commercial offers** (paid support, services, entitlement-based features) start no earlier than M3 (PRD §11). Billing is not part of the product (PRD §3.3).
8. **Later channels.** OpenRouter provider listing (PRD §10.6); managed SaaS, if the M4 decision is positive (PRD §6.6).

## 4. Measures

GTM reports on these PRD §12 KPIs; definitions and targets are in the PRD.

| KPI | GTM's part |
|---|---|
| Registered / weekly active users on the flagship | Event and channel activation; onboarding |
| Time to first successful call | Snippets, docs, onboarding |
| Adoption vs external tools | Runs the survey; its method is a PRD §12 placeholder owned by PRODUCT_MANAGER |
| Community growth (GitHub stars, contributors, external PRs) | From the M3 public launch |

## 5. Ecosystem positioning

Token Factory is the *Model* direction of the Constructor Factory initiative, alongside Compute, Platform, Insight and Construct. It uses platform gears only behind open interfaces and stays standalone-installable regardless (PRD NFR-21). It may later feed the separate model-research track with consented telemetry (PRD FR-K9, a future direction); in M1 no prompt or response content is stored (PRD FR-H5.1). It is deliberately not dependent on the research track's outcomes.
