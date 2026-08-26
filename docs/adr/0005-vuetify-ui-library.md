# ADR-0005: Vuetify 4 as the UI component library

**Status:** Accepted  
**Date:** 2026-08-26  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

[ADR-0004](./0004-vue-frontend-framework.md) selects **Vue 3 + Vite** for the Speckit SPA. Feature Screen Requirements still need a **single component and theming system** so students and Cursor agents do not invent ad-hoc CSS, Tailwind utilities, or mixed UI kits per feature.

Constraints:

1. **One design system** — Screen Requirements can name layouts, dialogs, forms, and buttons in a shared vocabulary.
2. **Vue 3 native** — Material-style components that integrate with Vite and `<script setup>`.
3. **Academic brand** — OC maroon / academic tokens live in one place (`plugins/vuetify.js`); views use theme names, not scattered hex.
4. **Agent guardrails** — Cursor rules must be able to say “Vuetify only” without debating CSS frameworks every prompt.
5. **Teachable forms & dialogs** — Login, Register, Dashboard list/todo CRUD, and profile flows need dialogs, text fields, and navigation chrome out of the box.

Without a fixed UI library, Feature 1–5 specs would either over-specify CSS or accept inconsistent UIs that fail visual and testing conventions.

## Decision

Adopt **Vuetify 4** as the **only** primary UI component library for OC CS Speckit frontends:

| Concern | Choice |
|---------|--------|
| **Library** | Vuetify 4 |
| **Plugin** | `vite-plugin-vuetify` (`autoImport: false` — explicit imports as required by course rules) |
| **Icons** | `@mdi/font` |
| **Theme** | Light theme tokens in `frontend/src/plugins/vuetify.js` (OC Academic Edition — primary maroon `#801328`, Inter font) |
| **Encoding** | [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc) — Vuetify only; **no Tailwind** as the design system |
| **API style** | Vue 3 `<script setup>` exclusively |

```text
Screen Requirements (features/)
        │
        ▼
views / components  ──►  Vuetify 4 components (v-btn, v-dialog, v-text-field, …)
        │
        └── theme colors / typography from plugins/vuetify.js
```

**Invariants:**

1. Product UI uses Vuetify components and theme tokens — not Tailwind utility classes as the primary styling approach.
2. Brand hex values live **only** in `plugins/vuetify.js`; views use Vuetify color names / CSS variables.
3. Replacing Vuetify (or adding a second competing UI kit) requires a new ADR and updates to `ui-style-system.mdc`.

## Consequences

### Positive

- Screen Requirements can reference familiar Vuetify patterns (forms, `v-dialog`, app bars) without inventing a custom kit.
- One theme file keeps OC Academic branding consistent across Login, Dashboard, and MenuBar.
- Cursor agents get a hard “Vuetify only / no Tailwind” rule, reducing stack thrash.
- Matches Vue 3 + Vite choice (ADR-0004) and existing starter-kit / Todo shells.

### Negative / tradeoffs

- Bundle size and Material look are heavier than a minimal custom CSS approach.
- Students must learn Vuetify APIs (props, density, slots) in addition to Vue.
- Strict “no Tailwind” means utility-first habits from other courses do not transfer; occasional scoped CSS is fine for layout tweaks, not a second design system.
- Vuetify major upgrades (3 → 4 already taken) can require coordinated rule and view updates.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Tailwind CSS (+ Headless UI)** | Flexible, but no single component contract for Screen Requirements; conflicts with Speckit’s “no Tailwind” academic edition rule and invites one-off styling. |
| **PrimeVue / Quasar** | Capable Vue libraries, but not the OC Speckit / course standard; would fork docs and agent rules. |
| **Naive UI / Element Plus** | Strong Vue 3 kits; same problem — second ecosystem without course alignment. |
| **Custom CSS / BEM only** | Too slow for feature-by-feature SDD; agents and students reinvent dialogs/forms inconsistently. |
| **Bootstrap Vue** | Aging fit for Vue 3 + Vite teaching path; weaker Material/academic token story for this kit. |

## Related artifacts

- ADRs: [ADR-0004 — Vue 3 as the frontend framework](./0004-vue-frontend-framework.md), [ADR-0001 — Client–server multi-user architecture](./0001-client-server-multi-user-architecture.md)
- Cursor rules: [ui-style-system.mdc](../../.cursor/rules/ui-style-system.mdc), [frontend-services.mdc](../../.cursor/rules/frontend-services.mdc), [constitution.mdc](../../.cursor/rules/constitution.mdc) (Principle 5)
- Implementation: `frontend/src/plugins/vuetify.js`, Feature 1–5 Screen Requirements
- Starter kit: [docs/STARTER-KIT.md](../STARTER-KIT.md) (Vuetify-enabled Vue shell)
