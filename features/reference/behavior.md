# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on `dev` (not API shapes or columns — see [api.md](./api.md) and [data-model.md](./data-model.md)).

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md` (**FR-00N** + Gherkin). Deep scenarios stay in the introducing feature; this file is an **index**.

**Related:** [ADR-0002 — Security architecture](../../docs/adr/0002-security-architecture.md)

---

## Maintenance

| When | Action |
|------|--------|
| Feature changes a product rule (sort, ownership, validation, UI rule) | Update this file in the **same PR** |
| Feature only changes routes/payloads/schema | Update [api.md](./api.md) / [data-model.md](./data-model.md); touch this file only if rules changed |
| Drift suspected | Compare this file → code + mapped tests; fix reference or code |

---

## Auth & sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login is **username + password** (not email-only) | Auth API + Login UI | Feature 1 |
| Passwords hashed with bcrypt (`SALT_ROUNDS = 10`); hash never returned | Register/login APIs; user `defaultScope` | Feature 1 |
| Session = JWT stored server-side; client sends `Authorization: Bearer <token>` | `authenticate` middleware + `sessions` table | Feature 1 |
| Session lifetime **24 hours** from creation | JWT `expiresIn: 86400` + `expirationDate` | Feature 1 |
| Login reuses a non-expired session for the same user when one exists | `createOrReuseSession` | Feature 1 |
| Logout invalidates the server session (token set to `""`) and clears client `user` storage | Logout API + `authServices.logoutUser` | Feature 1 |
| Unauthenticated protected API → `401` | `authenticate` | Feature 1 |
| Unauthenticated protected UI → redirect to login | Router `beforeEach` | Feature 1 |
| Signed-in user visiting login/register → redirect to home | Router `beforeEach` | Feature 1 |
| Default role for new users is `worker` | User model default | Feature 1 |
| Username normalized `trim().toLowerCase()` on save | User model hook + auth controller | Feature 1 |
| Client session stored in `localStorage` key `user` | `Utils.setStore` after register/login | Feature 1 |
| API `401` / unauthorized message clears `user` and redirects to login | Axios response interceptor | Feature 1 |
| Shared `emailRules` on registration (required + `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; invalid format **"Enter a valid email address."**) | `frontend/src/config/validation.js` + Register | Feature 1 |

## Ownership & isolation

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Every authenticated request resolves to `req.user.id` from the session | `authenticate` | Feature 1 |
| `GET /todo/lists` returns only the caller's lists (currently `[]`) | Authenticated lists placeholder | Feature 1 |

## UI (Feature 1)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login, register, and home use full-screen layout with **no MenuBar** | `App.vue` / views | Feature 1 |
| Home placeholder welcomes the user by first name and has a standalone **Sign out** button | `Home.vue` | Feature 1 |
| Login/register server errors shown in `<v-alert type="error">` | Login / Register views | Feature 1 |

## Errors (product convention)

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Error body shape `{ "message": "Human-readable explanation." }` | Controllers | Feature 1 |
| Invalid login uses the same message for wrong username or password | Login controller | Feature 1 |

---

## How to use

| Question | Look here |
|----------|-----------|
| What rule is in force now? | This file |
| Why was this rule chosen? | Feature FR / Gherkin, or ADR |
| Exact scenario / test name | Introducing `feature-N-*.md` Test Coverage Map |
| Routes and payloads | [api.md](./api.md) |
| Tables and columns | [data-model.md](./data-model.md) |
