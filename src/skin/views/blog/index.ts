import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/blog/view";

import { BlogListView } from "./list";
import { BlogPostView } from "./post";

export const views = {
  "blog.list": BlogListView,
  "blog.post": BlogPostView,
} satisfies SkinViews<ViewContracts>;
