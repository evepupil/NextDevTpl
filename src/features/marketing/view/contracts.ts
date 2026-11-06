import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export interface MarketingLayoutViewProps {
  children: ReactNode;
}

export interface MarketingHomeViewProps {
  locale: string;
}

export interface MarketingLegalViewProps {
  locale: string;
  slug: string;
  title: string;
  formattedDate: string;
  body: ReactNode;
}

export interface MarketingHeaderUser {
  image: string | null;
  name: string;
}

export interface MarketingNavigationItem {
  title: string;
  href: string;
  translationKey?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: LucideIcon;
  description?: string;
}

export interface MarketingProductNavigationItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface MarketingProductNavigationGroup {
  title: string;
  items: readonly MarketingProductNavigationItem[];
}

export interface MarketingHeaderViewProps {
  isPending: boolean;
  user: MarketingHeaderUser | null;
  mainNav: readonly MarketingNavigationItem[];
  productsNav: readonly MarketingProductNavigationGroup[];
}

export type MarketingHeaderController = MarketingHeaderViewProps;

export interface MarketingHeaderViewHostProps {
  View: ComponentType<MarketingHeaderViewProps>;
}

export interface MarketingFooterLink {
  title: string;
  href: string;
  external?: boolean;
}

export interface MarketingFooterController {
  siteName: string;
  productLinks: readonly MarketingFooterLink[];
  legalLinks: readonly MarketingFooterLink[];
  socialLinks: {
    github: string;
    twitter: string;
  };
}

export interface MarketingPricingPlanModel {
  id: "free" | "starter" | "pro" | "ultra";
  price: number;
  priceSuffix: string;
  credits: number;
  isCurrent: boolean;
  isPending: boolean;
  isLoading: boolean;
  isPopular: boolean;
  featureKeys: readonly string[];
}

export interface MarketingPricingController {
  plans: readonly MarketingPricingPlanModel[];
  isYearly: boolean;
  setIsYearly: (value: boolean) => void;
  yearlyDiscount: number;
  isPending: boolean;
  hasSubscription: boolean;
  onSubscribe: (planId: MarketingPricingPlanModel["id"]) => void;
  onManageSubscription: () => void;
}

export interface ViewContracts {
  "marketing.header": MarketingHeaderViewProps;
  "marketing.layout": MarketingLayoutViewProps;
  "marketing.home": MarketingHomeViewProps;
  "marketing.legal": MarketingLegalViewProps;
}
