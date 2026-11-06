import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAllBlogStaticParams,
  getBlogListViewData,
  getBlogPostMetadataData,
  getBlogPostViewData,
} from "@/features/blog/server";
import {
  getPseoDetailViewData,
  getPseoListViewData,
} from "@/features/pseo/server";

const source = vi.hoisted(() => ({
  getAllBlogSlugs: vi.fn(),
  getBlogPost: vi.fn(),
  getBlogPostLocales: vi.fn(),
  getBlogPosts: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/source", () => source);

function ArticleBody() {
  return null;
}

beforeEach(() => vi.resetAllMocks());

describe("blog view data", () => {
  it("sorts articles without changing source order and exposes only view data", () => {
    const posts = [
      {
        title: "Older",
        date: "2026-10-01",
        info: { path: "zh/older.mdx" },
        body: ArticleBody,
      },
      {
        title: "Newer",
        description: "Article summary",
        date: new Date("2026-10-15T00:00:00Z"),
        author: "Editor",
        tags: ["updates"],
        info: { path: "zh/newer.mdx" },
        body: ArticleBody,
      },
    ];
    source.getBlogPosts.mockReturnValue(posts);

    const data = getBlogListViewData("zh");

    expect(source.getBlogPosts).toHaveBeenCalledWith("zh");
    expect(data).toEqual({
      locale: "zh",
      posts: [
        {
          slug: "newer",
          title: "Newer",
          description: "Article summary",
          date: "2026-10-15",
          author: "Editor",
          tags: ["updates"],
        },
        { slug: "older", title: "Older", date: "2026-10-01" },
      ],
    });
    expect(posts[0]?.title).toBe("Older");
  });

  it("returns an empty list and keeps missing localized articles absent", () => {
    source.getBlogPosts.mockReturnValue([]);
    source.getBlogPost.mockReturnValue(undefined);

    expect(getBlogListViewData("zh")).toEqual({ locale: "zh", posts: [] });
    expect(getBlogPostViewData("zh", "english-only")).toBeNull();
    expect(getBlogPostMetadataData("zh", "english-only")).toBeNull();
    expect(source.getBlogPost).toHaveBeenCalledWith("english-only", "zh");
  });

  it("prepares localized dates and a body node without exposing the source record", () => {
    source.getBlogPost.mockReturnValue({
      title: "Article",
      date: new Date("2026-10-15T00:00:00Z"),
      body: ArticleBody,
      info: { path: "en/article.mdx" },
    });

    const data = getBlogPostViewData("en", "article");

    expect(data).toMatchObject({
      locale: "en",
      slug: "article",
      title: "Article",
      formattedDate: "October 15, 2026",
      publishedAt: "2026-10-15T00:00:00.000Z",
    });
    expect(isValidElement(data?.body)).toBe(true);
    if (isValidElement(data?.body)) expect(data.body.type).toBe(ArticleBody);
    expect(data).not.toHaveProperty("info");
  });

  it("preserves string dates and only advertises available language versions", () => {
    source.getBlogPost.mockReturnValue({
      title: "Article",
      date: "2026-10-15",
      body: ArticleBody,
    });
    source.getBlogPostLocales.mockReturnValue(["en"]);
    source.getAllBlogSlugs.mockReturnValue([{ locale: "en", slug: "article" }]);

    expect(getBlogPostViewData("en", "article")?.formattedDate).toBe(
      "2026-10-15"
    );
    expect(getBlogPostMetadataData("en", "article")).toMatchObject({
      publishedDate: "2026-10-15",
      locales: ["en"],
    });
    expect(getAllBlogStaticParams()).toEqual([
      { locale: "en", slug: "article" },
    ]);
  });
});

describe("PSEO view data", () => {
  it("provides localized catalog data and keeps the existing English fallback", () => {
    const english = getPseoListViewData("en");
    const chinese = getPseoListViewData("zh");

    expect(english.pages.length).toBeGreaterThan(0);
    expect(chinese.pages.length).toBe(english.pages.length);
    expect(chinese.pages.every((page) => page.locale === "zh")).toBe(true);
    expect(chinese.overviewCards[0]?.title).toBe("JSON 数据驱动");
    expect(getPseoListViewData("fr")).toEqual(english);
  });

  it("rejects unknown pages and excludes the current page from related content", () => {
    expect(getPseoDetailViewData("en", "missing-page")).toBeNull();
    const data = getPseoDetailViewData("zh", "ai-meeting-notes");

    expect(data?.page).toMatchObject({
      slug: "ai-meeting-notes",
      locale: "zh",
    });
    expect(data?.relatedPages.length).toBeGreaterThan(0);
    expect(
      data?.relatedPages.every((page) => page.slug !== "ai-meeting-notes")
    ).toBe(true);
    expect(data?.relatedPages.every((page) => page.locale === "zh")).toBe(true);
    expect(data?.relatedPages.length).toBeLessThanOrEqual(3);
  });
});
