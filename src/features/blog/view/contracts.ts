import type { ReactNode } from "react";

export interface BlogPostListItem {
  slug: string;
  title: string;
  description?: string;
  date: string;
  author?: string;
  tags?: readonly string[];
}

export interface BlogListViewProps {
  locale: string;
  posts: readonly BlogPostListItem[];
}

export interface BlogPostViewProps {
  locale: string;
  slug: string;
  title: string;
  description?: string;
  author?: string;
  tags?: readonly string[];
  formattedDate: string;
  publishedAt: string;
  body: ReactNode;
}

export interface ViewContracts {
  "blog.list": BlogListViewProps;
  "blog.post": BlogPostViewProps;
}
