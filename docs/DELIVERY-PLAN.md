# Token Factory — Delivery Plan

> Internal planning document. Remove it from the repository, or move it to a private location, before the public open-source release (M3).

Companion to [PRD.md](PRD.md) v1.2. The PRD defines *what* each milestone delivers; this document defines *how* the team delivers M1 and who is accountable. Role tokens (`DEVOPS`, `ML_LEAD`, …) are defined in §10 and used in the PRD's `TODO(ROLE)` placeholders.

## 1. Delivery principles

1. **Build over plan ("think with your hands").** Weekly shippable increments; a perfect architecture must not block a working solution.
2. **Bottom-up assembly.** Infrastructure stand → components → control plane. Do not wait for a complete architecture.
3. **One task, one artifact.** Each task yields a separate artifact (e.g., a Helm chart). The task list doubles as the management-transparency tool (done / in work / difficulties).
4. **Value every week.** Every week something useful ships, and the community is told what shipped and how to use it.
5. **Date fixed, scope flexes.** The 5-Dec date does not move; scope is cut along the cut line (§8) at the checkpoints (§7).

## 2. Cadence

- **Weekly release train.** Every calendar week produces a shippable increment plus a community update: *what shipped, how to use it, what's next.*
- **Weekly internal demos** are mandatory. Until 5 Dec 2026 the team syncs **daily**.
- **Community events every 1–2 months = milestones.** Milestone scope and acceptance criteria are in PRD §10.

## 3. Working venues

- Private project repository and private project channels (infrastructure / applications split) until ready for broad publication.
- QA is pulled in from week 1.

## 4. Status as of 2026-11-03

Done or underway:

- two-track split confirmed (TF as the applied *Model* direction of Constructor Fabric; model research separate);
- PM assigned;
- first working capability (a served model + API-token issuance);
- draft architecture & implementation plan;
- component terminology fixed (Control Plane, Model Registry, Model Deployer, LLM Gateway, ML workers, Usage Collector, gears);
- PRD v1.2 drafted;
- Kubernetes prototype work started (CPU stand from the adapted installer).

## 5. M1 workstreams

Every M1 requirement of PRD §7–§8 (Must and Should) has exactly one accountable workstream. QA (WS-8) verifies the acceptance criteria of all of them.

