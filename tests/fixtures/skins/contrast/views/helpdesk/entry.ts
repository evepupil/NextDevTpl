import type { SkinViews } from "@/core/skin";
import type { ViewContracts } from "@/features/support/view";

import { SupportDetail } from "./detail";
import { SupportList } from "./list";
import { NewSupportTicket } from "./new";

export const views = {
  "support.list": SupportList,
  "support.new": NewSupportTicket,
  "support.detail": SupportDetail,
} satisfies SkinViews<ViewContracts>;
