import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import type { PseoPage } from "../lib/pseo-data";

export function PseoFaq({ page }: { page: PseoPage }) {
  const { sections, faq } = page.data;

  return (
    <section className="container py-24" id="faq">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {sections.faq.title}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {sections.faq.subtitle}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faq.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
