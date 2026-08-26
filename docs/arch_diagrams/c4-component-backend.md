# C4 Level 3 — Backend components

Express app inside `backend/`, ordered along the HTTP handling path.

```mermaid
C4Component
title Component Diagram — API

Container_Boundary(api, "API Application") {
  Component(routes, "Routes", "app/routes/*", "Resource routers under /todo.")
  Component(authz, "Authorization", "app/authorization/*", "Session auth and ownership helpers.")
  Component(controllers, "Controllers", "app/controllers/*", "Validation, feature rules, and responses.")
  Component(models, "Models", "app/models/*", "Sequelize entities and associations.")
}

Container_Ext(spa, "Web SPA", "Vue + axios")
ContainerDb_Ext(db, "MySQL", "System of record")

Rel(spa, routes, "HTTP JSON", "Bearer JWT")
Rel(routes, authz, "Protects")
Rel(routes, controllers, "Delegates")
Rel(controllers, authz, "Scopes access")
Rel(controllers, models, "CRUD")
Rel(authz, models, "Loads Session / User")
Rel(models, db, "SQL", "Sequelize")

UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
UpdateRelStyle(spa, routes, $offsetY="-20")
UpdateRelStyle(routes, controllers, $offsetY="-15")
UpdateRelStyle(controllers, models, $offsetY="-10")
UpdateRelStyle(models, db, $offsetX="15")
```

## Notes

- Protected routes authenticate first; controllers reuse authorization helpers for ownership checks.
- Cross-user resources return `404`, while missing or invalid sessions return `401`.
- Database/auth configuration and Winston logging are omitted to keep the request path readable; they remain under `app/config/`.

**Related:** [ADR-0002](../adr/0002-security-architecture.md) · [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc) · [security.mdc](../../.cursor/rules/security.mdc)
