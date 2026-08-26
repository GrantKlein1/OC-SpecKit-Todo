# ADR-0008: Sequelize as the Node ORM

**Status:** Accepted  
**Date:** 2026-08-26  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

[ADR-0003](./0003-mysql-relational-database.md) selects **MySQL** as the relational database and already mentions Sequelize in the stack. [ADR-0006](./0006-node-express-api.md) selects **Node + Express**. Feature specs still need an explicit, durable choice of **how** Node code maps tables to models, associations, and queries.

Constraints:

1. **SDD data model** — Feature **Data Model Requirements** and living [data-model.md](../../features/reference/data-model.md) should map 1:1 to model files under `backend/app/models/`.
2. **ES modules** — Same `"type": "module"` style as the rest of Speckit.
3. **Ownership queries** — Easy `where: { userId: req.user.id }` patterns for ADR-0002.
4. **Classroom sync** — Dev `sync({ alter: true })` and test `sync({ force: true })` without requiring migration files in v1.
5. **Course continuity** — Speckit Cursor rules (`api-conventions.mdc`) already encode Sequelize model/route patterns.

## Decision

Adopt **Sequelize 6** (with **`mysql2`**) as the ORM for OC CS Speckit backends:

| Concern | Choice |
|---------|--------|
| **ORM** | Sequelize 6 |
| **Driver** | `mysql2` |
| **Instance** | Shared `sequelizeInstance.js`; models register in `models/index.js` |
| **Associations** | Defined in models / `index.js` (User–Session, User–List, List–Todo) |
| **Schema in v1** | Model definitions + `sequelize.sync` (see ADR-0003 for env strategies) |
| **Queries** | `findOne` / `findAll` / `create` / `update` / `destroy` with explicit `where` |

```text
feature Data Model Requirements
        │
        ▼
backend/app/models/*.model.js  ──Sequelize──►  MySQL (ADR-0003)
        ▲
controllers / auth helpers (userId in WHERE)
```

**Invariants:**

1. Product persistence for Speckit apps uses Sequelize models — not ad-hoc raw SQL as the primary pattern (raw SQL only if a feature ADR explicitly allows it).
2. Models import the shared sequelize instance; associations stay centralized so agents do not invent parallel DB access layers.
3. Replacing Sequelize (e.g. with Prisma) requires a new ADR and updates to `api-conventions.mdc` / project structure.

## Consequences

### Positive

- Models read like the data-model section of a feature spec — good for teaching and Cursor prompts.
- Associations and FK cascades (e.g. list → todos) are declarative.
- Fits Express controllers and Jest setup already used in the Todo answer key and starter shell.
- `unscoped()` / default scopes support hiding password hashes except where bcrypt needs them.

### Negative / tradeoffs

- ORM abstraction can hide inefficient queries if misused (mitigate with simple find patterns in rules).
- Sequelize 6 vs 7 / TypeScript dialects — Speckit stays on the documented JS + Sequelize 6 path until a new ADR.
- No first-class checked-in migrations in v1 — production-grade migration discipline is deferred (ADR-0003).

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Prisma** | Strong DX and migrations; would rewrite all models, rules, and course materials already Sequelize-based. |
| **Knex / Objection** | Flexible query builder; less “model file ↔ spec entity” clarity for SDD beginners. |
| **TypeORM** | Common in Nest/TS stacks; Speckit is JS + Express without requiring TypeScript. |
| **Raw `mysql2` only** | More boilerplate for associations, sync, and consistent `userId` filters; weaker agent consistency. |
| **Drizzle** | Modern SQL-first; not the Speckit teaching standard. |

## Related artifacts

- ADRs: [ADR-0003 — MySQL](./0003-mysql-relational-database.md) (engine + schema strategy), [ADR-0006 — Node + Express](./0006-node-express-api.md), [ADR-0002 — Security](./0002-security-architecture.md)
- Cursor rules: [api-conventions.mdc](../../.cursor/rules/api-conventions.mdc), [project-structure.mdc](../../.cursor/rules/project-structure.mdc)
- Code: `backend/app/models/`, `backend/app/config/sequelizeInstance.js`, `db.config.js`
- Reference: [features/reference/data-model.md](../../features/reference/data-model.md)
