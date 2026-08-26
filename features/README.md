# Feature Specifications

Spec-driven development (SDD) source of truth for **OC CS Speckit** (Todo is the example application in this repo).  
No application code may be written unless it maps to a requirement in one of these files.

**Methodology:** [framework.md](./framework.md) — how to write, trace, and ship feature specs.  
**Student guide (requirements):** [writing-feature-requirements.md](./writing-feature-requirements.md) ([PDF](./writing-feature-requirements.pdf)) — stories, FRs, initial data model, Gherkin AC.  
**Student guide (design):** [writing-feature-design.md](./writing-feature-design.md) ([PDF](./writing-feature-design.pdf)) — ownership, API, screens, test map, DoD, out of scope.  
**Student guide (living reference):** [reference/writing-living-reference.md](./reference/writing-living-reference.md) ([PDF](./reference/writing-living-reference.pdf)) — update api / data-model / behavior in the same PR.

Regenerate writing-guide PDFs: `npm run writing-guides:pdf`

**Sprints** (timeboxes, iterations, team planning) live in your agile tool — they are **not** part of these specs. One sprint may contain multiple features; one feature may span sprints. Specs describe **what** to build; sprints describe **when** the team works on it.

## Feature catalog

| ID | File | Branch | Status | Depends on |
|----|------|--------|--------|------------|
| 1 | [feature-1-user-auth.md](./feature-1-user-auth.md) | `feature/1-user-auth` | Ready | — |
| 2 | [feature-2-todo-list-management.md](./feature-2-todo-list-management.md) | `feature/2-todo-list-management` | Ready | Feature 1 |
| 3 | [feature-3-todo-list-item-management.md](./feature-3-todo-list-item-management.md) | `feature/3-todo-list-item-management` | Ready | Features 1–2 |
| 4 | [feature-4-user-profile-management.md](./feature-4-user-profile-management.md) | `feature/4-user-profile-management` | Ready | Features 1–3 |
| 5 | [feature-5-todo-due-date.md](./feature-5-todo-due-date.md) | `feature/5-todo-due-date` | Ready | Features 1–3 |

**Branch roles:** `main` = scaffold-only starter kit · `dev` = integration (branch from `main`, merge features here) · `feature/N-*` = feature implementation (branch from `dev`).

Implement features in dependency order (1 → 2 → 3; 4 and 5 after 3). Features 4 and 5 do not depend on each other.

## Living reference (current integrated state)

Keep these snapshots in sync with the codebase when schema or API changes — **in the same PR as implementation** (required DoD; see [Merge checklist + Agility sync](./framework.md#merge-checklist--agility-sync)). Use each feature’s **Agent implementation request** block when implementing with Cursor.

| File | Purpose |
|------|---------|
| [reference/README.md](./reference/README.md) | How to maintain reference docs |
| [reference/writing-living-reference.md](./reference/writing-living-reference.md) | Student guide — writing/updating living reference |
| [reference/data-model.md](./reference/data-model.md) | Current database tables and associations |
| [reference/api.md](./reference/api.md) | Current REST API under `/todo/` |
| [reference/behavior.md](./reference/behavior.md) | Current product rules (ownership, sort, validation, UI) |

New features: follow the template in [framework.md](./framework.md#feature-spec-template) — **Status**, **Input**, story **Priority** / **Independent test**, **FR-00N**, **Assumptions**, **Edge Cases**, **SC-00N**, **Key Entities**, plus **Agent implementation request** and **Definition of Done**.

Feature specs define **changes**; reference files describe **what exists now**. Spec evolution after merge: prefer a new feature delta — [framework.md](./framework.md#spec-evolution-after-merge).

## Implementation order (each feature)

**Cursor:** `Implement @features/feature-N-….md per its Agent implementation request and Definition of Done.` (or layer-by-layer — see [framework.md](./framework.md#agent-implementation-request)).

1. Backend models and associations
2. Backend routes, controllers, authorization helpers
3. Backend tests (Jest + supertest)
4. Frontend services (`*Services.js`, axios client)
5. Frontend views and components
6. Frontend tests (Vitest + `@vue/test-utils`)
7. Router updates and manual verification

## Related project docs

- Cursor rules: `.cursor/rules/`
- Architecture decisions: `docs/adr/` — [index](../docs/adr/README.md)
- Quality attributes (NFRs): `docs/nfr/` — [index](../docs/nfr/README.md)
- Living reference: `features/reference/` (data model + API + **behavior/rules** snapshot on `dev`)
- Backend env: `backend/.env` (copy from `backend/.env.example`)
- Test env: `backend/.env.test` (copy from `backend/.env.test.example`)
- UI references (optional): `docs/ui/` — link Figma exports from each feature spec

## Running tests

```bash
npm test                 # from repo root — backend + frontend
npm run test:backend     # Jest
npm run test:frontend    # Vitest
```

## Export specs to PDF

**Product specs only** (ADRs, NFRs, C4, features — no rules/guides/reference):

```bash
npm run specs:pdf:app
```

Output: `docs/todo-app-specs.md` · `docs/todo-app-specs.pdf`

**Full methodology pack** (rules + ADRs + NFRs + diagrams + specs + reference):

```bash
npm install              # once — installs md-mermaid-pdf at repo root
npm run specs:pdf
```

If PDF generation fails with a missing Chrome error, either use installed Google Chrome / Edge (macOS, Windows, or Linux paths are detected) or run the one-time browser download:

```bash
npm run specs:pdf:setup
npm run specs:pdf
```

Output:

- `docs/oc-cs-speckit-specs.md` — combined Markdown (rules, ADRs, specs, reference)
- `docs/oc-cs-speckit-specs.pdf` — PDF export

**Included in `specs:pdf` (auto-discovered each run):**

1. All `.cursor/rules/*.mdc` (preferred order, then any extras alphabetically)
2. `docs/adr/README.md` + every `docs/adr/NNNN-*.md` (numeric order)
3. `docs/nfr/README.md` + `docs/nfr/*.md` (quality attributes)
4. `docs/arch_diagrams/*.md` (C4 / architecture diagrams; Mermaid rendered in PDF)
5. `features/README.md`, `features/framework.md`
6. Every `features/feature-N-*.md` (numeric order)
7. `features/reference/*.md`

Adding a new feature, ADR, NFR, or arch-diagram markdown file is enough — no edits to `scripts/export-specs-pdf.mjs`. Mermaid fences (including C4) render in the PDF via `md-mermaid-pdf`.

Manual alternative (no npm script):

```bash
# Prefer npm run specs:pdf — it strips .mdc frontmatter, discovers new files, and renders Mermaid.
npx md-mermaid-pdf docs/oc-cs-speckit-specs.md
```

Note: a plain `md-to-pdf` run leaves Mermaid as code blocks; `npm run specs:pdf` renders diagrams.
