"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateUserRoleAction } from "@/features/support/actions";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";

interface UserRoleSelectProps {
  /** 用户 ID */
  userId: string;
  /** 当前角色 */
  currentRole: "user" | "admin";
}

/**
 * 用户角色选择组件
 *
 * 管理员可以通过此组件修改用户角色
 */
export function UserRoleSelect({ userId, currentRole }: UserRoleSelectProps) {
  const router = useRouter();
  const t = useTranslations("Admin.roles");
  const tToast = useTranslations("Admin.toasts");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState(currentRole);

  /**
   * 处理角色变更
   */
  const handleRoleChange = async (newRole: string) => {
    if (newRole === role) return;

    setIsLoading(true);

    try {
      const result = await updateUserRoleAction({
        userId,
        role: newRole as "user" | "admin",
      });

      if (result?.data) {
        toast.success(tToast("roleUpdated", { role: t(newRole) }));
        setRole(newRole as "user" | "admin");
        router.refresh();
      } else if (result?.serverError) {
        toast.error(tToast("roleUpdateFailed"));
        console.error(result.serverError);
      }
    } catch (error) {
      toast.error(tToast("roleUpdateFailed"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 显示当前角色的徽章样式
  const getRoleBadge = (r: string) => {
    if (r === "admin") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          {t("admin")}
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      >
        {t("user")}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          {tToast("updating")}
        </span>
      </div>
    );
  }

  return (
    <Select value={role} onValueChange={handleRoleChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue>{getRoleBadge(role)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          >
            {t("user")}
          </Badge>
        </SelectItem>
        <SelectItem value="admin">
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            {t("admin")}
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
