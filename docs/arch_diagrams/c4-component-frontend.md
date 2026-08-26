# C4 Level 3 — Frontend components

Vue SPA inside `frontend/src/`, ordered along the user interaction and API request path.

```mermaid
C4Component
title Component Diagram — Web SPA

Container_Boundary(spa, "Web SPA") {
  Component(router, "Router", "vue-router", "Routes and UX-only auth redirects.")
  Component(views, "Views", "views/*.vue", "Login, register, dashboard, and profile flows.")
  Component(ui, "UI Components", "components/*.vue", "Navigation, forms, dialogs, and rows.")
  Component(services, "API Services", "*Services.js", "axios modules for /todo resources.")
  Component(config, "Client Config", "config + plugins", "Token storage, helpers, and Vuetify.")
}

Container_Ext(api, "API", "Express /todo")

Rel(router, views, "Renders")
Rel(views, ui, "Uses")
Rel(views, services, "Calls")
Rel(services, config, "Token")
Rel(services, api, "HTTP JSON", "Bearer JWT")

UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
UpdateRelStyle(router, views, $offsetY="-20")
UpdateRelStyle(views, services, $offsetY="-10")
UpdateRelStyle(services, api, $offsetX="20")
```

## Notes

- Router guards and `localStorage` improve UX only; the API remains authoritative.
- Views may compose UI components that call services for dialog actions; the main request spine is simplified above.
- API modules follow the `*Services.js` naming rule.

**Related:** [frontend-services.mdc](../../.cursor/rules/frontend-services.mdc) · [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc)
