"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function CookieSettingsCard() {
  const t = useTranslations("Cookie");

  const cookieOptions = [
    {
      id: "necessary",
      label: t("essential.title"),
      description: t("essential.description"),
      defaultChecked: true,
      disabled: true,
    },
    {
      id: "functional",
      label: t("functional.title"),
      description: t("functional.description"),
      defaultChecked: false,
      disabled: false,
    },
    {
      id: "performance",
      label: t("performance.title"),
      description: t("performance.description"),
      defaultChecked: false,
      disabled: false,
    },
  ] as const;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{t("card.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("card.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {cookieOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-center justify-between space-x-4"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor={option.id} className="text-sm font-medium">
                {option.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
            <Switch
              id={option.id}
              defaultChecked={option.defaultChecked}
              disabled={option.disabled}
            />
          </div>
        ))}
        <Button className="w-full">{t("card.savePreferences")}</Button>
      </CardContent>
    </Card>
  );
}
