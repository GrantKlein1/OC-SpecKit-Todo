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
| Shared `emailRules` on Edit Profile (same messages as registration) | `validation.js` + MenuBar | Feature 4 |
| Profile fields trimmed before save; empty required strings rejected | User controller | Feature 4 |
| Profile password is optional on `PUT`; when provided, min 8 characters and bcrypt hashed | User controller | Feature 4 |
| After profile save: refresh `localStorage` `user` and dispatch `user-logged-in` | MenuBar | Feature 4 |

## Ownership & isolation

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Every authenticated request resolves to `req.user.id` from the session | `authenticate` | Feature 1 |
| Every list read/update/delete includes `userId: req.user.id` in the `where` clause | List controller + `getAccessibleListOrNull` | Feature 2 |
| A list belongs to exactly one user for its lifetime; ownership never changes | Create sets `userId` from `req.user.id` only | Feature 2 |
| `GET /todo/lists` returns only lists owned by the caller | `where: { userId: req.user.id }` | Feature 2 |
| Cross-user list access returns `404` (never `403`) | `getAccessibleListOrNull` | Feature 2 |
| Every todo read/update/delete includes `userId: req.user.id` in the `where` clause | Todo controller + `getAccessibleTodoOrNull` | Feature 3 |
| A todo belongs to exactly one list and one user for its lifetime; ownership never changes | Create sets `userId` from `req.user.id` and `listId` from the owned parent list | Feature 3 |
| Creating a todo requires the parent list to belong to `req.user.id` | `getAccessibleListOrNull` before `Todo.create` | Feature 3 |
| Cross-user todo or parent-list access returns `404` (never `403`) | `getAccessibleListOrNull` / `getAccessibleTodoOrNull` | Feature 3 |
| A user may read/update only their own profile (`:id` must match `req.user.id`) | `getAccessibleUserOrNull` | Feature 4 |
| Cross-user profile access returns `404` (never `403`) | `getAccessibleUserOrNull` | Feature 4 |

## Lists

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| List names are trimmed before save; empty/whitespace names are rejected | List controller | Feature 2 |
| List name max length is 100 characters (`400` if longer) | List controller | Feature 2 |
| Lists are ordered alphabetically by name in API responses | `order: [["name", "ASC"]]` | Feature 2 |
| Client-supplied `userId` on create is ignored | List controller | Feature 2 |

## Todos

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Todo titles are trimmed before save; empty/whitespace titles are rejected | Todo controller | Feature 3 |
| Todo title max length is 255 characters (`400` if longer) | Todo controller | Feature 3 |
| New todos default to `completed: false`; client-supplied `completed` on create is ignored | Todo controller | Feature 3 |
| Todos are ordered incomplete first, then by `createdAt` ascending | `order: [["completed", "ASC"], ["createdAt", "ASC"]]` | Feature 3 |
| Client-supplied `userId` on create is ignored | Todo controller | Feature 3 |
| Deleting a list deletes all todos in that list | `List hasMany Todo` `onDelete: CASCADE` | Feature 3 |

## UI

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login and register use full-screen layout with **no MenuBar** | `MenuBar` hidden on those routes | Feature 1 / 2 |
| Login/register server errors shown in `<v-alert type="error">` | Login / Register views | Feature 1 |
| Signed-in chrome is `MenuBar` with a user icon → profile dropdown (name, username, email); **Log out** in the dropdown only (no standalone **Sign out**) | `MenuBar.vue` | Features 2→4 |
| Dashboard (`home`) is a single lists view — no sidebar/main split | `Dashboard.vue` | Feature 2 |
| Empty lists view copy: **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| List row icon actions: **Edit list**, **Delete list** (`size="small"`) | `Dashboard.vue` | Feature 2 |
| Empty list name is blocked in the add-list dialog: **"List name is required."** | Dashboard form rules | Feature 2 |
| Each list row has an **Items** icon (`View items for <list name>`) that opens a list-items dialog | `Dashboard.vue` | Feature 3 |
| List-items dialog title is **{list name} — Items**; empty copy: **"No todos in this list yet."** | `ListItemsDialog.vue` | Feature 3 |
| Todo add/edit/delete use nested dialogs — no sidebar/main split | `ListItemsDialog.vue` | Feature 3 |
| Empty todo title is blocked in the add-item dialog: **"Todo title is required."** | List-items form rules | Feature 3 |
| Completed todos show struck-through / muted title styling | `ListItemsDialog.vue` | Feature 3 |

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
