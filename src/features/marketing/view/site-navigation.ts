import { siteNavigation } from "@/modules/site-navigation";

export interface MarketingSiteNavigation {
  blogHref: string | null;
  cookiePolicyHref: string | null;
  pseoHref: string | null;
  privacyHref: string | null;
  termsHref: string | null;
}

export const marketingSiteNavigation: MarketingSiteNavigation = {
  blogHref: siteNavigation.blogHref,
  cookiePolicyHref: siteNavigation.cookiePolicyHref,
  pseoHref: siteNavigation.pseoHref,
  privacyHref: siteNavigation.privacyHref,
  termsHref: siteNavigation.termsHref,
};

export function filterMarketingNavigation<T extends { href: string }>(
  links: readonly T[],
  routes: MarketingSiteNavigation
): T[] {
  return links.filter((link) => {
    if (link.href === "/blog") return routes.blogHref !== null;
    if (link.href === "/pseo") return routes.pseoHref !== null;
    if (link.href === "/legal/cookie-policy") {
      return routes.cookiePolicyHref !== null;
    }
    if (link.href === "/legal/privacy") return routes.privacyHref !== null;
    if (link.href === "/legal/terms") return routes.termsHref !== null;
    return true;
  });
}
