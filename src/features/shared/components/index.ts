// Shared Components
export { CookieSettingsDialog } from "./cookie-settings-dialog";
export { LanguageSwitcher } from "./language-switcher";
export { MaxWidthWrapper } from "./max-width-wrapper";
export { ModeToggle } from "./mode-toggle";

// Note: og-image-template.tsx 不在此导出，因为它使用 next/og (Node.js 模块)
// 请直接导入: import { createOgImageResponse } from "@/features/shared/components/og-image-template"