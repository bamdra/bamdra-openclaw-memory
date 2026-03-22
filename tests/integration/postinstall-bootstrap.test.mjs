import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

test("postinstall bootstrap patches openclaw config before first plugin activation", () => {
  const dir = mkdtempSync(join(tmpdir(), "openclaw-enhanced-postinstall-"));
  const homeDir = join(dir, "home");
  const openclawDir = join(homeDir, ".openclaw");
  const extensionsDir = join(openclawDir, "extensions");
  const skillsDir = join(openclawDir, "skills");
  const configPath = join(openclawDir, "openclaw.json");
  const scriptPath = resolve("plugins/bamdra-memory/scripts/postinstall.cjs");

  mkdirSync(openclawDir, { recursive: true });
  writeFileSync(
    configPath,
    `${JSON.stringify({
      tools: { allow: ["memory_search", "group:runtime"] },
      plugins: { enabled: true, entries: {}, slots: {}, allow: [] },
      agents: { list: [{ id: "main", skills: [] }, { id: "writer", skills: [] }] },
      skills: { load: { extraDirs: [] } },
    }, null, 2)}\n`,
    "utf8",
  );

  execFileSync(process.execPath, [scriptPath], {
    cwd: resolve("plugins/bamdra-memory"),
    env: {
      ...process.env,
      HOME: homeDir,
    },
    stdio: "pipe",
  });

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.plugins.slots.memory, "bamdra-openclaw-memory");
  assert.equal(config.plugins.slots.contextEngine, "bamdra-openclaw-memory");
  assert.equal(config.plugins.entries["bamdra-openclaw-memory"].enabled, true);
  assert.equal(config.plugins.entries["bamdra-user-bind"].enabled, true);
  assert.equal(config.plugins.entries["bamdra-memory-vector"].enabled, true);
  assert.equal(config.plugins.entries["memory-core"].enabled, false);
  assert.equal(config.plugins.entries["memory-lancedb"].enabled, false);
  assert.equal(config.tools.allow.includes("memory_search"), false);
  assert.equal(config.tools.allow.includes("bamdra_memory_search"), true);
  assert.equal(config.tools.allow.includes("bamdra_user_bind_get_my_profile"), true);
  assert.equal(config.skills.load.extraDirs.includes(join(homeDir, ".openclaw", "skills")), true);
  assert.deepEqual(
    config.agents.list[0].skills,
    ["bamdra-memory-operator", "bamdra-user-bind-profile", "bamdra-memory-vector-operator", "bamdra-user-bind-admin"],
  );
  assert.deepEqual(
    config.agents.list[1].skills,
    ["bamdra-memory-operator", "bamdra-user-bind-profile", "bamdra-memory-vector-operator"],
  );
  assert.equal(existsSync(join(extensionsDir, "bamdra-user-bind", "index.js")), true);
  assert.equal(existsSync(join(extensionsDir, "bamdra-memory-vector", "index.js")), true);
  assert.equal(existsSync(join(skillsDir, "bamdra-memory-operator", "SKILL.md")), true);
  assert.equal(existsSync(join(skillsDir, "bamdra-memory-upgrade-operator", "SKILL.md")), true);
  assert.equal(existsSync(join(skillsDir, "bamdra-user-bind-profile", "SKILL.md")), true);
  assert.equal(existsSync(join(skillsDir, "bamdra-user-bind-admin", "SKILL.md")), true);
  assert.equal(existsSync(join(skillsDir, "bamdra-memory-vector-operator", "SKILL.md")), true);
});
