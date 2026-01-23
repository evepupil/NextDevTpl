import {
  CTASection,
  FAQSection,
  FeatureGrid,
  HeroSection,
  HowItWorks,
  PricingSection,
  Testimonials,
} from "@/features/marketing/components";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <PricingSection />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </>
  );
}
