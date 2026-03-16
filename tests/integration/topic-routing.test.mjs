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

test("explicit new topic phrases always spawn a fresh topic", async () => {
  const { contextEngine, close } = await createMemoryFixture();

  const first = await contextEngine.routeAndTrack(
    "session-a",
    "先聊缅因猫的饮食和毛发护理",
  );
  const second = await contextEngine.routeAndTrack(
    "session-a",
    "这是一个新的 topic，我们聊聊写歌和校园生活",
  );
  const third = await contextEngine.routeAndTrack(
    "session-a",
    "我们开启一个新话题，聊聊城市风光摄影",
  );

  assert.equal(first.decision.action, "spawn");
  assert.equal(second.decision.action, "spawn");
  assert.equal(third.decision.action, "spawn");
  assert.notEqual(first.topicId, second.topicId);
  assert.notEqual(second.topicId, third.topicId);
  await close();
});
