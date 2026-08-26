# Non-Functional Requirements (quality attributes)

Living snapshot of **system characteristics** (“ilities”) for this product — performance, reliability, availability, security posture, accessibility, and related bars.

| Artifact | Question |
|----------|----------|
| [Feature specs](../../features/) | What must the product *do*? |
| **This folder** (`docs/nfr/`) | What quality bars apply *across* the product? |
| [ADRs](../adr/README.md) | *Why* did we choose a particular approach for a quality? |
| [Cursor rules](../../.cursor/rules/) | *How* must code meet ongoing constraints? |
| [Reference](../../features/reference/) | What API/schema exists on `dev` now? |

NFRs here do **not** authorize new product behavior by themselves. Feature specs still authorize *what* to build. Use this doc to record targets, deferrals, and links to ADRs/rules.

**Agent literacy:** [`.cursor/rules/quality-attributes.mdc`](../../.cursor/rules/quality-attributes.mdc) (`alwaysApply`) — honor **Accepted**; treat **Deferred** as guidance only; do not invent for **Out of scope**.

---

## Files

| File | Contents |
|------|----------|
| [quality-attributes.md](./quality-attributes.md) | Attribute table + **Status** / **Links** documentation |
| [writing-quality-attributes.md](./writing-quality-attributes.md) | Student guide — when/how to write NFR rows ([PDF](./writing-quality-attributes.pdf)) |

**Student guide:** [writing-quality-attributes.md](./writing-quality-attributes.md) ([PDF](./writing-quality-attributes.pdf))

---

## When to update

| When | Action |
|------|--------|
| New app-wide quality bar (or explicit “out of scope”) | Update [quality-attributes.md](./quality-attributes.md) |
| Choose *how* to meet a bar (caching, HA, auth model, …) | Write or update an [ADR](../adr/README.md); link from the attribute row |
| Ongoing coding constraint for agents | Add/update a `.cursor/rules/*.mdc` entry; link from the row |
| Feature-local quality only | Prefer **Requirements (FR-00N)** / **Success Criteria (SC-00N)** + Gherkin in that feature; optionally link here |

---

## Related

- [ADR index](../adr/README.md)
- [SDD framework](../../features/framework.md) — feature spec template (**FR-00N**, **SC-00N**, Gherkin)
- [Quality attributes rule](../../.cursor/rules/quality-attributes.mdc)
- [Security rule](../../.cursor/rules/security.mdc)
