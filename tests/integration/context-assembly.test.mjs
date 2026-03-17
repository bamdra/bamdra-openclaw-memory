import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

test("context assembly includes open loops and extracted facts", async () => {
  const { contextEngine, dbPath, close } = await createMemoryFixture();

  await contextEngine.routeAndTrack(
    "session-a",
    "当前 OpenClaw runtime 用的是 Node 25.6.1",
  );
  await contextEngine.routeAndTrack(
    "session-a",
    "这个 topic 里必须使用 node:sqlite，不要用 better-sqlite3",
  );
  await contextEngine.routeAndTrack(
    "session-a",
    "继续处理 openclaw memory sqlite 的上下文装配",
  );

  const assembled = await contextEngine.assembleContext("session-a");
  assert.match(assembled.text, /\[facts\]/);
  assert.match(assembled.text, /runtime\.node: Node 25\.6\.1/);
  assert.match(assembled.text, /\[open_loops\]/);
  assert.match(assembled.text, /继续处理 openclaw memory sqlite 的上下文装配/);

  const db = new DatabaseSync(dbPath);
  const factRows = db
    .prepare("select category, key, recall_policy from bamdra_memory_facts order by updated_at")
    .all();
  db.close();

  assert.equal(factRows.length >= 2, true);
  await close();
});
