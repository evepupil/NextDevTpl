import "server-only";

import { createElement } from "react";

import {
  getAllBlogSlugs,
  getBlogPost,
  getBlogPostLocales,
  getBlogPosts,
} from "@/lib/source";

import type { BlogListViewProps, BlogPostViewProps } from "./view";

function getSlug(path: string): string {
  const fileName = path.split("/").at(-1) ?? "";
  return fileName.replace(/\.mdx$/, "");
}

function formatListDate(date: Date | string): string {
  return typeof date === "string"
    ? date
    : (date.toISOString().split("T")[0] ?? "");
}

function toIsoDate(date: Date | string): string {
  return typeof date === "string" ? date : date.toISOString();
}

function getDateTimestamp(date: Date | string): number {
  return date instanceof Date ? date.getTime() : new Date(date).getTime();
}

export function getBlogListViewData(locale: string): BlogListViewProps {
  const posts = getBlogPosts(locale)
    .slice()
    .sort((a, b) => getDateTimestamp(b.date) - getDateTimestamp(a.date))
    .map((post) => ({
      slug: getSlug(post.info.path),
      title: post.title,
      ...(post.description !== undefined && {
        description: post.description,
      }),
      date: formatListDate(post.date),
      ...(post.author !== undefined && { author: post.author }),
      ...(post.tags !== undefined && { tags: post.tags }),
    }));

  return { locale, posts };
}

export function getBlogPostViewData(
  locale: string,
  slug: string
): BlogPostViewProps | null {
  const post = getBlogPost(slug, locale);
  if (!post) return null;

  const formattedDate =
    typeof post.date === "string"
      ? post.date
      : post.date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  return {
    locale,
    slug,
    title: post.title,
    ...(post.description !== undefined && {
      description: post.description,
    }),
    ...(post.author !== undefined && { author: post.author }),
    ...(post.tags !== undefined && { tags: post.tags }),
    formattedDate,
    publishedAt: toIsoDate(post.date),
    body: createElement(post.body),
  };
}

export function getBlogPostMetadataData(locale: string, slug: string) {
  const post = getBlogPost(slug, locale);
  if (!post) return null;

  return {
    title: post.title,
    description: post.description,
    publishedDate: toIsoDate(post.date),
    author: post.author,
    tags: post.tags,
    locales: getBlogPostLocales(slug),
  };
}

export function getAllBlogStaticParams() {
  return getAllBlogSlugs();
}
