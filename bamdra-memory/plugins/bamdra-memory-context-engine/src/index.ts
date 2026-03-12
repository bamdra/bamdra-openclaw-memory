import { ContextAssembler } from "@openclaw-enhanced/context-assembler";
import { FactExtractor } from "@openclaw-enhanced/fact-extractor";
import { InMemoryCacheStore } from "@openclaw-enhanced/memory-cache-memory";
import { RedisCacheStore } from "@openclaw-enhanced/memory-cache-redis";
import type {
  AssembledContext,
  CacheStore,
  MemorySearchResult,
  FactCategory,
  FactRecallPolicy,
  FactSensitivity,
  ExtractedFactCandidate,
  MessageRecord,
  MemoryV2Config,
  SessionStateRecord,
  TopicMembershipRecord,
  TopicRecord,
  TopicRoutingDecision,
} from "@openclaw-enhanced/memory-core";
import { MemorySqliteStore } from "@openclaw-enhanced/memory-sqlite";
import { SummaryRefresher } from "@openclaw-enhanced/summary-refresher";
import { TopicRouter } from "@openclaw-enhanced/topic-router";
import { createHash, randomUUID } from "node:crypto";

export interface ContextEngineMemoryV2Plugin {
  name: string;
  slot: "contextEngine";
  config: MemoryV2Config;
  setup(): Promise<void>;
  close(): Promise<void>;
  listTopics(sessionId: string): Promise<
    Array<
      TopicRecord & {
        isActive: boolean;
      }
    >
  >;
  switchTopic(sessionId: string, topicId: string): Promise<TopicRecord>;
  saveFact(args: {
    sessionId: string;
    key: string;
    value: string;
    category?: FactCategory;
    sensitivity?: FactSensitivity;
    recallPolicy?: FactRecallPolicy;
    scope?: string;
    topicId?: string | null;
    tags?: string[];
  }): Promise<{ topicId: string | null; tags: string[] }>;
  compactTopic(args: {
    sessionId: string;
    topicId?: string | null;
  }): Promise<TopicRecord>;
  searchMemory(args: {
    sessionId: string;
    query: string;
    topicId?: string | null;
    limit?: number;
  }): Promise<MemorySearchResult>;
  routeTopic(sessionId: string, text: string): Promise<TopicRoutingDecision>;
  assembleContext(sessionId: string): Promise<AssembledContext>;
  routeAndTrack(sessionId: string, text: string): Promise<{
    decision: TopicRoutingDecision;
    topicId: string;
    messageId: string;
  }>;
}

