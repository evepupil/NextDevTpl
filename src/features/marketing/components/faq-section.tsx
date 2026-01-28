import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is NextDevTpl?",
    answer:
      "NextDevTpl is a production-ready starter kit for building SaaS applications with Next.js 15. It includes authentication, payments, database setup, and beautiful UI components out of the box.",
  },
  {
    question: "What technologies does it use?",
    answer:
      "NextDevTpl is built with Next.js 15, React 19, TypeScript, Tailwind CSS 4, Shadcn/UI, Drizzle ORM, and Better Auth. We use modern tools like Biome for linting and formatting.",
  },
  {
    question: "Do I need to know TypeScript?",
    answer:
      "While TypeScript knowledge is helpful, the codebase is well-documented and follows consistent patterns. You can learn as you go, and the strict type checking will help catch errors early.",
  },
  {
    question: "Can I use it for commercial projects?",
    answer:
      "Yes! All paid plans include a commercial license. You can use NextDevTpl to build and ship as many projects as you want.",
  },
  {
    question: "What kind of support is included?",
    answer:
      "All plans include access to our documentation and community Discord. Pro and Lifetime plans include priority support with direct access to the team.",
  },
  {
    question: "How often is it updated?",
    answer:
      "We release updates regularly to keep up with the latest Next.js features and security patches. Lifetime plan holders get all future updates included.",
  },
  {
    question: "Can I customize the UI?",
    answer:
      "Absolutely! The UI is built with Tailwind CSS and Shadcn/UI, making it fully customizable. You can modify colors, fonts, spacing, and components to match your brand.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "Yes, we offer a 14-day money-back guarantee. If you're not satisfied with NextDevTpl, contact us within 14 days of purchase for a full refund.",
  },
];

export function FAQSection() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Everything you need to know about NextDevTpl.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
