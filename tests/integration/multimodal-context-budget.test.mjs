import test from "node:test";
import assert from "node:assert/strict";

import contextEnginePlugin from "../../packages/bamdra-memory-context-engine/dist/index.js";

const { createContextEngineMemoryV2Plugin } = contextEnginePlugin;

test("before_prompt_build keeps prependSystemContext compact for multimodal input", async () => {
  const plugin = createContextEngineMemoryV2Plugin({
    enabled: true,
    store: { provider: "sqlite", path: ":memory:" },
    cache: { provider: "memory", maxSessions: 16 },
    contextAssembly: {
      recentTurns: 6,
      alwaysFactLimit: 12,
      topicFactLimit: 16,
      maxChars: 4000,
      maxCharsWhenMultimodal: 320,
      recentMessageMaxChars: 1200,
      maxFactValueChars: 280,
      recallMaxChars: 200,
    },
  });
  await plugin.setup();

  for (let index = 0; index < 8; index += 1) {
    await plugin.routeAndTrack(
      "session-mm",
      `这是第 ${index} 条超长上下文消息 ${"内容".repeat(80)}`,
    );
  }

  let handler = null;
  plugin.registerHooks({
    registerContextEngine() {},
    on(name, nextHandler) {
      if (name === "before_prompt_build") {
        handler = nextHandler;
      }
    },
  });

  const result = await handler(
    {
      input: {
        content: [
          { type: "input_text", text: "请结合这张图片说明文档里的部署问题" },
          { type: "input_image", image_url: "https://example.com/demo.png" },
        ],
      },
    },
    {
      sessionId: "session-mm",
      input: {
        content: [
          { type: "input_text", text: "请结合这张图片说明文档里的部署问题" },
          { type: "input_image", image_url: "https://example.com/demo.png" },
        ],
      },
    },
  );

  assert.equal(typeof result.prependSystemContext, "string");
  assert.equal(result.prependSystemContext.length <= 320, true);
  assert.match(result.prependSystemContext, /\[recent_messages\]|\[facts\]|\[topic\]/);

  await plugin.close();
});
