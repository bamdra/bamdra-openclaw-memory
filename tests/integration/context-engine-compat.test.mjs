import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

test("context engine exposes legacy assemble and ingest compatibility methods", async () => {
  const { contextEngine, close } = await createMemoryFixture();
  const runtimeMessages = [
    { role: "system", content: "You are OpenClaw." },
    { role: "user", content: "记住：默认知识召回应优先检查本地向量知识。" },
  ];

  try {
    const ingestResult = await contextEngine.ingest({
      sessionId: "session-compat",
      text: "记住：默认知识召回应优先检查本地向量知识。",
    });
    assert.ok(ingestResult);

    const assembled = await contextEngine.assemble({
      sessionId: "session-compat",
      messages: runtimeMessages,
    });
    assert.equal(assembled.sessionId, "session-compat");
    assert.equal(Array.isArray(assembled.sections), true);
    assert.equal(Array.isArray(assembled.messages), true);
    assert.equal(assembled.messages, runtimeMessages);

    const assembledFromString = await contextEngine.assemble("session-compat");
    assert.equal(assembledFromString.sessionId, "session-compat");
    assert.equal(Array.isArray(assembledFromString.messages), true);
  } finally {
    await close();
  }
});

test("legacy ingest returns null when the runtime payload is incomplete", async () => {
  const { contextEngine, close } = await createMemoryFixture();

  try {
    const result = await contextEngine.ingest({ sessionId: "session-compat" });
    assert.equal(result, null);
  } finally {
    await close();
  }
});
