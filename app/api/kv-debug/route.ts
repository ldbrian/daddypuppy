import { NextResponse } from "next/server"

export async function GET() {
  // 调试端点 - 只显示环境变量状态，不执行实际操作
  const kvUrl = process.env.KV_REST_API_URL
  const kvToken = process.env.KV_REST_API_TOKEN
  const redisUrl = process.env.REDIS_URL

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    kv_config: {
      KV_REST_API_URL: kvUrl
        ? {
            present: true,
            format: kvUrl.startsWith("https://") ? "✅ Valid HTTPS" : "❌ Invalid format",
            domain: kvUrl.split("/")[2] || "unknown",
            length: kvUrl.length,
          }
        : { present: false },
      KV_REST_API_TOKEN: kvToken
        ? {
            present: true,
            length: kvToken.length,
            starts_with: kvToken.substring(0, 4) + "...",
          }
        : { present: false },
      REDIS_URL: redisUrl
        ? {
            present: true,
            format: redisUrl.startsWith("redis://") ? "✅ Valid Redis URL" : "❌ Invalid format",
            length: redisUrl.length,
          }
        : { present: false },
    },
    timestamp: new Date().toISOString(),
  })
}
