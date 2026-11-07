export interface SiteNavigation {
  blogHref: string | null;
  cookiePolicyHref: string | null;
  docsHref: string | null;
  homeHref: string;
  pseoHref: string | null;
  privacyHref: string | null;
  termsHref: string | null;
}

export const siteNavigation = {
  blogHref: "/blog",
  cookiePolicyHref: "/legal/cookie-policy",
  docsHref: "/docs",
  homeHref: "/",
  pseoHref: "/pseo",
  privacyHref: "/legal/privacy",
  termsHref: "/legal/terms",
} as const satisfies SiteNavigation;
