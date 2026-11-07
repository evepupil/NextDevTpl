"use client";

import { views as dashboardViews } from "@/skin/views/dashboard";
import { views as settingsViews } from "@/skin/views/settings";
import { views as sharedViews } from "@/skin/views/shared";
import { views as supportViews } from "@/skin/views/support";

export const DemoDashboardSkinView = dashboardViews["dashboard.overview"];
export const DemoSettingsSkinView = settingsViews["settings.page"];
export const DemoSupportListSkinView = supportViews["support.list"];
export const DemoSupportDetailSkinView = supportViews["support.detail"];
export const DemoEmptyDashboardSkinView = sharedViews["shared.empty-dashboard"];
