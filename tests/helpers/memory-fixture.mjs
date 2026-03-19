import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import contextEnginePlugin from "../../packages/bamdra-memory-context-engine/dist/index.js";
import toolsPlugin from "../../packages/bamdra-memory-tools/dist/index.js";

const { createContextEngineMemoryV2Plugin } = contextEnginePlugin;
const { createToolsMemoryV2Plugin } = toolsPlugin;

export async function createMemoryFixture(overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), "openclaw-enhanced-test-"));
  const dbPath = join(dir, "memory.sqlite");
  const contextEngine = createContextEngineMemoryV2Plugin({
    enabled: true,
    store: { provider: "sqlite", path: dbPath },
    cache: { provider: "memory", maxSessions: 16 },
    topicRouting: { switchTopicThreshold: 0.55, newTopicThreshold: 0.28 },
    contextAssembly: {
      recentTurns: 6,
      alwaysFactLimit: 8,
      topicFactLimit: 8,
      includeOpenLoops: true,
      maxChars: 4000,
      maxCharsWhenMultimodal: 1200,
      recentMessageMaxChars: 1200,
      maxFactValueChars: 280,
      recallMaxChars: 900,
    },
    ...overrides,
  });
  await contextEngine.setup();
  const tools = createToolsMemoryV2Plugin(contextEngine);

  return {
    dbPath,
    contextEngine,
    tools,
    async close() {
      await contextEngine.close();
    },
  };
}
