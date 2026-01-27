import Stripe from "stripe";

/**
 * Stripe 服务端客户端实例
 *
 * 使用环境变量中的 Secret Key 初始化
 * 注意：此文件只能在服务端使用（Server Components、Server Actions、API Routes）
 * 注意：STRIPE_SECRET_KEY 必须在 .env.local 中配置
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  typescript: true,
});
