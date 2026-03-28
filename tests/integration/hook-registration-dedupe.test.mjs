import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import contextEnginePlugin from "../../packages/bamdra-memory-context-engine/dist/index.js";

const { register } = contextEnginePlugin;

test("context engine register does not attach duplicate hooks when a configured engine is created later", async () => {
  const dir = mkdtempSync(join(tmpdir(), "openclaw-enhanced-hook-dedupe-"));
  const firstDbPath = join(dir, "memory-a.sqlite");
  const secondDbPath = join(dir, "memory-b.sqlite");
  let registerHookCalls = 0;
  let beforePromptCalls = 0;
  let factory = null;

  const api = {
    pluginConfig: {
      enabled: true,
      store: { provider: "sqlite", path: firstDbPath },
      cache: { provider: "memory", maxSessions: 16 },
    },
    registerHook() {
      registerHookCalls += 1;
    },
    on(name) {
      if (name === "before_prompt_build") {
        beforePromptCalls += 1;
      }
    },
    registerContextEngine(_id, nextFactory) {
      factory = nextFactory;
    },
  };

  register(api);
  assert.equal(registerHookCalls, 1);
  assert.equal(beforePromptCalls, 1);
  assert.equal(typeof factory, "function");

  const configured = await factory({
    enabled: true,
    store: { provider: "sqlite", path: secondDbPath },
    cache: { provider: "memory", maxSessions: 16 },
  });

  try {
    assert.equal(registerHookCalls, 1);
    assert.equal(beforePromptCalls, 1);
  } finally {
    await configured.close();
  }
});
