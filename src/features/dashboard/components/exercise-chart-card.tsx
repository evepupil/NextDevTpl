"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExerciseChartCard() {
  const t = useTranslations("Dashboard");
  const data = [
    { day: t("cards.exercise.days.mon"), thisWeek: 30, lastWeek: 20 },
    { day: t("cards.exercise.days.tue"), thisWeek: 45, lastWeek: 35 },
    { day: t("cards.exercise.days.wed"), thisWeek: 35, lastWeek: 40 },
    { day: t("cards.exercise.days.thu"), thisWeek: 50, lastWeek: 30 },
    { day: t("cards.exercise.days.fri"), thisWeek: 40, lastWeek: 45 },
    { day: t("cards.exercise.days.sat"), thisWeek: 60, lastWeek: 50 },
    { day: t("cards.exercise.days.sun"), thisWeek: 55, lastWeek: 40 },
  ];

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{t("cards.exercise.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("cards.exercise.description")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="thisWeek"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name={t("cards.exercise.thisWeek")}
              />
              <Line
                type="monotone"
                dataKey="lastWeek"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={t("cards.exercise.lastWeek")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            {t("cards.exercise.thisWeek")}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted-foreground" />
            {t("cards.exercise.lastWeek")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
