import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

test("related sqlite messages stay in one topic", async () => {
  const { contextEngine, close } = await createMemoryFixture();

  const a = await contextEngine.routeAndTrack(
    "session-a",
    "当前 OpenClaw runtime 用的是 Node 25.6.1",
  );
  const b = await contextEngine.routeAndTrack(
    "session-a",
    "这个 topic 里必须使用 node:sqlite，不要用 better-sqlite3",
  );
  const c = await contextEngine.routeAndTrack(
    "session-a",
    "继续处理 openclaw memory sqlite 的上下文装配",
  );

  assert.equal(a.decision.action, "spawn");
  assert.equal(b.decision.action, "continue");
  assert.equal(c.decision.action, "continue");
  assert.equal(a.topicId, b.topicId);
  assert.equal(b.topicId, c.topicId);
  await close();
});

test("explicit shift signal creates a new topic", async () => {
  const { contextEngine, close } = await createMemoryFixture();

  const a = await contextEngine.routeAndTrack(
    "session-a",
    "先聊 OpenClaw memory sqlite 架构",
  );
  const b = await contextEngine.routeAndTrack(
    "session-a",
    "现在切到 Redis 作为可选缓存的设计",
  );

  assert.equal(a.decision.action, "spawn");
  assert.equal(b.decision.action, "spawn");
  assert.notEqual(a.topicId, b.topicId);
  await close();
});
