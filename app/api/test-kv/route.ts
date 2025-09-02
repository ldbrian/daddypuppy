import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

export async function GET() {
  try {
    // 检查环境变量
    const kvUrl = process.env.KV_REST_API_URL
    const kvToken = process.env.KV_REST_API_TOKEN
    const redisUrl = process.env.REDIS_URL

    console.log("Environment variables check:")
    console.log("KV_REST_API_URL:", kvUrl ? `${kvUrl.substring(0, 20)}...` : "MISSING")
    console.log("KV_REST_API_TOKEN:", kvToken ? `${kvToken.substring(0, 10)}...` : "MISSING")
    console.log("REDIS_URL:", redisUrl ? `${redisUrl.substring(0, 20)}...` : "MISSING")

    if (!kvUrl || !kvToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing KV environment variables",
          details: {
            KV_REST_API_URL: kvUrl ? "✅ Present" : "❌ Missing",
            KV_REST_API_TOKEN: kvToken ? "✅ Present" : "❌ Missing",
            REDIS_URL: redisUrl ? "✅ Present" : "❌ Missing",
            help: "Please check your Vercel project environment variables in Settings > Environment Variables",
          },
        },
        { status: 500 },
      )
    }

    // 验证 URL 格式
    if (!kvUrl.startsWith("https://")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid KV_REST_API_URL format",
          details: {
            provided: kvUrl,
            expected: "Should start with https://",
          },
        },
        { status: 500 },
      )
    }

    // 创建 Redis 客户端
    let redis: Redis

    try {
      // 使用 URL 和 Token
      redis = new Redis({
        url: kvUrl,
        token: kvToken,
      })
    } catch (clientError) {
      console.error("Redis client creation failed:", clientError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create Redis client",
          details: {
            clientError: clientError instanceof Error ? clientError.message : "Unknown client error",
          },
        },
        { status: 500 },
      )
    }

    // 简单的连接测试
    console.log("Testing basic KV operations...")

    const testKey = `memoir_health_check_${Date.now()}`
    const testValue = "connection_test"

    try {
      // 测试 SET 操作
      console.log("Testing SET operation...")
      const setResult = await redis.set(testKey, testValue, { ex: 60 })
      console.log("SET result:", setResult)

      // 测试 GET 操作
      console.log("Testing GET operation...")
      const getValue = await redis.get(testKey)
      console.log("GET result:", getValue)

      // 测试 DEL 操作
      console.log("Testing DEL operation...")
      const delResult = await redis.del(testKey)
      console.log("DEL result:", delResult)

      // 验证数据一致性
      const isDataConsistent = getValue === testValue

      return NextResponse.json({
        success: true,
        message: "KV connection test successful! 🎉",
        tests: {
          environment: {
            KV_REST_API_URL: "✅ Valid",
            KV_REST_API_TOKEN: "✅ Valid",
            REDIS_URL: redisUrl ? "✅ Available" : "ℹ️ Not set",
          },
          operations: {
            set: setResult === "OK" ? "✅ Success" : `⚠️ Unexpected result: ${setResult}`,
            get: isDataConsistent ? "✅ Success" : `❌ Data mismatch: expected '${testValue}', got '${getValue}'`,
            delete: delResult === 1 ? "✅ Success" : `⚠️ Unexpected result: ${delResult}`,
          },
          data: {
            testKey,
            testValue,
            retrievedValue: getValue,
            setResult,
            delResult,
            isConsistent: isDataConsistent,
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (operationError) {
      console.error("KV operation failed:", operationError)

      // 尝试获取更详细的错误信息
      const errorDetails: any = {
        message: operationError instanceof Error ? operationError.message : "Unknown operation error",
      }

      if (operationError instanceof Error) {
        errorDetails.stack = operationError.stack
        errorDetails.name = operationError.name
      }

      // 检查是否是认证错误
      if (errorDetails.message.includes("401") || errorDetails.message.includes("Unauthorized")) {
        errorDetails.suggestion = "Check if your KV_REST_API_TOKEN is correct"
      }

      // 检查是否是网络错误
      if (errorDetails.message.includes("fetch") || errorDetails.message.includes("network")) {
        errorDetails.suggestion = "Check if your KV_REST_API_URL is correct and accessible"
      }

      return NextResponse.json(
        {
          success: false,
          error: "KV operation failed",
          details: errorDetails,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unexpected error in KV test:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error during KV test",
        details: {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          type: typeof error,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return GET()
}
