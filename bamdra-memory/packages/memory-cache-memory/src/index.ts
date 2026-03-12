import type {
  CachedSessionState,
  CacheStore,
  MemoryV2MemoryCacheConfig,
} from "@openclaw-enhanced/memory-core";

export class InMemoryCacheStore implements CacheStore {
  private readonly sessionState = new Map<string, CachedSessionState>();
  private readonly maxSessions: number;

  constructor(config: MemoryV2MemoryCacheConfig = { provider: "memory" }) {
    this.maxSessions = config.maxSessions ?? 128;
  }

  async getActiveTopicId(sessionId: string): Promise<string | null> {
    return this.sessionState.get(sessionId)?.activeTopicId ?? null;
  }

  async setActiveTopicId(sessionId: string, topicId: string | null): Promise<void> {
    const current = this.sessionState.get(sessionId);
    await this.setSessionState(sessionId, {
      activeTopicId: topicId,
      updatedAt: current?.updatedAt ?? new Date().toISOString(),
    });
  }

  async getSessionState(sessionId: string): Promise<CachedSessionState | null> {
    return this.sessionState.get(sessionId) ?? null;
  }

  async setSessionState(
    sessionId: string,
    state: CachedSessionState,
  ): Promise<void> {
    if (!this.sessionState.has(sessionId) && this.sessionState.size >= this.maxSessions) {
      const oldestKey = this.sessionState.keys().next().value;
      if (oldestKey) {
        this.sessionState.delete(oldestKey);
      }
    }

    this.sessionState.set(sessionId, state);
  }

  async deleteSessionState(sessionId: string): Promise<void> {
    this.sessionState.delete(sessionId);
  }

  async close(): Promise<void> {}
}
