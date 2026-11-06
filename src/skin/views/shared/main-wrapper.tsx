"use client";

import { Menu, PanelLeft, PanelLeftClose } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui-utils";
import { usePathname } from "@/i18n/routing";

import { useSidebar } from "./sidebar-context";

function getPageTitleKey(pathname: string): string {
  const path = pathname.replace(/^\/[a-z]{2}\//, "/");
  const keyMap: Record<string, string> = {
    "/dashboard": "dashboard",
    "/dashboard/support": "support",
    "/dashboard/support/new": "newTicket",
    "/dashboard/settings": "settings",
    "/dashboard/credits/buy": "credits",
  };
  if (keyMap[path]) return keyMap[path];
  if (path.startsWith("/dashboard/support/")) return "ticketDetails";
  return "dashboard";
}

export function DashboardMainWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations("Dashboard.pages");
  const pageTitle = t(getPageTitleKey(pathname));

  return (
    <main
      className={cn(
        "p-2.5 min-h-screen transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64"
      )}
    >
      <div className="min-h-[calc(100vh-20px)] rounded-lg bg-background border border-border flex flex-col">
        <header className="flex h-12 items-center gap-3 border-b border-border px-4 shrink-0">
          <button
            type="button"
            onClick={toggleMobile}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer md:hidden"
          >
            <Menu className="h-4 w-4 pointer-events-none" />
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer md:flex"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4 pointer-events-none" />
            ) : (
              <PanelLeftClose className="h-4 w-4 pointer-events-none" />
            )}
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-foreground">
            {pageTitle}
          </span>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </main>
  );
}
