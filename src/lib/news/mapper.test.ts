import { Category } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { normalizeFeedItem } from "./mapper";

describe("normalizeFeedItem", () => {
  it("normalizes RSS item into storage shape", () => {
    const article = normalizeFeedItem(
      {
        title: "AI ships new agent features",
        link: "https://example.com/ai-news",
        contentSnippet: "<p>Large update for developers.</p>",
        isoDate: "2026-03-08T12:00:00.000Z",
        enclosure: {
          url: "https://example.com/image.png",
        },
      },
      Category.TECHNOLOGY,
    );

    expect(article).not.toBeNull();
    expect(article?.title).toBe("AI ships new agent features");
    expect(article?.summary).toContain("Large update");
    expect(article?.category).toBe(Category.TECHNOLOGY);
    expect(article?.imageUrl).toBe("https://example.com/image.png");
  });

  it("returns null for missing title or link", () => {
    const article = normalizeFeedItem(
      {
        title: "",
        link: "",
      },
      Category.SCIENCE,
    );

    expect(article).toBeNull();
  });
});
