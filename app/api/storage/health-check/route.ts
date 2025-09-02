import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

export async function GET() {
  try {
    // 检查环境变量
    const kvUrl = process.env.KV_REST_API_URL
    const kvToken = process.env.KV_REST_API_TOKEN

    if (!kvUrl || !kvToken) {
      return NextResponse.json(
        {
          error: "Redis not configured",
          details: {
            KV_REST_API_URL: kvUrl ? "✅ Present" : "❌ Missing",
            KV_REST_API_TOKEN: kvToken ? "✅ Present" : "❌ Missing",
            message: "Please configure KV environment variables in Vercel project settings",
          },
        },
        { status: 500 },
      )
    }

    // 测试 Redis 连接
    const redis = new Redis({
      url: kvUrl,
      token: kvToken,
    })

    const testKey = `health_check_${Date.now()}`

    // 简单的读写测试
    await redis.set(testKey, "ok", { ex: 10 }) // 10秒过期
    const result = await redis.get(testKey)
    await redis.del(testKey)

    if (result === "ok") {
      return NextResponse.json({
        success: true,
        message: "Server storage is available",
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({ error: "Redis test failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        error: "Server storage unavailable",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
