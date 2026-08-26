# API Reference

**Base path:** `/todo/`  
**Status:** Integrated API through **Feature 1** (authentication and session management).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when routes or payloads change.

**Auth:** Send `Authorization: Bearer <token>` on protected routes.  
**Errors:** `{ "message": "Human-readable explanation." }` unless noted.

## Feature provenance

| Area | Feature |
|------|---------|
| Register, login, logout | 1 |
| `GET /todo/lists` (authenticated empty list until Feature 2) | 1 |

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

## Lists (Feature 1 placeholder)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/lists` | Yes | Lists owned by the caller. Feature 1 returns `[]`; Feature 2 adds persistence and CRUD. |

Unauthenticated `GET /todo/lists` returns `401`.