| WS | Workstream | M1 requirements owned (PRD IDs) | Accountable | Depends on |
|---|---|---|---|---|
| WS-0 | Architecture & design | NFR-5.4, NFR-11, NFR-12, NFR-21; plus router capability check (§7-G G.0), cluster provisioning decision (D-23), permission matrix draft (FR-B6.1), M1 design sign-off | ARCHITECT | OQ answers (§9) |
| WS-1 | Platform & installer | FR-A1.1, FR-A2.1, FR-A2.2, FR-A2.3, FR-A3, FR-A5, FR-A6.1, FR-A6.3, FR-A9.1, FR-A9.2, FR-A9.3, FR-A11, FR-A12, FR-J1, FR-J2, NFR-1, NFR-2.1, NFR-5.1, NFR-5.2, NFR-6.1, NFR-8, NFR-19 | DEVOPS | WS-0 |
| WS-2 | Identity & tenancy | FR-B1.1, FR-B1.2, FR-B2.1, FR-B2.4, FR-B3.1, FR-B3.4, FR-B6.1, FR-B7.1, FR-B8.1, FR-B8.2, FR-B8.3, FR-B10, FR-B11.1, FR-B12, FR-B13 | DEVELOPER | WS-1; WS-3 for the flagship |
| WS-3 | Constructor Fabric Pass extensions | PASS-1.1, PASS-2, PASS-3, PASS-4, PASS-5, PASS-6.1, PASS-7, PASS-8, PASS-9 | PASS_OWNER | TF webhook contract from WS-2 |
| WS-4 | Gateway, APIs, quotas & rate limits | FR-B7.2, FR-B7.3, FR-C7, FR-E1.1, FR-E1.2, FR-E2.1, FR-E3, FR-E4.1, FR-E4.2, FR-E5.1, FR-E7.1, FR-E10, FR-E11, FR-E12, FR-E13, FR-G1.1, FR-G1.2, FR-G2.1, FR-G4.1, FR-G8.1, FR-G8.2, FR-G8.3, FR-H1 | DEVELOPER | WS-1; router capability check (2026-11-10) |
| WS-5 | Model admission & runtime | FR-C1, FR-C2.1, FR-C2.2, FR-C3, FR-C4.1, FR-C5.1, FR-C6.1, FR-C12, FR-C13, FR-C14, FR-D1, FR-D2.1, FR-D2.2, FR-D3, FR-D4.1, FR-D5, FR-D6.1, FR-D9.1, FR-D11, FR-D12, FR-D13.1, NFR-2.3, NFR-3.1, NFR-7 | ML_LEAD | WS-1; GPUs (2026-11-16) |
| WS-6 | Admin page & Portal | FR-F1.1, FR-F2, FR-F4.1, NFR-14, NFR-15, NFR-16, NFR-20.1 | DEVELOPER | WS-2, WS-4, WS-5; UI technology (OQ-20) |
| WS-7 | Observability & operations | FR-A7.1, FR-H2.1, FR-H3.1, FR-H3.2, FR-H5.1, FR-H7.1, FR-I1, FR-I2.1, FR-I3.1, NFR-9, NFR-10, NFR-18; on-call rota for FR-I9 | DEVOPS | WS-1 |
| WS-8 | Quality | FR-A4, FR-I5.1, FR-I5.2, NFR-4.1 (isolation test suite); conformance sets (FR-E1), tool-validation matrix (FR-E3), acceptance-criteria review of all M1 requirements | QA | all |
| WS-9 | Security & legal | NFR-5.5, NFR-13.1, NFR-17.1, NFR-17.2; policy inputs: custom-code policy (FR-D2.2), key format (FR-B8.3), allowed-license list (FR-D1), retention periods (NFR-18), partner code terms (OQ-9.1) | SECURITY, LEGAL | all |
| WS-10 | Launch | FR-I9, FR-J5; docs (install guide, API reference, onboarding), weekly community updates, Constructor Tech deployment with CT_ADMIN | PRODUCT_MANAGER | all |

## 6. M1 weekly plan (2026)

