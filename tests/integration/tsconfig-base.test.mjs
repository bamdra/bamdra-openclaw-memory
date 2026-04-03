import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

test("memory-core tsconfig resolves locally and keeps project references composite", () => {
  const output = execFileSync(
    process.execPath,
    [
      "./scripts/run-local-bin.mjs",
      "typescript",
      "--showConfig",
      "-p",
      "packages/memory-core/tsconfig.json",
    ],
    {
      cwd: resolve("."),
      encoding: "utf8",
      stdio: "pipe",
    },
  );

  const config = JSON.parse(output);
  assert.equal(config.compilerOptions.composite, true);
});
