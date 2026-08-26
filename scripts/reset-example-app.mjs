#!/usr/bin/env node
/**
 * Strip the Todo example implementation so you can rebuild it from feature specs.
 *
 * Keeps: features/feature-*.md, framework, Cursor rules, ADRs, NFRs, C4 diagrams, tooling.
 * Removes: models/controllers/routes/views/services/feature tests (product code).
 * Resets: empty app shells + empty features/reference/* stubs (from starter-kit overlay).
 *
 * API mount stays `/todo` so Feature 1–5 specs still match.
 *
 * Usage:
 *   npm run reset:example -- --yes
 *   node scripts/reset-example-app.mjs --yes
 *   node scripts/reset-example-app.mjs --dry-run
 *
 * Related: npm run starter:zip (new product without Todo specs) — docs/STARTER-KIT.md
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const OVERLAY_DIR = join(ROOT_DIR, "scripts", "starter-kit", "overlay");

/** Overlay paths applied in-place (app shells + reference stubs only). */
const OVERLAY_APPLY = [
  "backend/app/authorization/authorization.js",
  "backend/app/config/db.config.js",
  "backend/app/models/index.js",
  "backend/app/routes/index.js",
  "backend/server.js",
  "backend/tests/helpers.js",
  "frontend/src/App.vue",
  "frontend/src/router.js",
  "frontend/src/services/services.js",
  "frontend/src/views/Home.vue",
  "frontend/tests/App.test.js",
  "frontend/tests/testUtils.js",
  "features/reference/README.md",
  "features/reference/api.md",
  "features/reference/behavior.md",
  "features/reference/data-model.md",
];

/** Product files removed (not replaced by overlay). */
const REMOVE_PATHS = [
  "backend/app/controllers/auth.controller.js",
  "backend/app/controllers/list.controller.js",
  "backend/app/controllers/todo.controller.js",
  "backend/app/controllers/user.controller.js",
  "backend/app/models/user.model.js",
  "backend/app/models/session.model.js",
  "backend/app/models/list.model.js",
  "backend/app/models/todo.model.js",
  "backend/app/routes/auth.routes.js",
  "backend/app/routes/user.routes.js",
  "backend/app/routes/list.routes.js",
  "backend/app/routes/list-todo.routes.js",
  "backend/app/routes/todo.routes.js",
  "backend/app/utils/dueDate.js",
  "backend/tests/auth.test.js",
  "backend/tests/authenticate.test.js",
  "backend/tests/lists.test.js",
  "backend/tests/todos.test.js",
  "backend/tests/users.test.js",
  "frontend/src/components/MenuBar.vue",
  "frontend/src/views/Login.vue",
  "frontend/src/views/Register.vue",
  "frontend/src/views/Dashboard.vue",
  "frontend/src/services/authServices.js",
  "frontend/src/services/userServices.js",
  "frontend/src/services/listServices.js",
  "frontend/src/services/todoServices.js",
  "frontend/tests/Login.test.js",
  "frontend/tests/Register.test.js",
  "frontend/tests/Dashboard.test.js",
  "frontend/tests/MenuBar.test.js",
  "frontend/tests/router.test.js",
];

function printHelp() {
  console.log(`Reset Todo example app code (keep feature specs)

Usage:
  npm run reset:example -- --yes
  node scripts/reset-example-app.mjs --yes
  node scripts/reset-example-app.mjs --dry-run

Options:
  --yes       Required to apply changes (destructive)
  --dry-run   Print planned deletes/applies; do not write
  -h, --help  Show this help

Keeps feature specs, rules, ADRs, NFRs, diagrams.
Removes product implementation; restores empty shells + reference stubs.
`);
}

function parseArgs(argv) {
  const options = { yes: false, dryRun: false, help: false };
  for (const arg of argv.slice(2)) {
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function removeIfExists(path, dryRun) {
  if (!existsSync(path)) {
    return false;
  }
  if (!dryRun) {
    rmSync(path, { force: true, recursive: true });
  }
  return true;
}

function ensureGitkeep(dir, dryRun) {
  if (dryRun) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, ".gitkeep"), "");
}

/**
 * Overlay shells use /api for new products; Todo feature specs require /todo.
 */
