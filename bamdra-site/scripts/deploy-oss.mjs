import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const siteRoot = resolve(import.meta.dirname, "..");
const distDir = resolve(siteRoot, ".vitepress", "dist");
const bucket = process.env.BAMDRA_OSS_BUCKET;
const targetPrefix = process.env.BAMDRA_OSS_PREFIX ?? "";
const endpoint = process.env.BAMDRA_OSS_ENDPOINT;

if (!existsSync(distDir)) {
  console.error("Missing site build output. Run `pnpm build` in bamdra-site first.");
  process.exit(1);
}

if (!bucket) {
  console.error("Missing BAMDRA_OSS_BUCKET.");
  process.exit(1);
}

const normalizedBucket = bucket.replace(/^oss:\/\//, "").replace(/\/+$/, "");
const normalizedPrefix = targetPrefix.replace(/^\/+|\/+$/g, "");
const target = `oss://${normalizedBucket}${normalizedPrefix ? `/${normalizedPrefix}` : ""}`;

const ossutil = process.env.OSSUTIL_BIN ?? "ossutil";
const args = ["sync", distDir, target, "--delete", "--force", "--exclude", ".DS_Store"];
if (endpoint) {
  args.push("-e", endpoint);
}

const result = spawnSync(ossutil, args, {
  cwd: siteRoot,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Failed to run ${ossutil}. Install ossutil first or set OSSUTIL_BIN.`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
