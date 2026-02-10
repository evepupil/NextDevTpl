"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export function SubscriptionFormCard() {
  const [plan, setPlan] = useState("starter");

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg">Upgrade your subscription</CardTitle>
        <p className="text-sm text-muted-foreground">
          You are currently on the free plan.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="First Last" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card">Card number</Label>
          <Input id="card" placeholder="1234 5678 9012 3456" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="month">Expires</Label>
            <Input id="month" placeholder="MM" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input id="year" placeholder="YY" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvc">CVC</Label>
            <Input id="cvc" placeholder="123" />
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
              <span className="font-medium">Starter</span>
              <span className="text-sm text-muted-foreground">$9/month</span>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="pro" id="pro" className="peer sr-only" />
            <Label
              htmlFor="pro"
              className="flex cursor-pointer flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
            >
              <span className="font-medium">Pro</span>
              <span className="text-sm text-muted-foreground">$29/month</span>
            </Label>
          </div>
        </RadioGroup>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Add any additional notes..." />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms" className="text-sm">
            I agree to the terms and conditions
          </Label>
        </div>

        <Button className="w-full">Upgrade Plan</Button>
      </CardContent>
    </Card>
  );
}
