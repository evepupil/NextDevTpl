"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const users = [
  {
    name: "Olivia Martin",
    email: "m@example.com",
    avatar: "/avatars/01.png",
    permission: "edit",
  },
  {
    name: "Isabella Nguyen",
    email: "b@example.com",
    avatar: "/avatars/02.png",
    permission: "view",
  },
  {
    name: "Sofia Davis",
    email: "p@example.com",
    avatar: "/avatars/03.png",
    permission: "view",
  },
];

export function ShareDocumentCard() {
  const t = useTranslations("Dashboard");

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">{t("cards.share.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("cards.share.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value="https://example.com/link/to/document"
            readOnly
            className="flex-1"
          />
          <Button variant="outline" size="icon">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">{t("cards.share.people")}</p>
          {users.map((user) => (
            <div
              key={user.email}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Select defaultValue={user.permission}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">
                    {t("cards.share.permissions.edit")}
                  </SelectItem>
                  <SelectItem value="view">
                    {t("cards.share.permissions.view")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
