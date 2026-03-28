import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import contextEnginePlugin from "../../packages/bamdra-memory-context-engine/dist/index.js";
import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

const { createContextEngineMemoryV2Plugin } = contextEnginePlugin;

test("before_prompt_build does not re-track the same user text already ingested", async () => {
  const { dbPath, close } = await createMemoryFixture();
  const plugin = createContextEngineMemoryV2Plugin({
    enabled: true,
    store: { provider: "sqlite", path: dbPath },
    cache: { provider: "memory", maxSessions: 16 },
  });
  await plugin.setup();

  let ingestHandler = null;
  let beforePromptHandler = null;
  plugin.registerHooks({
    registerHook(_events, handler) {
      ingestHandler = handler;
    },
    on(name, handler) {
      if (name === "before_prompt_build") {
        beforePromptHandler = handler;
      }
    },
  });

  assert.equal(typeof ingestHandler, "function");
  assert.equal(typeof beforePromptHandler, "function");

  const event = {
    sessionId: "session-dedupe",
    message: { role: "user", text: "请帮我整理这份 Obsidian 收件箱条目" },
  };

  await ingestHandler(event);
  await beforePromptHandler(event, event);

  const db = new DatabaseSync(dbPath);
  try {
    const row = db
      .prepare("SELECT COUNT(*) AS count FROM bamdra_memory_messages WHERE session_id = ?")
      .get("session-dedupe");
    assert.equal(row.count, 1);
  } finally {
    db.close();
    await plugin.close();
    await close();
  }
});
