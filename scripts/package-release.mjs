import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const version = process.argv[2] ?? `v${pkg.version}`;
const outDir = resolve(repoRoot, "artifacts", `bamdra-openclaw-memory-${version}`);
const bundleRoot = resolve(outDir, "bamdra-openclaw-memory");
const skipBuild = process.env.OPENCLAW_MEMORY_SKIP_BUILD === "1";
const workspaceRoot = resolve(repoRoot, "..");
const siblingPlugins = [
  {
    repoDir: "bamdra-user-bind",
    releaseDirName: "bamdra-user-bind",
  },
  {
    repoDir: "bamdra-memory-vector",
    releaseDirName: "bamdra-memory-vector",
  },
];

if (!skipBuild) {
  run(["pnpm", "build"], workspaceRoot);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(bundleRoot, { recursive: true });

const plugins = [
  {
    sourceDirName: "bamdra-memory",
    releaseDirName: "bamdra-openclaw-memory",
  },
];

for (const plugin of plugins) {
  const srcDir = resolve(repoRoot, "plugins", plugin.sourceDirName, "dist");
  const destDir = resolve(bundleRoot, plugin.releaseDirName);
  cpSync(srcDir, destDir, { recursive: true });
}

for (const sibling of siblingPlugins) {
  const srcDir = resolve(workspaceRoot, sibling.repoDir, "dist");
  if (!existsSync(srcDir)) {
    continue;
  }
  const destDir = resolve(bundleRoot, sibling.releaseDirName);
  cpSync(srcDir, destDir, { recursive: true });
}

mkdirSync(resolve(bundleRoot, "examples", "configs"), { recursive: true });
for (const file of [
  "bamdra-memory.local.json",
  "openclaw.plugins.bamdra-memory.local.merge.json",
  "openclaw.plugins.bamdra-memory.suite.merge.json",
]) {
  cpSync(
    resolve(repoRoot, "examples", "configs", file),
    resolve(bundleRoot, "examples", "configs", file),
  );
}
cpSync(resolve(repoRoot, "skills"), resolve(bundleRoot, "skills"), { recursive: true });
cpSync(resolve(repoRoot, "LICENSE"), resolve(bundleRoot, "LICENSE"));
cpSync(resolve(repoRoot, "README.md"), resolve(bundleRoot, "README.md"));
cpSync(resolve(repoRoot, "README.zh-CN.md"), resolve(bundleRoot, "README.zh-CN.md"));
cpSync(resolve(repoRoot, "CHANGELOG.md"), resolve(bundleRoot, "CHANGELOG.md"));
cpSync(resolve(repoRoot, "docs", "en", "installation.md"), resolve(bundleRoot, "INSTALL.md"));

writeFileSync(
  resolve(bundleRoot, "RELEASE.txt"),
  [
    `bamdra-openclaw-memory ${version}`,
    "",
    "Contents:",
    "- bamdra-openclaw-memory/",
    "- bamdra-user-bind/",
    "- bamdra-memory-vector/ (optional enhancement)",
    "- examples/configs/",
    "- skills/",
    "- INSTALL.md",
    "- CHANGELOG.md",
    "",
    "Supported install paths:",
    "1. openclaw plugins install @bamdra/bamdra-openclaw-memory",
    "2. manual install from this release bundle",
    "",
    "Required dependency for production use:",
    "- install bamdra-user-bind so memory is scoped by real user identity instead of raw sender ids",
    "",
    "Optional enhancement:",
    "- install bamdra-memory-vector to add lightweight semantic retrieval",
    "",
    "For installation details, read INSTALL.md first.",
    "",
  ].join("\n"),
);

const archives = [
  resolve(outDir, `bamdra-openclaw-memory-${version}.tar.gz`),
  resolve(outDir, `bamdra-openclaw-memory-${version}.zip`),
];

run(["tar", "-czf", archives[0], "-C", outDir, basename(bundleRoot)], repoRoot, false);
run(["zip", "-qr", archives[1], basename(bundleRoot)], outDir, false);

const checksumLines = [];
for (const file of archives) {
  const hash = sha256(file);
  checksumLines.push(`${hash}  ${basename(file)}`);
}
writeFileSync(resolve(outDir, "SHA256SUMS.txt"), `${checksumLines.join("\n")}\n`);

console.log(outDir);

function sha256(filePath) {
  const data = readFileSync(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function run(args, cwd = repoRoot, useCorepack = true) {
  const command = useCorepack ? "corepack" : args[0];
  const finalArgs = useCorepack ? args : args.slice(1);
  const result = spawnSync(command, finalArgs, {
    cwd,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
