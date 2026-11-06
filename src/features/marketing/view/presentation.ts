import {
  Coins,
  CreditCard,
  Languages,
  LayoutGrid,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const marketingFeatureCards = [
  { key: "ai", icon: ShieldCheck, path: "/auth" },
  { key: "multiSource", icon: CreditCard, path: "/payment" },
  { key: "outline", icon: Coins, path: "/credits" },
  { key: "export", icon: Zap, path: "/jobs" },
  { key: "batch", icon: Languages, path: "/i18n" },
  { key: "multilingual", icon: LayoutGrid, path: "/admin" },
] as const;
