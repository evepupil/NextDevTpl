"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export function SubscriptionFormCard() {
  const [plan, setPlan] = useState("starter");
  const t = useTranslations("Dashboard");

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg">{t("cards.subscription.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("cards.subscription.subtitle")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t("cards.subscription.fields.name")}</Label>
            <Input
              id="name"
              placeholder={t("cards.subscription.placeholders.name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("cards.subscription.fields.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("cards.subscription.placeholders.email")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card">{t("cards.subscription.fields.card")}</Label>
          <Input
            id="card"
            placeholder={t("cards.subscription.placeholders.card")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="month">{t("cards.subscription.fields.expires")}</Label>
            <Input id="month" placeholder={t("cards.subscription.placeholders.month")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">{t("cards.subscription.fields.year")}</Label>
            <Input id="year" placeholder={t("cards.subscription.placeholders.year")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvc">{t("cards.subscription.fields.cvc")}</Label>
            <Input id="cvc" placeholder={t("cards.subscription.placeholders.cvc")} />
          </div>
        </div>

        <RadioGroup
          value={plan}
          onValueChange={setPlan}
          className="grid gap-4 md:grid-cols-2"
        >
          <div>
            <RadioGroupItem
              value="starter"
              id="starter"
              className="peer sr-only"
            />
            <Label
              htmlFor="starter"
              className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
            >
              <span className="font-medium">
                {t("cards.subscription.plan.starter.title")}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("cards.subscription.plan.starter.price")}
              </span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="pro" id="pro" className="peer sr-only" />
            <Label
              htmlFor="pro"
              className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
            >
              <span className="font-medium">
                {t("cards.subscription.plan.pro.title")}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("cards.subscription.plan.pro.price")}
              </span>
            </Label>
          </div>
        </RadioGroup>

        <div className="space-y-2">
          <Label htmlFor="notes">{t("cards.subscription.fields.notes")}</Label>
          <Textarea
            id="notes"
            placeholder={t("cards.subscription.placeholders.notes")}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms" className="text-sm">
            {t("cards.subscription.terms")}
          </Label>
        </div>

        <Button className="w-full">{t("cards.subscription.submit")}</Button>
      </CardContent>
    </Card>
  );
}
