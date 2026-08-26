# Data Model Reference

**Status:** Integrated schema through **Feature 1** (`users`, `sessions`).  
**Authority for new work:** feature specs in `features/` — update this file in the same PR when schema changes.  
**Architecture:** [ADR-0003 — MySQL relational database](../../docs/adr/0003-mysql-relational-database.md)

## Feature provenance

| Table / column | Introduced |
|----------------|------------|
| `users`, `sessions` | Feature 1 |

---

## `users`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `fName` | STRING | Required |
| `lName` | STRING | Required |
| `email` | STRING | Required, unique |
| `username` | STRING(100) | Required, unique; trimmed and stored lowercase (`beforeValidate` hook) |
| `password` | STRING(255) | Required; bcrypt hash only (never returned by API) |
| `role` | STRING(20) | Default `worker` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

**Sequelize:** `defaultScope` excludes `password` from query results. Use `unscoped()` when comparing passwords at login.

---

## `sessions`

| Column | Type | Rules |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING | Required; JWT string; cleared to `""` on logout |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24-hour lifetime from creation |
| `userId` | INTEGER FK | Required → `users.id` |
| `createdAt` | DATE | Sequelize timestamps |
| `updatedAt` | DATE | Sequelize timestamps |

---

## Associations

* `User hasMany Session` — `onDelete: CASCADE`
* `Session belongsTo User`
