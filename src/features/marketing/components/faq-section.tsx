"use client";

import { useTranslations } from "next-intl";
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
    <section className="py-24">
      <div className="container max-w-3xl">
        <h2 className="mb-12 text-center text-3xl font-bold">{t("title")}</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((faq, index) => (
            <AccordionItem
              // biome-ignore lint/suspicious/noArrayIndexKey: static FAQ list
              key={index}
              value={`item-${index}`}
            >
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
