import { SiteJsonLd, SoftwareAppJsonLd } from "@/components/seo/json-ld";
import type { MarketingHomeViewProps } from "@/features/marketing/view";

import {
  CTASection,
  FAQSection,
  FeatureGrid,
  HeroSection,
  HowItWorks,
  PricingSection,
  Testimonials,
  UseCasesSection,
} from "./components";

export function MarketingHomeView({ locale }: MarketingHomeViewProps) {
  return (
    <>
      <SiteJsonLd locale={locale as "en" | "zh"} />
      <SoftwareAppJsonLd locale={locale as "en" | "zh"} />
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <UseCasesSection />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
