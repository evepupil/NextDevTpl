"use client";

import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsChartCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  chartType: "line" | "area";
  data: { value: number }[];
}

export function StatsChartCard({
  title,
  value,
  change,
  changeType,
  chartType,
  data,
}: StatsChartCardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={`text-xs ${
            changeType === "positive" ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {change}
        </p>
        <div className="mt-4 h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
