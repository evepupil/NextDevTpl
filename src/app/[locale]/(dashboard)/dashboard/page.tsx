import { eq } from "drizzle-orm";
import { Coins, Headset, Settings } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { creditsBalance } from "@/db/schema";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const t = await getTranslations("DashboardPages.dashboard");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // 获取积分余额
  const balanceData = await db.query.creditsBalance.findFirst({
    where: eq(creditsBalance.userId, userId),
  });

  const credits = balanceData?.balance ?? 0;

  return (
    <div className="container mx-auto space-y-8 px-4 py-6 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Credits Card */}
      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t("stats.credits.title")}
          </CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(credits).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("stats.credits.description")}
          </p>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4">
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard/credits">
            <Coins className="mr-2 h-5 w-5" />
            {t("actions.credits")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-5 w-5" />
            {t("actions.settings")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard/support">
            <Headset className="mr-2 h-5 w-5" />
            {t("actions.support")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
