function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function normalizeBullet(sentence: string): string {
  const cleaned = sentence.replace(/^[\-•\d.\s]+/, "").trim();

  if (cleaned.length <= 180) {
    return cleaned;
  }

  return `${cleaned.slice(0, 177).trim()}...`;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const item of items) {
    const key = item.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(item);
  }

  return results;
}

function extractKeyFigures(text: string, limit = 3): string[] {
  const matches = text.match(/\b\d[\d.,%]*\s?(?:tỷ|triệu|nghìn|USD|đồng|km|ha|ca|người|điểm|%)?/gi) ?? [];
  const cleaned = dedupe(
    matches
      .map((item) => item.trim())
      .filter((item) => item.length >= 2),
  );

  return cleaned.slice(0, limit);
}

function extractMainActors(text: string, limit = 3): string[] {
  const matches =
    text.match(/\b[A-ZÀ-Ỹ][\p{L}]+(?:\s+[A-ZÀ-Ỹ][\p{L}]+){0,3}\b/gu) ?? [];
  const cleaned = dedupe(
    matches
      .map((item) => item.trim())
      .filter((item) => item.length >= 3),
  );

  return cleaned.slice(0, limit);
}

function buildReadDecision(summary: string, content: string | null): string {
  const merged = `${summary} ${content ?? ""}`.trim();
  const hasNumbers = /\d/.test(merged);
  const hasRiskWords = /(khẩn|cảnh báo|điều tra|thanh tra|xử lý|tai nạn|dịch|giảm mạnh|tăng mạnh)/i.test(merged);

  if (hasRiskWords || hasNumbers) {
    return "Nên đọc full: có chi tiết quan trọng/số liệu cần đối chiếu.";
  }

  if (merged.length > 700) {
    return "Nên đọc full: bài có nhiều bối cảnh và thông tin bổ sung.";
  }

  return "Đọc nhanh là đủ cho bức tranh chính, đọc full nếu cần chi tiết.";
}

export function buildQuickSummary(
  summary: string,
  content: string | null,
  maxItems = 3,
): string[] {
  const mergedText = [summary, content ?? ""].filter(Boolean).join(" ").trim();

  if (!mergedText) {
    return ["Bài viết chưa có đủ dữ liệu để tóm tắt nhanh."];
  }

  const candidates = splitSentences(mergedText).map(normalizeBullet);
  const uniqueItems: string[] = [];

  for (const sentence of candidates) {
    if (sentence.length < 30) {
      continue;
    }

    if (!uniqueItems.includes(sentence)) {
      uniqueItems.push(sentence);
    }

    if (uniqueItems.length >= maxItems) {
      break;
    }
  }

  if (uniqueItems.length === 0) {
    return [normalizeBullet(summary)];
  }

  return uniqueItems;
}

export type InsightSummary = {
  highlights: string[];
  mainActors: string[];
  keyFigures: string[];
  readDecision: string;
};

export function buildInsightSummary(summary: string, content: string | null): InsightSummary {
  const mergedText = [summary, content ?? ""].filter(Boolean).join(" ").trim();

  return {
    highlights: buildQuickSummary(summary, content, 3),
    mainActors: extractMainActors(mergedText),
    keyFigures: extractKeyFigures(mergedText),
    readDecision: buildReadDecision(summary, content),
  };
}
