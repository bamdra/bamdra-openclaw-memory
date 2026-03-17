import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function ancestorDirs(startDir, depth = 6) {
  const dirs = [];
  let current = startDir;
  for (let index = 0; index < depth; index += 1) {
    dirs.push(current);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return dirs;
}

function resolveExecutable(packageName, candidates) {
  const binName = packageName === "typescript" ? "tsc" : packageName;
  for (const candidate of candidates) {
    try {
      const pkgJsonPath = require.resolve(`${packageName}/package.json`, {
        paths: [candidate],
      });
      const nodeModulesMarker = `${path.sep}node_modules${path.sep}`;
      const markerIndex = pkgJsonPath.indexOf(nodeModulesMarker);
      if (markerIndex === -1) {
        continue;
      }
      const installRoot = pkgJsonPath.slice(0, markerIndex);
      return path.join(installRoot, "node_modules", ".bin", binName);
    } catch {
      // Try the next location.
    }
  }
  return null;
}

const [packageName, ...args] = process.argv.slice(2);

if (!packageName) {
  console.error("Usage: node ./scripts/run-local-bin.mjs <package-name> [...args]");
  process.exit(1);
}

const searchPaths = Array.from(
  new Set([
    ...ancestorDirs(process.cwd()),
    ...ancestorDirs(scriptDir),
  ]),
);

const executable = resolveExecutable(packageName, searchPaths);

if (!executable) {
  console.error(`Unable to resolve ${packageName}. Run \`pnpm install\` in this repository first.`);
  process.exit(1);
}

const result = spawnSync(executable, args, {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env,
});

process.exit(result.status ?? 1);
