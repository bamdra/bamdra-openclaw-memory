import type {
  CachedSessionState,
  CacheStore,
  MemoryV2CacheConfig,
} from "@openclaw-enhanced/memory-core";

function logCacheEvent(event: string, details: Record<string, unknown> = {}): void {
  try {
    console.info("[bamdra-openclaw-memory-cache]", event, JSON.stringify(details));
  } catch {
    console.info("[bamdra-openclaw-memory-cache]", event);
  }
}

export class InMemoryCacheStore implements CacheStore {
  private readonly sessionState = new Map<string, CachedSessionState>();
  private readonly maxSessions: number;

  constructor(config: MemoryV2CacheConfig = { provider: "memory" }) {
    this.maxSessions = config.maxSessions ?? 128;
    logCacheEvent("init", { provider: "memory", maxSessions: this.maxSessions });
  }

  async getActiveTopicId(sessionId: string): Promise<string | null> {
    const activeTopicId = this.sessionState.get(sessionId)?.activeTopicId ?? null;
    logCacheEvent("get-active-topic", {
      sessionId,
      hit: activeTopicId !== null,
      activeTopicId,
    });
    return activeTopicId;
  }

  async setActiveTopicId(sessionId: string, topicId: string | null): Promise<void> {
    const current = this.sessionState.get(sessionId);
    await this.setSessionState(sessionId, {
      activeTopicId: topicId,
      updatedAt: current?.updatedAt ?? new Date().toISOString(),
    });
  }

  async getSessionState(sessionId: string): Promise<CachedSessionState | null> {
    const state = this.sessionState.get(sessionId) ?? null;
    logCacheEvent("get-session-state", {
      sessionId,
      hit: state !== null,
      activeTopicId: state?.activeTopicId ?? null,
    });
    return state;
  }

  async setSessionState(
    sessionId: string,
    state: CachedSessionState,
  ): Promise<void> {
    if (!this.sessionState.has(sessionId) && this.sessionState.size >= this.maxSessions) {
      const oldestKey = this.sessionState.keys().next().value;
      if (oldestKey) {
        this.sessionState.delete(oldestKey);
        logCacheEvent("evict-session-state", {
          sessionId: oldestKey,
          sizeAfter: this.sessionState.size,
        });
      }
    }

    this.sessionState.set(sessionId, state);
    logCacheEvent("set-session-state", {
      sessionId,
      activeTopicId: state.activeTopicId,
      updatedAt: state.updatedAt,
      size: this.sessionState.size,
    });
  }

  async deleteSessionState(sessionId: string): Promise<void> {
    this.sessionState.delete(sessionId);
    logCacheEvent("delete-session-state", {
      sessionId,
      size: this.sessionState.size,
    });
  }

  async close(): Promise<void> {}
}
