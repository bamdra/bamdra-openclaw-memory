import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const version = process.argv[2] ?? `v${pkg.version}`;
const outDir = resolve(repoRoot, "artifacts", `openclaw-topic-memory-${version}`);
const bundleRoot = resolve(outDir, "openclaw-topic-memory");
const skipBuild = process.env.OPENCLAW_MEMORY_SKIP_BUILD === "1";

if (!skipBuild) {
  run(["pnpm", "build"]);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(bundleRoot, { recursive: true });

const pluginNames = [
  "bamdra-memory-context-engine",
  "bamdra-memory-tools",
];

for (const name of pluginNames) {
  const srcDir = resolve(repoRoot, "plugins", name, "dist");
  const destDir = resolve(bundleRoot, name);
  cpSync(srcDir, destDir, { recursive: true });
}

cpSync(resolve(repoRoot, "examples", "configs"), resolve(bundleRoot, "examples", "configs"), { recursive: true });
cpSync(resolve(repoRoot, "skills"), resolve(bundleRoot, "skills"), { recursive: true });
cpSync(resolve(repoRoot, "LICENSE"), resolve(bundleRoot, "LICENSE"));
cpSync(resolve(repoRoot, "README.md"), resolve(bundleRoot, "README.md"));
cpSync(resolve(repoRoot, "README.zh-CN.md"), resolve(bundleRoot, "README.zh-CN.md"));
cpSync(resolve(repoRoot, "CHANGELOG.md"), resolve(bundleRoot, "CHANGELOG.md"));
cpSync(resolve(repoRoot, "docs", "en", "installation.md"), resolve(bundleRoot, "INSTALL.md"));

writeFileSync(
  resolve(bundleRoot, "RELEASE.txt"),
  [
    `openclaw-topic-memory ${version}`,
    "",
    "Contents:",
    "- bamdra-memory-context-engine/",
    "- bamdra-memory-tools/",
    "- examples/configs/",
    "- skills/",
    "- INSTALL.md",
    "- CHANGELOG.md",
    "",
    "For installation details, read INSTALL.md first.",
    "",
  ].join("\n"),
);

const archives = [
  resolve(outDir, `openclaw-topic-memory-${version}.tar.gz`),
  resolve(outDir, `openclaw-topic-memory-${version}.zip`),
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