| Week | Focus | Exit artifact |
|---|---|---|
| Nov 2–8 | Task list with per-task artifacts and named owners agreed (Nov 4). Decisions: OQ-1 models, tools, hardware, flagship tenants (Nov 6); OQ-18 Pass owner and dates, OQ-20 UI technology (Nov 7). Every `TODO(ROLE)` placeholder has a named person. CPU stand from the installer on project infrastructure. TF deprovisioning-webhook contract and Helm values schema v0 published. Router capability check started. Channels and QA onboarded. | Agreed plan with owners; running CPU stand; every placeholder owned |
| Nov 9–15 | Decisions: OQ-16 `auto`, OQ-17 quota spec, OQ-19 runtime overrides; router capability result; design-critical placeholders filled (Nov 10); M1 design sign-off (Nov 11). Components on the stand and seeing each other; gateway serves the CPU test model through both API formats; bundled IdP with GitHub sign-in, OIDC client, claims mapping, JIT provisioning and admin bootstrap; traces and logs configured metadata-only (FR-H5.1); admission scripts for license, download (with Hugging Face token), security, format and capacity checks; vendor dev instance running (FR-J1). Pass: Google and Microsoft sign-in, account linking, OIDC discovery and JWKS on Pass staging. Isolation test suite skeleton; first nightly runs. OQ-21 component inventory (Nov 14); benchmark budget plan (Nov 15). | "Hello token" on CPU through both API formats with sign-in |
| Nov 16–22 | GPU go/no-go (Nov 16). Admission chain end-to-end for family 1 on GPU; Admin page (status, evidence, failure reasons, capacity, promote, default); runtime profile with per-model overrides; tenant settings; quota enforcement, rate limits, error table and credit headers; keys (prefix, hashing, expiry, revoke); per-tenant cache salt and concurrency caps; usage events and dashboards; installer prerequisite check (FR-A12); request limits and unsupported-endpoint errors (FR-E12, FR-E13). Pass OIDC on staging works with TF; **fallback rehearsal**: the flagship configuration runs once against the bundled IdP with GitHub sign-in and an allowlist (PRD R-9). Pass go/no-go, partner code terms (OQ-9.1) and all remaining placeholders (Nov 20). | First model through the chain and promoted; isolation tests green; both sign-in paths work |
| Nov 23–29 | Scope checkpoint (Nov 23): apply the cut line if needed. Family 2; Terminal Bench on the eval instance; Portal and snippets (Claude Code main and background models mapped); Claude Code and second-tool validation; browser tests (NFR-20.1); deprovisioning webhook with Pass; configuration backup with a restore test, basic alerts and break-glass admin; retention jobs (NFR-18); image scanning and SBOM; install guide, API reference and onboarding docs; security review starts (Nov 25); support channel and on-call rota; Tier 2 platform installs (FR-A2.3); nightly green streak starts; Constructor Tech instance installed by CT_ADMIN with support and connected to their corporate IdP. | Two families serving; tool matrix green; nightly green; Constructor Tech installed |
| Nov 30 – Dec 5 | Feature freeze (Dec 1); security review findings fixed (Dec 2); deploy Constructor Fabric TF production with Pass sign-in and the `contributors`, `students` and `vendor` tenants; run scenario S-11 on the flagship; Constructor Tech serving its users; install by an engineer outside the core team (NFR-1); onboard the first Pass-approved contributors, students and vendor users; migration invitations sent (FR-J5); M1 acceptance checklist reviewed and demo rehearsal (Dec 4); **community event Dec 5**. | Live instances + demo; PRD §10.2 acceptance checklist signed off |

**M1 delivery criterion** (in addition to the PRD acceptance criteria): 5 consecutive weekly community updates shipped.

## 7. Go/no-go checkpoints

| Date | Checkpoint | Decided by | If "no" |
|---|---|---|---|
| 2026-11-11 | M1 design sign-off: design-critical placeholders filled, router capability known, OQ-16/17/19 decided | ARCHITECT → PRODUCT_OWNER | Work on the affected workstreams continues on stated assumptions; each assumption is listed and revisited at the 2026-11-23 checkpoint. |
| 2026-11-16 | GPUs for flagship production and eval are available | DEVOPS → PRODUCT_OWNER | The demo uses the CPU test model for the criteria named in PRD §10.2; GPU work continues after the event. |
| 2026-11-20 | Pass OIDC provider on staging works with TF | PASS_OWNER → PRODUCT_OWNER | The flagship launches on the bundled IdP with GitHub sign-in and an allowlist of approved users (PRD R-9); switch to Pass after the event. |
| 2026-11-20 | Partner code terms and contribution agreement agreed (OQ-9.1) | LEGAL → PRODUCT_OWNER | The Constructor Tech deployment waits until they are. |
| 2026-11-23 | Remaining Must work fits the remaining capacity | PRODUCT_MANAGER → PRODUCT_OWNER | Apply the cut line (§8). |
| 2026-12-01 | Feature freeze | ARCHITECT | Only fixes after this date. |
| 2026-12-02 | Security review has no open critical findings | SECURITY | The flagship opens to the `vendor` tenant only; contributors and students wait for the fixes. |

## 8. M1 cut line

If the 2026-11-23 checkpoint shows the plan does not fit, cut in this order. The PRODUCT_OWNER approves each step. Should items may slip by definition (PRD §0). Moving a **Must** item out of M1 is a PRD change: the PRODUCT_OWNER lowers its priority in PRD.md by pull request, and the affected M1 acceptance criterion in PRD §10.2 is amended in the same pull request.

