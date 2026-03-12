import { InMemoryCacheStore } from "@openclaw-enhanced/memory-cache-memory";
import type {
  CachedSessionState,
  CacheStore,
  MemoryV2RedisCacheConfig,
} from "@openclaw-enhanced/memory-core";
import { createClient, type RedisClientType } from "redis";

export class RedisCacheStore implements CacheStore {
  private readonly client: RedisClientType;
  private readonly keyPrefix: string;
  private readonly fallback: InMemoryCacheStore | null;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly config: MemoryV2RedisCacheConfig) {
    this.keyPrefix = config.keyPrefix ?? "openclaw:memory-v2:";
    this.fallback = config.fallbackToMemory === false ? null : new InMemoryCacheStore({
      provider: "memory",
    });
    this.client = createClient({
      url: config.url,
      pingInterval: 30000,
      socket: {
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 1000),
      },
    });
  }

  async getActiveTopicId(sessionId: string): Promise<string | null> {
    return (await this.getSessionState(sessionId))?.activeTopicId ?? null;
  }

  async setActiveTopicId(sessionId: string, topicId: string | null): Promise<void> {
    const current = await this.getSessionState(sessionId);
    await this.setSessionState(sessionId, {
      activeTopicId: topicId,
      updatedAt: current?.updatedAt ?? new Date().toISOString(),
    });
  }

  async getSessionState(sessionId: string): Promise<CachedSessionState | null> {
    return this.withFallback(async () => {
      await this.ensureConnected();
      const payload = await this.client.get(this.getSessionKey(sessionId));
      if (!payload) {
        return null;
      }
      return parseCachedSessionState(payload);
    }, async () => this.fallback?.getSessionState(sessionId) ?? null);
  }

  async setSessionState(sessionId: string, state: CachedSessionState): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureConnected();
      const serialized = JSON.stringify(state);
      const key = this.getSessionKey(sessionId);
      if (this.config.ttlSeconds != null) {
        await this.client.set(key, serialized, {
          expiration: {
            type: "EX",
            value: this.config.ttlSeconds,
          },
        });
      } else {
        await this.client.set(key, serialized);
      }
    }, async () => {
      if (this.fallback) {
        await this.fallback.setSessionState(sessionId, state);
      }
    });

    if (this.fallback) {
      await this.fallback.setSessionState(sessionId, state);
    }
  }

  async deleteSessionState(sessionId: string): Promise<void> {
    await this.withFallback(async () => {
      await this.ensureConnected();
      await this.client.del(this.getSessionKey(sessionId));
    }, async () => {
      if (this.fallback) {
        await this.fallback.deleteSessionState(sessionId);
      }
    });

    if (this.fallback) {
      await this.fallback.deleteSessionState(sessionId);
    }
  }

  async ping(): Promise<string> {
    await this.ensureConnected();
    return this.client.ping();
  }

  async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close();
    }
    if (this.fallback) {
      await this.fallback.close();
    }
  }

  private getSessionKey(sessionId: string): string {
    return `${this.keyPrefix}session:${sessionId}`;
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }
    if (!this.connectPromise) {
      this.connectPromise = (async () => {
        try {
          await this.client.connect();
        } finally {
          this.connectPromise = null;
        }
      })();
    }
    await this.connectPromise;
  }

  private async withFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!this.fallback) {
        throw error;
      }
      return fallbackOperation();
    }
  }
}

function parseCachedSessionState(payload: string): CachedSessionState | null {
  const parsed = JSON.parse(payload) as unknown;
  if (
    typeof parsed !== "object" ||
    parsed == null ||
    !("updatedAt" in parsed) ||
    typeof parsed.updatedAt !== "string"
  ) {
    return null;
  }

  const activeTopicId =
    "activeTopicId" in parsed && (typeof parsed.activeTopicId === "string" || parsed.activeTopicId === null)
      ? parsed.activeTopicId
      : null;

  return {
    activeTopicId,
    updatedAt: parsed.updatedAt,
  };
}
