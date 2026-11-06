import type { ViewContracts as AuthViewContracts } from "@/features/auth/view";
import { views as authViews } from "@/skin/views/auth";
import type { ViewContracts as BlogViewContracts } from "@/features/blog/view";
import { views as blogViews } from "@/skin/views/blog";
import type { ViewContracts as DashboardViewContracts } from "@/features/dashboard/view";
import { views as dashboardViews } from "@/skin/views/dashboard";
import type { ViewContracts as MarketingViewContracts } from "@/features/marketing/view";
import { views as marketingViews } from "@/skin/views/marketing";
import type { ViewContracts as PseoViewContracts } from "@/features/pseo/view";
import { views as pseoViews } from "@/skin/views/pseo";
import type { ViewContracts as SettingsViewContracts } from "@/features/settings/view";
import { views as settingsViews } from "@/skin/views/settings";
import type { ViewContracts as SharedViewContracts } from "@/features/shared/view";
import { views as sharedViews } from "@/skin/views/shared";
import type { ViewContracts as SupportViewContracts } from "@/features/support/view";
import { views as supportViews } from "@/skin/views/support";
import type { SkinViews } from "@/core/skin";

export type SelectedViewContracts = AuthViewContracts &
  BlogViewContracts &
  DashboardViewContracts &
  MarketingViewContracts &
  PseoViewContracts &
  SettingsViewContracts &
  SharedViewContracts &
  SupportViewContracts;

export const skinViews = {
  ...authViews,
  ...blogViews,
  ...dashboardViews,
  ...marketingViews,
  ...pseoViews,
  ...settingsViews,
  ...sharedViews,
  ...supportViews,
} satisfies SkinViews<SelectedViewContracts>;
