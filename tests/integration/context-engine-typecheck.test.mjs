import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

test("context engine package typechecks in isolation", () => {
  assert.doesNotThrow(() => {
    execFileSync(
      process.execPath,
      [
        "./scripts/run-local-bin.mjs",
        "typescript",
        "--noEmit",
        "--pretty",
        "false",
        "-p",
        "packages/bamdra-memory-context-engine/tsconfig.json",
      ],
      {
        cwd: resolve("."),
        stdio: "pipe",
      },
    );
  });
});
