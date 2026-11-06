"use client";

import Image from "next/image";
import { type ReactNode, Suspense } from "react";

import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { authSiteName } from "@/features/auth/view";

import brandImage from "../../assets/brand.svg";

export function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="min-h-screen px-4 py-8 sm:py-12"
      data-skin="contrast"
      data-skin-view="auth.layout"
    >
      <div className="mx-auto grid w-full max-w-md gap-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              alt="NextDevTpl"
              className="size-8 shrink-0"
              height={32}
              src={brandImage}
              width={32}
            />
            <span className="break-words font-mono text-sm font-bold uppercase">
              {authSiteName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle variant="inline" />
            <LanguageSwitcher />
          </div>
        </header>
        <section className="min-w-0">
          <Suspense fallback={<div className="min-h-48" />}>
            {children}
          </Suspense>
        </section>
      </div>
    </main>
  );
}