export function createContextEngineMemoryV2Plugin(
  config: MemoryV2Config,
): ContextEngineMemoryV2Plugin {
  const store = new MemorySqliteStore({
    path: config.store.path,
  });
  const cache = createCacheStore(config);
  const router = new TopicRouter(config);
  const assembler = new ContextAssembler(config);
  const factExtractor = new FactExtractor(config);
  const summaryRefresher = new SummaryRefresher(config);

  return {
    name: "bamdra-memory-context-engine",
    slot: "contextEngine",
    config,
    async setup(): Promise<void> {
      await store.applyMigrations();
    },
    async close(): Promise<void> {
      await cache.close?.();
      await store.close();
    },
    async listTopics(sessionId: string) {
      const sessionState = await resolveSessionState(store, cache, sessionId);
      const topics = await store.listTopics(sessionId);
      return topics.map((topic) => ({
        ...topic,
        isActive: sessionState?.activeTopicId === topic.id,
      }));
    },
    async switchTopic(sessionId: string, topicId: string): Promise<TopicRecord> {
      const topic = await store.getTopic(topicId);
      if (!topic || topic.sessionId !== sessionId) {
        throw new Error(`Topic ${topicId} does not belong to session ${sessionId}`);
      }

      const now = new Date().toISOString();
      await cache.setSessionState(sessionId, {
        activeTopicId: topicId,
        updatedAt: now,
      });

      const previousState = await store.getSessionState(sessionId);
      const updatedTopic: TopicRecord = {
        ...topic,
        status: "active",
        lastActiveAt: now,
      };
      await store.upsertTopic(updatedTopic);
      await store.upsertSessionState({
        sessionId,
        activeTopicId: topicId,
        lastCompactedAt: previousState?.lastCompactedAt ?? null,
        lastTurnId: previousState?.lastTurnId ?? null,
        updatedAt: now,
      });

      return updatedTopic;
    },
    async saveFact(args) {
      const now = new Date().toISOString();
      const sessionState = await resolveSessionState(store, cache, args.sessionId);
      const resolvedTopicId = args.topicId ?? sessionState?.activeTopicId ?? null;
      const resolvedTopic =
        resolvedTopicId != null ? await store.getTopic(resolvedTopicId) : null;
      const scope =
        args.scope ??
        (resolvedTopic != null ? `topic:${resolvedTopic.id}` : "shared");
      const tags = dedupeTextItems([
        ...(resolvedTopic?.labels ?? []),
        ...(args.tags ?? []),
        args.category ?? "background",
      ]);

      await store.upsertFact(
        {
          id: createFactId(scope, args.key),
          scope,
          category: args.category ?? "background",
          key: args.key,
          value: args.value,
          sensitivity: args.sensitivity ?? "normal",
          recallPolicy: args.recallPolicy ?? (resolvedTopic ? "topic_bound" : "always"),
          confidence: 1,
          sourceMessageId: null,
          sourceTopicId: resolvedTopic?.id ?? null,
          updatedAt: now,
        },
        tags,
      );

      if (resolvedTopic) {
        await refreshTopicSummary(store, summaryRefresher, config, resolvedTopic.id, now);
      }

      return {
        topicId: resolvedTopic?.id ?? null,
        tags,
      };
    },
    async compactTopic(args) {
      const now = new Date().toISOString();
      const sessionState = await resolveSessionState(store, cache, args.sessionId);
      const topicId = args.topicId ?? sessionState?.activeTopicId ?? null;
      if (!topicId) {
        throw new Error(`Session ${args.sessionId} does not have an active topic`);
      }

      const topic = await store.getTopic(topicId);
      if (!topic || topic.sessionId !== args.sessionId) {
        throw new Error(`Topic ${topicId} does not belong to session ${args.sessionId}`);
      }

      const refreshedTopic = await refreshTopicSummary(
        store,
        summaryRefresher,
        config,
        topic.id,
        now,
      );
      await store.upsertSessionState({
        sessionId: args.sessionId,
        activeTopicId: sessionState?.activeTopicId ?? topic.id,
        lastCompactedAt: now,
        lastTurnId: sessionState?.lastTurnId ?? null,
        updatedAt: now,
      });
      await cache.setSessionState(args.sessionId, {
        activeTopicId: sessionState?.activeTopicId ?? topic.id,
        updatedAt: now,
      });

      return refreshedTopic;
    },
    async searchMemory(args) {
      const sessionState = await resolveSessionState(store, cache, args.sessionId);
      const limit = args.limit ?? 5;
      const resolvedTopicId = args.topicId ?? sessionState?.activeTopicId ?? null;
      const [topics, facts] = await Promise.all([
        store.searchTopics(args.sessionId, args.query, limit),
        store.searchFacts({
          sessionId: args.sessionId,
          query: args.query,
          topicId: resolvedTopicId,
          limit,
        }),
      ]);

      return {
        sessionId: args.sessionId,
        query: args.query,
        topics,
        facts,
      };
    },
    async routeTopic(sessionId: string, text: string): Promise<TopicRoutingDecision> {
      const persistedState = await resolveSessionState(store, cache, sessionId);
      const recentTopics = await store.listTopics(sessionId);

      return router.route({
        sessionId,
        text,
        activeTopicId: persistedState?.activeTopicId ?? null,
        recentTopics,
      });
    },
    async assembleContext(sessionId: string): Promise<AssembledContext> {
      const sessionState = await resolveSessionState(store, cache, sessionId);
      const topic =
        sessionState?.activeTopicId != null
          ? await store.getTopic(sessionState.activeTopicId)
          : null;
      const recentMessages =
        topic != null
          ? await store.listRecentMessagesForTopic(
              topic.id,
              config.contextAssembly?.recentTurns ?? 6,
            )
          : [];
      const alwaysFacts = await store.listFactsByScope("global");
      const scopedTopicFacts =
        topic != null ? await store.listFactsByScope(`topic:${topic.id}`) : [];
      const labelFacts =
        topic != null
          ? await store.listFactsByTags(topic.labels, ["always", "topic_bound"])
          : [];

      return assembler.assemble({
        sessionId,
        topic,
        recentMessages,
        alwaysFacts,
        topicFacts: dedupeFacts([...scopedTopicFacts, ...labelFacts]),
      });
    },
    async routeAndTrack(sessionId: string, text: string) {
      const cachedState = await cache.getSessionState(sessionId);
      const persistedState = cachedState
        ? mapCachedStateToSessionState(sessionId, cachedState)
        : await store.getSessionState(sessionId);
      const recentTopics = await store.listTopics(sessionId);

      const decision = router.route({
        sessionId,
        text,
        activeTopicId: persistedState?.activeTopicId ?? null,
        recentTopics,
      });

      const now = new Date().toISOString();
      const topicId =
        decision.action === "spawn"
          ? createTopicId(sessionId, text)
          : decision.topicId;
      const messageId = randomUUID();
      const topicRecord =
        decision.action === "spawn"
          ? createSpawnedTopic(sessionId, topicId, text, now, persistedState?.activeTopicId ?? null)
          : await store.getTopic(topicId);

      if (!topicRecord) {
        throw new Error(`Unable to resolve topic ${topicId} after routing`);
      }

      if (decision.action === "spawn") {
        await store.upsertTopic(topicRecord);
      } else {
        await store.upsertTopic({
          ...topicRecord,
          status: "active",
          openLoops: mergeOpenLoops(topicRecord.openLoops, text),
          lastActiveAt: now,
        });
      }

      const messageRecord: MessageRecord = {
        id: messageId,
        sessionId,
        turnId: messageId,
        parentTurnId: persistedState?.lastTurnId ?? null,
        role: "user",
        eventType: "message",
        text,
        ts: now,
        rawJson: JSON.stringify({ role: "user", text }),
      };
      await store.upsertMessage(messageRecord);

      const membership: TopicMembershipRecord = {
        messageId,
        topicId,
        score: 1,
        isPrimary: true,
        reason: decision.reason,
        createdAt: now,
      };
      await store.upsertTopicMembership(membership);

      const extractedFacts = factExtractor.extract({
        sessionId,
        text,
        topic:
          decision.action === "spawn"
            ? topicRecord
            : {
                ...topicRecord,
                openLoops: mergeOpenLoops(topicRecord.openLoops, text),
                lastActiveAt: now,
              },
      });
      for (const candidate of extractedFacts) {
        await store.upsertFact(
          mapExtractedFactCandidate(candidate, {
            sourceMessageId: messageId,
            sourceTopicId: topicId,
            updatedAt: now,
          }),
          candidate.tags,
        );
      }

      await refreshTopicSummary(store, summaryRefresher, config, topicId, now);

      await cache.setSessionState(sessionId, {
        activeTopicId: topicId,
        updatedAt: now,
      });

      await store.upsertSessionState({
        sessionId,
        activeTopicId: topicId,
        lastCompactedAt: persistedState?.lastCompactedAt ?? null,
        lastTurnId: messageId,
        updatedAt: now,
      });

      return {
        decision,
        topicId,
        messageId,
      };
    },
  };
}

