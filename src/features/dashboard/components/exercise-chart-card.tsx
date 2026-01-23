"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { day: "Mon", thisWeek: 30, lastWeek: 20 },
  { day: "Tue", thisWeek: 45, lastWeek: 35 },
  { day: "Wed", thisWeek: 35, lastWeek: 40 },
  { day: "Thu", thisWeek: 50, lastWeek: 30 },
  { day: "Fri", thisWeek: 40, lastWeek: 45 },
  { day: "Sat", thisWeek: 60, lastWeek: 50 },
  { day: "Sun", thisWeek: 55, lastWeek: 40 },
];

export function ExerciseChartCard() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">Exercise Minutes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your exercise minutes are ahead of where you normally are.
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
                name="This Week"
              />
              <Line
                type="monotone"
                dataKey="lastWeek"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Last Week"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            This Week
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-muted-foreground" />
            Last Week
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
