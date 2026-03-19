import { ContextAssembler } from "@openclaw-enhanced/context-assembler";
import { FactExtractor } from "@openclaw-enhanced/fact-extractor";
import { InMemoryCacheStore } from "@openclaw-enhanced/memory-cache-memory";
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
  PersistentStore,
  SessionStateRecord,
  TopicMembershipRecord,
  TopicRecord,
  TopicRoutingDecision,
} from "@openclaw-enhanced/memory-core";
import { MemorySqliteStore } from "@openclaw-enhanced/memory-sqlite";
import { SummaryRefresher } from "@openclaw-enhanced/summary-refresher";
import { TopicRouter } from "@openclaw-enhanced/topic-router";
import { createHash, randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const ENGINE_GLOBAL_KEY = "__OPENCLAW_BAMDRA_MEMORY_CONTEXT_ENGINE__";
const USER_BIND_GLOBAL_KEY = "__OPENCLAW_BAMDRA_USER_BIND__";
const VECTOR_GLOBAL_KEY = "__OPENCLAW_BAMDRA_MEMORY_VECTOR__";
const DEFAULT_DB_PATH = join(
  homedir(),
  ".openclaw",
  "memory",
  process.env.OPENCLAW_BAMDRA_MEMORY_DB_BASENAME || "main.sqlite",
);

function logMemoryEvent(event: string, details: Record<string, unknown> = {}): void {
  try {
    console.info("[bamdra-openclaw-memory]", event, JSON.stringify(details));
  } catch {
    console.info("[bamdra-openclaw-memory]", event);
  }
}

export interface ContextEngineMemoryV2Plugin {
  name: string;
  type: "context-engine";
  slot: "memory";
  capabilities: ["memory"];
  config: MemoryV2Config;
  registerHooks(api: unknown): void;
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

type InternalHookOptions = {
  name?: string;
  description?: string;
  priority?: number;
};

type InternalHookHandler = (event: unknown) => unknown | Promise<unknown>;

type InternalHookRegistrar = (
  events: string | string[],
  handler: InternalHookHandler,
  opts?: InternalHookOptions,
) => void;

export function createContextEngineMemoryV2Plugin(
  inputConfig: Partial<MemoryV2Config> | MemoryV2Config | undefined,
  api?: unknown,
): ContextEngineMemoryV2Plugin {
  const config = normalizeMemoryConfig(inputConfig);
  const store = new MemorySqliteStore({
    path: config.store.path,
  });
  let cache: CacheStore = new InMemoryCacheStore(config.cache as { provider: "memory"; maxSessions?: number; maxTopicsPerSession?: number; maxFacts?: number });
  const router = new TopicRouter(config);
  const assembler = new ContextAssembler(config);
  const factExtractor = new FactExtractor(config);
  const summaryRefresher = new SummaryRefresher(config);

  // 延迟初始化模式：在首次使用时自动执行数据库迁移
  let migrationsApplied = false;
  let migrationsPromise: Promise<void> | null = null;

  async function ensureMigrations(): Promise<void> {
    if (migrationsApplied) return;
    if (migrationsPromise) return migrationsPromise;

    migrationsPromise = store.applyMigrations().then(() => {
      migrationsApplied = true;
    });

    return migrationsPromise;
  }

  let hooksRegistered = false;

  const plugin: ContextEngineMemoryV2Plugin = {
    name: "bamdra-openclaw-memory",
    type: "context-engine",
    slot: "memory" as const,
    capabilities: ["memory"],
    config,
    registerHooks(hostApi: unknown): void {
      if (hooksRegistered) {
        return;
      }

      const registerHook = getInternalHookRegistrar(hostApi);
      const registerTypedHook = getTypedHookRegistrar(hostApi);

      if (registerHook) {
        registerHook(
          ["message:received", "message:preprocessed"],
          async (event: unknown) => {
            await ensureResolvedIdentity(event);
            const sessionId = getSessionIdFromHookContext(event);
            await backfillResolvedIdentity(store, sessionId);
            const text = getTextFromHookContext(event);
            logMemoryEvent("hook-ingest-received", {
              hasSessionId: Boolean(sessionId),
              textPreview: typeof text === "string" ? text.slice(0, 80) : null,
            });
            if (!sessionId || !text) {
              return;
            }

            const result = await plugin.routeAndTrack(sessionId, text);
            logMemoryEvent("hook-ingest-tracked", {
              sessionId,
              action: result.decision.action,
              reason: result.decision.reason,
              topicId: result.topicId,
              messageId: result.messageId,
            });
          },
          {
            name: "bamdra-memory-ingest",
            description: "Track inbound conversation turns into bamdra memory topics and facts",
          },
        );
      } else {
        logMemoryEvent("register-hooks-skipped", { reason: "registerHook unavailable" });
      }

      if (registerTypedHook) {
        registerTypedHook("before_prompt_build", async (event: unknown, hookContext: unknown) => {
          await ensureResolvedIdentity(hookContext);
          const sessionId = getSessionIdFromHookContext(hookContext);
          await backfillResolvedIdentity(store, sessionId);
          const text = getTextFromHookContext(event);
          const hasMultimodalPayload =
            containsNonTextualPayload(event) || containsNonTextualPayload(hookContext);
          logMemoryEvent("hook-assemble-received", {
            hasSessionId: Boolean(sessionId),
            hasText: Boolean(text),
            hasMultimodalPayload,
          });
          if (!sessionId) {
            return;
          }

          if (text) {
            const result = await plugin.routeAndTrack(sessionId, text);
            logMemoryEvent("hook-before-prompt-tracked", {
              sessionId,
              action: result.decision.action,
              reason: result.decision.reason,
              topicId: result.topicId,
              messageId: result.messageId,
            });
          }

          const assembled = await plugin.assembleContext(sessionId);
          const knowledgeRecall = text && shouldPreferLocalKnowledgeFirst(text)
            ? await plugin.searchMemory({
              sessionId,
              query: text,
              limit: 3,
            })
            : null;
          const assembledWithRecall = knowledgeRecall != null
            ? mergeLocalKnowledgeRecall(
              assembled,
              knowledgeRecall,
              config.contextAssembly?.recallMaxChars ?? 900,
            )
            : assembled;
          logMemoryEvent("hook-assemble-complete", {
            sessionId,
            topicId: assembledWithRecall.topicId,
            sections: assembledWithRecall.sections.length,
            localKnowledgeHits: knowledgeRecall == null
              ? 0
              : knowledgeRecall.vectors.length + knowledgeRecall.facts.length + knowledgeRecall.topics.length,
          });

          return buildBeforePromptBuildResult(
            assembledWithRecall,
            hasMultimodalPayload
              ? config.contextAssembly?.maxCharsWhenMultimodal ?? 1200
              : config.contextAssembly?.maxChars ?? 4000,
          );
        });
      } else {
        logMemoryEvent("register-typed-hooks-skipped", { reason: "typed hook registrar unavailable" });
      }

      if (!registerHook && !registerTypedHook) {
        return;
      }

      logMemoryEvent("register-hooks-complete", {
        internalHooks: registerHook ? ["message:received", "message:preprocessed"] : [],
        typedHooks: registerTypedHook ? ["before_prompt_build"] : [],
      });
      hooksRegistered = true;
    },
    async setup(): Promise<void> {
      await ensureMigrations();
    },
    async close(): Promise<void> {
      await store.close();
    },
    async listTopics(sessionId: string) {
      await ensureMigrations();
      const sessionState = await resolveSessionState(store, cache, sessionId);
      const topics = await store.listTopics(sessionId);
      return topics.map((topic) => ({
        ...topic,
        isActive: sessionState?.activeTopicId === topic.id,
      }));
    },
    async switchTopic(sessionId: string, topicId: string): Promise<TopicRecord> {
      await ensureMigrations();
      const topic = await store.getTopic(topicId);
      if (!topic || topic.sessionId !== sessionId) {
        throw new Error(`Topic ${topicId} does not belong to session ${sessionId}`);
      }

      const now = new Date().toISOString();
      const userId = getResolvedUserId(sessionId);
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
        userId,
        activeTopicId: topicId,
        lastCompactedAt: previousState?.lastCompactedAt ?? null,
        lastTurnId: previousState?.lastTurnId ?? null,
        updatedAt: now,
      });

      logMemoryEvent("switch-topic", { sessionId, topicId, title: updatedTopic.title });

      return updatedTopic;
    },
    async saveFact(args) {
      await ensureMigrations();
      const now = new Date().toISOString();
      const sessionState = await resolveSessionState(store, cache, args.sessionId);
      const resolvedTopicId = args.topicId ?? sessionState?.activeTopicId ?? null;
      const resolvedTopic =
        resolvedTopicId != null ? await store.getTopic(resolvedTopicId) : null;
      const userId = getResolvedUserId(args.sessionId);
      const normalizedScope = normalizeFactScope(args.scope, args.sessionId);
      const scope =
        normalizedScope ??
        (resolvedTopic != null
          ? `topic:${resolvedTopic.id}`
          : userId != null
            ? `user:${userId}`
            : "shared");
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
      pushVectorMemoryRecord({
        userId,
        sessionId: args.sessionId,
        topicId: resolvedTopic?.id ?? null,
        sourcePath: join("user", userId ?? "shared", "facts", `${args.key}.md`),
        title: args.key,
        text: args.value,
        tags,
      });

      logMemoryEvent("save-fact", {
        sessionId: args.sessionId,
        topicId: resolvedTopic?.id ?? null,
        key: args.key,
        scope,
        tags,
      });

      return {
        topicId: resolvedTopic?.id ?? null,
        tags,
      };
    },
    async compactTopic(args) {
      await ensureMigrations();
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
        userId: getResolvedUserId(args.sessionId),
        activeTopicId: sessionState?.activeTopicId ?? topic.id,
        lastCompactedAt: now,
        lastTurnId: sessionState?.lastTurnId ?? null,
        updatedAt: now,
      });
      await cache.setSessionState(args.sessionId, {
        activeTopicId: sessionState?.activeTopicId ?? topic.id,
        updatedAt: now,
      });

      logMemoryEvent("compact-topic", {
        sessionId: args.sessionId,
        topicId: refreshedTopic.id,
        title: refreshedTopic.title,
      });

      return refreshedTopic;
    },
    async searchMemory(args) {
      await ensureMigrations();
      const sessionState = await resolveSessionState(store, cache, args.sessionId);
      const limit = args.limit ?? 5;
      const resolvedTopicId = args.topicId ?? sessionState?.activeTopicId ?? null;
      const userId = getResolvedUserId(args.sessionId);
      const [topics, facts] = await Promise.all([
        store.searchTopics(args.sessionId, args.query, limit),
        store.searchFacts({
          sessionId: args.sessionId,
          userId,
          query: args.query,
          topicId: resolvedTopicId,
          limit,
        }),
      ]);
      const vectors = searchVectorMemory({
        query: args.query,
        userId,
        topicId: resolvedTopicId,
        limit,
      });

      return {
        sessionId: args.sessionId,
        userId,
        query: args.query,
        topics,
        facts,
        vectors,
      };
    },
    async routeTopic(sessionId: string, text: string): Promise<TopicRoutingDecision> {
      await ensureMigrations();
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
      await ensureMigrations();
      const sessionState = await resolveSessionState(store, cache, sessionId);
      const topic =
        sessionState?.activeTopicId != null
          ? await store.getTopic(sessionState.activeTopicId)
          : null;
      const userId = getResolvedUserId(sessionId);
      const recentMessages =
        topic != null
          ? await store.listRecentMessagesForTopic(
            topic.id,
            config.contextAssembly?.recentTurns ?? 6,
          )
          : [];
      const alwaysFacts = await store.listFactsByScope("global");
      const sharedFacts = await store.listFactsByScope("shared");
      const sessionFacts = await store.listFactsByScope(`session:${sessionId}`);
      const userFacts = userId != null ? await store.listFactsByScope(`user:${userId}`) : [];
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
        alwaysFacts: dedupeFacts([...alwaysFacts, ...sharedFacts, ...sessionFacts, ...userFacts]),
        topicFacts: dedupeFacts([...scopedTopicFacts, ...labelFacts]),
      });
    },
    async routeAndTrack(sessionId: string, text: string) {
      await ensureMigrations();
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
      const userId = getResolvedUserId(sessionId);
      const topicId =
        decision.action === "spawn"
          ? createTopicId(sessionId, text)
          : decision.topicId;
      const messageId = randomUUID();
      const topicRecord =
        decision.action === "spawn"
          ? createSpawnedTopic(sessionId, userId, topicId, text, now, persistedState?.activeTopicId ?? null)
          : await store.getTopic(topicId);

      if (!topicRecord) {
        throw new Error(`Unable to resolve topic ${topicId} after routing`);
      }

      if (decision.action === "spawn") {
        await store.upsertTopic(topicRecord);
      } else {
        await store.upsertTopic({
          ...topicRecord,
          userId,
          status: "active",
          openLoops: mergeOpenLoops(topicRecord.openLoops, text),
          lastActiveAt: now,
        });
      }

      const messageRecord: MessageRecord = {
        id: messageId,
        sessionId,
        userId,
        channelType: getResolvedChannelType(sessionId),
        senderOpenId: getResolvedSenderOpenId(sessionId),
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
        userId,
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
      pushVectorMemoryRecord({
        userId,
        sessionId,
        topicId,
        sourcePath: join("user", userId ?? "shared", "topics", topicId, `${messageId}.md`),
        title: deriveTopicTitle(text),
        text,
        tags: dedupeTextItems(topicRecord.labels),
      });

      await cache.setSessionState(sessionId, {
        activeTopicId: topicId,
        updatedAt: now,
      });

      await store.upsertSessionState({
        sessionId,
        userId,
        activeTopicId: topicId,
        lastCompactedAt: persistedState?.lastCompactedAt ?? null,
        lastTurnId: messageId,
        updatedAt: now,
      });

      logMemoryEvent("route-and-track", {
        sessionId,
        userId,
        action: decision.action,
        reason: decision.reason,
        topicId,
        extractedFactCount: extractedFacts.length,
      });

      return {
        decision,
        topicId,
        messageId,
      };
    },
  };

  plugin.registerHooks(api);
  return plugin;
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

