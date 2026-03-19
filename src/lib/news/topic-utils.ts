const STOPWORDS = new Set([
  "va",
  "voi",
  "cua",
  "cho",
  "tai",
  "tu",
  "mot",
  "nhung",
  "nhung",
  "nhieu",
  "theo",
  "sau",
  "truoc",
  "khi",
  "trong",
  "ngoai",
  "duoc",
  "dang",
  "da",
  "se",
  "la",
  "o",
  "den",
  "ve",
  "ra",
  "vao",
  "nay",
  "kia",
  "an",
  "noi",
  "nguoi",
  "tai",
  "viet",
  "nam",
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(title: string): string[] {
  return normalizeText(title)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

export function buildTopicSignature(title: string): string {
  const unique = Array.from(new Set(tokenize(title)));

  return unique.slice(0, 4).join("-");
}

export function scoreTopicSimilarity(titleA: string, titleB: string): number {
  const a = new Set(tokenize(titleA));
  const b = new Set(tokenize(titleB));

  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...a, ...b]).size;

  return union === 0 ? 0 : intersection / union;
}
