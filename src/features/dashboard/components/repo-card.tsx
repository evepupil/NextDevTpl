"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RepoCard() {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">tweakcn</CardTitle>
          <p className="text-sm text-muted-foreground">
            An AI-powered theme editor for shadcn/ui components.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Star className="h-3 w-3" />
          Star
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            TypeScript
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            1.2k
          </div>
          <div>Updated Apr 2024</div>
        </div>
      </CardContent>
    </Card>
  );
}
