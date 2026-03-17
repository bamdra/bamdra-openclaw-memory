import type {
  MemoryV2Config,
  TopicRecord,
  TopicRoutingDecision,
  TopicRoutingInput,
} from "@openclaw-enhanced/memory-core";

export class TopicRouter {
  constructor(private readonly config: MemoryV2Config) {}

  route(input: TopicRoutingInput): TopicRoutingDecision {
    const normalizedText = normalize(input.text);
    const hasShiftSignal = containsShiftSignal(normalizedText);
    const hasExplicitNewTopicSignal = containsExplicitNewTopicSignal(normalizedText);

    if (!normalizedText) {
      if (input.activeTopicId) {
        return {
          action: "continue",
          topicId: input.activeTopicId,
          reason: "empty-message-falls-back-to-active-topic",
        };
      }

      return {
        action: "spawn",
        topicId: null,
        reason: "empty-message-without-active-topic",
      };
    }

    const activeTopic = input.recentTopics.find(
      (topic: TopicRecord) => topic.id === input.activeTopicId,
    );

    if (hasExplicitNewTopicSignal) {
      return {
        action: "spawn",
        topicId: null,
        reason: "explicit-new-topic-signal",
      };
    }

    if (
      activeTopic &&
      !shouldBreakFromActive(activeTopic, normalizedText, hasShiftSignal) &&
      scoreTopicMatch(activeTopic, normalizedText, {
        rank: 0,
        isActive: true,
      }) >= this.getContinueThreshold()
    ) {
      return {
        action: "continue",
        topicId: activeTopic.id,
        reason: "matched-active-topic",
      };
    }

    const matchedExisting = findBestTopicMatch(
      input.recentTopics,
      normalizedText,
      this.getSwitchThreshold(),
      input.activeTopicId,
    );

    if (matchedExisting) {
      return {
        action: "switch",
        topicId: matchedExisting.id,
        reason: "matched-existing-topic",
      };
    }

    return {
      action: "spawn",
      topicId: null,
      reason: "no-topic-match-above-threshold",
    };
  }

  private getSwitchThreshold(): number {
    return this.config.topicRouting?.switchTopicThreshold ?? 0.68;
  }

  private getContinueThreshold(): number {
    const configured = this.config.topicRouting?.newTopicThreshold;
    if (typeof configured === "number") {
      return configured;
    }

    return Math.max(0.22, this.getSwitchThreshold() * 0.55);
  }
}

function findBestTopicMatch(
  topics: TopicRecord[],
  normalizedText: string,
  threshold: number,
  activeTopicId: string | null,
): TopicRecord | null {
  let bestTopic: TopicRecord | null = null;
  let bestScore = 0;
  let rank = 0;

  for (const topic of topics) {
    if (topic.id === activeTopicId) {
      continue;
    }

    const score = scoreTopicMatch(topic, normalizedText, {
      rank,
      isActive: false,
    });
    if (score >= threshold && score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }

    rank += 1;
  }

  return bestTopic;
}

function scoreTopicMatch(
  topic: TopicRecord,
  normalizedText: string,
  context: {
    rank: number;
    isActive: boolean;
  },
): number {
  const textTokens = tokenizeMeaningful(normalizedText);
  const candidateTexts = [
    topic.title,
    topic.summaryShort,
    topic.summaryLong,
    ...topic.openLoops,
  ].map(normalize);
  const candidateTokens = tokenizeMeaningful(
    [topic.title, topic.summaryShort, topic.summaryLong, ...topic.labels, ...topic.openLoops]
      .map(normalize)
      .join(" "),
  );
  const labelTokens = tokenizeMeaningful(topic.labels.join(" "));

  let bestPhraseScore = 0;
  for (const candidate of candidateTexts) {
    if (!candidate) {
      continue;
    }

    if (candidate.includes(normalizedText) || normalizedText.includes(candidate)) {
      bestPhraseScore = Math.max(
        bestPhraseScore,
        overlapScore(candidate, normalizedText),
      );
    }
  }

  const tokenIntersection = countIntersection(candidateTokens, textTokens);
  const labelIntersection = countIntersection(labelTokens, textTokens);
  const tokenScore =
    tokenIntersection === 0
      ? 0
      : tokenIntersection / Math.max(1, Math.min(candidateTokens.size, textTokens.size));
  const labelScore =
    labelIntersection === 0
      ? 0
      : labelIntersection / Math.max(1, Math.min(labelTokens.size, textTokens.size));
  const recencyBonus = context.rank === 0 ? 0.12 : context.rank === 1 ? 0.06 : 0;
  const activeBonus = context.isActive ? 0.18 : 0;
  const loopBonus =
    topic.openLoops.length > 0 && /继续|待办|下一步|todo|follow up/i.test(normalizedText)
      ? 0.08
      : 0;

  return clamp01(
    bestPhraseScore * 0.5 +
      tokenScore * 0.6 +
      labelScore * 0.45 +
      recencyBonus +
      activeBonus +
      loopBonus,
  );
}

function shouldBreakFromActive(
  topic: TopicRecord,
  normalizedText: string,
  hasShiftSignal: boolean,
): boolean {
  if (!hasShiftSignal) {
    return false;
  }

  const activeTokens = tokenizeMeaningful(
    [topic.title, topic.summaryShort, ...topic.labels].map(normalize).join(" "),
  );
  const textTokens = tokenizeMeaningful(normalizedText);
  const overlap = countIntersection(activeTokens, textTokens);

  return overlap <= 1;
}

function overlapScore(left: string, right: string): number {
  const smaller = Math.min(left.length, right.length);
  const larger = Math.max(left.length, right.length);
  return smaller / larger;
}

function tokenizeMeaningful(value: string): Set<string> {
  return new Set(
    value
      .split(/[^a-z0-9_\u4e00-\u9fff]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
      .filter((token) => !STOP_TOKENS.has(token)),
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function containsShiftSignal(value: string): boolean {
  return [
    "切到",
    "切回",
    "转到",
    "换到",
    "换个话题",
    "换一个话题",
    "聊聊",
    "回到",
    "重新聊",
    "换个主题",
    "切换到",
    "switch to",
    "move to",
    "back to",
    "new topic",
  ].some((marker) => value.includes(marker));
}

function containsExplicitNewTopicSignal(value: string): boolean {
  return [
    "新的 topic",
    "新的topic",
    "新 topic",
    "新topic",
    "这是一个新的",
    "这是新的话题",
    "这是一个新的话题",
    "开启一个新话题",
    "开始一个新话题",
    "开一个新话题",
    "换个新话题",
    "我们开启一个新话题",
    "现在开始一个新话题",
    "从这页重新开始",
    "重新开始一个话题",
    "let's start a new topic",
    "start a new topic",
    "this is a new topic",
  ].some((marker) => value.includes(marker));
}

function countIntersection(left: Set<string>, right: Set<string>): number {
  return [...left].filter((token) => right.has(token)).length;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

const STOP_TOKENS = new Set([
  "当前",
  "这个",
  "我们",
  "继续",
  "讨论",
  "处理",
  "一下",
  "一个",
  "topic",
  "topics",
]);
