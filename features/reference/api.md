# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 3** (todo list item management).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| List CRUD (`GET/POST /todo/lists`, `PUT/DELETE /todo/lists/:listId`) | 2 |
| Todo CRUD (`GET/POST /todo/lists/:listId/todos`, `PUT/DELETE /todo/todos/:id`) | 3 |

---

## Authentication (Feature 1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/todo/register` | No | Create account |
| `POST` | `/todo/login` | No | Sign in; returns session payload |
| `POST` | `/todo/logout` | Yes | Invalidate session token |

**Register body:**
```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

**Login body:**
```json
{
  "username": "jdoe",
  "password": "password123"
}
```

**Register / login success** (`201` register · `200` login):
```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never returned.

**Logout success** (`200`):
```json
{
  "message": "Signed out successfully."
}
```

**Common auth errors:** missing/whitespace required fields `400`; password < 8 chars `400` with `"Password must be at least 8 characters."`; duplicate username `400` with `"Username is already taken."`; duplicate email `400` with `"Email is already registered."`; invalid login `401` with `"Invalid username or password."`; missing token on protected routes `401` with `"Unauthorized! No token provided."`; expired or revoked token `401` with `"Unauthorized! Invalid or expired token."`

---

## Lists (Feature 2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | Fetch all lists owned by the authenticated user, ordered alphabetically by `name` |
| `POST` | `/todo/lists` | Yes | Create a new list owned by the authenticated user |
| `PUT` | `/todo/lists/:listId` | Yes | Rename a list owned by the caller |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete a list owned by the caller |

All list endpoints require a valid session. Cross-user access returns `404` (not `403`). Invalid `listId` returns `400`.

**Create / rename request body:**
```json
{ "name": "Groceries" }
```

`userId` in the request body is ignored. Ownership is always `req.user.id`. Names are trimmed before save.

**List success response** (`200` / `201`):
```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of list objects. `DELETE` returns `200` with the deleted list object.

**List errors:** empty or whitespace-only name `400` with `"List name is required."`; name longer than 100 characters `400` with `"List name must be 100 characters or fewer."`; not found / not owned `404` with `"List with id=<id> not found."`; unauthenticated `401`.

---

## Todos (Feature 3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch all todos in a list owned by the authenticated user, incomplete first then `createdAt` ascending |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to a list owned by the authenticated user |
| `PUT` | `/todo/todos/:id` | Yes | Update a todo (title and/or `completed`) owned by the caller |
| `DELETE` | `/todo/todos/:id` | Yes | Delete a todo owned by the caller |

All todo endpoints require a valid session. Cross-user access to a list or todo returns `404` (not `403`). Invalid `listId` or todo `id` returns `400`.

**Create todo request body:**
```json
{ "title": "Buy milk" }
```

`userId`, `listId`, and `completed` in the request body are ignored on create. Ownership is always `req.user.id`; the parent list comes from `:listId`; new todos default to `completed: false`. Titles are trimmed before save.

**Update todo request body** (one or both fields):
```json
{ "title": "Buy oat milk", "completed": true }
```

**Todo success response** (`200` / `201`):
```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

`GET /todo/lists/:listId/todos` returns an array of todo objects. `DELETE` returns `200` with the deleted todo object.

**Todo errors:** empty or whitespace-only title `400` with `"Todo title is required."`; title longer than 255 characters `400` with `"Todo title must be 255 characters or fewer."`; parent list not found / not owned `404` with `"List with id=<id> not found."`; todo not found / not owned `404` with `"Todo with id=<id> not found."`; unauthenticated `401`.
