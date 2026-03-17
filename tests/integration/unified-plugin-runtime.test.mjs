import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import unifiedPlugin from "../../plugins/bamdra-memory/dist/index.js";

const { register: registerUnifiedPlugin } = unifiedPlugin;

test("unified bamdra-openclaw-memory plugin registers the memory slot and one canonical tool set", async () => {
  const dir = mkdtempSync(join(tmpdir(), "openclaw-enhanced-unified-"));
  const dbPath = join(dir, "memory.sqlite");
  const registeredTools = new Map();
  const registeredContextEngines = new Map();

  registerUnifiedPlugin({
    config: {
      enabled: true,
      store: { provider: "sqlite", path: dbPath },
      cache: { provider: "memory", maxSessions: 16 },
    },
    registerContextEngine(id, factory) {
      registeredContextEngines.set(id, factory);
    },
    registerTool(definition) {
      registeredTools.set(definition.name, definition);
    },
  });

  assert.equal(registeredContextEngines.has("bamdra-openclaw-memory"), true);
  assert.equal(registeredTools.has("bamdra_memory_save_fact"), true);
  assert.equal(registeredTools.has("bamdra_memory_search"), true);

  const factory = registeredContextEngines.get("bamdra-openclaw-memory");
  assert.ok(factory);

  const engine = await factory({
    enabled: true,
    store: { provider: "sqlite", path: dbPath },
    cache: { provider: "memory", maxSessions: 16 },
  });

  const saveFact = registeredTools.get("bamdra_memory_save_fact");
  assert.ok(saveFact);

  await saveFact.execute("invocation-1", {
    sessionId: "session-unified",
    key: "passphrase",
    value: "天空之城",
    category: "background",
    recallPolicy: "always",
    tags: ["secret", "verification"],
  });

  const search = await engine.searchMemory({
    sessionId: "session-unified",
    query: "天空之城",
    limit: 5,
  });

  assert.equal(search.facts.some((item) => item.fact.value === "天空之城"), true);
  await engine.close();
});

test("unified plugin bootstraps tools allowlist and agent skills without overwriting an existing global skill copy", async () => {
  const dir = mkdtempSync(join(tmpdir(), "openclaw-enhanced-bootstrap-"));
  const homeDir = join(dir, "home");
  const openclawDir = join(homeDir, ".openclaw");
  const globalSkillsDir = join(openclawDir, "skills");
  const extensionsDir = join(openclawDir, "extensions");
  const memoryDir = join(openclawDir, "memory");
  const existingSkillDir = join(globalSkillsDir, "bamdra-memory-operator");
  const userBindProfileSkillDir = join(globalSkillsDir, "bamdra-user-bind-profile");
  const userBindAdminSkillDir = join(globalSkillsDir, "bamdra-user-bind-admin");
  const vectorSkillDir = join(globalSkillsDir, "bamdra-memory-vector-operator");
  const configPath = join(openclawDir, "openclaw.json");
  const previousHome = process.env.HOME;
  const previousForceBootstrap = process.env.OPENCLAW_BAMDRA_MEMORY_FORCE_BOOTSTRAP;

  mkdirSync(existingSkillDir, { recursive: true });
  writeFileSync(join(existingSkillDir, "SKILL.md"), "existing-skill\n", "utf8");
  writeFileSync(
    configPath,
    `${JSON.stringify({
      tools: { allow: ["group:runtime"] },
      plugins: {
        enabled: true,
        allow: ["feishu"],
        entries: {},
        slots: {},
      },
      agents: {
        list: [
          { id: "main", skills: [] },
          { id: "test-agent", skills: ["pdf-read"] },
        ],
      },
      skills: {
        load: {
          extraDirs: [],
        },
      },
    }, null, 2)}\n`,
    "utf8",
  );

  process.env.HOME = homeDir;
  process.env.OPENCLAW_BAMDRA_MEMORY_FORCE_BOOTSTRAP = "1";

  try {
    registerUnifiedPlugin({
      config: {
        enabled: true,
        store: { provider: "sqlite", path: join(dir, "memory.sqlite") },
        cache: { provider: "memory", maxSessions: 16 },
      },
      registerContextEngine() {},
      registerTool() {},
    });

    await new Promise((resolve) => setTimeout(resolve, 25));

    const config = JSON.parse(readFileSync(configPath, "utf8"));
    assert.deepEqual(
      config.tools.allow.filter((item) => item.includes("memory")),
      [
        "bamdra_memory_list_topics",
        "bamdra_memory_switch_topic",
        "bamdra_memory_save_fact",
        "bamdra_memory_compact_topic",
        "bamdra_memory_search",
        "bamdra_memory_vector_search",
      ],
    );
    assert.equal(config.tools.allow.includes("bamdra_user_bind_get_my_profile"), true);
    assert.equal(config.tools.allow.includes("bamdra_user_bind_admin_query"), true);
    assert.equal(config.plugins.slots.memory, "bamdra-openclaw-memory");
    assert.equal(config.plugins.slots.contextEngine, "bamdra-openclaw-memory");
    assert.equal(config.plugins.entries["bamdra-openclaw-memory"].enabled, true);
    assert.equal(
      config.plugins.entries["bamdra-openclaw-memory"].config.store.path,
      "~/.openclaw/memory/main.sqlite",
    );
    assert.deepEqual(
      config.agents.list[0].skills,
      ["bamdra-memory-operator", "bamdra-user-bind-profile", "bamdra-memory-vector-operator", "bamdra-user-bind-admin"],
    );
    assert.deepEqual(
      config.agents.list[1].skills,
      ["pdf-read", "bamdra-memory-operator", "bamdra-user-bind-profile", "bamdra-memory-vector-operator"],
    );
    assert.equal(
      config.skills.load.extraDirs.includes(join(homeDir, ".openclaw", "skills")),
      true,
    );
    assert.equal(existsSync(memoryDir), true);
    assert.equal(existsSync(join(extensionsDir, "bamdra-user-bind", "index.js")), true);
    assert.equal(existsSync(join(extensionsDir, "bamdra-memory-vector", "index.js")), true);
    assert.equal(config.plugins.entries["bamdra-memory-vector"].enabled, true);
    assert.equal(config.plugins.entries["bamdra-memory-vector"].config.enabled, true);
    assert.equal(
      config.plugins.entries["bamdra-memory-vector"].config.privateMarkdownRoot,
      "~/.openclaw/memory/vector/markdown/private",
    );
    assert.equal(
      config.plugins.entries["bamdra-memory-vector"].config.sharedMarkdownRoot,
      "~/.openclaw/memory/vector/markdown/shared",
    );
    assert.equal(existsSync(join(existingSkillDir, "SKILL.md")), true);
    assert.equal(readFileSync(join(existingSkillDir, "SKILL.md"), "utf8"), "existing-skill\n");
    assert.equal(existsSync(join(userBindProfileSkillDir, "SKILL.md")), true);
    assert.equal(existsSync(join(userBindAdminSkillDir, "SKILL.md")), true);
    assert.equal(existsSync(join(vectorSkillDir, "SKILL.md")), true);
  } finally {
    if (previousForceBootstrap === undefined) {
      delete process.env.OPENCLAW_BAMDRA_MEMORY_FORCE_BOOTSTRAP;
    } else {
      process.env.OPENCLAW_BAMDRA_MEMORY_FORCE_BOOTSTRAP = previousForceBootstrap;
    }
    if (previousHome === undefined) {
      delete process.env.HOME;
    } else {
      process.env.HOME = previousHome;
    }
  }
});
