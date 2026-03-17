import type {
  FactSearchResult,
  FactRecord,
  MessageRecord,
  PersistentStore,
  RecentTopicMessage,
  SessionStateRecord,
  TopicSearchResult,
  TopicMembershipRecord,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";
import { mkdirSync } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const SCHEMA_VERSION = 2;
const TABLES = {
  schemaMigrations: "bamdra_memory_schema_migrations",
  messages: "bamdra_memory_messages",
  topics: "bamdra_memory_topics",
  topicMembership: "bamdra_memory_topic_membership",
  facts: "bamdra_memory_facts",
  factTags: "bamdra_memory_fact_tags",
  contextSnapshots: "bamdra_memory_context_snapshots",
  sessionState: "bamdra_memory_session_state",
} as const;

export interface MemorySqliteStoreOptions {
  path: string;
}

export class MemorySqliteStore implements PersistentStore {
  private readonly db: DatabaseSync;

  constructor(private readonly options: MemorySqliteStoreOptions) {
    mkdirSync(dirname(options.path), { recursive: true });
    this.db = new DatabaseSync(options.path);
  }

  async getSchemaVersion(): Promise<number> {
    return SCHEMA_VERSION;
  }

  async applyMigrations(): Promise<void> {
    const schemaSql = await loadSchemaSql();
    this.db.exec(schemaSql);
    applyUserIdentityMigrations(this.db);
  }

  async close(): Promise<void> {
    this.db.close();
  }

  async upsertMessage(record: MessageRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO ${TABLES.messages} (
          id,
          session_id,
          user_id,
          channel_type,
          sender_open_id,
          turn_id,
          parent_turn_id,
          role,
          event_type,
          text,
          ts,
          raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          session_id = excluded.session_id,
          user_id = excluded.user_id,
          channel_type = excluded.channel_type,
          sender_open_id = excluded.sender_open_id,
          turn_id = excluded.turn_id,
          parent_turn_id = excluded.parent_turn_id,
          role = excluded.role,
          event_type = excluded.event_type,
          text = excluded.text,
          ts = excluded.ts,
          raw_json = excluded.raw_json`,
      )
      .run(
        record.id,
        record.sessionId,
        record.userId,
        record.channelType,
        record.senderOpenId,
        record.turnId,
        record.parentTurnId,
        record.role,
        record.eventType,
        record.text,
        record.ts,
        record.rawJson,
      );
  }

  async getSessionState(sessionId: string): Promise<SessionStateRecord | null> {
    const row = this.db
      .prepare(
        `SELECT session_id, user_id, active_topic_id, last_compacted_at, last_turn_id, updated_at
         FROM ${TABLES.sessionState}
         WHERE session_id = ?`,
      )
      .get(sessionId) as SessionStateRow | undefined;

    return row ? mapSessionStateRow(row) : null;
  }

  async upsertSessionState(record: SessionStateRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO ${TABLES.sessionState} (
          session_id,
          user_id,
          active_topic_id,
          last_compacted_at,
          last_turn_id,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          user_id = excluded.user_id,
          active_topic_id = excluded.active_topic_id,
          last_compacted_at = excluded.last_compacted_at,
          last_turn_id = excluded.last_turn_id,
          updated_at = excluded.updated_at`,
      )
      .run(
        record.sessionId,
        record.userId,
        record.activeTopicId,
        record.lastCompactedAt,
        record.lastTurnId,
        record.updatedAt,
      );
  }

  async listTopics(sessionId: string): Promise<TopicRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT
          id,
          session_id,
          user_id,
          title,
          status,
          parent_topic_id,
          summary_short,
          summary_long,
          open_loops_json,
          labels_json,
          created_at,
          last_active_at
         FROM ${TABLES.topics}
         WHERE session_id = ?
         ORDER BY last_active_at DESC`,
      )
      .all(sessionId) as unknown as TopicRow[];

    return rows.map(mapTopicRow);
  }

  async getTopic(topicId: string): Promise<TopicRecord | null> {
    const row = this.db
      .prepare(
        `SELECT
          id,
          session_id,
          user_id,
          title,
          status,
          parent_topic_id,
          summary_short,
          summary_long,
          open_loops_json,
          labels_json,
          created_at,
          last_active_at
         FROM ${TABLES.topics}
         WHERE id = ?`,
      )
      .get(topicId) as TopicRow | undefined;

    return row ? mapTopicRow(row) : null;
  }

  async upsertTopic(record: TopicRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO ${TABLES.topics} (
          id,
          session_id,
          user_id,
          title,
          status,
          parent_topic_id,
          summary_short,
          summary_long,
          open_loops_json,
          labels_json,
          created_at,
          last_active_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          session_id = excluded.session_id,
          user_id = excluded.user_id,
          title = excluded.title,
          status = excluded.status,
          parent_topic_id = excluded.parent_topic_id,
          summary_short = excluded.summary_short,
          summary_long = excluded.summary_long,
          open_loops_json = excluded.open_loops_json,
          labels_json = excluded.labels_json,
          created_at = excluded.created_at,
          last_active_at = excluded.last_active_at`,
      )
      .run(
        record.id,
        record.sessionId,
        record.userId,
        record.title,
        record.status,
        record.parentTopicId,
        record.summaryShort,
        record.summaryLong,
        JSON.stringify(record.openLoops),
        JSON.stringify(record.labels),
        record.createdAt,
        record.lastActiveAt,
      );
  }

  async upsertTopicMembership(record: TopicMembershipRecord): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO ${TABLES.topicMembership} (
          message_id,
          topic_id,
          score,
          is_primary,
          reason,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(message_id, topic_id) DO UPDATE SET
          score = excluded.score,
          is_primary = excluded.is_primary,
          reason = excluded.reason,
          created_at = excluded.created_at`,
      )
      .run(
        record.messageId,
        record.topicId,
        record.score,
        record.isPrimary ? 1 : 0,
        record.reason,
        record.createdAt,
      );
  }

  async upsertFact(record: FactRecord, tags: string[] = []): Promise<void> {
    this.db.exec("BEGIN");

    try {
      this.db
        .prepare(
          `INSERT INTO ${TABLES.facts} (
            id,
            scope,
            category,
            key,
            value,
            sensitivity,
            recall_policy,
            confidence,
            source_message_id,
            source_topic_id,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            scope = excluded.scope,
            category = excluded.category,
            key = excluded.key,
            value = excluded.value,
            sensitivity = excluded.sensitivity,
            recall_policy = excluded.recall_policy,
            confidence = excluded.confidence,
            source_message_id = excluded.source_message_id,
            source_topic_id = excluded.source_topic_id,
            updated_at = excluded.updated_at`,
        )
        .run(
          record.id,
          record.scope,
          record.category,
          record.key,
          record.value,
          record.sensitivity,
          record.recallPolicy,
          record.confidence,
          record.sourceMessageId,
          record.sourceTopicId,
          record.updatedAt,
        );

      this.db.prepare(`DELETE FROM ${TABLES.factTags} WHERE fact_id = ?`).run(record.id);

      const insertTag = this.db.prepare(
        `INSERT INTO ${TABLES.factTags} (fact_id, tag) VALUES (?, ?)`,
      );

      for (const tag of tags) {
        insertTag.run(record.id, tag);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  async listFactsByScope(
    scope: string,
  ): Promise<Array<FactRecord & { tags: string[] }>> {
    const rows = this.db
      .prepare(
        `SELECT
          f.id,
          f.scope,
          f.category,
          f.key,
          f.value,
          f.sensitivity,
          f.recall_policy,
          f.confidence,
          f.source_message_id,
          f.source_topic_id,
          f.updated_at,
          COALESCE(json_group_array(ft.tag) FILTER (WHERE ft.tag IS NOT NULL), '[]') AS tags_json
         FROM ${TABLES.facts} f
         LEFT JOIN ${TABLES.factTags} ft ON ft.fact_id = f.id
         WHERE f.scope = ?
         GROUP BY
          f.id,
          f.scope,
          f.category,
          f.key,
          f.value,
          f.sensitivity,
          f.recall_policy,
          f.confidence,
          f.source_message_id,
          f.source_topic_id,
          f.updated_at
         ORDER BY f.updated_at DESC`,
      )
      .all(scope) as unknown as FactRow[];

    return rows.map(mapFactRow);
  }

  async listFactsByTags(
    tags: string[],
    recallPolicies: FactRecord["recallPolicy"][] = ["always", "topic_bound"],
  ): Promise<Array<FactRecord & { tags: string[] }>> {
    if (tags.length === 0) {
      return [];
    }

    const tagPlaceholders = tags.map(() => "?").join(", ");
    const recallPolicyPlaceholders = recallPolicies.map(() => "?").join(", ");
    const rows = this.db
      .prepare(
        `SELECT
          f.id,
          f.scope,
          f.category,
          f.key,
          f.value,
          f.sensitivity,
          f.recall_policy,
          f.confidence,
          f.source_message_id,
          f.source_topic_id,
          f.updated_at,
          COALESCE(json_group_array(DISTINCT ft_all.tag) FILTER (WHERE ft_all.tag IS NOT NULL), '[]') AS tags_json
         FROM ${TABLES.facts} f
         JOIN ${TABLES.factTags} ft_match ON ft_match.fact_id = f.id
         LEFT JOIN ${TABLES.factTags} ft_all ON ft_all.fact_id = f.id
         WHERE ft_match.tag IN (${tagPlaceholders})
           AND f.recall_policy IN (${recallPolicyPlaceholders})
         GROUP BY
          f.id,
          f.scope,
          f.category,
          f.key,
          f.value,
          f.sensitivity,
          f.recall_policy,
          f.confidence,
          f.source_message_id,
          f.source_topic_id,
          f.updated_at
         ORDER BY f.updated_at DESC`,
      )
      .all(...tags, ...recallPolicies) as unknown as FactRow[];

    return rows.map(mapFactRow);
  }

  async listRecentMessagesForTopic(
    topicId: string,
    limit: number,
  ): Promise<RecentTopicMessage[]> {
    const rows = this.db
      .prepare(
        `SELECT
          tm.message_id,
          tm.topic_id,
          tm.score,
          tm.is_primary,
          tm.reason,
          tm.created_at,
          m.id,
          m.session_id,
          m.user_id,
          m.channel_type,
          m.sender_open_id,
          m.turn_id,
          m.parent_turn_id,
          m.role,
          m.event_type,
          m.text,
          m.ts,
          m.raw_json
         FROM ${TABLES.topicMembership} tm
         JOIN ${TABLES.messages} m ON m.id = tm.message_id
         WHERE tm.topic_id = ?
         ORDER BY m.ts DESC
         LIMIT ?`,
      )
      .all(topicId, limit) as unknown as RecentTopicMessageRow[];

    return rows.map(mapRecentTopicMessageRow).reverse();
  }

  async searchTopics(
    sessionId: string,
    query: string,
    limit: number,
  ): Promise<TopicSearchResult[]> {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery) {
      return [];
    }

    const likeValue = `%${escapeLike(normalizedQuery)}%`;
    const rows = this.db
      .prepare(
        `SELECT
          id,
          session_id,
          title,
          status,
          parent_topic_id,
          summary_short,
          summary_long,
          open_loops_json,
          labels_json,
          created_at,
          last_active_at
         FROM ${TABLES.topics}
         WHERE session_id = ?
           AND (
             lower(title) LIKE ? ESCAPE '\\'
             OR lower(summary_short) LIKE ? ESCAPE '\\'
             OR lower(summary_long) LIKE ? ESCAPE '\\'
             OR lower(labels_json) LIKE ? ESCAPE '\\'
           )
         ORDER BY last_active_at DESC
         LIMIT ?`,
      )
      .all(sessionId, likeValue, likeValue, likeValue, likeValue, limit) as unknown as TopicRow[];

    return rows
      .map((row) => mapTopicSearchResult(row, normalizedQuery))
      .sort((a, b) => b.score - a.score);
  }

  async searchFacts(args: {
    sessionId: string;
    userId?: string | null;
    query: string;
    limit: number;
    topicId?: string | null;
  }): Promise<FactSearchResult[]> {
    const normalizedQuery = normalizeSearchQuery(args.query);
    if (!normalizedQuery) {
      return [];
    }

    const likeValue = `%${escapeLike(normalizedQuery)}%`;
    const topicScope = args.topicId ? `topic:${args.topicId}` : null;
    const sessionScope = `session:${args.sessionId}`;
    const userScope = args.userId ? `user:${args.userId}` : null;
    const rows = this.db
      .prepare(
        `SELECT
          f.id,
          f.scope,
          f.category,
          f.key,
          f.value,
          f.sensitivity,
          f.recall_policy,
          f.confidence,
          f.source_message_id,
          f.source_topic_id,
          f.updated_at,
          COALESCE(json_group_array(DISTINCT ft_all.tag) FILTER (WHERE ft_all.tag IS NOT NULL), '[]') AS tags_json
         FROM ${TABLES.facts} f
         LEFT JOIN ${TABLES.factTags} ft_match ON ft_match.fact_id = f.id
         LEFT JOIN ${TABLES.factTags} ft_all ON ft_all.fact_id = f.id
         WHERE (
            f.scope IN ('global', 'shared')
            OR f.scope = ?
            OR f.scope = ?
            OR f.scope = ?
            OR f.source_topic_id IN (
              SELECT id FROM ${TABLES.topics} WHERE session_id = ? AND (? IS NULL OR user_id = ?)
            )
         )
           AND (
             lower(f.key) LIKE ? ESCAPE '\\'
             OR lower(f.value) LIKE ? ESCAPE '\\'
             OR lower(f.category) LIKE ? ESCAPE '\\'
             OR lower(COALESCE(ft_match.tag, '')) LIKE ? ESCAPE '\\'
           )
         GROUP BY
          f.id,
          f.scope,
          f.category,
          f.key,
          f.value,
          f.sensitivity,
          f.recall_policy,
          f.confidence,
          f.source_message_id,
          f.source_topic_id,
          f.updated_at
         ORDER BY f.updated_at DESC
         LIMIT ?`,
      )
      .all(
        sessionScope,
        topicScope,
        userScope,
        args.sessionId,
        args.userId ?? null,
        args.userId ?? null,
        likeValue,
        likeValue,
        likeValue,
        likeValue,
        args.limit,
      ) as unknown as FactRow[];

    return rows
      .map((row) => mapFactSearchResult(row, normalizedQuery))
      .sort((a, b) => b.score - a.score);
  }
}

export async function loadSchemaSql(): Promise<string> {
  const candidatePaths = [
    fileURLToPath(new URL("./schema.sql", import.meta.url)),
    fileURLToPath(new URL("../src/schema.sql", import.meta.url)),
  ];

  for (const schemaPath of candidatePaths) {
    try {
      await access(schemaPath);
      return readFile(schemaPath, "utf8");
    } catch {
      continue;
    }
  }

  throw new Error("Unable to locate memory-v2 SQLite schema.sql");
}

interface SessionStateRow {
  session_id: string;
  user_id: string | null;
  active_topic_id: string | null;
  last_compacted_at: string | null;
  last_turn_id: string | null;
  updated_at: string;
}

interface TopicRow {
  id: string;
  session_id: string;
  user_id: string | null;
  title: string;
  status: TopicRecord["status"];
  parent_topic_id: string | null;
  summary_short: string;
  summary_long: string;
  open_loops_json: string;
  labels_json: string;
  created_at: string;
  last_active_at: string;
}

interface FactRow {
  id: string;
  scope: string;
  category: FactRecord["category"];
  key: string;
  value: string;
  sensitivity: FactRecord["sensitivity"];
  recall_policy: FactRecord["recallPolicy"];
  confidence: number;
  source_message_id: string | null;
  source_topic_id: string | null;
  updated_at: string;
  tags_json: string;
}

interface RecentTopicMessageRow {
  message_id: string;
  topic_id: string;
  score: number;
  is_primary: number;
  reason: string;
  created_at: string;
  id: string;
  session_id: string;
  user_id: string | null;
  channel_type: string | null;
  sender_open_id: string | null;
  turn_id: string;
  parent_turn_id: string | null;
  role: MessageRecord["role"];
  event_type: string;
  text: string;
  ts: string;
  raw_json: string;
}

function mapSessionStateRow(row: SessionStateRow): SessionStateRecord {
  return {
    sessionId: row.session_id,
    userId: row.user_id,
    activeTopicId: row.active_topic_id,
    lastCompactedAt: row.last_compacted_at,
    lastTurnId: row.last_turn_id,
    updatedAt: row.updated_at,
  };
}

function mapTopicRow(row: TopicRow): TopicRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    parentTopicId: row.parent_topic_id,
    summaryShort: row.summary_short,
    summaryLong: row.summary_long,
    openLoops: parseJsonArray(row.open_loops_json),
    labels: parseJsonArray(row.labels_json),
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  };
}

function mapFactRow(row: FactRow): FactRecord & { tags: string[] } {
  return {
    id: row.id,
    scope: row.scope,
    category: row.category,
    key: row.key,
    value: row.value,
    sensitivity: row.sensitivity,
    recallPolicy: row.recall_policy,
    confidence: row.confidence,
    sourceMessageId: row.source_message_id,
    sourceTopicId: row.source_topic_id,
    updatedAt: row.updated_at,
    tags: parseJsonArray(row.tags_json),
  };
}

function mapTopicSearchResult(row: TopicRow, normalizedQuery: string): TopicSearchResult {
  const topic = mapTopicRow(row);
  const haystacks = [
    { reason: "title", value: topic.title },
    { reason: "summary_short", value: topic.summaryShort },
    { reason: "summary_long", value: topic.summaryLong },
    { reason: "labels", value: topic.labels.join(" ") },
  ];
  const matchReasons = haystacks
    .filter((entry) => entry.value.toLowerCase().includes(normalizedQuery))
    .map((entry) => entry.reason);

  return {
    topic,
    score: scoreTopicSearch(topic, matchReasons),
    matchReasons,
    source: "topic",
  };
}

function mapFactSearchResult(row: FactRow, normalizedQuery: string): FactSearchResult {
  const fact = mapFactRow(row);
  const haystacks = [
    { reason: "key", value: fact.key },
    { reason: "value", value: fact.value },
    { reason: "category", value: fact.category },
    { reason: "tags", value: fact.tags.join(" ") },
  ];
  const matchReasons = haystacks
    .filter((entry) => entry.value.toLowerCase().includes(normalizedQuery))
    .map((entry) => entry.reason);

  return {
    fact,
    score: scoreFactSearch(fact, matchReasons),
    matchReasons,
    source: "fact",
  };
}

function mapRecentTopicMessageRow(row: RecentTopicMessageRow): RecentTopicMessage {
  return {
    membership: {
      messageId: row.message_id,
      topicId: row.topic_id,
      score: row.score,
      isPrimary: row.is_primary === 1,
      reason: row.reason,
      createdAt: row.created_at,
    },
    message: {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      channelType: row.channel_type,
      senderOpenId: row.sender_open_id,
      turnId: row.turn_id,
      parentTurnId: row.parent_turn_id,
      role: row.role,
      eventType: row.event_type,
      text: row.text,
      ts: row.ts,
      rawJson: row.raw_json,
    },
  };
}

function parseJsonArray(value: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((item): item is string => typeof item === "string");
}

function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function scoreTopicSearch(topic: TopicRecord, matchReasons: string[]): number {
  let score = 0;
  for (const reason of matchReasons) {
    if (reason === "title") {
      score += 5;
    } else if (reason === "labels") {
      score += 4;
    } else if (reason === "summary_short") {
      score += 3;
    } else if (reason === "summary_long") {
      score += 2;
    }
  }
  if (topic.status === "active") {
    score += 1;
  }
  return score;
}

function scoreFactSearch(
  fact: FactRecord & { tags: string[] },
  matchReasons: string[],
): number {
  let score = 0;
  for (const reason of matchReasons) {
    if (reason === "key") {
      score += 5;
    } else if (reason === "tags") {
      score += 4;
    } else if (reason === "value") {
      score += 3;
    } else if (reason === "category") {
      score += 1;
    }
  }
  if (fact.recallPolicy === "always") {
    score += 1;
  }
  return score;
}

function applyUserIdentityMigrations(db: DatabaseSync): void {
  ensureColumn(db, TABLES.messages, "user_id", "TEXT");
  ensureColumn(db, TABLES.messages, "channel_type", "TEXT");
  ensureColumn(db, TABLES.messages, "sender_open_id", "TEXT");
  ensureColumn(db, TABLES.topics, "user_id", "TEXT");
  ensureColumn(db, TABLES.sessionState, "user_id", "TEXT");
}

function ensureColumn(
  db: DatabaseSync,
  tableName: string,
  columnName: string,
  columnSql: string,
): void {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;
  if (rows.some((row) => row.name === columnName)) {
    return;
  }
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSql}`);
}