async function resolveSessionState(
  store: MemorySqliteStore,
  cache: CacheStore,
  sessionId: string,
): Promise<SessionStateRecord | null> {
  const cachedState = await cache.getSessionState(sessionId);
  return cachedState
    ? mapCachedStateToSessionState(sessionId, cachedState)
    : store.getSessionState(sessionId);
}

function createCacheStore(config: MemoryV2Config): CacheStore {
  if (config.cache.provider === "redis") {
    return new RedisCacheStore(config.cache);
  }

  return new InMemoryCacheStore(config.cache);
}

function mapCachedStateToSessionState(
  sessionId: string,
  cached: { activeTopicId: string | null; updatedAt: string },
): SessionStateRecord {
  return {
    sessionId,
    activeTopicId: cached.activeTopicId,
    lastCompactedAt: null,
    lastTurnId: null,
    updatedAt: cached.updatedAt,
  };
}

function createTopicId(sessionId: string, text: string): string {
  const digest = createHash("sha1")
    .update(`${sessionId}:${text}:${Date.now()}`)
    .digest("hex")
    .slice(0, 12);

  return `topic-${digest}`;
}

function createFactId(scope: string, key: string): string {
  const digest = createHash("sha1")
    .update(`${scope}:${key}`)
    .digest("hex")
    .slice(0, 16);

  return `fact-${digest}`;
}

