import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import contextEnginePlugin from "../../packages/bamdra-memory-context-engine/dist/index.js";
import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

const { createContextEngineMemoryV2Plugin } = contextEnginePlugin;

test("message ingest dedupes metadata-wrapped channel payloads for the same inbound message", async () => {
  const { dbPath, close } = await createMemoryFixture();
  const plugin = createContextEngineMemoryV2Plugin({
    enabled: true,
    store: { provider: "sqlite", path: dbPath },
    cache: { provider: "memory", maxSessions: 16 },
  });
  await plugin.setup();

  let ingestHandler = null;
  plugin.registerHooks({
    registerHook(_events, handler) {
      ingestHandler = handler;
    },
  });

  assert.equal(typeof ingestHandler, "function");

  const sessionId = "agent:main:feishu:direct:ou_message_dedupe";
  await ingestHandler({
    sessionId,
    message: { role: "user", text: "在不在" },
  });
  await ingestHandler({
    sessionId,
    text: `Conversation info (untrusted metadata):
\`\`\`json
{"message_id":"om_test_1","sender_id":"ou_message_dedupe","sender":"张丰"}
\`\`\`

Sender (untrusted metadata):
\`\`\`json
{"label":"张丰 (ou_message_dedupe)","id":"ou_message_dedupe","name":"张丰"}
\`\`\`

[message_id: om_test_1]
张丰: 在不在`,
  });

  const db = new DatabaseSync(dbPath);
  try {
    const rows = db
      .prepare("SELECT text FROM bamdra_memory_messages WHERE session_id = ?")
      .all(sessionId);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].text, "在不在");
  } finally {
    db.close();
    await plugin.close();
    await close();
  }
});
