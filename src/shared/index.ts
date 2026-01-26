// 共享组件导出
export { Analytics } from "./analytics";
export { ModeToggle } from "./mode-toggle";
export { LanguageSwitcher } from "./language-switcher";
export { MaxWidthWrapper } from "./max-width-wrapper";
export { Providers } from "./providers";

// 注意: og-image-template.tsx 不在此导出，因为它使用 next/og (Node.js 模块)
// 请直接导入: import { createOgImageResponse } from "@/shared/og-image-template"
