"use client";

import { useState, useEffect } from "react";
import { Search, Coins, Ban, UserCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAllUsersAction,
  banUserAction,
  adminGrantCreditsAction,
} from "@/features/support/actions";
import { UserRoleSelect } from "@/features/support/components";
import { toast } from "sonner";

/**
 * 用户类型定义
 */
interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  banned: boolean;
  bannedReason: string | null;
  emailVerified: boolean;
  createdAt: Date;
  credits: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    status: "active" | "frozen";
  } | null;
  subscription: {
    status: string;
    stripePriceId: string;
    currentPeriodEnd: Date | null;
  } | null;
}

/**
 * 管理员 - 用户管理页面 (客户端组件)
 *
 * 功能:
 * - 搜索用户 (邮箱/名称)
 * - 查看积分余额
 * - 查看订阅状态
 * - 修改用户角色
 * - 封禁/解封用户
 * - 手动充值积分
 */
export default function AdminUsersPage() {
  const t = useTranslations("Admin.users");
  const tToasts = useTranslations("Admin.toasts");
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 封禁对话框状态
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  // 充值对话框状态
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [isGranting, setIsGranting] = useState(false);

  /**
   * 加载用户列表
   */
  const loadUsers = async (query?: string) => {
    setIsLoading(true);
    try {
      const result = await getAllUsersAction(query ? { query } : undefined);
      if (result?.data?.users) {
        setUsers(result.data.users as UserWithDetails[]);
      }
    } catch (error) {
      toast.error(tToasts("loadUsersFailed"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    loadUsers(searchInput);
  };

  /**
   * 打开封禁对话框
   */
  const openBanDialog = (user: UserWithDetails) => {
    setSelectedUser(user);
    setBanReason("");
    setBanDialogOpen(true);
  };

  /**
   * 处理封禁/解封
   */
  const handleBan = async () => {
    if (!selectedUser) return;

    setIsBanning(true);
    try {
      const result = await banUserAction({
        userId: selectedUser.id,
        banned: !selectedUser.banned,
        reason: banReason || undefined,
      });

      if (result?.data) {
        toast.success(
          selectedUser.banned ? tToasts("unbanned") : tToasts("banned")
        );
        setBanDialogOpen(false);
        loadUsers(searchQuery);
      } else if (result?.serverError) {
        toast.error(tToasts("actionFailed"));
        console.error(result.serverError);
      }
    } catch (error) {
      toast.error(tToasts("actionFailed"));
      console.error(error);
    } finally {
      setIsBanning(false);
    }
  };

  /**
   * 打开充值对话框
   */
  const openGrantDialog = (user: UserWithDetails) => {
    setSelectedUser(user);
    setGrantAmount("");
    setGrantReason("");
    setGrantDialogOpen(true);
  };

  /**
   * 处理充值
   */
  const handleGrant = async () => {
    if (!selectedUser) return;

    const amount = parseInt(grantAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error(tToasts("invalidCreditAmount"));
      return;
    }

    if (!grantReason.trim()) {
      toast.error(tToasts("missingGrantReason"));
      return;
    }

    setIsGranting(true);
    try {
      const result = await adminGrantCreditsAction({
        userId: selectedUser.id,
        amount,
        reason: grantReason.trim(),
      });

      if (result?.data) {
        toast.success(tToasts("creditsGranted", { amount }));
        setGrantDialogOpen(false);
        loadUsers(searchQuery);
      } else if (result?.serverError) {
        toast.error(tToasts("grantFailed"));
        console.error(result.serverError);
      }
    } catch (error) {
      toast.error(tToasts("grantFailed"));
      console.error(error);
    } finally {
      setIsGranting(false);
    }
  };

  /**
   * 获取用户名首字母
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * 获取订阅状态显示
   */
  const getSubscriptionBadge = (sub: UserWithDetails["subscription"]) => {
    if (!sub) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          {t("subscription.none")}
        </Badge>
      );
    }

    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: t("subscription.status.active"), color: "bg-green-100 text-green-800" },
      canceled: { label: t("subscription.status.canceled"), color: "bg-yellow-100 text-yellow-800" },
      past_due: { label: t("subscription.status.pastDue"), color: "bg-red-100 text-red-800" },
      incomplete: { label: t("subscription.status.incomplete"), color: "bg-gray-100 text-gray-800" },
    };

    // 获取配置，使用默认值避免 undefined
    const defaultConfig = {
      label: t("subscription.status.incomplete"),
      color: "bg-gray-100 text-gray-800",
    };
    const config = statusMap[sub.status] ?? defaultConfig;
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // 统计数据
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const bannedCount = users.filter((u) => u.banned).length;
  const activeSubscriptions = users.filter(
    (u) => u.subscription?.status === "active"
  ).length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.admins")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.subscribers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeSubscriptions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.banned")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{bannedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("search.placeholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("search.submit")}
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  loadUsers();
                }}
              >
                {t("search.clear")}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("table.title")}
            {searchQuery && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {t("table.search", { query: searchQuery })}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? t("table.emptySearch") : t("table.empty")}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">{t("table.user")}</th>
                    <th className="px-4 py-3">{t("table.status")}</th>
                    <th className="px-4 py-3">{t("table.credits")}</th>
                    <th className="px-4 py-3">{t("table.subscription")}</th>
                    <th className="px-4 py-3">{t("table.role")}</th>
                    <th className="px-4 py-3">{t("table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={u.image || undefined}
                              alt={u.name}
                            />
                            <AvatarFallback className="bg-violet-600 text-white text-xs">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{u.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {u.banned ? (
                            <Badge variant="destructive">
                              {t("status.banned")}
                            </Badge>
                          ) : u.emailVerified ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800"
                            >
                              {t("status.verified")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-yellow-800"
                            >
                              {t("status.unverified")}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">
                            {u.credits?.balance ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getSubscriptionBadge(u.subscription)}
                      </td>
                      <td className="px-4 py-3">
                        <UserRoleSelect userId={u.id} currentRole={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openGrantDialog(u)}
                            title={t("actions.grant")}
                          >
                            <Coins className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={u.banned ? "default" : "destructive"}
                            onClick={() => openBanDialog(u)}
                            title={u.banned ? t("actions.unban") : t("actions.ban")}
                          >
                            {u.banned ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 封禁对话框 */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.banned ? t("banDialog.unbanTitle") : t("banDialog.banTitle")}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.banned
                ? t("banDialog.unbanDescription", { name: selectedUser?.name ?? "" })
                : t("banDialog.banDescription", { name: selectedUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          {!selectedUser?.banned && (
            <div className="space-y-2">
              <Label htmlFor="banReason">{t("banDialog.reasonLabel")}</Label>
              <Textarea
                id="banReason"
                placeholder={t("banDialog.reasonPlaceholder")}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={isBanning}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              variant={selectedUser?.banned ? "default" : "destructive"}
              onClick={handleBan}
              disabled={isBanning}
            >
              {isBanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedUser?.banned ? t("banDialog.confirmUnban") : t("banDialog.confirmBan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 充值对话框 */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("grantDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("grantDialog.description", { name: selectedUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grantAmount">{t("grantDialog.amountLabel")}</Label>
              <Input
                id="grantAmount"
                type="number"
                placeholder={t("grantDialog.amountPlaceholder")}
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                min={1}
                max={100000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grantReason">{t("grantDialog.reasonLabel")}</Label>
              <Textarea
                id="grantReason"
                placeholder={t("grantDialog.reasonPlaceholder")}
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantDialogOpen(false)}
              disabled={isGranting}
            >
              {t("actions.cancel")}
            </Button>
            <Button onClick={handleGrant} disabled={isGranting}>
              {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("grantDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
