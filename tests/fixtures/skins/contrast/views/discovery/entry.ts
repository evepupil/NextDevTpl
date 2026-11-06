import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/pseo/view";

import { PseoDetail } from "./detail";
import { PseoList } from "./list";

export const views = {
  "pseo.list": PseoList,
  "pseo.detail": PseoDetail,
} satisfies SkinViews<ViewContracts>;
