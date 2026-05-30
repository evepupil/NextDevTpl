"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function Testimonials() {
  const t = useTranslations("Testimonials");

  const testimonialItems = [
    {
      content: t("items.0.content"),
      author: t("items.0.author"),
      role: t("items.0.role"),
    },
    {
      content: t("items.1.content"),
      author: t("items.1.author"),
      role: t("items.1.role"),
    },
    {
      content: t("items.2.content"),
      author: t("items.2.author"),
      role: t("items.2.role"),
    },
  ];

  return (
    <section className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">{t("title")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonialItems.map((testimonial, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static testimonial list
            <Card key={index} className="rounded-xl border-0 bg-muted/50">
              <CardContent className="p-6">
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}