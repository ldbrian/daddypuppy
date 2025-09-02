import { Redis } from "@upstash/redis"

// 创建 Redis 客户端
const redis = process.env.REDIS_URL ? Redis.fromEnv() : null

// 检查 KV 是否可用
export const isKVAvailable = () => {
  return !!process.env.REDIS_URL && !!redis
}

// KV 存储函数
export async function kvGet<T>(key: string): Promise<T | null> {
  if (!redis) return null

  try {
    const result = await redis.get(key)
    return result as T
  } catch (error) {
    console.error("KV get error:", error)
    return null
  }
}

export async function kvSet<T>(key: string, value: T): Promise<boolean> {
  if (!redis) return false

  try {
    await redis.set(key, value)
    return true
  } catch (error) {
    console.error("KV set error:", error)
    return false
  }
}

export async function kvDel(key: string): Promise<boolean> {
  if (!redis) return false

  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error("KV del error:", error)
    return false
  }
}