function createSpawnedTopic(
  sessionId: string,
  topicId: string,
  text: string,
  now: string,
  parentTopicId: string | null,
): TopicRecord {
  return {
    id: topicId,
    sessionId,
    title: deriveTopicTitle(text),
    status: "active",
    parentTopicId,
    summaryShort: text,
    summaryLong: "",
    openLoops: mergeOpenLoops([], text),
    labels: deriveTopicLabels(text),
    createdAt: now,
    lastActiveAt: now,
  };
}

function deriveTopicTitle(text: string): string {
  const compact = text.trim().replace(/\s+/g, " ");
  return compact.length <= 32 ? compact : `${compact.slice(0, 32)}...`;
}

function deriveTopicLabels(text: string): string[] {
  return dedupeTextItems(
    text
      .toLowerCase()
      .split(/[^a-z0-9_\u4e00-\u9fff]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .slice(0, 8),
  );
}

function mergeOpenLoops(existing: string[], text: string): string[] {
  const next = [...existing];
  if (looksLikeOpenLoop(text)) {
    next.push(text.trim());
  }

  return dedupeTextItems(next).slice(-8);
}

function looksLikeOpenLoop(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "todo",
    "待办",
    "需要",
    "继续",
    "后面",
    "remember",
    "follow up",
    "下一步",
  ].some((marker) => normalized.includes(marker));
}

function dedupeFacts<
  T extends {
    id: string;
  },
>(facts: T[]): T[] {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    if (seen.has(fact.id)) {
      return false;
    }

    seen.add(fact.id);
    return true;
  });
}

function dedupeTextItems(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function mapExtractedFactCandidate(
  candidate: ExtractedFactCandidate,
  meta: {
    sourceMessageId: string;
    sourceTopicId: string;
    updatedAt: string;
  },
) {
  return {
    id: createHash("sha1")
      .update(`${candidate.scope}:${candidate.key}:${candidate.value}`)
      .digest("hex")
      .slice(0, 24),
    scope: candidate.scope,
    category: candidate.category,
    key: candidate.key,
    value: candidate.value,
    sensitivity: candidate.sensitivity,
    recallPolicy: candidate.recallPolicy,
    confidence: candidate.confidence,
    sourceMessageId: meta.sourceMessageId,
    sourceTopicId: meta.sourceTopicId,
    updatedAt: meta.updatedAt,
  };
}

async function refreshTopicSummary(
  store: MemorySqliteStore,
  summaryRefresher: SummaryRefresher,
  config: MemoryV2Config,
  topicId: string,
  now: string,
): Promise<TopicRecord> {
  const topic = await store.getTopic(topicId);
  if (!topic) {
    throw new Error(`Unable to refresh summary for missing topic ${topicId}`);
  }

  const recentMessages = await store.listRecentMessagesForTopic(
    topicId,
    config.contextAssembly?.recentTurns ?? 6,
  );
  const refreshedFacts = dedupeFacts([
    ...(await store.listFactsByScope(`topic:${topicId}`)),
    ...(await store.listFactsByTags(topic.labels, ["always", "topic_bound"])),
  ]);
  const refreshedSummary = summaryRefresher.refresh({
    topic,
    recentMessages,
    facts: refreshedFacts,
  });
  const updatedTopic: TopicRecord = {
    ...topic,
    ...refreshedSummary,
    lastActiveAt: now,
  };
  await store.upsertTopic(updatedTopic);
  return updatedTopic;
}
