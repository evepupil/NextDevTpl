"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialData = [
  { day: "Mon", value: 220 },
  { day: "Tue", value: 300 },
  { day: "Wed", value: 250 },
  { day: "Thu", value: 280 },
  { day: "Fri", value: 320 },
  { day: "Sat", value: 400 },
  { day: "Sun", value: 350 },
];

export function GoalCard() {
  const [goal, setGoal] = useState(350);

  const decrease = () => setGoal((prev) => Math.max(100, prev - 10));
  const increase = () => setGoal((prev) => Math.min(500, prev + 10));

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Move Goal</CardTitle>
        <p className="text-xs text-muted-foreground">Set your daily activity goal.</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={decrease}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="text-5xl font-bold tracking-tighter">{goal}</div>
            <div className="text-xs uppercase text-muted-foreground">
              Calories/day
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={increase}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 h-[60px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={initialData}>
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
