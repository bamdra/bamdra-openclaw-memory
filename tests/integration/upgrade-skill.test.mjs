import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

test("upgrade skill script backs up config, moves old artifacts, and invokes openclaw install", () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-upgrade-skill-"));
  const homeDir = join(dir, "home");
  const openclawDir = join(homeDir, ".openclaw");
  const extensionsDir = join(openclawDir, "extensions");
  const skillsDir = join(openclawDir, "skills");
  const binDir = join(dir, "bin");
  const logPath = join(dir, "openclaw.log");
  const configPath = join(openclawDir, "openclaw.json");
  const scriptPath = resolve("plugins/bamdra-memory/skills/bamdra-memory-upgrade-operator/scripts/upgrade-bamdra-memory.cjs");

  mkdirSync(extensionsDir, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });

  for (const pluginId of ["bamdra-openclaw-memory", "bamdra-user-bind", "bamdra-memory-vector"]) {
    mkdirSync(join(extensionsDir, pluginId), { recursive: true });
    writeFileSync(join(extensionsDir, pluginId, "index.js"), "// old\n", "utf8");
  }
  for (const skillId of ["bamdra-memory-operator", "bamdra-user-bind-profile", "bamdra-user-bind-admin", "bamdra-memory-vector-operator"]) {
    mkdirSync(join(skillsDir, skillId), { recursive: true });
    writeFileSync(join(skillsDir, skillId, "SKILL.md"), "old\n", "utf8");
  }

  writeFileSync(
    configPath,
    `${JSON.stringify({
      plugins: {
        allow: ["bamdra-openclaw-memory", "bamdra-user-bind", "bamdra-memory-vector"],
        entries: {
          "bamdra-openclaw-memory": { enabled: true },
          "bamdra-user-bind": { enabled: true },
          "bamdra-memory-vector": { enabled: true },
        },
        slots: {
          memory: "bamdra-openclaw-memory",
          contextEngine: "bamdra-openclaw-memory",
        },
      },
      agents: { list: [{ id: "main", skills: ["bamdra-memory-operator"] }] },
      skills: { load: { extraDirs: [] } },
      tools: { allow: ["bamdra_memory_search"] },
    }, null, 2)}\n`,
    "utf8",
  );

  const fakeOpenclawPath = join(binDir, "openclaw");
  writeFileSync(
    fakeOpenclawPath,
    `#!/bin/sh
echo "$@" >> "${logPath}"
exit 0
`,
    "utf8",
  );
  chmodSync(fakeOpenclawPath, 0o755);

  execFileSync(process.execPath, [scriptPath], {
    cwd: resolve("plugins/bamdra-memory/skills/bamdra-memory-upgrade-operator"),
    env: {
      ...process.env,
      HOME: homeDir,
      PATH: `${binDir}:${process.env.PATH}`,
    },
    stdio: "pipe",
  });

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.deepEqual(config.plugins.allow, []);
  assert.deepEqual(config.plugins.entries, {});
  assert.deepEqual(config.plugins.slots, {});
  assert.deepEqual(config.tools.allow, []);

  const backupDir = join(openclawDir, "backups", readdirSync(join(openclawDir, "backups"))[0]);
  assert.equal(existsSync(join(backupDir, "openclaw.json.before")), true);
  assert.equal(existsSync(join(backupDir, "extensions", "bamdra-openclaw-memory")), true);
  assert.equal(existsSync(join(backupDir, "skills", "bamdra-memory-operator")), true);
  assert.equal(existsSync(join(extensionsDir, "bamdra-openclaw-memory")), false);

  const logged = readFileSync(logPath, "utf8");
  assert.match(logged, /plugins install @bamdra\/bamdra-openclaw-memory/);
});