1. **All M1 Should items slip to M2** (19 items): FR-A2.2–A2.3, FR-A11, FR-B2.4, FR-C4.1, FR-D6.1, FR-D9.1, FR-E5.1, FR-G8.3, FR-H7.1, FR-I5.2, FR-J5, NFR-2.3, NFR-3.1, NFR-15, NFR-17.2, PASS-7, PASS-8, PASS-9.
2. **Must items that can move to just after the event** with a documented workaround:

   | Item | Workaround until delivered | PRD §10.2 acceptance criterion affected |
   |---|---|---|
   | FR-D4.1 Terminal Bench for the second family | Promote with the "benchmark missing" warning; run after the event. | "2 model families pass … Terminal Bench" — second family without Terminal Bench |
   | FR-B11.1 + PASS-6.1 deprovisioning webhook | Instance Admin disables users in the instance configuration within 1 hour of a Pass block (documented procedure). | "Blocking a user in Pass makes their keys refused within 2 minutes" — 1 hour instead |
   | FR-B12 break-glass admin | Documented `kubectl` procedure for emergency admin access. | — |
   | NFR-1 install by an engineer outside the core team | Demonstrated after the event. | "Fresh 5-VM cluster → running TF … in ≤ 1 working day" — after the event |
   | FR-E12 request limits | Router defaults, documented. | — |
   | FR-A12 prerequisite check | Prerequisites documented in the install guide. | — |

3. **Never cut:**
   - tenant isolation (FR-B7.1–B7.3);
   - quota enforcement and rate limits (FR-G4.1, FR-G8.1–G8.2);
   - no content storage (FR-H5.1);
   - configuration backup (FR-A7.1);
   - security review (NFR-5.5);
   - both API formats (FR-E1.1–E1.2).

## 9. Interim deliverables and dates

| Deliverable | Accountable | Due |
|---|---|---|
| M1 task list with per-task artifacts and named owners | PRODUCT_MANAGER | 2026-11-04 |
| OQ-1: second tool, tool versions, models, hardware, flagship tenants | PRODUCT_OWNER | 2026-11-06 |
| OQ-18: Pass owner and dates, role names; OQ-20: UI technology | PRODUCT_OWNER | 2026-11-07 |
| Router capability check against PRD §7-G G.0 | ARCHITECT | 2026-11-10 |
| M1 design sign-off | ARCHITECT, PRODUCT_OWNER | 2026-11-11 |
| OQ-16 `auto`; OQ-17 quota spec and values; OQ-19 runtime overrides | PRODUCT_OWNER, ARCHITECT | 2026-11-10 |
| OQ-21: inventory of non-open components | ARCHITECT | 2026-11-14 |
| Stage-gated benchmark budget plan agreed with finance | ML_LEAD | 2026-11-15 |
| OQ-9.1: partner code terms and contribution agreement | LEGAL | 2026-11-20 |
| Design-critical M1 placeholders filled: hardware and models (PRD §10.2), runtime profile (§6.4), flagship tenant settings, quota and rate-limit values (§7-G G.0), Pass role names (§6.5), permission matrix (FR-B6.1), key format (FR-B8.3), request limits (FR-E12) | each role named in its `TODO(ROLE)` | 2026-11-10 |
| All other M1 `TODO(ROLE)` placeholders in the PRD filled | each role named in its `TODO(ROLE)` | 2026-11-20 |
| Usage collection completed and stabilized | DEVELOPER | 2026-11-30 |
| Custom client benchmark interface designed (PRD FR-D7) | ML_LEAD | 2026-12-20 |
| Image-modality and specialized-models roadmap | ML_LEAD | 2026-12-20 |

## 10. Team & responsibilities

