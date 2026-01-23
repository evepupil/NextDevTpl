"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    description: "Perfect for side projects",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1GB storage",
    ],
    cta: "Get Started",
    highlighted: false,
    dark: false,
  },
  {
    name: "Pro",
    description: "For growing businesses",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "10GB storage",
      "Custom domain",
      "API access",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    dark: false,
  },
  {
    name: "Lifetime",
    description: "Pay once, use forever",
    monthlyPrice: 299,
    yearlyPrice: 299,
    isLifetime: true,
    features: [
      "Everything in Pro",
      "Lifetime updates",
      "Source code access",
      "Private Discord",
      "1-on-1 onboarding",
    ],
    cta: "Buy Now",
    highlighted: false,
    dark: false,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      "Everything in Lifetime",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support",
      "On-premise option",
      "Security audit",
    ],
    cta: "Contact Sales",
    highlighted: false,
    dark: true,
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Choose the plan that works best for you. All plans include a 14-day
            free trial.
          </p>
        </div>

        {/* Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <Label
            htmlFor="billing-toggle"
            className={cn(
              "text-sm font-medium",
              !isYearly && "text-foreground",
              isYearly && "text-muted-foreground"
            )}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label
            htmlFor="billing-toggle"
            className={cn(
              "text-sm font-medium",
              isYearly && "text-foreground",
              !isYearly && "text-muted-foreground"
            )}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </Label>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const price = plan.isLifetime
              ? plan.monthlyPrice
              : isYearly
                ? plan.yearlyPrice
                : plan.monthlyPrice;

            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-xl",
                  plan.highlighted &&
                    "border-violet-500 shadow-lg shadow-violet-500/10",
                  plan.dark && "border-0 bg-foreground text-background"
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle
                    className={cn(
                      "text-lg font-semibold",
                      plan.dark && "text-background"
                    )}
                  >
                    {plan.name}
                  </CardTitle>
                  <p
                    className={cn(
                      "text-sm",
                      plan.dark ? "text-background/70" : "text-muted-foreground"
                    )}
                  >
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-6">
                    {price !== null ? (
                      <>
                        <span
                          className={cn(
                            "text-4xl font-bold",
                            plan.dark && "text-background"
                          )}
                        >
                          ${price}
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            plan.dark
                              ? "text-background/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {plan.isLifetime
                            ? " one-time"
                            : isYearly
                              ? "/year"
                              : "/month"}
                        </span>
                      </>
                    ) : (
                      <span
                        className={cn(
                          "text-4xl font-bold",
                          plan.dark && "text-background"
                        )}
                      >
                        Custom
                      </span>
                    )}
                  </div>

                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            plan.dark ? "text-background" : "text-violet-600"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm",
                            plan.dark
                              ? "text-background/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      "w-full",
                      plan.highlighted && "bg-violet-600 hover:bg-violet-700",
                      plan.dark &&
                        "bg-background text-foreground hover:bg-background/90"
                    )}
                    variant={
                      plan.highlighted || plan.dark ? "default" : "outline"
                    }
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
