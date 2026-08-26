# ADR-0003: MySQL relational database

**Status:** Accepted  
**Date:** 2026-07-07  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

The **Todo** example application persists multi-user identity, sessions, lists, and todos. The data is inherently **relational**: users own lists; lists contain todos; sessions belong to users. [ADR-0001](./0001-client-server-multi-user-architecture.md) requires a shared server-side database; [ADR-0002](./0002-security-architecture.md) requires row-level ownership enforced in every query.

We needed to decide:

1. **Relational SQL vs document/NoSQL** for this domain.
2. **Which SQL engine** fits a classroom + XAMPP-style local setup.
3. **How** the Node backend talks to the database (ORM, schema evolution, tests).

The stack must work on developer laptops (often XAMPP with MySQL already installed), support foreign keys and transactions, and stay simple enough to teach alongside Sequelize models and Jest integration tests.

## Decision

Use **MySQL** as the production database with **Sequelize 6** as the ORM ([ADR-0008](./0008-sequelize-orm.md)) and **relational, normalized tables** scoped by `userId` foreign keys.

### Stack

| Layer | Choice |
|-------|--------|
| **Database** | MySQL 5.7+ / 8.x (via XAMPP, Docker, or native install) |
| **Driver** | `mysql2` |
| **ORM** | Sequelize 6 (ES modules) |
| **Config** | `backend/app/config/db.config.js` + `sequelizeInstance.js`; credentials from `.env` |
| **Default database** | `todospeckit-db` |
| **Test database** | Separate `todospeckit-db-test` (`backend/.env.test`) |

### Schema model

Four core tables with explicit foreign keys (see [data-model.md](../../features/reference/data-model.md)):

```text
users ──┬── sessions
        ├── lists ── todos
        └── todos (direct userId for authorization queries)
```

| Table | Purpose |
|-------|---------|
| `users` | Accounts; bcrypt password hash; unique `email` and `username` |
| `sessions` | Revocable Bearer tokens; `expirationDate`; FK → `users.id` |
| `lists` | Per-user todo lists; FK → `users.id` |
| `todos` | Items in a list; FK → `lists.id` + `users.id`; `onDelete: CASCADE` from list |

**Design rules:**

- **Normalized relational schema** — no embedded todo arrays in list documents.
- **`userId` on lists and todos** — enables authorization `WHERE` clauses without joins-only assumptions.
- **Cascade delete** — removing a list deletes its todos (US-3.6).
- **`DATEONLY` for `dueDate`** — date-only semantics without timezone complexity (Feature 5).
- **Timestamps** — Sequelize `createdAt` / `updatedAt` on all tables.
- **Uniqueness** — email and username enforced at DB + controller.

### Schema evolution

| Environment | Strategy |
|-------------|----------|
| **Development** | `sequelize.sync({ alter: true })` on server start when `SEQUELIZE_SYNC_ALTER=true` (default in `.env.example`) |
| **Production** | `sync()` without alter; schema changes require explicit migration discipline (out of scope for v1 teaching model) |
| **Tests** | `sync({ force: true })` in Jest `beforeAll` — drops and recreates tables per suite; `resetTestDatabase()` truncates between tests |

No checked-in Sequelize migration files in v1 — schema is defined in `backend/app/models/*.model.js` and synced. Feature specs authorize schema changes; `features/reference/data-model.md` is updated in the same feature PR when schema changes (see [Agent implementation request](../../features/framework.md#agent-implementation-request)).

### Connection handling

- Connection pool: `max: 5`, `min: 0` in `db.config.js`.
- Server refuses to start if sync fails outside `NODE_ENV=test`.
- Tests close `db.sequelize` in `afterAll` to avoid connection leaks across suites.

### Query patterns

- Sequelize model definitions + `findOne` / `findAll` with explicit `where` clauses.
- Authorization helpers add `userId: req.user.id` to every scoped lookup.
- `User.unscoped()` only when bcrypt password comparison requires the hash column.

## Consequences

### Positive

- Natural fit for user → list → todo hierarchy and FK integrity.
- MySQL ships with XAMPP — low friction for local full-stack development.
- Sequelize models map cleanly to SDD **Data Model Requirements** sections in feature specs.
- Separate test database prevents dev data loss during `force: true` test sync.
- `alter: true` in dev speeds iteration without hand-written migrations for coursework.
- SQL `WHERE userId = ?` aligns with [ADR-0002](./0002-security-architecture.md) authorization model.

### Negative / tradeoffs

- MySQL must be installed and running — not zero-dependency like SQLite file DB.
- `sync({ alter: true })` is unsafe for production schema changes; real deployments need migrations (deferred).
- Sequelize adds abstraction weight vs raw SQL.
- No read replicas, sharding, or connection pooling beyond defaults — single-instance assumption.
- `DATEONLY` avoids timezones but does not support time-of-day due dates (Feature 5 out of scope).

## Alternatives considered

| Option | Why not |
|--------|---------|
| **SQLite (file DB)** | Simpler setup but weaker classroom alignment with deployed MySQL; concurrent test + dev access is awkward. |
| **PostgreSQL** | Excellent choice for production; less universal in XAMPP/LAMP developer environments for this course. |
| **MongoDB / document store** | Todo-in-list fits poorly without duplicating ownership; cross-user isolation harder to reason about in specs. |
| **JSON files / in-memory store** | No real multi-user persistence; fails ADR-0001. |
| **Prisma** | Viable ORM; rejected for Speckit in [ADR-0008](./0008-sequelize-orm.md) — Sequelize is the course standard. |
| **Raw SQL only (no ORM)** | More boilerplate; see ADR-0008. |
| **Single shared DB for dev and test** | Risk of wiping developer data when tests run `force: true`. |

## Related artifacts

- ADRs: [ADR-0001](./0001-client-server-multi-user-architecture.md), [ADR-0002](./0002-security-architecture.md), [ADR-0006](./0006-node-express-api.md), [ADR-0008](./0008-sequelize-orm.md)
- Reference: [data-model.md](../../features/reference/data-model.md)
- Cursor rules: [api-conventions.mdc](../../.cursor/rules/api-conventions.mdc), [project-structure.mdc](../../.cursor/rules/project-structure.mdc)
- Config: `backend/app/config/db.config.js`, `backend/.env.example`, `backend/.env.test.example`
- Models: `backend/app/models/`
- Tests: `backend/tests/helpers.js` (`syncTestDatabase`, `resetTestDatabase`)
