import test from "node:test";
import assert from "node:assert/strict";

import contextEnginePlugin from "../../packages/bamdra-memory-context-engine/dist/index.js";

const { createContextEngineMemoryV2Plugin } = contextEnginePlugin;

test("before_prompt_build tolerates malformed vector recall payloads", async () => {
  const vectorApiKey = "__OPENCLAW_BAMDRA_MEMORY_VECTOR__";
  const previous = globalThis[vectorApiKey];
  globalThis[vectorApiKey] = {
    search() {
      return undefined;
    },
  };

  const plugin = createContextEngineMemoryV2Plugin({
    enabled: true,
    store: { provider: "sqlite", path: ":memory:" },
    cache: { provider: "memory", maxSessions: 16 },
  });
  await plugin.setup();

  try {
    await plugin.routeAndTrack("session-vector-guard", "请查一下本地 docs 里的部署说明");

    let handler = null;
    plugin.registerHooks({
      on(name, nextHandler) {
        if (name === "before_prompt_build") {
          handler = nextHandler;
        }
      },
    });

    const result = await handler(
      { input: { text: "请查一下本地 docs 里的部署说明" } },
      { sessionId: "session-vector-guard", input: { text: "请查一下本地 docs 里的部署说明" } },
    );

    assert.equal(typeof result?.prependSystemContext, "string");
    assert.match(result.prependSystemContext, /\[topic\]|\[recent_messages\]|\[facts\]/);
  } finally {
    await plugin.close();
    if (previous === undefined) {
      delete globalThis[vectorApiKey];
    } else {
      globalThis[vectorApiKey] = previous;
    }
  }
});
