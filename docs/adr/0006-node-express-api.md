# ADR-0006: Node.js and Express as the API runtime

**Status:** Accepted  
**Date:** 2026-08-26  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

[ADR-0001](./0001-client-server-multi-user-architecture.md) requires a **server-side REST API** as the source of truth for multi-user Todo data. [ADR-0003](./0003-mysql-relational-database.md) selects MySQL + Sequelize. We still needed an explicit choice of **runtime and HTTP framework** for Speckit’s `backend/` shell (starter kit and Todo answer key).

Constraints:

1. **Teachable SDD** — students and Cursor map API Requirements to a small layout: `routes/`, `controllers/`, `models/`, `authorization/`.
2. **Same language as tooling** — Node is already used for Vite, Jest, Vitest, and repo scripts (`starter:zip`, Agility, PDF export).
3. **REST + flat JSON** — matches `api-conventions.mdc` and feature Gherkin (supertest against Express `app`).
4. **Classroom deploy** — long-running Node process + static SPA is simpler than a heavy application server for this kit.
5. **ES modules** — `"type": "module"` throughout backend for consistency with modern Node and frontend tooling.

Choosing Java/Spring, .NET, Python/Django, or PHP as the *primary* Speckit API would fork the monorepo story, Cursor rules, and test harness without improving SDD pedagogy for this course stack.

## Decision

Adopt **Node.js** (current LTS suitable for the course, e.g. 24+) with **Express 4** as the HTTP framework for OC CS Speckit APIs:

| Concern | Choice |
|---------|--------|
| **Runtime** | Node.js (ES modules — `"type": "module"`) |
| **HTTP framework** | Express 4 |
| **API mount** | `/todo/` for the Todo example (starter kit may use `/api/` until renamed) |
| **Persistence** | Sequelize 6 + `mysql2` ([ADR-0003](./0003-mysql-relational-database.md)) |
| **Auth** | bcryptjs, JWT, Session table ([ADR-0002](./0002-security-architecture.md)) |
| **Logging** | winston + morgan |
| **Tests** | Jest + supertest against exported `app` |
| **Layout** | `backend/server.js`, `backend/app/{routes,controllers,models,authorization,config}/` |

```text
Vue SPA (ADR-0004)  ──JSON / Bearer──►  Express (this ADR)
                                              │
                                              ├── authenticate middleware
                                              ├── controllers + routes
                                              └── Sequelize ──► MySQL (ADR-0003)
```

**Invariants:**

1. The product API is a **Node + Express** service under `backend/` — not PHP pages or a second backend stack in the same kit.
2. Routes register through `app/routes/index.js`; `server.js` mounts the API prefix and syncs Sequelize on startup.
3. Replacing Node/Express (or adding a parallel primary API framework) requires a new ADR and updates to `api-conventions.mdc` / `project-structure.mdc`.

## Consequences

### Positive

- One language across frontend tooling, backend, and Speckit scripts — easier for students and agents.
- Express middleware model fits authenticate → controller → Sequelize cleanly (ADR-0002).
- Jest + supertest against `export default app` matches Gherkin API scenarios without a browser.
- Starter-kit overlay can ship a thin Express shell that features extend route-by-route.
- Aligns with existing Cursor rules: `api-conventions.mdc`, `auth-patterns.mdc`, `security.mdc`.

### Negative / tradeoffs

- Single-threaded event loop — CPU-heavy work needs care (not a goal of this Todo kit).
- Students must understand async/await and middleware order.
- Express is minimal: validation, auth, and structure are **our** conventions (rules + specs), not framework magic.
- TypeScript is not required by Speckit today — JS + ES modules keeps the teaching surface smaller; adopting TS would be a separate ADR.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Python + FastAPI / Django** | Excellent APIs, but splits language from Vue/Vite/Jest tooling and OC Speckit Node scripts. |
| **Java + Spring Boot** | Strong enterprise fit; heavier local setup and mental model for feature-sized SDD slices in this course. |
| **PHP (Laravel / plain)** | Common on XAMPP hosts, but Speckit’s monorepo, Sequelize, and Jest harness are Node-first. |
| **.NET / ASP.NET Core** | Viable REST stack; outside OC Speckit’s documented Vue + Node teaching path. |
| **NestJS (Node)** | Structured, but more ceremony than Express for a small Todo API and starter overlay. |
| **Next.js / Nuxt API routes only** | Couples UI and API deploy; ADR-0001 targets a **separate** Express service and static SPA. |

## Related artifacts

- ADRs: [ADR-0001 — Client–server](./0001-client-server-multi-user-architecture.md), [ADR-0002 — Security](./0002-security-architecture.md), [ADR-0003 — MySQL](./0003-mysql-relational-database.md), [ADR-0004 — Vue](./0004-vue-frontend-framework.md), [ADR-0007 — REST + JSON](./0007-rest-json-api.md), [ADR-0008 — Sequelize](./0008-sequelize-orm.md)
- Cursor rules: [api-conventions.mdc](../../.cursor/rules/api-conventions.mdc), [project-structure.mdc](../../.cursor/rules/project-structure.mdc), [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc), [constitution.mdc](../../.cursor/rules/constitution.mdc) (Principle 5)
- Implementation: `backend/server.js`, Feature 1+ API Requirements
- C4: [docs/arch_diagrams/](../arch_diagrams/README.md) (backend container / components)
- Starter kit: [docs/STARTER-KIT.md](../STARTER-KIT.md) (empty Express shell)
