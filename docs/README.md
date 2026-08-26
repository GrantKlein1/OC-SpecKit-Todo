# Docs

Project documentation outside feature specs (`features/`) and Cursor rules (`.cursor/rules/`).

| Artifact | Question |
|----------|----------|
| [Feature specs](../features/) | What must the product *do*? |
| [Cursor rules](../.cursor/rules/) | *How* must we implement? |
| **This folder** (`docs/`) | Architecture *why*, quality bars, diagrams, Agility/PDF exports, starter kit |
| [Living reference](../features/reference/) | What API / schema / rules exist on `dev` now? |
| [Writing living reference](../features/reference/writing-living-reference.md) | Student guide for updating reference in the feature PR |

---

## Directories

| Directory | Purpose |
|-----------|---------|
| [adr/](./adr/README.md) | Architecture Decision Records — cross-cutting *why* |
| [nfr/](./nfr/README.md) | Non-functional requirements / quality attributes (“ilities”) |
| [arch_diagrams/](./arch_diagrams/README.md) | C4 architecture diagrams (Mermaid) |
| [agility-import/](./agility-import/README.md) | Digital.ai Agility Excel/API import from feature specs |
| `ui/` | Optional Figma / screen exports (`docs/ui/feature-N/`) — create as needed; link from feature Screen Requirements |

---

## Top-level files

| File | Purpose |
|------|---------|
| [STARTER-KIT.md](./STARTER-KIT.md) | How to use `npm run starter:zip` for a new SDD app; related: `npm run reset:example` keeps Todo specs and strips product code |
| [ASSIGNMENT-rebuild-todo.md](./ASSIGNMENT-rebuild-todo.md) ([PDF](./ASSIGNMENT-rebuild-todo.pdf)) | Student assignment: create GitHub repo → load Speckit → `reset:example` → rebuild Features 1–5 from specs |
| [ASSIGNMENT-starter-kit.md](./ASSIGNMENT-starter-kit.md) ([PDF](./ASSIGNMENT-starter-kit.pdf)) | Student assignment: new product from `speckit-starter-kit.zip` → rename → Feature 1 with Cursor |
| [ASSIGNMENT-walkthrough-todo.md](./ASSIGNMENT-walkthrough-todo.md) ([PDF](./ASSIGNMENT-walkthrough-todo.pdf)) | Student reading tour: SDD, OC Speckit, what folders and files mean |
| [ASSIGNMENT-agility-sync.md](./ASSIGNMENT-agility-sync.md) ([PDF](./ASSIGNMENT-agility-sync.pdf)) | Student assignment: sync `features/` backlog to Digital.ai Agility (API push or Excel import) |
| [todo-app-specs.md](./todo-app-specs.md) | Product-only Markdown from `npm run specs:pdf:app` (generated) |
| [todo-app-specs.pdf](./todo-app-specs.pdf) | Product specs PDF — ADRs, NFRs, C4, features (no rules/guides/reference) |
| [oc-cs-speckit-specs.md](./oc-cs-speckit-specs.md) | Full pack Markdown from `npm run specs:pdf` (generated) |
| [oc-cs-speckit-specs.pdf](./oc-cs-speckit-specs.pdf) | Full pack PDF — rules, ADRs, NFRs, diagrams, specs, reference (generated) |

Generated exports are safe to regenerate; do not treat them as the source of truth for requirements.

---

## Quick links by topic

### Architecture

- [ADR index](./adr/README.md) — ADR-0001 client/server · ADR-0002 security · ADR-0003 MySQL · ADR-0004 Vue · ADR-0005 Vuetify · ADR-0006 Node/Express · ADR-0007 REST/JSON · ADR-0008 Sequelize  
- [Writing ADRs](./adr/writing-adrs.md) — student guide (when, naming, principles)  
- [C4 diagrams](./arch_diagrams/README.md) — context, container, components, deployment  

### Quality & process

- [Quality attributes](./nfr/quality-attributes.md) · [NFR README](./nfr/README.md) · [Writing quality attributes](./nfr/writing-quality-attributes.md)  
- [SDD framework](../features/framework.md)  
- [Starter kit](./STARTER-KIT.md)  
- [Assignment: create, reset, rebuild Todo](./ASSIGNMENT-rebuild-todo.md)  
- [Assignment: new app from starter kit](./ASSIGNMENT-starter-kit.md)  
- [Assignment: walk through Todo Speckit](./ASSIGNMENT-walkthrough-todo.md) (textual tour)  
- [Assignment: sync specs to Agility](./ASSIGNMENT-agility-sync.md)  

Regenerate assignment PDFs: `npm run assignments:pdf`


### Backlog & exports

- [Agility import](./agility-import/README.md) — `npm run agility:export` / `agility:push`  
- Specs PDF (product only) — `npm run specs:pdf:app` → [todo-app-specs.pdf](./todo-app-specs.pdf)  
- Specs PDF (full pack) — `npm run specs:pdf` (includes `docs/adr`, `docs/nfr`, `docs/arch_diagrams`, features, reference, rules)

---

## When to update what

| Change | Update |
|--------|--------|
| Significant stack / security / data choice | New or revised [ADR](./adr/README.md) |
| App-wide quality bar (or explicit out of scope) | [nfr/quality-attributes.md](./nfr/quality-attributes.md) |
| System shape (containers, deploy topology) | [arch_diagrams/](./arch_diagrams/README.md) |
| Story/AC text for planning tools | Re-export Agility / regenerate PDF as needed |
| Product API, schema, or rules on `dev` | [features/reference/](../features/reference/) (not this folder) |
