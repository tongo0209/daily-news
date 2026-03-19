import { describe, expect, it } from "vitest";
import { buildArticleSlug, slugify } from "./slug";

describe("slugify", () => {
  it("removes accents and special chars", () => {
    expect(slugify("Tin Tức Công Nghệ: AI 2026!")).toBe("tin-tuc-cong-nghe-ai-2026");
  });

  it("collapses repeated separators", () => {
    expect(slugify("hello---world___news")).toBe("hello-world-news");
  });
});

describe("buildArticleSlug", () => {
  it("creates deterministic slug with hash", () => {
    const slugA = buildArticleSlug("Hello World", "https://example.com/a");
    const slugB = buildArticleSlug("Hello World", "https://example.com/a");

    expect(slugA).toEqual(slugB);
    expect(slugA.startsWith("hello-world-")).toBe(true);
  });
});
