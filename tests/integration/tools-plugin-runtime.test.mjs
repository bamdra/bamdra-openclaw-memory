import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createContextEngineMemoryV2Plugin } from "../../packages/bamdra-memory-context-engine/dist/index.js";
import { register as registerToolsPlugin } from "../../packages/bamdra-memory-tools/dist/index.js";

test("tools plugin registers one canonical tool set and can bootstrap its own sqlite-backed engine", async () => {
  const dir = mkdtempSync(join(tmpdir(), "openclaw-enhanced-tools-"));
  const dbPath = join(dir, "memory.sqlite");
  const registeredTools = new Map();

  registerToolsPlugin({
    config: {
      enabled: true,
      store: { provider: "sqlite", path: dbPath },
      cache: { provider: "memory", maxSessions: 16 },
    },
    registerTool(definition) {
      registeredTools.set(definition.name, definition);
    },
  });

  assert.equal(registeredTools.has("memory_save_fact"), true);

  const saveFact = registeredTools.get("memory_save_fact");
  assert.ok(saveFact);

  await saveFact.execute("invocation-1", {
    sessionId: "session-bootstrap",
    key: "passphrase",
    value: "天空之城",
    category: "background",
    recallPolicy: "always",
    tags: ["secret", "verification"],
  });

  const engine = createContextEngineMemoryV2Plugin({
    enabled: true,
    store: { provider: "sqlite", path: dbPath },
    cache: { provider: "memory", maxSessions: 16 },
  });
  await engine.setup();

  const search = await engine.searchMemory({
    sessionId: "session-bootstrap",
    query: "天空之城",
    limit: 5,
  });

  assert.equal(search.facts.some((item) => item.fact.value === "天空之城"), true);
  await engine.close();
});