Role tokens are used in the PRD's `TODO(ROLE)` placeholders. Named owners: `<names>` TODO(PRODUCT_MANAGER), by 2026-11-04.

| Role token | Role | Responsibility | Named owner |
|---|---|---|---|
| `PRODUCT_OWNER` | Product Owner | Vision, priorities, milestone acceptance, go/no-go decisions (the PRD's authority). | `<name>` |
| `PRODUCT_MANAGER` | Product Manager | Requirements, roadmap, stakeholder communication, weekly community updates, launch (WS-10). | `<name>` |
| `ARCHITECT` | Architecture owner | End-to-end design, stable-facade contracts, design reviews (scalability & self-growth criteria enforced), router capability check, M1 design sign-off, feature freeze (WS-0). | `<name>` |
| `DEVOPS` | Infrastructure / Kubernetes lead and Operations / SRE | Installer, clusters (dev/prod/nightly), GPU operators, base services, backups, alerts, runbooks, on-call (WS-1, WS-7). | `<name>` |
| `DEVELOPER` | Control Plane lead and Gateway / platform integration | Gateway and APIs, identity and tenancy, quotas and rate limits, Admin page, Portal (WS-2, WS-4, WS-6). | `<name>` |
| `ML_LEAD` | ML / benchmarking lead | ML workers, admission pipeline, runtime profile, benchmark suites, eval infrastructure (WS-5). | `<name>` |
| `QA` | QA lead | Nightly tests, acceptance-chain verification, isolation tests, tool-validation matrix, acceptance-criteria review (WS-8). | `<name>` |
| `SECURITY` | Security reviewer | Security review, admission security policy, key format, supply-chain checks (WS-9). | `<name>` |
| `LEGAL` | Legal counsel | Partner code terms, contribution agreement, allowed-license list, retention periods (WS-9). | `<name>` |
| `PASS_OWNER` | Owner of Constructor Fabric Pass | Pass extensions (WS-3). | `<name>` |
| `CT_ADMIN` | Instance Admin at Constructor Tech | Constructor Tech hardware, IdP connection and instance operation. | `<name>` |
| — | Community / GTM | Event demos, documentation, onboarding, partner program (with PRODUCT_MANAGER). | `<name>` |

## 11. Delivery risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| DR-1 | **5-Dec deadline compression**: about 107 Must and 19 Should M1 requirements in 4.5 weeks. | M1 slip or quality loss | Named owners per workstream (§5); daily syncs; checkpoints (§7) and cut line (§8); one-off scripts allowed. |
| DR-2 | **GPU unavailability** before the event. | Reduced demo fidelity | CPU-first bootstrap and CPU test model; GPU go/no-go on 2026-11-16 with a defined fallback. |
| DR-3 | **Staffing / QA bandwidth** across participating companies. | Delivery risk | Role table with named owners (§10); QA from week 1; additional benchmarking capacity from students and university labs; scope discipline. |
| DR-4 | **Requirements churn**. | Rework | The PRD is the single source of requirements; changes go through pull requests; open questions are time-boxed (PRD §15). |
| DR-5 | **Pass is a separate system with its own owner** on the M1 critical path. | Flagship sign-in late | Owner and dates by 2026-11-07 (OQ-18); TF webhook contract published in week 1; go/no-go 2026-11-20 with the bundled-IdP fallback. |
| DR-6 | **Router cannot implement the quota, rate-limit and cache-salt behaviour.** | Extra gateway work in weeks 3–4 | Capability check by 2026-11-10; gateway extension planned in WS-4 from week 2. |
| DR-7 | **Constructor Tech dependencies** (their hardware, IdP and code terms). | Partner deployment late | CT_ADMIN named in week 1; OQ-9.1 by 2026-11-20; install support from DEVOPS in week 4. |

## 12. Delivery KPI

| KPI | Definition | M1 target | Later |
|---|---|---|---|
| Weekly releases shipped | Increments + community updates | 5/5 weeks | sustained |
