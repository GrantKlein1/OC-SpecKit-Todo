# Digital.ai Agility import — OC CS Speckit backlog

Export user stories and Gherkin acceptance criteria from `features/` into CSV files formatted for [Digital.ai Agility Excel import](https://docs.digital.ai/agility/docs/agility/import-data-from-excel).

## Generate the import files

From the repo root (replace project name with your Agility **Scope** / project name):

```bash
node scripts/export-agility-import.mjs --project "OC CS Speckit"
```

This creates:

| File | Agility worksheet | Contents |
|------|-------------------|----------|
| `PortfolioItem.csv` | **Portfolio Item** | 5 epics (one per feature spec) |
| `Story.csv` | **Story** | All user stories (`US-N.n`, 24 stories) |
| `Test.csv` | **Test** | All Gherkin scenarios as acceptance tests |

Stories link to epics via **Super** + **Parent**. Tests link to stories via **Parent** = story **Reference** (e.g. `TS-F3-US3.1`).

Each story **Description** includes the full user story text plus the spec file path in `features/`.

Feature specs are **auto-discovered** from `features/feature-N-*.md`; epic names come from each file’s `# Feature: …` heading. Adding a new feature file is enough — no edits to `backlog-data.mjs`.

**Sprints / timeboxes** are team planning in Agility — assign stories to iterations after import; they are not exported from specs.

---

## Import into Digital.ai Agility

### Prerequisites

- Edit access to **Product Planning** for the target project
- Microsoft Excel (Agility import requires `.xls` workbook)
- [Download Basic or Advanced import template](https://docs.digital.ai/agility/docs/agility/import-data-from-excel) from Agility

### Steps

1. **Create or pick a project** in Agility — note the exact **Scope** name (must match `--project`).

2. **Regenerate CSVs** with your project name:
   ```bash
   node scripts/export-agility-import.mjs --project "Your Exact Project Name"
   ```

3. **Open the Agility import template** (`.xls`).

4. **Copy each CSV into the matching worksheet tab** (worksheet name must match asset type):
   - `PortfolioItem.csv` → **Portfolio Item** tab
   - `Story.csv` → **Story** tab
   - `Test.csv` → **Test** tab

   Paste **values only** so column headers align with the template. Required story columns: **AssetType**, **Name**, **Scope**.

5. **Verify column headers** match Agility system names ([Import Column Reference](https://docs.digital.ai/agility/docs/agility/importing-file-column-titles-by-asset-type)):
   - Story: `AssetType`, `Name`, `Scope`, `Description`, `Reference`, `Super`, `Parent`
   - Test: `AssetType`, `Name`, `Parent`, `Description`, `ExpectedResults`, `Reference`

6. **Save as `.xls`** and run **Import** from Product Planning.

7. **Review backlog** — assign stories to sprints/timeboxes in Agility as your team plans work.

### Team Process / Status errors

If import fails with *"Multiple StoryStatus assets matching provided name"*, leave **Status** blank on import or use status OIDs — see [Import Status When Team Process is in Place](https://docs.digital.ai/agility/docs/agility/import-data-from-excel).

### Re-import warning

Agility import **creates new items only**; it does not update existing ones. Re-importing the same file creates duplicates. See [Update Existing Backlog Items](https://docs.digital.ai/agility/docs/agility/can-i-update-an-existing-backlog-using-import-feature).

---

## Hierarchy in Agility

```text
Portfolio Item (Epic)     Todo Item Management
  └── Story               US-3.1: Add tasks to a list
        └── Test          User adds a todo to the selected list
        └── Test          User adds a todo with an empty title
        └── …
```

| Repo | Agility |
|------|---------|
| Feature spec file | Epic (Portfolio Item) |
| `US-N.n` in spec | Story |
| Gherkin `#### Scenario` | Test (acceptance criteria) |
| `features/feature-N-*.md` | Story Description → Spec link |
| `Reference` column | Stable ID for linking (`TS-F3-US3.1`) |
| Sprint / iteration | Timebox (assigned in Agility, not in specs) |

---

## Custom fields (optional)

Add columns to the CSV / template for your org, e.g.:

- **Spec URL** — path `features/feature-3-todo-list-item-management.md`
- **Branch** — `feature/3-todo-list-item-management`

Column titles must match Agility **system names** (ask admin or query `meta.v1` API).

---

## Re-export after spec changes

When you add or change stories/AC in `features/`:

```bash
node scripts/export-agility-import.mjs --project "OC CS Speckit"
```

Then import only **new** items (or use Agility API for updates).

---

## Push via Agility Bulk API (access token)

Yes — you can create epics, stories, and acceptance tests programmatically using Agility’s **Bulk JSON API** (`POST /api/asset`) with an **Access Token** (Bearer auth). This is Agility’s equivalent of an API key.

### Setup

1. In Agility: **My Settings → Access Tokens** → create a token with Product Planning permissions.
2. Copy `.env.agility.example` → `.env.agility` (gitignored via `.env` pattern) and set:

   | Variable | Example |
   |----------|---------|
   | `AGILITY_BASE_URL` | `https://your-instance.com` (no trailing slash) |
   | `AGILITY_ACCESS_TOKEN` | `1.xxxxx…` |
   | `AGILITY_SCOPE` | Exact project name, e.g. `OC CS Speckit` |

### Dry run (preview payloads)

```bash
npm run agility:push:dry-run
npm run agility:push:dry-run -- --feature 2
npm run agility:push:dry-run -- --feature 3 --upsert
```

### Push backlog

```bash
# Full push — all epics, stories, and tests (features 1–5)
npm run agility:push

# Feature push — stories + tests for one feature only
# (finds epic by name in Agility; creates that epic if missing)
npm run agility:push -- --feature 3

# Feature upsert — update existing stories/tests; create missing items
npm run agility:push -- --feature 3 --upsert

# or with explicit project:
node scripts/push-agility-api.mjs --project "Your Exact Project Name"
node scripts/push-agility-api.mjs --feature 3 --project "Your Exact Project Name"
node scripts/push-agility-api.mjs --feature 3 --upsert --project "Your Exact Project Name"
```

| Mode | Command | Creates epics? | Creates stories + tests? | Updates existing? |
|------|---------|----------------|--------------------------|-------------------|
| **Full** | `npm run agility:push` | All 5 features | All features | No |
| **Feature** | `npm run agility:push -- --feature N` | Only if epic missing for N | Feature N only | No |
| **Upsert** | `npm run agility:push -- --feature N --upsert` | No (epic must exist) | Missing items only | Yes (Description, ExpectedResults) |

The script:

1. **Full push:** creates **5 Epics** (one per feature spec), then for each epic creates **Stories** with nested **Tests** (Gherkin scenarios).
2. **Feature push (`--feature N`):** looks up the epic by name for feature N; creates it if missing; then creates only that feature's stories and tests.
3. **Feature upsert (`--feature N --upsert`):** looks up the epic by name (must already exist); for each story/test matches by **Reference** (`TS-F3-US3.1`) or **Name**; updates **Description** / **ExpectedResults** when found, creates when missing.

Docs: [Access Token Authentication](https://docs.digital.ai/agility/docs/developerlibrary/access-token-authentication), [Asset Creation Examples](https://docs.digital.ai/agility/docs/asset-creation-examples-1), [Asset Updation Examples](https://docs.digital.ai/agility/docs/asset-updation-examples).

**Note:** Re-running a **create** push duplicates assets. Use **`--feature N --upsert`** after spec changes to refresh stories and acceptance tests in place.

---

## Related

- Spec source of truth: `features/`
- Living API/schema snapshot: `features/reference/`
- PDF export: `npm run specs:pdf`
- Student assignment: [ASSIGNMENT-agility-sync.md](../ASSIGNMENT-agility-sync.md)
