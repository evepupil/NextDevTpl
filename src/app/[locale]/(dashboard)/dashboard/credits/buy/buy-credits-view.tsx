"use client";

/**
 * 购买积分套餐视图组件
 *
 * 显示积分套餐列表，允许用户选择并购买
 */

import { Check, Coins, Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createCreditsPurchaseCheckout } from "@/credits/actions";
import { CREDIT_PACKAGES } from "@/credits/config";
import { cn } from "@/lib/utils";

/**
 * 购买积分套餐视图
 */
export function BuyCreditPackagesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled");

  // 创建 Checkout Session
  const { execute, isPending } = useAction(createCreditsPurchaseCheckout, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "创建支付会话失败");
    },
  });

  // 显示取消提示
  useEffect(() => {
    if (canceled) {
      toast.info("支付已取消");
      // 清除 URL 参数
      router.replace("/dashboard/credits/buy");
    }
  }, [canceled, router]);

  /**
   * 处理购买按钮点击
   */
  const handlePurchase = (packageId: "lite" | "standard" | "pro") => {
    execute({ packageId });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Purchase Credits</h1>
        <p className="text-muted-foreground">
          Choose a credit package to unlock AI features and capabilities
        </p>
      </div>

      {/* 套餐列表 */}
      <div className="grid gap-6 md:grid-cols-3">
        {CREDIT_PACKAGES.map((pkg) => {
          const isPopular = "popular" in pkg && pkg.popular;

          return (
            <Card
              key={pkg.id}
              className={cn(
                "relative flex flex-col",
                isPopular && "border-primary shadow-lg"
              )}
            >
              {/* 热门标签 */}
              {isPopular && (
                <Badge
                  className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* 积分数量 */}
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-6 w-6 text-amber-500" />
                  <span className="text-4xl font-bold">{pkg.credits}</span>
                  <span className="text-muted-foreground">credits</span>
                </div>

                <Separator />

                {/* 价格 */}
                <div className="text-center">
                  <span className="text-3xl font-bold">${pkg.price}</span>
                  <span className="text-muted-foreground"> USD</span>
                </div>

                {/* 特性列表 */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Instant delivery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Valid for 90 days</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Use for all AI features</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  disabled={isPending}
                  onClick={() => handlePurchase(pkg.id as "lite" | "standard" | "pro")}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Buy ${pkg.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* 返回链接 */}
      <div className="text-center">
        <Button variant="ghost" onClick={() => router.push("/dashboard/settings?tab=usage")}>
          ← Back to Usage
        </Button>
      </div>
    </div>
  );
}
