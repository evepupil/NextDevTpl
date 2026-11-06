import { siteNavigation } from "@/modules/site-navigation";

export interface SharedSiteNavigation {
  homeHref: string;
}

export const sharedSiteNavigation: SharedSiteNavigation = {
  homeHref: siteNavigation.homeHref,
};
