// Redis support has been removed. This file is kept for compatibility only.
// Use InMemoryCacheStore from @openclaw-enhanced/memory-cache-memory instead.

import { InMemoryCacheStore } from "@openclaw-enhanced/memory-cache-memory";
import type { CacheStore, MemoryV2CacheConfig } from "@openclaw-enhanced/memory-core";

// Re-export InMemoryCacheStore as RedisCacheStore for backwards compatibility
// This is a no-op implementation that falls back to in-memory storage
export class RedisCacheStore extends InMemoryCacheStore implements CacheStore {
  constructor(config: MemoryV2CacheConfig = { provider: "memory" }) {
    super(config);
    console.warn("RedisCacheStore is deprecated. Use InMemoryCacheStore instead.");
  }
}
