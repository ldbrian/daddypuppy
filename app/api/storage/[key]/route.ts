import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// 初始化 Redis 客户端
let redis: Redis | null = null

function getRedisClient() {
  if (!redis) {
    try {
      // 检查必需的环境变量
      const kvUrl = process.env.KV_REST_API_URL
      const kvToken = process.env.KV_REST_API_TOKEN

      if (!kvUrl || !kvToken) {
        console.error("Missing KV environment variables:", {
          KV_REST_API_URL: kvUrl ? "✅" : "❌",
          KV_REST_API_TOKEN: kvToken ? "✅" : "❌",
        })
        return null
      }

      // 使用显式配置创建 Redis 客户端
      redis = new Redis({
        url: kvUrl,
        token: kvToken,
      })
    } catch (error) {
      console.error("Failed to initialize Redis:", error)
      return null
    }
  }
  return redis
}

// GET - 读取数据
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params
    const client = getRedisClient()

    if (!client) {
      return NextResponse.json(
        {
          error: "Redis not available",
          details: "Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables",
        },
        { status: 500 },
      )
    }

    const data = await client.get(key)

    return NextResponse.json({
      success: true,
      data: data || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Storage GET error:", error)
    return NextResponse.json(
      {
        error: "Failed to read data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - 写入数据
export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params
    const body = await request.json()
    const { data } = body

    const client = getRedisClient()

    if (!client) {
      return NextResponse.json(
        {
          error: "Redis not available",
          details: "Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables",
        },
        { status: 500 },
      )
    }

    // 保存数据到 Redis
    await client.set(key, data)

    return NextResponse.json({
      success: true,
      message: "Data saved successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Storage POST error:", error)
    return NextResponse.json(
      {
        error: "Failed to save data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - 删除数据
export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params
    const client = getRedisClient()

    if (!client) {
      return NextResponse.json(
        {
          error: "Redis not available",
          details: "Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables",
        },
        { status: 500 },
      )
    }

    await client.del(key)

    return NextResponse.json({
      success: true,
      message: "Data deleted successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Storage DELETE error:", error)
    return NextResponse.json(
      {
        error: "Failed to delete data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