function retargetTodoApiPrefix(dryRun) {
  const patches = [
    {
      relative: "backend/server.js",
      from: 'app.use("/api", routes);',
      to: 'app.use("/todo", routes);',
    },
    {
      relative: "backend/server.js",
      from: "Speckit App API running on port",
      to: "Todo API running on port",
    },
    {
      relative: "frontend/src/services/services.js",
      from: 'baseURL: import.meta.env.DEV ? "http://localhost:3200/api/" : "/api/",',
      to: 'baseURL: import.meta.env.DEV ? "http://localhost:3200/todo/" : "/todo/",',
    },
  ];

  for (const { relative, from, to } of patches) {
    if (dryRun) {
      console.log(`  ~ ${relative}: ${from.slice(0, 40)}… → /todo`);
      continue;
    }
    const path = join(ROOT_DIR, relative);
    if (!existsSync(path)) {
      throw new Error(`Missing file for API retarget: ${relative}`);
    }
    const before = readFileSync(path, "utf8");
    if (!before.includes(from)) {
      if (before.includes(to)) {
        console.log(`  · ${relative} already uses /todo`);
      } else {
        console.warn(`  ! skip retarget (pattern not found): ${relative}`);
      }
      continue;
    }
    writeFileSync(path, before.replace(from, to), "utf8");
    console.log(`  ~ ${relative} → /todo`);
  }
}

function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!existsSync(OVERLAY_DIR)) {
    throw new Error(`Missing overlay: ${OVERLAY_DIR}`);
  }

  if (!options.yes && !options.dryRun) {
    console.error(
      "Refusing to run without --yes (destructive). Try:\n  npm run reset:example -- --yes\n  npm run reset:example -- --dry-run",
    );
    process.exit(1);
  }

  const mode = options.dryRun ? "DRY RUN" : "APPLY";
  console.log(`Reset example app (${mode})`);
  console.log("");

  console.log("Removing product implementation…");
  const removed = new Set();
  for (const relative of REMOVE_PATHS) {
    const path = join(ROOT_DIR, relative);
    if (removeIfExists(path, options.dryRun)) {
      removed.add(relative);
      console.log(`  - ${relative}`);
    }
  }

  // Drop any leftover controllers not listed above
  const controllersDir = join(ROOT_DIR, "backend", "app", "controllers");
  if (existsSync(controllersDir)) {
    for (const name of readdirSync(controllersDir)) {
      if (name === ".gitkeep") continue;
      const relative = `backend/app/controllers/${name}`;
      if (removed.has(relative)) continue;
      const path = join(controllersDir, name);
      if (removeIfExists(path, options.dryRun)) {
        console.log(`  - ${relative}`);
      }
    }
  }

  console.log("");
  console.log("Applying empty shells + reference stubs from overlay…");
  for (const relative of OVERLAY_APPLY) {
    const from = join(OVERLAY_DIR, relative);
    const to = join(ROOT_DIR, relative);
    if (!existsSync(from)) {
      throw new Error(`Missing overlay file: ${relative}`);
    }
    if (!options.dryRun) {
      mkdirSync(dirname(to), { recursive: true });
      cpSync(from, to);
    }
    console.log(`  + ${relative}`);
  }

  console.log("");
  console.log("Retargeting API prefix to /todo (match feature specs)…");
  retargetTodoApiPrefix(options.dryRun);

  if (!options.dryRun) {
    ensureGitkeep(join(ROOT_DIR, "frontend", "src", "components"), false);
    ensureGitkeep(join(ROOT_DIR, "backend", "app", "controllers"), false);
    mkdirSync(join(ROOT_DIR, "backend", "app", "utils"), { recursive: true });
  }

  console.log("");
  if (options.dryRun) {
    console.log("Dry run complete — no files changed.");
  } else {
    console.log("Done. Feature specs kept; product code cleared.");
    console.log("");
    console.log("Next:");
    console.log("  1. Ensure backend/.env and backend/.env.test exist");
    console.log("  2. npm install (root optional) && npm install --prefix backend && npm install --prefix frontend");
    console.log("  3. Implement Feature 1 from features/feature-1-*.md on a feature branch");
    console.log("  4. npm test as you go");
  }
}

try {
  main();
} catch (error) {
  console.error(error.message ?? error);
  process.exit(1);
}
