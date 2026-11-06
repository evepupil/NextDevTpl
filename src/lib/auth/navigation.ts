import { authNavigation } from "@/config/auth-navigation";
import type { Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/routing";

export function navigateAfterSignOut(
  locale: Locale,
  navigate: (href: string) => void = (href) => window.location.assign(href)
): void {
  navigate(
    getPathname({
      href: authNavigation.afterSignOut,
      locale,
      forcePrefix: true,
    })
  );
}
