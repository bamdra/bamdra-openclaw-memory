import type {
  AssembledContext,
  FactRecord,
  MemoryV2Config,
  RecentTopicMessage,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";

export interface ContextAssemblyInput {
  sessionId: string;
  topic: TopicRecord | null;
  recentMessages: RecentTopicMessage[];
  alwaysFacts: Array<FactRecord & { tags: string[] }>;
  topicFacts: Array<FactRecord & { tags: string[] }>;
}

export class ContextAssembler {
  constructor(private readonly config: MemoryV2Config) {}

  assemble(input: ContextAssemblyInput): AssembledContext {
    const sections: AssembledContext["sections"] = [];
    const maxFactValueChars = this.config.contextAssembly?.maxFactValueChars ?? 280;
    const recentMessageMaxChars = this.config.contextAssembly?.recentMessageMaxChars ?? 1200;

    if (input.topic) {
      sections.push({
        kind: "topic",
        content: trimToLength(
          `Topic: ${input.topic.title}\nLabels: ${joinList(input.topic.labels)}`,
          240,
        ),
      });

      if (this.config.contextAssembly?.includeTopicShortSummary !== false) {
        sections.push({
          kind: "summary",
          content: trimToLength(input.topic.summaryShort || "(no short summary yet)", 600),
        });
      }

      if (
        this.config.contextAssembly?.includeOpenLoops !== false &&
        input.topic.openLoops.length > 0
      ) {
        sections.push({
          kind: "open_loops",
          content: trimToLength(
            input.topic.openLoops.map((item) => `- ${trimToLength(item, 120)}`).join("\n"),
            600,
          ),
        });
      }
    }

    const facts = [
      ...limitFacts(
        input.alwaysFacts,
        this.config.contextAssembly?.alwaysFactLimit ?? 12,
      ),
      ...limitFacts(
        input.topicFacts,
        this.config.contextAssembly?.topicFactLimit ?? 16,
      ),
    ];

    if (facts.length > 0) {
      sections.push({
        kind: "facts",
        content: facts
          .map((fact) => {
            const prefix =
              fact.sensitivity === "secret_ref"
                ? "[secret-ref]"
                : `[${fact.category}]`;
            return `${prefix} ${trimToLength(fact.key, 80)}: ${trimToLength(fact.value, maxFactValueChars)}`;
          })
          .join("\n"),
      });
    }

    if (input.recentMessages.length > 0) {
      sections.push({
        kind: "recent_messages",
        content: trimToLength(
          input.recentMessages
            .map(({ message }) => `${message.role}: ${trimToLength(normalizeWhitespace(message.text), 220)}`)
            .join("\n"),
          recentMessageMaxChars,
        ),
      });
    }

    const maxChars = this.config.contextAssembly?.maxChars ?? 4000;
    const text = trimToLength(
      sections
        .filter((section) => section.content.trim().length > 0)
        .map((section) => `[${section.kind}]\n${section.content}`)
        .join("\n\n"),
      maxChars,
    );

    return {
      sessionId: input.sessionId,
      topicId: input.topic?.id ?? null,
      text,
      sections: sections.filter((section) => section.content.trim().length > 0),
    };
  }
}

function joinList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}

function limitFacts<T>(values: T[], limit: number): T[] {
  return values.slice(0, Math.max(0, limit));
}

function trimToLength(value: string, maxChars: number): string {
  if (maxChars <= 0) {
    return "";
  }

  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxChars) {
    return normalized;
  }

  if (maxChars <= 3) {
    return normalized.slice(0, maxChars);
  }

  return `${normalized.slice(0, maxChars - 3).trimEnd()}...`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
