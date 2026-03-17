export type FactCategory =
  | "background"
  | "environment"
  | "account"
  | "security"
  | "preference"
  | "project"
  | "decision"
  | "constraint";

export type FactSensitivity = "normal" | "sensitive" | "secret_ref";

export type FactRecallPolicy = "always" | "topic_bound" | "on_demand";

export type TopicStatus = "active" | "paused" | "done";

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface MessageRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  channelType: string | null;
  senderOpenId: string | null;
  turnId: string;
  parentTurnId: string | null;
  role: MessageRole;
  eventType: string;
  text: string;
  ts: string;
  rawJson: string;
}

export interface TopicRecord {
  id: string;
  sessionId: string;
  userId: string | null;
  title: string;
  status: TopicStatus;
  parentTopicId: string | null;
  summaryShort: string;
  summaryLong: string;
  openLoops: string[];
  labels: string[];
  createdAt: string;
  lastActiveAt: string;
}

export interface TopicMembershipRecord {
  messageId: string;
  topicId: string;
  score: number;
  isPrimary: boolean;
  reason: string;
  createdAt: string;
}

export interface FactRecord {
  id: string;
  scope: string;
  category: FactCategory;
  key: string;
  value: string;
  sensitivity: FactSensitivity;
  recallPolicy: FactRecallPolicy;
  confidence: number;
  sourceMessageId: string | null;
  sourceTopicId: string | null;
  updatedAt: string;
}

export interface SessionStateRecord {
  sessionId: string;
  userId: string | null;
  activeTopicId: string | null;
  lastCompactedAt: string | null;
  lastTurnId: string | null;
  updatedAt: string;
}

export interface CachedSessionState {
  activeTopicId: string | null;
  updatedAt: string;
}

export interface PersistentStore {
  getSchemaVersion(): Promise<number>;
  applyMigrations(): Promise<void>;
  close(): Promise<void>;
  upsertMessage(record: MessageRecord): Promise<void>;
  backfillSessionIdentity?(args: {
    sessionId: string;
    userId: string;
    channelType?: string | null;
    senderOpenId?: string | null;
  }): Promise<void>;
  getSessionState(sessionId: string): Promise<SessionStateRecord | null>;
  upsertSessionState(record: SessionStateRecord): Promise<void>;
  listTopics(sessionId: string): Promise<TopicRecord[]>;
  getTopic(topicId: string): Promise<TopicRecord | null>;
  upsertTopic(record: TopicRecord): Promise<void>;
  upsertTopicMembership(record: TopicMembershipRecord): Promise<void>;
  upsertFact(record: FactRecord, tags?: string[]): Promise<void>;
  listFactsByScope(scope: string): Promise<Array<FactRecord & { tags: string[] }>>;
  listFactsByTags(
    tags: string[],
    recallPolicies?: FactRecallPolicy[],
  ): Promise<Array<FactRecord & { tags: string[] }>>;
  listRecentMessagesForTopic(
    topicId: string,
    limit: number,
  ): Promise<RecentTopicMessage[]>;
  searchTopics(
    sessionId: string,
    query: string,
    limit: number,
  ): Promise<TopicSearchResult[]>;
  searchFacts(args: {
    sessionId: string;
    userId?: string | null;
    query: string;
    limit: number;
    topicId?: string | null;
  }): Promise<FactSearchResult[]>;
}

export interface CacheStore {
  getActiveTopicId(sessionId: string): Promise<string | null>;
  setActiveTopicId(sessionId: string, topicId: string | null): Promise<void>;
  getSessionState(sessionId: string): Promise<CachedSessionState | null>;
  setSessionState(sessionId: string, state: CachedSessionState): Promise<void>;
  deleteSessionState(sessionId: string): Promise<void>;
  close?(): Promise<void>;
}

export interface TopicRoutingDecisionContinue {
  action: "continue";
  topicId: string;
  reason: string;
}

export interface TopicRoutingDecisionSwitch {
  action: "switch";
  topicId: string;
  reason: string;
}

export interface TopicRoutingDecisionSpawn {
  action: "spawn";
  topicId: null;
  reason: string;
}

export type TopicRoutingDecision =
  | TopicRoutingDecisionContinue
  | TopicRoutingDecisionSwitch
  | TopicRoutingDecisionSpawn;

export interface TopicRoutingInput {
  sessionId: string;
  text: string;
  activeTopicId: string | null;
  recentTopics: TopicRecord[];
}

export interface RecentTopicMessage {
  membership: TopicMembershipRecord;
  message: MessageRecord;
}

export interface TopicSearchResult {
  topic: TopicRecord;
  score: number;
  matchReasons: string[];
  source: "topic";
}

export interface FactSearchResult {
  fact: FactRecord & { tags: string[] };
  score: number;
  matchReasons: string[];
  source: "fact";
}

export interface VectorSearchResult {
  id: string;
  userId: string | null;
  topicId: string | null;
  sessionId: string | null;
  sourcePath: string;
  title: string;
  text: string;
  tags: string[];
  score: number;
  matchReasons: string[];
  source: "vector";
}

export interface MemorySearchResult {
  sessionId: string;
  userId: string | null;
  query: string;
  topics: TopicSearchResult[];
  facts: FactSearchResult[];
  vectors: VectorSearchResult[];
}

export interface AssembledContext {
  sessionId: string;
  topicId: string | null;
  text: string;
  sections: Array<{
    kind: "topic" | "summary" | "open_loops" | "facts" | "recent_messages";
    content: string;
  }>;
}

export interface ExtractedFactCandidate {
  category: FactCategory;
  key: string;
  value: string;
  sensitivity: FactSensitivity;
  recallPolicy: FactRecallPolicy;
  scope: string;
  confidence: number;
  tags: string[];
}

export interface MemoryV2StoreConfig {
  provider: "sqlite";
  path: string;
}

export interface MemoryV2CacheConfig {
  provider: "memory";
  maxSessions?: number;
  maxTopicsPerSession?: number;
  maxFacts?: number;
}

export interface MemoryV2Config {
  enabled: boolean;
  store: MemoryV2StoreConfig;
  cache: MemoryV2CacheConfig;
  topicRouting?: {
    maxRecentTopics?: number;
    newTopicThreshold?: number;
    switchTopicThreshold?: number;
  };
  contextAssembly?: {
    recentTurns?: number;
    includeTopicShortSummary?: boolean;
    includeOpenLoops?: boolean;
    alwaysFactLimit?: number;
    topicFactLimit?: number;
  };
}
