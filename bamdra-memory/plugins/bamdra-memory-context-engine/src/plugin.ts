import { createContextEngineMemoryV2Plugin } from "./index.js";

import type { MemoryV2Config } from "@openclaw-enhanced/memory-core";

export interface ContextEnginePluginHost {
  registerContextEngine(
    id: string,
    factory: (config: MemoryV2Config) => ReturnType<typeof createContextEngineMemoryV2Plugin>,
  ): void;
}

export default function registerContextEngineMemoryV2(
  api: ContextEnginePluginHost,
): void {
  api.registerContextEngine("bamdra-memory-context-engine", (config: MemoryV2Config) =>
    createContextEngineMemoryV2Plugin(config),
  );
}
