import type { ReactNode } from "react";

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

export interface MarketingHeaderController {
  isPending: boolean;
  user: MarketingHeaderUser | null;
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
  "marketing.layout": MarketingLayoutViewProps;
  "marketing.home": MarketingHomeViewProps;
  "marketing.legal": MarketingLegalViewProps;
}
