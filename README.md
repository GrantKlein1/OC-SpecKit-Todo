# OC CS Speckit

**OC CS Speckit** is a Spec-Driven Development (SDD) kit: written specifications, Cursor rules, and living reference docs that drive incremental delivery with AI-assisted coding guardrails via [Cursor](https://cursor.com).

This repository ships a **Todo** example application (auth, lists, items) so you can see the process end to end. Specifications define *what* to build; Cursor rules define *how* to build it; automated tests verify that both were followed.

---

## What is Spec-Driven Development?

In traditional workflows, code often leads and documentation follows. SDD inverts that relationship:

1. **Write the spec first** — user stories, **FR-00N** / **SC-00N**, API contracts, data models, and Gherkin acceptance criteria live in `features/` before application code exists.
2. **Implement against the spec** — every model, route, service, and view must trace back to an explicit requirement.
3. **Verify with tests** — each acceptance scenario maps to automated tests; code is not "done" until they pass.
4. **Govern with rules** — `.cursor/rules/` encodes stack conventions so humans and AI assistants produce consistent output.

This repository ships with **scaffolding only** (config, deploy scripts, test harness). Feature code is generated feature-by-feature from the spec files.

---

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, Vuetify 4, Vite, vue-router, axios |
| Backend | Node.js (ES modules), Express 4, Sequelize 6, MySQL |
| Auth | bcryptjs, JWT, server-side Session table |
| Tests | Jest + supertest (backend), Vitest + `@vue/test-utils` (frontend) |
| Deploy | GitHub Actions → SSH (separate frontend static + backend Node jobs) |

The API is mounted at `/todo/`. All list and todo data is **scoped per user** — cross-user access returns `404`, not `403`.

```
┌─────────────────┐     HTTP /todo/      ┌─────────────────┐
│  frontend/      │ ◄──────────────────► │  backend/       │
│  Vue SPA :8082  │   Bearer token       │  Express :3200  │
└─────────────────┘                      └────────┬────────┘
                                                    │
                                           ┌────────▼────────┐
                                           │  MySQL          │
                                           │  todospeckit-db │
                                           └─────────────────┘
```

---

## Repository layout

```
todo-speckit/
├── features/              # SDD specifications (source of truth)
├── .cursor/rules/         # AI + team coding conventions
├── docs/                  # ADRs, NFRs, C4 diagrams, Agility, exports — see docs/README.md
├── frontend/              # Vue SPA
├── backend/               # Express API
├── scripts/               # Local bundle scripts for deployment
├── .github/workflows/     # CI tests + deploy pipelines
└── package.json           # Root orchestration scripts
```

### Specifications (`features/`)

See [features/framework.md](features/framework.md) for the SDD methodology (templates aligned with [GitHub Spec Kit](https://github.com/github/spec-kit) — **FR-00N**, **SC-00N**, traceability, workflow).

| Feature | Spec | Delivers |
|--------|------|----------|
| 1 | [feature-1-user-auth.md](features/feature-1-user-auth.md) | Registration, login, logout, session, route guards |
| 2 | [feature-2-todo-list-management.md](features/feature-2-todo-list-management.md) | List CRUD, dashboard sidebar |
| 3 | [feature-3-todo-list-item-management.md](features/feature-3-todo-list-item-management.md) | Todo item CRUD, dashboard main panel |
| 4 | [feature-4-user-profile-management.md](features/feature-4-user-profile-management.md) | Profile dropdown, edit profile |
| 5 | [feature-5-todo-due-date.md](features/feature-5-todo-due-date.md) | Optional todo due dates, overdue display |

See [features/README.md](features/README.md) for feature dependencies and implementation order.

### Cursor rules (`.cursor/rules/`)

| Rule | Purpose |
|------|---------|
| [constitution.mdc](.cursor/rules/constitution.mdc) | SDD principles, branching, testing mandate |
| [project-structure.mdc](.cursor/rules/project-structure.mdc) | Directory layout, env vars, ports |
| [api-conventions.mdc](.cursor/rules/api-conventions.mdc) | REST routes, JSON responses, Sequelize patterns |
| [auth-patterns.mdc](.cursor/rules/auth-patterns.mdc) | Login, session, token flow |
| [security.mdc](.cursor/rules/security.mdc) | User-scoped data, password hashing |
| [frontend-services.mdc](.cursor/rules/frontend-services.mdc) | Axios client, router, services layer |
| [ui-style-system.mdc](.cursor/rules/ui-style-system.mdc) | Vuetify 4 component defaults |
| [testing-standards.mdc](.cursor/rules/testing-standards.mdc) | Jest/Vitest requirements |
| [agent-behavior.mdc](.cursor/rules/agent-behavior.mdc) | Assumptions, minimal diffs, verifiable goals |
| [feature-branch.mdc](.cursor/rules/feature-branch.mdc) | Feature branch gate for product code |
| [quality-attributes.mdc](.cursor/rules/quality-attributes.mdc) | How to read Accepted vs Deferred NFRs |

### Docs (`docs/`)

See **[docs/README.md](docs/README.md)** for the full index (ADRs, NFRs, C4 diagrams, Agility import, starter kit, generated PDF/Markdown exports).

---

## Getting started

### Prerequisites

- Node.js 24+
- MySQL (e.g. XAMPP)
- npm

### 1. Clone and install dependencies

```bash
git clone <repository-url> todo-speckit
cd todo-speckit

npm install --prefix frontend
npm install --prefix backend
```

Each app maintains its own `node_modules/` (`frontend/node_modules/`, `backend/node_modules/`). The root `package.json` orchestrates scripts only.

### 2. Create the database

```sql
CREATE DATABASE `todospeckit-db`;
CREATE DATABASE `todospeckit-db-test`;
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
# Windows: copy backend\.env.example backend\.env
#          copy backend\.env.test.example backend\.env.test
```

Edit `backend/.env` with your MySQL credentials. Default database name: `todospeckit-db`.

Backend tests use `backend/.env.test` with `DB_NAME=todospeckit-db-test` so `npm test` does not wipe dev data.

For local development you may set `SEQUELIZE_SYNC_ALTER=true` so Sequelize creates/updates tables on startup.

### 4. Run the application

```bash
# Terminal 1 — API
cd backend && npm run dev

# Terminal 2 — SPA
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8082 |
| Backend API | http://localhost:3200/todo/ |

### 5. Run tests

```bash
npm test                  # from repo root — backend + frontend
npm run test:backend      # Jest only
npm run test:frontend     # Vitest only
```

---

## Development workflow

This project is designed for iterative, spec-first development with AI assistance.

### Branching

Three branch roles keep the scaffold starter kit separate from working implementation:

| Branch | Purpose |
|--------|---------|
| `main` | **Starter kit** — specs, rules, scaffold, and test harness only. No feature code. Never merge feature branches here. |
| `dev` | **Integration** — created from `main`; all completed feature work is merged here. |
| `feature/*` | **Feature work** — one branch per feature; branch from `dev`, merge back to `dev` when done. |

```
main (scaffold — clone and start here)
 └── dev (integration — all features land here)
      ├── feature/1-user-auth
      ├── feature/2-todo-list-management
      └── feature/3-todo-list-item-management
```

**One-time setup** (after scaffold is committed on `main`):

```bash
git checkout main
git checkout -b dev
git push -u origin dev
```

**Per feature:**

```bash
git checkout dev
git pull
git checkout -b feature/1-user-auth
# ... implement feature ...
git checkout dev
git merge feature/1-user-auth
git push origin dev
```

Never commit directly to `main`. Tag the scaffold baseline before Feature 1 if you want a frozen snapshot (e.g. `git tag scaffold-v1` on `main`).

### Per-feature implementation order

1. Backend models and associations
2. Backend routes, controllers, authorization helpers
3. Backend tests
4. Frontend services (`*Services.js`, axios client)
5. Frontend views and components
6. Frontend tests
7. Router updates and manual verification

### Working with Cursor

See [Building each feature with Cursor](#building-each-feature-with-cursor) at the end of this document for step-by-step instructions and example prompts for each feature.

The constitution rule requires the AI to **refuse code generation** that has no corresponding spec in `features/`.

### Optional UI references

Export Figma frames to `docs/ui/feature-N/` and link them from the feature spec. Specs remain the functional source of truth; designs are visual guidance.

### Rebuild the Todo example from specs (strip shipped code)

Clone the full repo (kit + Todo answer key), then wipe product code and restore empty shells while **keeping** `features/feature-*.md`:

```bash
npm run reset:example -- --dry-run   # preview
npm run reset:example -- --yes       # apply (destructive)
```

Then implement Feature 1…N from the specs on `feature/*` branches. API prefix stays `/todo` so the specs match.

**Student assignment (GitHub repo → reset → rebuild):** see [docs/ASSIGNMENT-rebuild-todo.md](docs/ASSIGNMENT-rebuild-todo.md).

**Student assignment (walk through / textual tour of Speckit):** see [docs/ASSIGNMENT-walkthrough-todo.md](docs/ASSIGNMENT-walkthrough-todo.md).

### Start a new SDD application (not this todo app)

Works on **macOS, Windows, and Linux** (Node.js only).

```bash
npm run starter:zip
# → dist/speckit-starter-kit.zip
```

See [docs/STARTER-KIT.md](docs/STARTER-KIT.md) for what is included, what is excluded, Windows `copy` equivalents, and the post-unzip checklist. That zip is for a **new** product (no Todo specs); `reset:example` is for rebuilding **this** Todo app from its specs.

**Student assignment (new app from starter kit):** see [docs/ASSIGNMENT-starter-kit.md](docs/ASSIGNMENT-starter-kit.md).

---

## Deployment

The monorepo deploys as **two independent artifacts** from one git repository:

| Artifact | Source | Workflow |
|----------|--------|----------|
| Static SPA | `frontend/dist/` | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |
| Node API | `backend/deploy/` | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) |

Pushes and merged PRs to `dev` run [.github/workflows/deploy.yml](.github/workflows/deploy.yml): backend and frontend tests must pass before either artifact is deployed. PRs targeting `main` or `dev` run [.github/workflows/test.yml](.github/workflows/test.yml) only (no deploy). Pushes to `main` run tests only — `main` stays scaffold-only and is never deployed.

Local bundle scripts (Node — works on macOS, Windows, and Linux):

```bash
npm run bundle:frontend:full   # install + build + → frontend/dist/
npm run bundle:backend:full    # install + → backend/deploy/  (requires backend/.env)
npm run bundle:all             # both
```

Or call the scripts directly: `node scripts/bundle-frontend.mjs`, etc.

CI tests run on push to `main` and on pull requests to `main` or `dev` via [.github/workflows/test.yml](.github/workflows/test.yml).

Deploy workflows require GitHub secrets (`SERVER_SSH_KEY`, `REMOTE_HOST`, `DB_*`, etc.). See workflow files for the full list.

---

## API overview

All authenticated endpoints require `Authorization: Bearer <token>`.

| Feature | Endpoints |
|--------|-----------|
| 1 | `POST /todo/register`, `/login`, `/logout` |
| 2 | `GET/POST/PUT/DELETE /todo/lists` |
| 3 | `GET/POST /todo/lists/:listId/todos`, `PUT/DELETE /todo/todos/:id` |

Responses use flat JSON (no `{ success, data }` envelope). Errors return `{ "message": "..." }`.

---

## Design principles

- **Specs over code** — if it is not in `features/`, it should not exist in the codebase.
- **One user, one tenant** — every query scopes to `req.user.id`; never trust client-supplied `userId`.
- **Rules over improvisation** — stack and patterns live in `.cursor/rules/`; deviations require a spec update.
- **Tests over assumptions** — every Gherkin scenario earns at least one automated test.
- **Incremental delivery** — five features, five feature branches merged into `dev`; `main` stays scaffold-only.

---

## Building each feature with Cursor

This section describes a repeatable workflow for implementing each feature using Cursor Agent (or Chat in Agent mode) and the spec files in `features/`.

### Before you start

1. **Open the repo in Cursor** — File → Open Folder → select the `todo-speckit` directory.
2. **Confirm rules are active** — Cursor loads `.cursor/rules/` automatically. Rules encode stack conventions (Vuetify 4, Express, Sequelize, testing standards). You do not need to paste them into every prompt.
3. **Complete [Getting started](#getting-started)** — MySQL database, `backend/.env`, and `npm install` in both `frontend/` and `backend/`.
4. **Use the branch workflow** — stay on `main` for the starter kit; create `dev` from `main` once; branch each feature from `dev`. Never implement feature code on `main`.

```bash
git checkout dev
git checkout -b feature/1-user-auth
```

5. **Use Agent mode** — Agent can edit files, run terminal commands, and run tests. Chat-only mode is fine for questions; use Agent for implementation.

### How to reference specs in prompts

Always `@` mention the feature spec. Project rules in `.cursor/rules/` load automatically; spec files do not.

Each feature ends with an **Agent implementation request** block and **Definition of Done** — use them so living reference updates are not forgotten:

```text
Implement @features/feature-N-….md per its Agent implementation request and Definition of Done.
```

For layer-by-layer work, `@` the spec and name one slice (models, API, tests, etc.). On the **last** slice that touches API or schema, include reference updates (`features/reference/api.md` and/or `data-model.md`) in the same PR.

Good prompts are **narrow** when stepping through layers. For a full feature pass, the one-liner above is enough — the spec’s Agent block carries the rest.

### Micro-step workflow (every feature)

Repeat this cycle until the feature spec is fully covered:

| Step | What to ask Cursor | Verify |
|------|-------------------|--------|
| 1 | Backend models + associations | `cd backend && npm run dev` starts without errors |
| 2 | Routes + controllers + auth helpers | API responds (curl, Postman, or supertest) |
| 3 | Backend tests for Gherkin scenarios | `npm run test:backend` passes |
| 4 | Frontend `services.js` + domain services | Imports resolve, no axios in views |
| 5 | Views + components | `cd frontend && npm run dev` — UI loads |
| 6 | Frontend tests | `npm run test:frontend` passes |
| 7 | Router guards / integration | Manual login flow works end-to-end |

After each step, run tests. Do not move to the next feature until the current feature's acceptance criteria are satisfied.

### Definition of done (each feature)

A feature is complete when the spec’s **Definition of Done** is satisfied (see each `features/feature-N-*.md` and [framework.md](features/framework.md#agent-implementation-request)):

- Every **user story** and **FR-00N** in the spec has corresponding code
- **Success Criteria (SC-00N)** for the feature are met
- Every **Gherkin scenario** has at least one automated test (see the spec's Test Coverage Map)
- `npm test` passes from the repo root
- **`features/reference/api.md` and/or `data-model.md` updated** in the same PR when routes, payloads, or schema changed
- You can demonstrate the feature manually in the browser
- Changes are committed on the feature branch and merged into `dev` (not `main`)

---

### Feature 1 — User authentication

**Spec:** [features/feature-1-user-auth.md](features/feature-1-user-auth.md)  
**Branch:** `feature/1-user-auth` (from `dev`)

**Goal:** Registration, login, logout, session persistence, route guards, minimal protected home page (no `MenuBar` yet).

#### Suggested Cursor prompts (in order)

**Step 1 — Models**
```
Implement the users and sessions Sequelize models and associations from
@features/feature-1-user-auth.md (Data Model Requirements).
Register models in backend/app/models/index.js only.
```

**Step 2 — Auth API**
```
Implement POST /todo/register, /login, and /logout per
@features/feature-1-user-auth.md (API Requirements).
Use bcrypt, Session table, and JWT as specified in the spec.
Add auth.routes.js and auth.controller.js; register in app/routes/index.js.
```

**Step 3 — Auth middleware**
```
Implement authenticate middleware in backend/app/authorization/authorization.js
per @features/feature-1-user-auth.md (session and data ownership requirements).
```

**Step 4 — Backend tests**
```
Add Jest + supertest tests for all Feature 1 API scenarios listed in the
Test Coverage Map of @features/feature-1-user-auth.md.
Run npm run test:backend and fix failures.
```

**Step 5 — Frontend services**
```
Implement frontend/src/services/services.js (axios client) and authServices.js
per @features/feature-1-user-auth.md.
Add frontend/src/config/utils.js for localStorage.
```

**Step 6 — Login & Register views**
```
Implement Login.vue and Register.vue per the Screen Requirements in
@features/feature-1-user-auth.md (Vuetify 4, no MenuBar on auth pages).
Wire routes in router.js with beforeEach guards.
```

**Step 7 — Home placeholder + frontend tests**
```
Implement the Feature 1 home placeholder (welcome message + Sign out button, no MenuBar)
and Vitest tests for Login, Register, and router guards per
@features/feature-1-user-auth.md.
Run npm test.
```

**Manual check:** Register a user → log in → see home → refresh page (still signed in) → sign out → redirected to login.

---

### Feature 2 — Todo list management

**Spec:** [features/feature-2-todo-list-management.md](features/feature-2-todo-list-management.md)  
**Branch:** `feature/2-todo-list-management` (from `dev`, after Feature 1 is merged)

**Depends on:** Feature 1 complete.

**Goal:** List CRUD API, dashboard sidebar, `MenuBar`, main panel placeholder for Feature 3.

#### Suggested Cursor prompts (in order)

**Step 1 — List model**
```
Implement the lists Sequelize model and User association per
@features/feature-2-todo-list-management.md.
Add getAccessibleListOrNull helper in backend/app/authorization/.
```

**Step 2 — List API**
```
Implement GET/POST/PUT/DELETE /todo/lists per
@features/feature-2-todo-list-management.md including user-scoped queries
and 404 for cross-user access.
```

**Step 3 — Backend tests**
```
Add Jest tests for all list API scenarios and ownership isolation cases in
@features/feature-2-todo-list-management.md. Run npm run test:backend.
```

**Step 4 — Frontend list service + MenuBar**
```
Add listServices.js and MenuBar.vue. Introduce MenuBar in App.vue (hidden on login/register).
Implement list sidebar on Dashboard per Screen Requirements in
@features/feature-2-todo-list-management.md (v-dialog for create/rename/delete).
```

**Step 5 — Frontend tests**
```
Add Vitest tests for sidebar empty state, list selection, and validation per
@features/feature-2-todo-list-management.md Test Coverage Map. Run npm test.
```

**Manual check:** Create lists → rename → delete → another user's list ID returns 404 via API.

---

### Feature 3 — Todo list item management

**Spec:** [features/feature-3-todo-list-item-management.md](features/feature-3-todo-list-item-management.md)  
**Branch:** `feature/3-todo-list-item-management` (from `dev`, after Feature 2 is merged)

**Depends on:** Features 1 and 2 complete.

**Goal:** Todo item CRUD, dashboard main panel, cascade delete when list is removed.

#### Suggested Cursor prompts (in order)

**Step 1 — Todo model**
```
Implement the todos Sequelize model, associations, and cascade delete on list removal
per @features/feature-3-todo-list-item-management.md.
Add getAccessibleTodoOrNull in backend/app/authorization/.
```

**Step 2 — Todo API**
```
Implement GET/POST /todo/lists/:listId/todos and PUT/DELETE /todo/todos/:id
per @features/feature-3-todo-list-item-management.md.
Enforce parent list ownership and userId scoping on every operation.
```

**Step 3 — Backend tests**
```
Add Jest tests for all todo scenarios including cross-user 404 cases and list delete cascade
in @features/feature-3-todo-list-item-management.md. Run npm run test:backend.
```

**Step 4 — Frontend todo UI**
```
Extend Dashboard main panel: add todo, complete toggle, edit/delete v-dialogs
per @features/feature-3-todo-list-item-management.md Screen Requirements.
Add todoServices.js. Loading, empty, and error states required.
```

**Step 5 — Frontend tests + full regression**
```
Add Vitest tests per @features/feature-3-todo-list-item-management.md Test Coverage Map.
Run npm test from repo root.
```

**Manual check:** Add todos → complete → edit → delete → switch lists → delete list removes its todos.

---

### Tips for effective Cursor sessions

- **One spec, one slice** — attach the feature markdown and ask for a single step from the table above.
- **Cite Gherkin scenarios** — *"Implement the scenario: User signs in with invalid password"* keeps tests aligned.
- **Run tests in chat** — ask Cursor to run `npm test` after each step; fix failures before continuing.
- **Review diffs** — you are the tech lead; read every change before committing.
- **Do not skip specs** — if you need behavior not in `features/`, update the spec first, then implement.
- **Optional designs** — attach `docs/ui/feature-N/*.png` or a Figma export when you want visual fidelity; specs still govern behavior.

### When something goes wrong

| Problem | What to do |
|---------|------------|
| AI builds undeclared features | Point to constitution Principle 1; remove code or add spec first |
| AI uses wrong stack (Tailwind, wrong API shape) | Reference `@.cursor/rules/ui-style-system.mdc` or `@.cursor/rules/api-conventions.mdc` |
| Tests fail after a step | Ask Cursor to fix tests *without* weakening assertions; scenarios must stay meaningful |
| AI tries to do too much at once | Stop and re-prompt with a single micro-step from this guide |

---

## License

Private / educational use. Adjust licensing as needed for your organization.
