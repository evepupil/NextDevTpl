import { siteNavigation } from "@/modules/site-navigation";

export interface AuthSiteNavigation {
  privacyHref: string | null;
  termsHref: string | null;
}

export const authSiteNavigation: AuthSiteNavigation = {
  privacyHref: siteNavigation.privacyHref,
  termsHref: siteNavigation.termsHref,
};
