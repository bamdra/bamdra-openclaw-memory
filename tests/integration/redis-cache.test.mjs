import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

const redisUrl = process.env.OPENCLAW_ENHANCED_TEST_REDIS_URL;

test("redis cache backend preserves active topic state", {
  skip: !redisUrl,
}, async () => {
  const keyPrefix = `openclaw-enhanced:test:${Date.now()}:`;
  const { contextEngine, tools, close } = await createMemoryFixture({
    cache: {
      provider: "redis",
      url: redisUrl,
      keyPrefix,
      ttlSeconds: 300,
      fallbackToMemory: true,
    },
  });

  await contextEngine.routeAndTrack("session-a", "先聊 OpenClaw memory sqlite 架构");
  await contextEngine.routeAndTrack("session-a", "现在切到 Redis 作为可选缓存的设计");

  const topics = await tools.tools.memory_list_topics({ sessionId: "session-a" });
  assert.equal(topics.length, 2);
  assert.equal(topics[0].isActive, true);

  const sqliteTopic = topics.find((topic) => topic.title.includes("sqlite"));
  assert.ok(sqliteTopic);

  await tools.tools.memory_switch_topic({
    sessionId: "session-a",
    topicId: sqliteTopic.id,
  });

  const assembled = await contextEngine.assembleContext("session-a");
  assert.equal(assembled.topicId, sqliteTopic.id);
  assert.match(assembled.text, /sqlite/i);
  await close();
});
