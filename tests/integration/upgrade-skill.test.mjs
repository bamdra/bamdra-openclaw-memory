import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

test("upgrade operator ships documentation only and no executable helper script", () => {
  const skillDir = resolve("plugins/bamdra-memory/skills/bamdra-memory-upgrade-operator");
  const skillPath = join(skillDir, "SKILL.md");

  assert.equal(existsSync(skillPath), true);
  assert.equal(existsSync(join(skillDir, "scripts")), false);

  const content = readFileSync(skillPath, "utf8");
  assert.doesNotMatch(content, /upgrade-bamdra-memory\.cjs/);
  assert.match(content, /manual/i);
  assert.match(content, /backup/i);
});
