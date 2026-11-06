import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/blog/view";

import { BlogList } from "./list";
import { BlogPost } from "./post";

export const views = {
  "blog.list": BlogList,
  "blog.post": BlogPost,
} satisfies SkinViews<ViewContracts>;
