import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

test("A -> B -> A switching restores the first topic as active", async () => {
  const { contextEngine, tools, close } = await createMemoryFixture();

  await contextEngine.routeAndTrack("session-a", "先聊 OpenClaw memory sqlite 架构");
  await contextEngine.routeAndTrack("session-a", "继续讨论 sqlite 约束和 context assembly");
  await contextEngine.routeAndTrack("session-a", "现在切到 Redis 作为可选缓存的设计");
  await contextEngine.routeAndTrack("session-a", "继续讨论 Redis fallback 和 keyPrefix");

  const topicsBefore = await tools.tools.memory_list_topics({ sessionId: "session-a" });
  assert.equal(topicsBefore.length, 2);
  assert.equal(topicsBefore[0].isActive, true);

  const sqliteTopic = topicsBefore.find((topic) => topic.title.includes("sqlite"));
  assert.ok(sqliteTopic);

  await tools.tools.memory_switch_topic({
    sessionId: "session-a",
    topicId: sqliteTopic.id,
  });

  const topicsAfter = await tools.tools.memory_list_topics({ sessionId: "session-a" });
  const sqliteAfter = topicsAfter.find((topic) => topic.id === sqliteTopic.id);
  assert.ok(sqliteAfter);
  assert.equal(sqliteAfter.isActive, true);

  const assembled = await contextEngine.assembleContext("session-a");
  assert.equal(assembled.topicId, sqliteTopic.id);
  assert.match(assembled.text, /sqlite/i);
  assert.doesNotMatch(assembled.text, /Redis fallback and keyPrefix/i);
  await close();
});
