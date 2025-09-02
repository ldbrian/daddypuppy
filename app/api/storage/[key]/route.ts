import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// 模拟数据
const mockData: Record<string, any> = {
  memoir_songs: [],
  memoir_memories: [],
  memoir_moods: [],
  memoir_todos: [],
  memoir_photos: [],
};

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
    const { key } = await params
    const client = getRedisClient()

    if (!client) {
      // 返回模拟数据而不是500错误
      return NextResponse.json(mockData[key] || [])
    }

    const data = await client.get(key)
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("GET error:", error)
    // 出现错误时也返回模拟数据
    const { key } = await params
    return NextResponse.json(mockData[key] || [])
  }
}

// POST - 写入数据
export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = await params
    const body = await request.json()
    const { data } = body

    const client = getRedisClient()

    if (!client) {
      // 模拟写入成功
      mockData[key] = data
      return NextResponse.json({ success: true })
    }

    await client.set(key, data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST error:", error)
    // 出现错误时也模拟写入成功
    return NextResponse.json({ success: true })
  }
}

// DELETE - 删除数据
export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const { key } = params
    const client = getRedisClient()

    if (!client) {
      // 模拟删除成功
      if (mockData[key]) {
        delete mockData[key]
      }
      return NextResponse.json({ success: true })
    }

    await client.del(key)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE error:", error)
    // 出现错误时也模拟删除成功
    return NextResponse.json({ success: true })
  }
}
