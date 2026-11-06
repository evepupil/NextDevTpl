"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

const POINTS = ["ship", "own", "stack"] as const;

export function AuthBrandPanel() {
  const t = useTranslations("Auth.brand");

  return (
    <aside className="dark relative hidden flex-col justify-between overflow-hidden bg-background p-12 lg:flex">
      <div aria-hidden className="aura pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(72%_72%_at_28%_18%,black,transparent)]"
      />

      <div className="relative flex items-center gap-2">
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative logo */}
        <svg
          className="h-6 w-6 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17 L9 7 L13 14 L21 4" />
          <circle cx="9" cy="7" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="21" cy="4" r="1.4" fill="currentColor" stroke="none" />
        </svg>
        <span className="text-lg font-bold tracking-tight text-foreground">
          NextDev<span className="text-muted-foreground">Tpl</span>
        </span>
      </div>

      <div className="relative max-w-md space-y-8">
        <div className="space-y-4">
          <h2 className="text-balance text-[clamp(1.75rem,2.4vw,2.5rem)] font-extrabold leading-[1.08] tracking-tight text-foreground">
            {t("headline")}
          </h2>
          <p className="leading-relaxed text-muted-foreground">{t("sub")}</p>
        </div>
        <ul className="space-y-3">
          {POINTS.map((key) => (
            <li
              key={key}
              className="flex items-center gap-3 text-sm text-foreground/90"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {t(`points.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-4 border-t border-border pt-6">
        <div className="mono-data text-3xl font-bold tracking-tight text-foreground">
          {t("stat.k")}
        </div>
        <div className="max-w-[16rem] text-xs text-muted-foreground">
          {t("stat.v")}
        </div>
      </div>
    </aside>
  );
}