function mapCachedStateToSessionState(
  sessionId: string,
  cached: { activeTopicId: string | null; updatedAt: string },
): SessionStateRecord {
  return {
    sessionId,
    userId: getResolvedUserId(sessionId),
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

function normalizeFactScope(
  scope: string | undefined,
  sessionId: string,
): string | null {
  if (typeof scope !== "string") {
    return null;
  }

  const normalized = scope.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === "session") {
    return `session:${sessionId}`;
  }
  if (normalized === "user") {
    const userId = getResolvedUserId(sessionId);
    return userId != null ? `user:${userId}` : null;
  }

  return normalized;
}

function getResolvedIdentity(sessionId: string): Record<string, unknown> | null {
  const api = (globalThis as Record<string, unknown>)[USER_BIND_GLOBAL_KEY] as
    | {
      getIdentityForSession?(sessionId: string): Record<string, unknown> | null;
      resolveIdentity?(context: unknown): Promise<Record<string, unknown> | null>;
    }
    | undefined;
  if (!api?.getIdentityForSession) {
    return null;
  }
  return api.getIdentityForSession(sessionId);
}

async function ensureResolvedIdentity(context: unknown): Promise<void> {
  const api = (globalThis as Record<string, unknown>)[USER_BIND_GLOBAL_KEY] as
    | {
      resolveIdentity?(context: unknown): Promise<Record<string, unknown> | null>;
    }
    | undefined;
  if (!api?.resolveIdentity) {
    return;
  }
  try {
    await api.resolveIdentity(context);
  } catch (error) {
    logMemoryEvent("identity-resolve-failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function backfillResolvedIdentity(
  store: PersistentStore,
  sessionId: string | null,
): Promise<void> {
  if (!sessionId || typeof store.backfillSessionIdentity !== "function") {
    return;
  }
  const userId = getResolvedUserId(sessionId);
  if (!userId) {
    return;
  }
  await store.backfillSessionIdentity({
    sessionId,
    userId,
    channelType: getResolvedChannelType(sessionId),
    senderOpenId: getResolvedSenderOpenId(sessionId),
  });
}

function getResolvedUserId(sessionId: string): string | null {
  const identity = getResolvedIdentity(sessionId);
  const userId = identity?.userId;
  return typeof userId === "string" && userId.trim() ? userId : null;
}

function getResolvedChannelType(sessionId: string): string | null {
  const identity = getResolvedIdentity(sessionId);
  const channelType = identity?.channelType;
  return typeof channelType === "string" && channelType.trim() ? channelType : null;
}

function getResolvedSenderOpenId(sessionId: string): string | null {
  const identity = getResolvedIdentity(sessionId);
  const senderOpenId = identity?.senderOpenId;
  return typeof senderOpenId === "string" && senderOpenId.trim() ? senderOpenId : null;
}

function pushVectorMemoryRecord(args: {
  userId: string | null;
  sessionId: string | null;
  topicId: string | null;
  sourcePath: string;
  title: string;
  text: string;
  tags?: string[];
}): void {
  const api = (globalThis as Record<string, unknown>)[VECTOR_GLOBAL_KEY] as
    | {
      upsertMemoryRecord?(args: {
        userId: string | null;
        sessionId: string | null;
        topicId: string | null;
        sourcePath: string;
        title: string;
        text: string;
        tags?: string[];
      }): void;
    }
    | undefined;
  api?.upsertMemoryRecord?.(args);
}

function searchVectorMemory(args: {
  query: string;
  userId: string | null;
  topicId?: string | null;
  limit?: number;
}): MemorySearchResult["vectors"] {
  const api = (globalThis as Record<string, unknown>)[VECTOR_GLOBAL_KEY] as
    | {
      search?(args: {
        query: string;
        userId: string | null;
        topicId?: string | null;
        limit?: number;
      }): unknown[];
    }
    | undefined;
  if (!api?.search) {
    return [];
  }
  return api.search(args) as MemorySearchResult["vectors"];
}

function createSpawnedTopic(
  sessionId: string,
  userId: string | null,
  topicId: string,
  text: string,
  now: string,
  parentTopicId: string | null,
): TopicRecord {
  return {
    id: topicId,
    sessionId,
    userId,
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

function normalizeMemoryConfig(
  inputConfig: Partial<MemoryV2Config> | MemoryV2Config | undefined,
): MemoryV2Config {
  return {
    enabled: inputConfig?.enabled ?? true,
    store: {
      provider: "sqlite",
      path:
        inputConfig?.store?.path ||
        process.env.OPENCLAW_BAMDRA_MEMORY_DB_PATH ||
        process.env.OPENCLAW_MEMORY_DB_PATH ||
        DEFAULT_DB_PATH,
    },
    cache: {
      provider: "memory",
      maxSessions: inputConfig?.cache?.maxSessions ?? 128,
      maxTopicsPerSession: inputConfig?.cache?.maxTopicsPerSession ?? 64,
      maxFacts: inputConfig?.cache?.maxFacts ?? 2048,
    },
    topicRouting: {
      maxRecentTopics: inputConfig?.topicRouting?.maxRecentTopics ?? 12,
      newTopicThreshold: inputConfig?.topicRouting?.newTopicThreshold ?? 0.28,
      switchTopicThreshold:
        inputConfig?.topicRouting?.switchTopicThreshold ?? 0.55,
    },
    contextAssembly: {
      recentTurns: inputConfig?.contextAssembly?.recentTurns ?? 6,
      includeTopicShortSummary:
        inputConfig?.contextAssembly?.includeTopicShortSummary ?? true,
      includeOpenLoops:
        inputConfig?.contextAssembly?.includeOpenLoops ?? true,
      alwaysFactLimit: inputConfig?.contextAssembly?.alwaysFactLimit ?? 12,
      topicFactLimit: inputConfig?.contextAssembly?.topicFactLimit ?? 16,
      maxChars: inputConfig?.contextAssembly?.maxChars ?? 4000,
      maxCharsWhenMultimodal:
        inputConfig?.contextAssembly?.maxCharsWhenMultimodal ?? 1200,
      recentMessageMaxChars:
        inputConfig?.contextAssembly?.recentMessageMaxChars ?? 1200,
      maxFactValueChars:
        inputConfig?.contextAssembly?.maxFactValueChars ?? 280,
      recallMaxChars: inputConfig?.contextAssembly?.recallMaxChars ?? 900,
    },
  };
}

export function register(api: {
  registerHook?: InternalHookRegistrar;
  on?: (
    hookName: string,
    handler: (event: unknown, context: unknown) => unknown | Promise<unknown>,
    opts?: { priority?: number },
  ) => void;
  pluginConfig?: Partial<MemoryV2Config>;
  registerContextEngine: (
    id: string,
    factory: (config: MemoryV2Config) => ContextEngineMemoryV2Plugin | Promise<ContextEngineMemoryV2Plugin>,
  ) => void;
}): void {
  logMemoryEvent("register-context-engine", { id: "bamdra-openclaw-memory" });
  const plugin = createContextEngineMemoryV2Plugin(api.pluginConfig, api);
  exposeContextEngine(plugin);
  plugin.registerHooks(api);
  api.registerContextEngine("bamdra-openclaw-memory", async (config) => {
    if (config?.store?.path && config.store.path !== plugin.config.store.path) {
      const configuredPlugin = createContextEngineMemoryV2Plugin(config, api);
      await configuredPlugin.setup();
      exposeContextEngine(configuredPlugin);
      configuredPlugin.registerHooks(api);
      logMemoryEvent("context-engine-ready", {
        id: configuredPlugin.name,
        dbPath: configuredPlugin.config.store.path,
      });
      return configuredPlugin;
    }
    await plugin.setup();
    logMemoryEvent("context-engine-ready", {
      id: plugin.name,
      dbPath: plugin.config.store.path,
    });
    return plugin;
  });
}

export async function activate(api: {
  registerHook?: InternalHookRegistrar;
  on?: (
    hookName: string,
    handler: (event: unknown, context: unknown) => unknown | Promise<unknown>,
    opts?: { priority?: number },
  ) => void;
  pluginConfig?: Partial<MemoryV2Config>;
  registerContextEngine: (
    id: string,
    factory: (config: MemoryV2Config) => ContextEngineMemoryV2Plugin | Promise<ContextEngineMemoryV2Plugin>,
  ) => void;
}): Promise<void> {
  logMemoryEvent("activate-context-engine", { id: "bamdra-openclaw-memory" });
  const plugin = createContextEngineMemoryV2Plugin(api.pluginConfig, api);
  exposeContextEngine(plugin);
  plugin.registerHooks(api);
  api.registerContextEngine("bamdra-openclaw-memory", async (config) => {
    if (config?.store?.path && config.store.path !== plugin.config.store.path) {
      const configuredPlugin = createContextEngineMemoryV2Plugin(config, api);
      await configuredPlugin.setup();
      exposeContextEngine(configuredPlugin);
      configuredPlugin.registerHooks(api);
      logMemoryEvent("context-engine-ready", {
        id: configuredPlugin.name,
        dbPath: configuredPlugin.config.store.path,
      });
      return configuredPlugin;
    }
    await plugin.setup();
    logMemoryEvent("context-engine-ready", {
      id: plugin.name,
      dbPath: plugin.config.store.path,
    });
    return plugin;
  });
}

function exposeContextEngine(plugin: ContextEngineMemoryV2Plugin): void {
  (globalThis as Record<string, unknown>)[ENGINE_GLOBAL_KEY] = plugin;
  process.env.OPENCLAW_BAMDRA_MEMORY_DB_PATH = plugin.config.store.path;
}

function getInternalHookRegistrar(api: unknown):
  | InternalHookRegistrar
  | null {
  if (!api || typeof api !== "object") {
    return null;
  }

  const registrar = (api as { registerHook?: unknown }).registerHook;
  if (typeof registrar !== "function") {
    return null;
  }

  return registrar.bind(api);
}

function getTypedHookRegistrar(api: unknown):
  | ((
    hookName: string,
    handler: (event: unknown, context: unknown) => unknown | Promise<unknown>,
    opts?: { priority?: number },
  ) => void)
  | null {
  if (!api || typeof api !== "object") {
    return null;
  }

  const registrar = (api as { on?: unknown }).on;
  if (typeof registrar !== "function") {
    return null;
  }

  return registrar.bind(api);
}

function getSessionIdFromHookContext(context: unknown): string | null {
  if (!context || typeof context !== "object") {
    return null;
  }

  const candidate = context as {
    sessionKey?: unknown;
    sessionId?: unknown;
    session?: { id?: unknown };
    conversation?: { id?: unknown };
    metadata?: { sessionId?: unknown };
    input?: { sessionId?: unknown; session?: { id?: unknown } };
    context?: { sessionId?: unknown };
  };

  const sessionId =
    candidate.sessionKey ??
    candidate.sessionId ??
    candidate.session?.id ??
    candidate.conversation?.id ??
    candidate.metadata?.sessionId ??
    candidate.context?.sessionId ??
    candidate.input?.sessionId ??
    candidate.input?.session?.id;

  return typeof sessionId === "string" && sessionId.trim() ? sessionId : null;
}

function getTextFromHookContext(context: unknown): string | null {
  if (!context || typeof context !== "object") {
    return null;
  }

  const candidate = context as {
    text?: unknown;
    prompt?: unknown;
    body?: unknown;
    bodyForAgent?: unknown;
    context?: {
      body?: unknown;
      bodyForAgent?: unknown;
      text?: unknown;
      content?: unknown;
    };
    input?: unknown;
    message?: { text?: unknown; content?: unknown };
    messages?: Array<{ role?: string; text?: unknown; content?: unknown }>;
  };

  const directText = normalizeHookText(
    candidate.bodyForAgent ??
    candidate.body ??
    candidate.prompt ??
    candidate.text ??
    candidate.context?.bodyForAgent ??
    candidate.context?.body ??
    candidate.context?.text ??
    candidate.context?.content,
  );
  if (directText) {
    return directText;
  }

  const messageText = normalizeHookText(candidate.message?.text ?? candidate.message?.content);
  if (messageText) {
    return messageText;
  }

  const inputText = extractTextFromInput(candidate.input);
  if (inputText) {
    return inputText;
  }

  const lastUserMessage = [...(candidate.messages ?? [])]
    .reverse()
    .find((message) => (message.role ?? "user") === "user");
  return normalizeHookText(lastUserMessage?.text ?? lastUserMessage?.content);
}

function extractTextFromInput(input: unknown): string | null {
  if (typeof input === "string") {
    return normalizeHookText(input);
  }

  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as {
    text?: unknown;
    content?: unknown;
    message?: { text?: unknown; content?: unknown };
    messages?: Array<{ role?: string; text?: unknown; content?: unknown }>;
  };

  const directText = normalizeHookText(candidate.text ?? candidate.content);
  if (directText) {
    return directText;
  }

  const messageText = normalizeHookText(candidate.message?.text ?? candidate.message?.content);
  if (messageText) {
    return messageText;
  }

  const lastUserMessage = [...(candidate.messages ?? [])]
    .reverse()
    .find((message) => (message.role ?? "user") === "user");
  return normalizeHookText(lastUserMessage?.text ?? lastUserMessage?.content);
}

function normalizeHookText(value: unknown): string | null {
  const normalized = extractTextFromStructuredValue(value).trim();
  return normalized ? normalized : null;
}

function buildBeforePromptBuildResult(
  assembled: AssembledContext,
  maxChars: number,
): {
  prependSystemContext?: string;
} | undefined {
  const text = trimToLength(assembled.text.trim(), maxChars);
  if (!text) {
    return undefined;
  }

  return {
    prependSystemContext: text,
  };
}

function shouldPreferLocalKnowledgeFirst(text: string): boolean {
  const normalized = text.toLowerCase();
  const signals = [
    "知识库",
    "文档",
    "说明",
    "规范",
    "笔记",
    "想法",
    "本地",
    "查一下文档",
    "查下文档",
    "知识",
    "changelog",
    "readme",
    "docs",
    "notes",
    "ideas",
    ".md",
    ".pdf",
    ".docx",
    "sop",
  ];
  return signals.some((signal) => normalized.includes(signal));
}

function mergeLocalKnowledgeRecall(
  assembled: AssembledContext,
  search: MemorySearchResult,
  maxChars: number,
): AssembledContext {
  const vectorLines = search.vectors
    .slice(0, 3)
    .map((item) => `- [vector] ${trimToLength(item.title, 80)} (${trimToLength(item.sourcePath, 120)}): ${trimToLength(item.text, 180)}`);
  const factLines = search.facts
    .slice(0, 2)
    .map((item) => `- [fact] ${trimToLength(item.fact.key, 80)}: ${trimToLength(item.fact.value, 140)}`);
  const topicLines = search.topics
    .slice(0, 2)
    .map((item) => `- [topic] ${trimToLength(item.topic.title, 80)}: ${trimToLength(item.topic.summaryShort, 140)}`);
  const lines = [...vectorLines, ...factLines, ...topicLines];
  if (lines.length === 0) {
    return assembled;
  }

  const content = trimToLength([
    "Prefer answering from local memory and knowledge before using web search.",
    ...lines,
  ].join("\n"), maxChars);

  return {
    ...assembled,
    text: trimToLength(`[facts]\n${content}\n\n${assembled.text}`.trim(), assembled.text.length + maxChars + 32),
    sections: [
      { kind: "facts", content },
      ...assembled.sections,
    ],
  };
}

function extractTextFromStructuredValue(value: unknown, depth = 0): string {
  if (depth > 4 || value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => extractTextFromStructuredValue(item, depth + 1))
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value !== "object") {
    return "";
  }

  const candidate = value as Record<string, unknown>;
  const direct = [
    candidate.text,
    candidate.input_text,
    candidate.caption,
  ]
    .map((item) => extractTextFromStructuredValue(item, depth + 1))
    .filter(Boolean);
  if (direct.length > 0) {
    return direct.join("\n");
  }

  return [
    extractTextFromStructuredValue(candidate.content, depth + 1),
    extractTextFromStructuredValue(candidate.message, depth + 1),
    extractTextFromStructuredValue(candidate.input, depth + 1),
    extractTextFromStructuredValue(candidate.messages, depth + 1),
  ]
    .filter(Boolean)
    .join("\n");
}

function containsNonTextualPayload(value: unknown, depth = 0): boolean {
  if (depth > 4 || value == null) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsNonTextualPayload(item, depth + 1));
  }

  if (typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const typeValue = typeof candidate.type === "string" ? candidate.type.toLowerCase() : "";
  if (
    typeValue.includes("image") ||
    typeValue.includes("audio") ||
    typeValue.includes("video") ||
    "image_url" in candidate ||
    "input_image" in candidate
  ) {
    return true;
  }

  if (typeof candidate.mimeType === "string" && candidate.mimeType.startsWith("image/")) {
    return true;
  }

  return Object.values(candidate).some((item) => containsNonTextualPayload(item, depth + 1));
}

function trimToLength(value: string, maxChars: number): string {
  if (maxChars <= 0) {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  if (maxChars <= 3) {
    return normalized.slice(0, maxChars);
  }

  return `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
}
