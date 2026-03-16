import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "..");
const defaultOutDir = resolve(
  repoRoot,
  "artifacts",
  `openclaw-topic-memory-release-${new Date().toISOString().replaceAll(":", "-")}`,
);
const outDir = resolve(process.argv[2] ?? defaultOutDir);

const plugins = [
  "@openclaw-enhanced/bamdra-memory-context-engine",
  "@openclaw-enhanced/bamdra-memory-tools",
];

// Step 1: Build all packages
console.log("Building packages...");
run(["pnpm", "build"]);

// Step 2: Create output directory
if (existsSync(outDir)) {
  console.error(`Output directory already exists: ${outDir}`);
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

// Step 3: Copy all workspace packages to output directory (source + dist)
const workspaces = ["packages", "plugins"];
for (const ws of workspaces) {
  const wsSrcDir = resolve(repoRoot, "bamdra-memory", ws);
  const wsDestDir = resolve(outDir, "bamdra-memory", ws);

  if (existsSync(wsSrcDir)) {
    console.log(`\nCopying ${ws}/ directory...`);
    cpSync(wsSrcDir, wsDestDir, { recursive: true });
  }
}

// Step 4: For each plugin, copy openclaw.plugin.json to dist/ directory
for (const pkg of plugins) {
  const name = pkg.split("/").at(-1);
  const pluginDir = resolve(outDir, "bamdra-memory", "plugins", name);
  const distDir = resolve(pluginDir, "dist");
  const pluginManifest = resolve(pluginDir, "openclaw.plugin.json");

  // Copy openclaw.plugin.json to dist/ for OpenClaw to find it
  if (existsSync(distDir) && existsSync(pluginManifest)) {
    cpSync(pluginManifest, resolve(distDir, "openclaw.plugin.json"));
    console.log(`  Copied openclaw.plugin.json to ${name}/dist/`);
  }
}

// Step 5: Copy root workspace configuration
cpSync(resolve(repoRoot, "pnpm-workspace.yaml"), resolve(outDir, "pnpm-workspace.yaml"));
cpSync(resolve(repoRoot, "package.json"), resolve(outDir, "package.json"));

// Step 6: Install dependencies in output directory
console.log("\nInstalling dependencies in release directory...");
const pnpmInstallCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
run([pnpmInstallCmd, "install", "--no-frozen-lockfile"], outDir);

// Step 7: Copy additional files
cpSync(resolve(repoRoot, "bamdra-memory", "examples", "configs"), resolve(outDir, "examples", "configs"), {
  recursive: true,
});

// Copy skills/ directory
const skillsSrcDir = resolve(repoRoot, "bamdra-memory", "skills");
if (existsSync(skillsSrcDir)) {
  cpSync(skillsSrcDir, resolve(outDir, "skills"), { recursive: true });
  console.log("Copied skills/ directory");
}

// Copy installation documentation
if (existsSync(resolve(repoRoot, "bamdra-memory", "docs", "en", "installation.md"))) {
  writeFileSync(
    resolve(outDir, "INSTALL.md"),
    readFileSync(resolve(repoRoot, "bamdra-memory", "docs", "en", "installation.md")),
  );
}

// Step 8: Keep src/ directories for debugging and development purposes
// Note: If you want to reduce size, you can enable this cleanup
// console.log("\nCleaning up src/ directories from plugins...");
// for (const pkg of plugins) {
//   const name = pkg.split("/").at(-1);
//   const srcDir = resolve(outDir, "bamdra-memory", "plugins", name, "src");
//   if (existsSync(srcDir)) {
//     rmSync(srcDir, { recursive: true });
//     console.log(`  Removed ${name}/src/`);
//   }
// }

console.log(`\nRelease package created at: ${outDir}`);
console.log("\nPackage structure:");
console.log("  bamdra-memory/");
console.log("    ├── packages/        # All workspace packages (with dist/)");
console.log("    ├── plugins/         # Plugin packages (with dist/ only, no src/)");
console.log("    └── skills/");
console.log("  node_modules/          # All dependencies (hoisted)");
console.log("  pnpm-workspace.yaml");
console.log("  examples/");
console.log("  INSTALL.md");

console.log("\n" + outDir);

function run(args, cwd = repoRoot) {
  const result = spawnSync("corepack", args, {
    cwd,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
