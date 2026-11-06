"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/routing";

import type { LanguageController, LanguageOption } from "./contracts";

const locales = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
] as const satisfies readonly LanguageOption[];

export function useLanguageController(): LanguageController {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const onLocaleChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(
        // @ts-expect-error Route params are inferred from the current pathname.
        { pathname, params },
        { locale: newLocale }
      );
    });
  };

  return { locale, isPending, locales, onLocaleChange };
}
