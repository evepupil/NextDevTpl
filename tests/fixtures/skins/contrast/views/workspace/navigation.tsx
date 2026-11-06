"use client";

import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
  useDashboardRuntime,
  useWorkspaceCredits,
  useWorkspacePlan,
} from "@/modules/view-runtime";

import brandImage from "../../assets/brand.svg";

function CreditsBalance() {
  const { balance, isPending } = useWorkspaceCredits();
  const format = useFormatter();
  return (
    <span className="border border-border px-2 py-1 font-mono text-xs">
      {isPending ? "..." : format.number(balance)}
    </span>
  );
}

function PlanLabel() {
  const { id } = useWorkspacePlan();
  const t = useTranslations("Subscription.plans");
  const labels: Record<string, string> = {
    free: t("free"),
    starter: t("starter"),
    pro: t("pro"),
    ultra: t("ultra"),
  };
  return (
    <span className="font-mono text-xs uppercase">
      {labels[id.toLowerCase()] ?? id}
    </span>
  );
}

export function WorkspaceNavigation() {
  const runtime = useDashboardRuntime();
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const [accountOpen, setAccountOpen] = useState(false);

  const signOut = async () => {
    setAccountOpen(false);
    await runtime.actions.onSignOut();
  };

  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
        <Link
          className="mr-auto flex shrink-0 items-center gap-2 font-mono text-sm font-bold text-foreground"
          href="/dashboard"
        >
          <Image alt="NextDevTpl" height={24} src={brandImage} width={24} />
          <span>NextDevTpl</span>
        </Link>
        <nav
          aria-label={t("nav.dashboard")}
          className="order-3 flex w-full flex-wrap items-center gap-2 md:order-none md:w-auto"
        >
          {runtime.navigation.flatMap((group) =>
            group.items.map((item) => {
              const Icon = item.icon;
              const label = item.translationKey
                ? t(item.translationKey)
                : item.title;
              return (
                <Link
                  className="inline-flex min-h-8 items-center gap-2 border border-border px-2 text-xs hover:bg-muted"
                  href={item.href}
                  key={item.href}
                >
                  {Icon && <Icon aria-hidden="true" className="size-4" />}
                  <span>{label}</span>
                </Link>
              );
            })
          )}
        </nav>
        {runtime.user ? (
          <div className="relative flex min-w-0 items-center gap-2">
            {runtime.capabilities.credits && <CreditsBalance />}
            <Button
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              className="max-w-40 truncate"
              onClick={() => setAccountOpen((open) => !open)}
              size="sm"
              variant="outline"
            >
              {runtime.user.name}
            </Button>
            {accountOpen && (
              <div
                className="absolute right-0 top-full z-20 mt-2 grid min-w-52 gap-3 border border-border bg-background p-3 shadow-lg"
                role="menu"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold">
                    {runtime.user.name}
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {runtime.user.email}
                  </p>
                </div>
                {runtime.capabilities.subscription && (
                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                    <span>{t("sidebar.settings")}</span>
                    <PlanLabel />
                  </div>
                )}
                {runtime.navigation.some((group) =>
                  group.items.some(
                    (item) => item.href === "/dashboard/settings"
                  )
                ) && (
                  <Link
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    href="/dashboard/settings"
                    onClick={() => setAccountOpen(false)}
                    role="menuitem"
                  >
                    {t("sidebar.settings")}
                  </Link>
                )}
                <Button
                  onClick={() => void signOut()}
                  role="menuitem"
                  variant="ghost"
                >
                  {t("sidebar.logout")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Link
            className="text-sm text-primary underline-offset-4 hover:underline"
            href="/sign-in"
          >
            {tCommon("login")}
          </Link>
        )}
      </div>
    </header>
  );
}
