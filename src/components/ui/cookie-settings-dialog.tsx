"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/components/ui-utils";
import { useCookieSettingsController } from "@/features/shared/view";

export interface CookieSettingsDialogProps {
  children: ReactNode;
}

export function CookieSettingsDialog({ children }: CookieSettingsDialogProps) {
  const t = useTranslations("Cookie");
  const {
    open,
    onOpenChange,
    expandedItems,
    toggleExpanded,
    getCategoryValue,
    onCategoryChange,
    onAcceptAll,
    onRejectAll,
    onSavePreferences,
  } = useCookieSettingsController();

  const cookieCategories = [
    {
      id: "necessary",
      title: t("essential.title"),
      description: t("essential.description"),
      required: true,
    },
    {
      id: "analytics",
      title: t("analytics.title"),
      description: t("analytics.description"),
      required: false,
    },
    {
      id: "marketing",
      title: t("marketing.title"),
      description: t("marketing.description"),
      required: false,
    },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-hidden p-0 [&>button]:hidden"
        overlayClassName="bg-black/30"
      >
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {t("dialog.title")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          <div className="mb-6">
            <h3 className="mb-2 font-semibold">{t("dialog.heading")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dialog.description")}
            </p>
          </div>

          <div className="space-y-3">
            {cookieCategories.map((category) => {
              const isExpanded = expandedItems.includes(category.id);
              const isChecked = getCategoryValue(category.id);

              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(category.id)}
                >
                  <div className="rounded-lg border">
                    <div className="flex items-center justify-between p-4">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                          <span className="font-medium">{category.title}</span>
                        </button>
                      </CollapsibleTrigger>
                      <Switch
                        checked={isChecked}
                        onCheckedChange={(value) =>
                          onCategoryChange(category.id, value)
                        }
                        disabled={category.required}
                      />
                    </div>

                    <CollapsibleContent>
                      <div className="border-t px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="flex gap-2">
            <Button
              onClick={onAcceptAll}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("acceptAll")}
            </Button>
            <Button
              variant="outline"
              onClick={onRejectAll}
              className="border-border text-foreground hover:bg-muted"
            >
              {t("rejectAll")}
            </Button>
          </div>
          <Button variant="outline" onClick={onSavePreferences}>
            {t("dialog.acceptCurrentSelection")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
