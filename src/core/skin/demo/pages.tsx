"use client";

import { notFound } from "next/navigation";
import {
  DemoDashboardSkinView,
  DemoEmptyDashboardSkinView,
  DemoSettingsSkinView,
  DemoSupportDetailSkinView,
  DemoSupportListSkinView,
} from "../../../modules/demo-skin-views.js";
import type { SupportDetailPageInput } from "../../support/contracts.js";
import {
  projectDashboardOverview,
  projectSupportDetail,
  projectSupportList,
  resolveDemoAssetUrl,
} from "./projections.js";
import { useDemoStore } from "./store.js";

export function DemoDashboardView({ locale }: { readonly locale: string }) {
  const { state } = useDemoStore();
  const data = projectDashboardOverview(state.data);
  if (!data.credits && !data.plan) {
    return <DemoEmptyDashboardSkinView locale={locale} />;
  }
  return <DemoDashboardSkinView data={data} locale={locale} />;
}

export function DemoSettingsView() {
  const { state } = useDemoStore();
  const user = state.data.workspace.user;
  return (
    <DemoSettingsSkinView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: resolveDemoAssetUrl(user.image),
      }}
    />
  );
}

export function DemoSupportListView({ locale }: { readonly locale: string }) {
  const { state } = useDemoStore();
  return (
    <DemoSupportListSkinView {...projectSupportList(state.data, locale)} />
  );
}

export function DemoSupportDetailPage({
  ticketId,
  locale,
}: SupportDetailPageInput) {
  const { state } = useDemoStore();
  const data = projectSupportDetail(state.data, ticketId, locale);
  if (!data) notFound();
  return <DemoSupportDetailSkinView {...data} />;
}
