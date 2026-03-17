import type {
  ExtractedFactCandidate,
  MemoryV2Config,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";

export interface FactExtractionInput {
  sessionId: string;
  userId?: string | null;
  text: string;
  topic: TopicRecord | null;
}

export class FactExtractor {
  constructor(private readonly _config: MemoryV2Config) {}

  extract(input: FactExtractionInput): ExtractedFactCandidate[] {
    const candidates: ExtractedFactCandidate[] = [];

    candidates.push(...extractNodeVersion(input));
    candidates.push(...extractAccountLikeFacts(input));
    candidates.push(...extractConstraintFacts(input));
    candidates.push(...extractPreferenceFacts(input));
    candidates.push(...extractPersonalWorkFacts(input));

    return dedupeCandidates(candidates);
  }
}

function extractNodeVersion(
  input: FactExtractionInput,
): ExtractedFactCandidate[] {
  const match = input.text.match(/\bnode(?:\.js)?\s*v?(\d+\.\d+\.\d+)\b/i);
  if (!match) {
    return [];
  }

  return [
    {
      category: "environment",
      key: "runtime.node",
      value: `Node ${match[1]}`,
      sensitivity: "normal",
      recallPolicy: "always",
      scope: "global",
      confidence: 0.95,
      tags: ["runtime", "node"],
    },
  ];
}

function extractAccountLikeFacts(
  input: FactExtractionInput,
): ExtractedFactCandidate[] {
  const lower = input.text.toLowerCase();
  const candidates: ExtractedFactCandidate[] = [];
  if (!/(账号|账户|account|appid|appsecret|token|apikey|api key)/i.test(input.text)) {
    return candidates;
  }

  const scope = input.topic ? `topic:${input.topic.id}` : fallbackSharedScope(input);
  const labels = input.topic?.labels ?? [];

  if (/(appid|appsecret|token|apikey|api key)/i.test(input.text)) {
    candidates.push({
      category: "security",
      key: "secret.reference",
      value: abbreviate(input.text),
      sensitivity: "secret_ref",
      recallPolicy: "topic_bound",
      scope,
      confidence: 0.8,
      tags: [...labels, "security", "account"],
    });
  }

  if (/(账号|账户|account)/i.test(input.text)) {
    candidates.push({
      category: "account",
      key: `account.note.${stableKeyFragment(input.text)}`,
      value: abbreviate(input.text),
      sensitivity: "sensitive",
      recallPolicy: "topic_bound",
      scope,
      confidence: 0.72,
      tags: [...labels, "account"],
    });
  }

  return candidates;
}

function extractConstraintFacts(
  input: FactExtractionInput,
): ExtractedFactCandidate[] {
  if (!/(必须|不能|不要|禁止|只能|must|cannot|can't|should not|do not)/i.test(input.text)) {
    return [];
  }

  return [
    {
      category: "constraint",
      key: `constraint.${stableKeyFragment(input.text)}`,
      value: abbreviate(input.text),
      sensitivity: "normal",
      recallPolicy: "topic_bound",
      scope: input.topic ? `topic:${input.topic.id}` : fallbackSharedScope(input),
      confidence: 0.82,
      tags: [...(input.topic?.labels ?? []), "constraint"],
    },
  ];
}

function extractPreferenceFacts(
  input: FactExtractionInput,
): ExtractedFactCandidate[] {
  if (!/(偏好|喜欢|不喜欢|prefer|preference|默认)/i.test(input.text)) {
    return [];
  }

  return [
    {
      category: "preference",
      key: `preference.${stableKeyFragment(input.text)}`,
      value: abbreviate(input.text),
      sensitivity: "normal",
      recallPolicy: "always",
      scope: choosePersonalOrSharedScope(input),
      confidence: 0.76,
      tags: [...(input.topic?.labels ?? []), "preference"],
    },
  ];
}

function extractPersonalWorkFacts(
  input: FactExtractionInput,
): ExtractedFactCandidate[] {
  const explicitCurrentWork =
    input.text.match(/(?:记住[:：]?\s*)?我(?:现在)?主要在做(.+?)[。.!！\n]?$/)
    ?? input.text.match(/(?:记住[:：]?\s*)?我最近主要在做(.+?)[。.!！\n]?$/)
    ?? input.text.match(/(?:记住[:：]?\s*)?我当前主要在做(.+?)[。.!！\n]?$/);
  if (!explicitCurrentWork) {
    return [];
  }
  const value = explicitCurrentWork[1]?.trim();
  if (!value) {
    return [];
  }

  return [
    {
      category: "project",
      key: "当前主要工作",
      value,
      sensitivity: "normal",
      recallPolicy: "always",
      scope: choosePersonalOrSharedScope(input),
      confidence: 0.92,
      tags: [...(input.topic?.labels ?? []), "project", "current-focus"],
    },
  ];
}

function choosePersonalOrSharedScope(input: FactExtractionInput): string {
  if (shouldForceShared(input.text)) {
    return "shared";
  }
  if (input.userId) {
    return `user:${input.userId}`;
  }
  return fallbackSharedScope(input);
}

function fallbackSharedScope(input: FactExtractionInput): string {
  return input.topic ? `topic:${input.topic.id}` : "shared";
}

function shouldForceShared(text: string): boolean {
  return /(共享|shared|公共|团队|所有人|everyone|team|public)/i.test(text);
}

function dedupeCandidates(
  candidates: ExtractedFactCandidate[],
): ExtractedFactCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const dedupeKey = `${candidate.scope}:${candidate.key}:${candidate.value}`;
    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}

function abbreviate(text: string): string {
  const compact = text.trim().replace(/\s+/g, " ");
  return compact.length <= 120 ? compact : `${compact.slice(0, 120)}...`;
}

function stableKeyFragment(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48) || "note";
}
