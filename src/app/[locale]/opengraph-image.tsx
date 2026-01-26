import { ImageResponse } from "next/og";

import { siteConfig } from "@/config";

/**
 * 动态 Open Graph 图片配置
 */
export const runtime = "edge";
export const alt = siteConfig.name;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * 动态生成 Open Graph 图片
 *
 * 功能:
 * - 显示站点名称和描述
 * - 使用品牌配色
 * - 适用于社交媒体分享预览
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #7c3aed20 0%, transparent 50%), radial-gradient(circle at 75% 75%, #7c3aed10 0%, transparent 50%)",
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 24,
              boxShadow: "0 8px 32px rgba(124, 58, 237, 0.4)",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              background: "linear-gradient(135deg, #ffffff 0%, #a5a5a5 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {siteConfig.name}
          </span>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
            padding: "0 40px",
          }}
        >
          {siteConfig.description}
        </div>

        {/* URL Badge */}
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            padding: "12px 24px",
            background: "rgba(124, 58, 237, 0.1)",
            borderRadius: 50,
            border: "1px solid rgba(124, 58, 237, 0.3)",
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: "#a78bfa",
            }}
          >
            nextdevkit.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
