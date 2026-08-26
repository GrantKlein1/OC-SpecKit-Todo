#!/usr/bin/env node
/**
 * Bundle an SDD starter-kit zip for starting a NEW application (not the todo product).
 * Cross-platform (macOS, Windows, Linux) — Node only; no zsh/rsync required.
 *
 * Docs: docs/STARTER-KIT.md
 *
 * Usage:
 *   npm run starter:zip
 *   node scripts/bundle-starter-kit.mjs
 *   node scripts/bundle-starter-kit.mjs --name myapp-speckit-template
 *   node scripts/bundle-starter-kit.mjs --out ~/Desktop
 *
 * Output: <out>/speckit-starter-kit.zip (default)
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const OVERLAY_DIR = join(ROOT_DIR, "scripts", "starter-kit", "overlay");

function printHelp() {
  console.log(`Bundle Speckit starter-kit zip (macOS / Windows / Linux)

Usage:
  node scripts/bundle-starter-kit.mjs [options]
  npm run starter:zip

Options:
  --out <dir>     Output directory (default: <repo>/dist)
  --name <name>   Zip / folder basename (default: speckit-starter-kit)
  -h, --help      Show this help
`);
}

function parseArgs(argv) {
  const options = {
    outDir: join(ROOT_DIR, "dist"),
    zipName: "speckit-starter-kit",
    help: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--out") {
      options.outDir = resolve(argv[++i] ?? options.outDir);
    } else if (arg.startsWith("--out=")) {
      options.outDir = resolve(arg.slice("--out=".length));
    } else if (arg === "--name") {
      options.zipName = argv[++i] ?? options.zipName;
    } else if (arg.startsWith("--name=")) {
      options.zipName = arg.slice("--name=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

const COPY_EXCLUDES = new Set([
  "node_modules",
  "dist",
  "deploy",
  "logs",
  ".env",
  ".env.test",
  ".env.agility",
  ".DS_Store",
]);

function shouldSkip(name) {
  return COPY_EXCLUDES.has(name);
}

function copyPath(rootDir, targetRoot, src, dest) {
  const from = join(rootDir, src);
  const to = join(targetRoot, dest);

  if (!existsSync(from)) {
    console.log(`  skip (missing): ${src}`);
    return;
  }

  mkdirSync(dirname(to), { recursive: true });

  if (statSync(from).isDirectory()) {
    mkdirSync(to, { recursive: true });
    cpSync(from, to, {
      recursive: true,
      filter: (source) => {
        const base = source.split(/[/\\]/).pop();
        return !shouldSkip(base);
      },
    });
  } else {
    cpSync(from, to);
  }

  console.log(`  + ${src}`);
}

function ensureGitkeep(dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, ".gitkeep"), "");
}

function removeIfExists(path) {
  if (existsSync(path)) {
    rmSync(path, { force: true, recursive: true });
  }
}

function removeMatching(dir, predicate) {
  if (!existsSync(dir)) {
    return;
  }

  for (const name of readdirSync(dir)) {
    if (predicate(name)) {
      removeIfExists(join(dir, name));
    }
  }
}

function createZip(stageDir, stageName, zipPath) {
  removeIfExists(zipPath);

  if (process.platform === "win32") {
    // PowerShell Compress-Archive (built into Windows)
    const ps = `
      $ErrorActionPreference = 'Stop'
      Set-Location -LiteralPath '${stageDir.replace(/'/g, "''")}'
      Compress-Archive -Path '${stageName.replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force
    `;
    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", ps],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw new Error("Compress-Archive failed. Is PowerShell available?");
    }
    return;
  }

  const result = spawnSync(
    "zip",
    ["-rq", zipPath, stageName, "-x", "*/node_modules/*", "-x", "*/.DS_Store", "-x", "*/.env", "-x", "*/.env.test", "-x", "*/.env.agility"],
    { cwd: stageDir, stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error("zip failed. Install zip (macOS/Linux) or use Windows PowerShell path.");
  }
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  const stageName = options.zipName;
  const stageDir = mkdtempSync(join(tmpdir(), "speckit-starter-"));
  const target = join(stageDir, stageName);

  mkdirSync(target, { recursive: true });
  mkdirSync(options.outDir, { recursive: true });

  const cleanup = () => {
    try {
      rmSync(stageDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  try {
    console.log(`Staging starter kit → ${target}`);

    const copy = (src, dest = src) => copyPath(ROOT_DIR, target, src, dest);

    copy(".gitignore");
    copy(".gitattributes");
    copy(".cursor/rules");
    copy("features/framework.md");
    copy("docs/STARTER-KIT.md");

    copy("scripts/bundle-frontend.mjs");
    copy("scripts/bundle-backend.mjs");
    copy("scripts/bundle-all.mjs");
    copy("scripts/export-agility-import.mjs");
    copy("scripts/push-agility-api.mjs");
    copy("scripts/agility/rest-helpers.mjs");
    copy("scripts/agility/upsert.mjs");

    copy(".github/workflows/test.yml");
    copy(".github/workflows/deploy.yml");

    copy("frontend/index.html");
    copy("frontend/vite.config.js");
    copy("frontend/vitest.config.js");
    copy("frontend/package-lock.json");
    copy("frontend/public");
    copy("frontend/src/main.js");
    copy("frontend/src/plugins");
    copy("frontend/src/config/utils.js");
    copy("frontend/src/config/validation.js");
    copy("frontend/tests/setup.js");
    copy("frontend/scripts/copy-htaccess.mjs");

    copy("backend/jest.config.js");
    copy("backend/package-lock.json");
    copy("backend/app/config/auth.config.js");
    copy("backend/app/config/logger.js");
    copy("backend/app/config/sequelizeInstance.js");
    copy("backend/tests/setup.js");
    copy("backend/tests/app.test.js");
    copy("backend/tests/helpers.js");
    copy("backend/scripts/make-deploy.mjs");

    console.log("Applying overlay from scripts/starter-kit/overlay/");
    cpSync(OVERLAY_DIR, target, { recursive: true });

    // Reference stubs + student writing guides ship via overlay.
    const requiredOverlayDocs = [
      "features/reference/README.md",
      "features/reference/api.md",
      "features/reference/data-model.md",
      "features/reference/behavior.md",
      "features/reference/writing-living-reference.md",
      "features/writing-feature-requirements.md",
      "features/writing-feature-design.md",
      "docs/adr/writing-adrs.md",
      "docs/nfr/writing-quality-attributes.md",
    ];
    for (const relative of requiredOverlayDocs) {
      const path = join(target, relative);
      if (!existsSync(path)) {
        throw new Error(
          `Missing starter kit doc after overlay: ${relative} (add under scripts/starter-kit/overlay/)`,
        );
      }
      console.log(`  ✓ ${relative}`);
    }

    ensureGitkeep(join(target, "frontend", "src", "components"));
    ensureGitkeep(join(target, "frontend", "src", "utils"));
    ensureGitkeep(join(target, "backend", "app", "controllers"));
    ensureGitkeep(join(target, "docs", "ui"));
    mkdirSync(join(target, "backend", "app", "scripts"), { recursive: true });
    mkdirSync(join(target, "docs", "agility-import"), { recursive: true });

    removeMatching(join(target, "features"), (name) => /^feature-.*\.md$/i.test(name));
    removeMatching(join(target, "docs", "adr"), (name) => /^\d{4}-.*\.md$/i.test(name));
    removeIfExists(join(target, "docs", "oc-cs-speckit-specs.md"));
    removeIfExists(join(target, "docs", "oc-cs-speckit-specs.pdf"));
    removeIfExists(join(target, "docs", "todo-app-specs.md"));
    removeIfExists(join(target, "docs", "todo-app-specs.pdf"));
    removeIfExists(join(target, "docs", "app-specs.md"));
    removeIfExists(join(target, "docs", "app-specs.pdf"));
    removeMatching(join(target, "docs", "agility-import"), (name) => name.endsWith(".csv"));
    removeIfExists(join(target, "frontend", "src", "views", "Login.vue"));
    removeIfExists(join(target, "frontend", "src", "views", "Register.vue"));
    removeIfExists(join(target, "frontend", "src", "views", "Dashboard.vue"));
    removeIfExists(join(target, "frontend", "src", "components", "MenuBar.vue"));

    const zipPath = join(options.outDir, `${stageName}.zip`);
    createZip(stageDir, stageName, zipPath);

    const size = formatSize(statSync(zipPath).size);
    console.log("");
    console.log(`Created: ${zipPath}`);
    console.log(`Size:    ${size}`);
    console.log("");
    console.log("Next: unzip, rename product placeholders, write features/feature-1-….md");
    console.log("Docs: docs/STARTER-KIT.md (also inside the zip)");
  } finally {
    cleanup();
  }
}

try {
  main();
} catch (error) {
  console.error(error.message ?? error);
  process.exit(1);
}
