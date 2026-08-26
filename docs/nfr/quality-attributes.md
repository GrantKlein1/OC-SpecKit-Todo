# Quality attributes

App-wide non-functional targets for OC CS Speckit (illustrated by the Todo example application).

**Teaching policy:** Specs say *what* to build. This table says *how good* the system should be. Only **Accepted** rows (and feature **Requirements (FR-00N)** / **Success Criteria (SC-00N)**) constrain implementation. **Deferred** is the quality backlog / classroom example. **Out of scope** is what not to build. Cursor agents follow [`.cursor/rules/quality-attributes.mdc`](../../.cursor/rules/quality-attributes.mdc) for this literacy — they must **not** treat every Deferred number as always-on.

## Column meanings

| Column | Meaning |
|--------|---------|
| **Attribute** | Quality characteristic (“ility”) |
| **Target** | Measure or bar — prefer a **number** (latency, %, count, level). Figures below are **illustrative classroom examples**, not production SLOs unless Status is **Accepted** and tests enforce them. |
| **Approach** | How the target is realized or limited (stack choice, pattern, explicit non-goal) |
| **How we verify** | Tests, manual checks, or N/A |
| **Status** | Whether the bar constrains work today (see below) |
| **Links** | Where Approach / enforcement lives (see below) |

## Status values

| Status | Meaning | Developer / agent expectation |
|--------|---------|------------------------------|
| **Accepted** | In force for this product | Must not regress; covered by linked rules, ADRs, and/or tests |
| **Accepted (minimal)** | Thin bar in force | Meet the stated Approach only; do not expand scope |
| **Deferred** | Documented, not enforced yet | Example Target for learning; implement only if a feature spec or instructor requires it |
| **Out of scope** | Explicit non-goal for this Todo example / kit demo | Do not design or generate for this bar |

## Links column

Use **Links** to point at the durable artifacts that explain or enforce the row:

| Link type | When to use |
|-----------|-------------|
| **ADR** (`docs/adr/…`) | *Why* this Approach was chosen |
| **Cursor rule** (`.cursor/rules/…`) | *How* agents/code must behave day to day |
| **Code path** (e.g. `logger.js`) | Concrete implementation of a minimal bar |
| **Feature / framework** | Process, **FR-00N**, **SC-00N**, or Screen Requirements that carry usability/maintainability |
| **—** | No separate artifact yet (common for Deferred rows) |

When Approach changes, update or add an ADR and refresh **Links**. When agents need a lasting coding constraint, add/update a Cursor rule and link it here.

---

Update this table when the bar changes. Feature-local bars stay in that feature’s **Requirements (FR-00N)** and/or **Success Criteria (SC-00N)** (+ Gherkin when testable).

| Attribute | Target | Approach | How we verify | Status | Links |
|-----------|--------|----------|---------------|--------|-------|
| **Security** | **100%** of protected routes require auth; **0** cross-user reads/writes in automated tests; other users’ resources → **404** (not 403) | Layered API enforcement; ownership isolation | Gherkin + Jest (supertest); Vitest for UX-only guards | Accepted | [ADR-0002](../adr/0002-security-architecture.md), [security.mdc](../../.cursor/rules/security.mdc), [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc) |
| **Data integrity** | **100%** of list/todo rows have a valid owning `userId`; **0** orphan associations after CRUD tests | Relational MySQL; foreign keys / Sequelize associations | Jest + schema in [data-model](../../features/reference/data-model.md) | Accepted | [ADR-0003](../adr/0003-mysql-relational-database.md) |
| **Reliability** | Happy-path write success ≥ **99%** in local test runs; failed writes return HTTP **4xx/5xx** with a body (never empty **200**) | Single-process Express; no HA/retry layer | Jest on create/update/delete paths | Deferred | — |
| **Availability** | Local demo uptime goal **≥ 95%** of lab session time; **no** multi-region SLA | Single-node deploy (XAMPP or similar); no HA | N/A | Out of scope | [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) |
| **Performance** | p95 API latency **&lt; 200 ms** (local XAMPP); dashboard first paint **&lt; 2 s** on a typical developer laptop | No formal load-test gate in CI yet | Manual / `npm run dev` (future: timed Jest or k6) | Deferred | — |
| **Scalability** | Correct for **≤ 30** concurrent classroom users; **≤ 500** todos per user without pagination redesign | Multi-user correctness, not horizontal scale | Ownership tests; manual multi-browser check | Out of scope | [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) |
| **Observability** | **100%** of unhandled server errors logged at `error`; HTTP access logged; retain rotating logs **≥ 7 days** | Winston console + daily rotate under `backend/logs/` | Logs present in local runs | Accepted (minimal) | `backend/app/config/logger.js` |
| **Usability** | New user completes register → create list → add todo in **≤ 3 minutes** without help; primary CTAs use labels from Screen Requirements (**100%** match); **≤ 2** clicks from dashboard to add a todo on an existing list | Vuetify + Screen Requirements; `oc-cta` for primary actions; empty states documented per feature | Manual walkthrough; Vitest for labeled CTAs / flows | Deferred | [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc), feature **Screen Requirements** |
| **Accessibility (a11y)** | Primary flows keyboard-reachable; aim **WCAG 2.2 AA** for auth + dashboard when audited; **0** unlabeled icon-only CTAs on primary actions | Prefer Vuetify semantic components | Manual / future Vitest a11y | Deferred | [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc) |
| **Internationalization (i18n)** | **1** locale (en-US); **0** translated string catalogs | No i18n framework | N/A | Out of scope | — |
| **Maintainability** | **100%** of Gherkin scenarios mapped in Test Coverage Map before merge; `npm test` green; feature PRs typically **≤ 15** files of product code (guideline) | Cursor rules + feature specs as source of truth | Merge checklist; `npm test` | Accepted | [framework.md](../../features/framework.md), [constitution.mdc](../../.cursor/rules/constitution.mdc), [quality-attributes.mdc](../../.cursor/rules/quality-attributes.mdc) |

---

## Feature-local NFRs

If only one feature needs a bar (e.g. a specific validation or UI responsiveness note):

1. Put it under that feature’s **Requirements (FR-00N)** (behavior/rules) or **Success Criteria (SC-00N)** (measurable outcome).
2. Add Gherkin when it must be proven by tests.
3. Optionally add a one-line pointer here (“see Feature N **FR-00N** / **SC-00N**”).

Do **not** invent a new feature file solely to “add performance.” See [feature spec template](../../features/framework.md#feature-spec-template).

---

## Changing a bar

1. Edit this table (**Target**, **Approach**, **Status**, **Links**). Prefer a number in **Target**.
2. If the **Approach** changes → ADR; put the ADR in **Links**.
3. If agents need a lasting coding constraint → Cursor rule; put the rule in **Links**.
4. If API/schema changed as a result → `features/reference/` in the same feature PR (see [Agent implementation request](../../features/framework.md#agent-implementation-request)).
5. Promoting **Deferred** → **Accepted** requires verification (tests or documented manual gate) that matches **How we verify**.
