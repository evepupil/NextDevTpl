"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const cookieOptions = [
  {
    id: "necessary",
    label: "Strictly Necessary",
    description: "These cookies are essential for the website to function properly.",
    defaultChecked: true,
    disabled: true,
  },
  {
    id: "functional",
    label: "Functional Cookies",
    description: "These cookies enable personalized features and functionality.",
    defaultChecked: false,
    disabled: false,
  },
  {
    id: "performance",
    label: "Performance Cookies",
    description: "These cookies help us understand how visitors interact with the website.",
    defaultChecked: false,
    disabled: false,
  },
];

export function CookieSettingsCard() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">Cookie Settings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your cookie settings here.
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
        <Button className="w-full">Save preferences</Button>
      </CardContent>
    </Card>
  );
}
