import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

test("memory_search returns matching topics and facts", async () => {
  const { contextEngine, tools, close } = await createMemoryFixture();

  await contextEngine.routeAndTrack("session-a", "先聊 OpenClaw memory sqlite 架构");
  await contextEngine.routeAndTrack(
    "session-a",
    "继续处理 sqlite context assembly 和 summary refresh",
  );
  await tools.tools.memory_save_fact({
    sessionId: "session-a",
    key: "sqlite.driver",
    value: "node:sqlite",
    category: "environment",
    recallPolicy: "always",
    tags: ["sqlite", "driver"],
  });

  await contextEngine.routeAndTrack("session-a", "现在切到 Redis 作为可选缓存的设计");
  await contextEngine.routeAndTrack("session-a", "继续讨论 Redis fallback 和 keyPrefix");

  const result = await tools.tools.memory_search({
    sessionId: "session-a",
    query: "sqlite",
    limit: 5,
  });

  assert.equal(result.sessionId, "session-a");
  assert.equal(result.topics.length >= 1, true);
  assert.equal(result.facts.length >= 1, true);
  assert.match(result.topics[0].topic.title, /sqlite/i);
  assert.equal(result.facts.some((entry) => entry.fact.key === "sqlite.driver"), true);
  assert.equal(result.facts[0].matchReasons.length >= 1, true);
  await close();
});
