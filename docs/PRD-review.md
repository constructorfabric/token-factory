# Review of the Token Factory PRD (v1.2, 2026-11-03)

**Reviewer's perspective:** product manager and engineering lead. The review also asks what an architect, developer, QA engineer, DevOps/SRE and security engineer would each need from the document before they can start.

**Reviewed:** `docs/PRD.md` v1.2, with `DESIGN.md`, `DELIVERY-PLAN.md` and `GO-TO-MARKET.md`. This review lists **only open items**. Every item from the v1.1 review is resolved in v1.2 and is not repeated here.

---

## 1. Verdict

**v1.2 is complete as a requirements baseline.**

- Every requirement has one milestone, a priority, acceptance criteria and a verification method.
- Every undecided value is a placeholder with an accountable role.
- The delivery plan matches the PRD, with checkpoints and a cut line.

**What is left is values and people, not requirements:**

- 119 placeholders across the four documents;
- named owners for the roles;
- a decision on the size of M1.

**Recommendation:** approve v1.2 as the M1 baseline once two things are done:

1. owners are named (due 2026-11-04);
2. the design-critical placeholders are filled (due 2026-11-10).

### Readiness by role

| Role | Ready? | What still blocks |
|---|---|---|
| Product / PM | Ready | 28 PRODUCT_OWNER placeholders; confirm priorities; decide M1 size early (B-3). |
| Architect | Ready to design M1 | Router capability check and 18 ARCHITECT placeholders, by 2026-11-10; confirm D-23 (cluster provisioning). |
| Developer | Ready to start | Values from G.0, FR-B8.3 and FR-E12; UI technology (OQ-20, 2026-11-07). |
| QA | Ready to plan tests | Conformance set, Claude Code version, permission matrix; confirm the acceptance criteria are testable. |
| DevOps / SRE | Ready to plan | 24 DEVOPS placeholders: sizing, versions, backup target, alert channel, on-call hours. |
| Security | Not yet | No named security reviewer; review window too short (M-1). |

---

## 2. Blockers

### B-1. Fill the design-critical placeholders by 2026-11-10

DELIVERY-PLAN.md §9 lists the design-critical placeholders. Without them, the gateway, admission pipeline and installer are built against guesses.

| Accountable role | Open | Most important |
|---|---|---|
| ML_LEAD | 29 | M1 models with size, quantization, context and parsers (§10.2); runtime-profile values (§6.4); sanity prompt set (FR-D3) |
| PRODUCT_OWNER | 28 | Second validated tool (FR-F2); flagship tenant settings (§10.2); credit prices, default limit, period and rate limits (§7-G G.0); key expiry (FR-B8.3); M1 user targets |
| DEVOPS | 24 | GPU type and count per environment (§10.2); profile sizing and Kubernetes versions (§6.7); backup target; alert channel; on-call hours |
| ARCHITECT | 18 | Router capability check (§7-G G.0); cluster provisioning (D-23); request limits (FR-E12); upgrade downtime (FR-A6.1); non-open component inventory (NFR-21) |
| SECURITY, LEGAL, QA, PASS_OWNER, PRODUCT_MANAGER, CT_ADMIN | 20 | Key prefix (FR-B8.3); custom-code policy (FR-D2.2); allowed-license list (FR-D1); retention periods (NFR-18); partner code terms (§11); Claude Code version (FR-E1.2); Pass role names (§6.5) |

### B-2. Name the owners by 2026-11-04

DELIVERY-PLAN.md §10 has no names. Four roles sit outside the core team and must agree to their part before the checkpoints in DELIVERY-PLAN.md §7 can work:

- **PASS_OWNER** — Pass extensions on the critical path;
- **SECURITY** — security review before outside users;
- **LEGAL** — partner code terms by 2026-11-20;
- **CT_ADMIN** — Constructor Tech hardware and instance.

### B-3. Decide the M1 size now, not on 2026-11-23

