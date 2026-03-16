import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import contextEnginePlugin from "../../plugins/bamdra-memory-context-engine/dist/index.js";
import toolsPlugin from "../../plugins/bamdra-memory-tools/dist/index.js";

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
