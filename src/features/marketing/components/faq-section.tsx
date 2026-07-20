"use client";

import { useTranslations } from "next-intl";

import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQSection() {
  const t = useTranslations("FAQ");

  const faqItems = [
    {
      question: t("items.0.question"),
      answer: t("items.0.answer"),
    },
    {
      question: t("items.1.question"),
      answer: t("items.1.answer"),
    },
    {
      question: t("items.2.question"),
      answer: t("items.2.answer"),
    },
  ];

  return (
    <section className="border-t py-24">
      <div className="container max-w-3xl">
        <Reveal>
          <div className="mb-12 text-center">
            <span className="eyebrow justify-center">{t("label")}</span>
            <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {t("title")}
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((faq, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static FAQ list
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
