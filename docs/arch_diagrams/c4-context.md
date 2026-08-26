# C4 Level 1 — System context

**Todo** (the OC CS Speckit example application) stores each registered user's private lists and todos in MySQL through a server API. There are no external SaaS dependencies.

```mermaid
C4Context
title System Context — Todo

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

Person(user, "Registered User", "Owns private lists and todos.")
System(todoApp, "Todo", "Web application for private lists and todos.")
SystemDb_Ext(mysql, "MySQL", "Application system of record.")

Rel(user, todoApp, "Uses", "HTTPS")
Rel(todoApp, mysql, "Reads and writes", "Sequelize")

UpdateRelStyle(user, todoApp, $offsetY="-20")
UpdateRelStyle(todoApp, mysql, $offsetX="15")
```

## Notes

- The Todo system contains the Vue SPA and Express API; the [container diagram](./c4-container.md) expands that boundary.
- The API is the source of truth. Browser storage is only a session/UX hint.

**Related:** [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) · [ADR-0003](../adr/0003-mysql-relational-database.md)
