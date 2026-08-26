# ADR-0004: Vue 3 as the frontend framework

**Status:** Accepted  
**Date:** 2026-08-26  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

[ADR-0001](./0001-client-server-multi-user-architecture.md) establishes a **client–server** Todo example: a browser SPA talks to an Express REST API. We still needed an explicit choice of **SPA framework** for Speckit’s frontend shell (starter kit and Todo answer key).

Constraints for the kit:

1. **Teachable SDD** — students and Cursor agents must map Screen Requirements to a small, consistent set of files (`views/`, `components/`, `services/`).
2. **Course-aligned stack** — OC CS materials and prior Vue coursework should transfer; avoid introducing a second major UI paradigm.
3. **Component UI library** — Speckit standardizes on **Vuetify 4** ([ADR-0005](./0005-vuetify-ui-library.md); see `ui-style-system.mdc`); the framework must integrate cleanly with that library.
4. **SPA + Vite** — client-side routing, axios services, and Vitest + `@vue/test-utils` for Gherkin-backed UI tests.
5. **Agent-friendly** — clear Options/Composition API patterns and a stable directory layout encoded in Cursor rules.

Choosing React, Svelte, or Angular would force a different component library, test stack, and rewrite of frontend rules — without improving the SDD teaching goals.

## Decision

Adopt **Vue 3** (with **Vite**) as the SPA framework for OC CS Speckit:

| Concern | Choice |
|---------|--------|
| **Framework** | Vue 3 (ES modules) |
| **Build / dev** | Vite (dev port **8082**) |
| **UI kit** | Vuetify 4 |
| **Routing** | `vue-router` with `beforeEach` guards for auth UX |
| **HTTP** | axios via `frontend/src/services/` (`*Services.js`) — no axios in views |
| **Tests** | Vitest + `@vue/test-utils` |
| **Layout** | `frontend/src/views/`, `components/`, `services/`, `plugins/` (see `project-structure.mdc`) |

```text
features/ Screen Requirements
        │
        ▼
frontend/src/views/*.vue  ←── services/*Services.js  ←── axios ──► Express /todo/
        │
        └── components/ + Vuetify 4 (ui-style-system.mdc)
```

**Invariants:**

1. Product UI lives under `frontend/` as a Vue SPA — not server-rendered HTML as the primary UI.
2. Views call **services**, not raw axios (constitution / `frontend-services.mdc`).
3. Stack deviations (e.g. React, Tailwind as primary system) require a new ADR and rule updates — not ad-hoc feature code.

## Consequences

### Positive

- Aligns with OC CS Vue teaching path and existing Speckit Cursor rules (`ui-style-system`, `frontend-services`).
- Vuetify 4 is first-class for Vue 3; Screen Requirements can name Vuetify patterns without inventing a design system.
- Vite keeps local DX simple (fast HMR, clear env split for API base URL).
- Vitest + Vue Test Utils match Gherkin scenarios for Login, Dashboard, etc.
- Starter-kit overlay can ship a thin Vue shell (`App.vue`, `Home.vue`, router) that features extend incrementally.

### Negative / tradeoffs

- Students who only know React must learn Vue idioms (or reverse for other courses).
- Vue ecosystem choices (Composition vs Options API, pinia vs local state) still need course guidance — Speckit prefers patterns already in rules/specs, not every Vue plugin.
- SSR / Nuxt is out of scope; SEO and first-paint for a public marketing site are not goals of this kit.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **React + Vite** | Strong ecosystem, but breaks Vuetify-first UI rules and OC CS Vue continuity; would require rewriting frontend rules and starter shell. |
| **Angular** | Heavier framework and tooling for a small Todo/SPA teaching kit; steeper curve for feature-by-feature SDD slices. |
| **Svelte / Solid** | Excellent DX, but weaker match to course materials and Vuetify; fewer shared patterns in OC CS Speckit docs. |
| **Plain JS / jQuery SPA** | Insufficient structure for services layer, router guards, and Vitest component tests tied to Gherkin. |
| **Nuxt / Vue SSR** | Extra deployment and auth complexity; ADR-0001 targets a Vite SPA talking to Express. |

## Related artifacts

- ADRs: [ADR-0001 — Client–server multi-user architecture](./0001-client-server-multi-user-architecture.md), [ADR-0005 — Vuetify 4 as the UI component library](./0005-vuetify-ui-library.md)
- Cursor rules: [project-structure.mdc](../../.cursor/rules/project-structure.mdc), [frontend-services.mdc](../../.cursor/rules/frontend-services.mdc), [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc), [constitution.mdc](../../.cursor/rules/constitution.mdc) (Principle 5 — stack consistency)
- Features: [Feature 1 — User Authentication](../../features/feature-1-user-auth.md) (first Vue screens); Features 2–5 (Dashboard, profile, due dates)
- C4: [docs/arch_diagrams/](../arch_diagrams/README.md) (frontend container / components)
- Starter kit: [docs/STARTER-KIT.md](../STARTER-KIT.md) (empty Vue shell in overlay)
