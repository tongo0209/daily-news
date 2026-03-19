import { createHash } from "node:crypto";

const MAX_SLUG_LENGTH = 85;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildArticleSlug(title: string, url: string): string {
  const titlePart = slugify(title).slice(0, MAX_SLUG_LENGTH) || "tin-moi";
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 8);

  return `${titlePart}-${hash}`;
}