**Problem:** M1 has grown from 78 to 107 Must requirements (plus 19 Should) for about 4.5 weeks. The growth comes from tenant isolation, rate limits, operational readiness, key handling and admission checks. The cut line in DELIVERY-PLAN.md §8 is good, but on 2026-11-23 only 1.5 weeks remain, too late to save the time.

**Fix:** at the 2026-11-10 decision point, the PRODUCT_OWNER decides whether to move the "after the event, with workaround" items of the cut line out of M1 right away:

- Terminal Bench for the second family;
- the deprovisioning webhook;
- the break-glass account;
- the installer's prerequisite check;
- request limits;
- the external install demonstration.

The "never cut" list stays as it is.

---

## 3. Major issues

| # | Issue | Where | Fix |
|---|---|---|---|
| M-1 | **Security review window is too short.** The review starts 2026-11-25 and findings must be fixed by 2026-12-02 — one week for an internet-facing, multi-tenant system with a new IdP integration. The security reviewer is not named. | NFR-5.5; DELIVERY-PLAN §6–7 | Name the reviewer by 2026-11-04; agree a threat model and review scope in week 2 (by 2026-11-13); review the identity and isolation parts as soon as they work (week 3) rather than all at the end. |
| M-2 | **Partial GPU availability has no rule.** The 2026-11-16 go/no-go covers "GPUs available or not". If only part arrives, it is undefined whether production or the isolated eval instance (FR-D5) gets the GPUs, and whether one model family is enough for the demo. | §10.2; DELIVERY-PLAN §7 | Add a rule: production first; the eval instance may borrow production GPUs outside user hours until its own arrive, with benchmarks marked as such. Or state which acceptance criteria are relaxed. |
| M-3 | **Constructor Tech readiness is outside the team's control.** The M1 acceptance criteria require the Constructor Tech instance, but its hardware, IdP and admin are unknown, and the code terms are due only 2026-11-20. | §10.2; DELIVERY-PLAN DR-7 | Name CT_ADMIN by 2026-11-04; get the Constructor Tech hardware and IdP details into the §10.2 table by 2026-11-10; decide what M1 acceptance means if Constructor Tech is late (e.g., "installed" vs "serving users"). |

---

## 4. Minor items

| # | Item | Where | Fix |
|---|---|---|---|
| m-1 | The PRD is now about 900 lines. People who only need M1 have to read through M2–M4 detail. | PRD | Optional: add a one-page M1 summary (scope, interfaces, acceptance) at the top of §10.2, or generate it as a separate handout for the team. |
| m-2 | The quota and rate-limit specification is still marked "proposed" (OQ-17) and depends on the router capability check. If the router can't implement it, WS-4 needs a gateway extension in weeks 3–4. | §7-G G.0; DR-6 | Close OQ-17 on 2026-11-10 together with the capability check result; record the outcome in DESIGN.md TD-7. |
| m-3 | Appendix B describes provider behaviour as of 2026-11-03; providers change limits and error codes often. | Appendix B | Re-check before M2 planning. |

---

## 5. Decisions due

| Decision | Ref | Owner | Due |
|---|---|---|---|
| Named owners for all roles | B-2 | PRODUCT_MANAGER | 2026-11-04 |
| Second validated tool, tool versions, models, hardware, flagship tenants | OQ-1 | PRODUCT_OWNER | 2026-11-06 |
| Pass owner, dates and role names; UI technology | OQ-18, OQ-20 | PRODUCT_OWNER | 2026-11-07 |
| Quota and rate-limit spec and values; `auto` before M4; runtime overrides; router capability; M1 size | OQ-16, OQ-17, OQ-19, B-3 | PRODUCT_OWNER, ARCHITECT | 2026-11-10 |
| Non-open component inventory | OQ-21 | ARCHITECT | 2026-11-14 |
| Partner code terms and contribution agreement | OQ-9.1 | LEGAL | 2026-11-20 |
| GPU, Pass and scope go/no-go | DELIVERY-PLAN §7 | PRODUCT_OWNER | 2026-11-16, 2026-11-20, 2026-11-23 |
