"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RepoCard() {
  const t = useTranslations("Dashboard");

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">tweakcn</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("cards.repo.description")}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Star className="h-3 w-3" />
          {t("cards.repo.star")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            {t("cards.repo.language")}
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            1.2k
          </div>
          <div>{t("cards.repo.updated")}</div>
        </div>
      </CardContent>
    </Card>
  );
}
