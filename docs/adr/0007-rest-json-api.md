# ADR-0007: REST and flat JSON as the API style

**Status:** Accepted  
**Date:** 2026-08-26  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

[ADR-0001](./0001-client-server-multi-user-architecture.md) and [ADR-0006](./0006-node-express-api.md) establish a browser SPA talking to a **Node + Express** backend. Feature specs still need a durable choice for **how** clients and servers exchange data: resource shape, HTTP verbs, and payload format.

Constraints:

1. **Spec-friendly contracts** — API Requirements and Gherkin must describe endpoints, status codes, and bodies without a separate IDL toolchain.
2. **Flat JSON** — response and request bodies are plain objects/arrays (no `{ success, data }` envelope); errors use `{ "message": "..." }` ([api-conventions.mdc](../../.cursor/rules/api-conventions.mdc)).
3. **Axios + Vue services** — frontend `*Services.js` modules map 1:1 to REST routes.
4. **Testability** — Jest + supertest assert status codes and JSON fields against the same contract as the living [api.md](../../features/reference/api.md).
5. **Teachable SDD** — students learn standard HTTP (GET/POST/PUT/DELETE), not RPC or GraphQL query language, for Features 1–5.

## Decision

Adopt **resource-oriented REST** over HTTP with **JSON** request/response bodies as the Speckit API style:

| Concern | Choice |
|---------|--------|
| **Style** | REST (resources + HTTP methods) |
| **Media type** | `application/json` (`express.json()`) |
| **Success body** | Flat JSON resource or array — **no** `{ success, data }` wrapper |
| **Error body** | `{ "message": "..." }` with appropriate 4xx/5xx |
| **Auth header** | `Authorization: Bearer <token>` on authenticated routes |
| **Todo mount** | `/todo/` (e.g. `POST /todo/login`, `GET /todo/lists`) |
| **Docs** | Feature API Requirements + living `features/reference/api.md` |

```text
Client (axios)                    Express
─────────────                    ───────
GET/POST/PUT/DELETE  ──JSON──►  routes → controllers
Bearer token                     flat JSON out / { message } on error
```

**Invariants:**

1. New product endpoints follow REST resource paths and HTTP verbs unless a feature ADR explicitly documents an exception.
2. Controllers return **flat** JSON; do not introduce a global envelope without a new ADR and rule update.
3. Living reference and Agility-facing API docs describe the same REST/JSON contract.

## Consequences

### Positive

- Feature specs can list routes and JSON fields that map directly to Express routes and Vue services.
- Widespread student familiarity with REST + JSON; easy to demo in Postman/curl.
- Supertest and axios share the same mental model; living `api.md` stays short.
- Aligns with existing Cursor rules and Todo Features 1–5.

### Negative / tradeoffs

- Over-fetching / under-fetching vs GraphQL — acceptable for this small domain.
- No built-in schema codegen (OpenAPI optional later; not required for Speckit v1).
- Teams must keep `features/reference/api.md` updated when routes change (DoD).

## Alternatives considered

| Option | Why not |
|--------|---------|
| **GraphQL** | Powerful queries, but heavier stack, different testing story, and weaker fit for short Gherkin API scenarios in this course. |
| **gRPC / protobuf** | Excellent for service-to-service; poor browser/teaching fit without gateways. |
| **JSON:API / OData envelopes** | Standardized wrappers add ceremony; Speckit prefers flat JSON for clarity. |
| **`{ success, data }` custom envelope** | Extra nesting in every client and test; rejected in `api-conventions.mdc`. |
| **HTML form posts / server-rendered only** | Conflicts with Vue SPA + separate API (ADR-0001 / ADR-0004). |
| **tRPC / RPC-over-HTTP** | Couples client/server types tightly; Speckit keeps language-agnostic REST contracts in Markdown. |

## Related artifacts

- ADRs: [ADR-0001 — Client–server](./0001-client-server-multi-user-architecture.md), [ADR-0006 — Node + Express](./0006-node-express-api.md), [ADR-0002 — Security](./0002-security-architecture.md)
- Cursor rules: [api-conventions.mdc](../../.cursor/rules/api-conventions.mdc), [frontend-services.mdc](../../.cursor/rules/frontend-services.mdc), [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc)
- Reference: [features/reference/api.md](../../features/reference/api.md)
- Features: API Requirements in `features/feature-*.md`
