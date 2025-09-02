// 客户端存储系统 - 通过 API 与服务端 Redis 通信

// 检查是否在客户端环境
const isClient = typeof window !== "undefined"

// 安全的本地存储函数（备用）
function loadJSONLocal<T>(key: string, fallback: T): T {
  if (!isClient) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw || raw === "undefined" || raw === "null") return fallback

    const parsed = JSON.parse(raw)
    if (parsed === null || parsed === undefined) return fallback

    // 类型安全检查
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback
    if (typeof fallback === "object" && fallback !== null && !Array.isArray(fallback)) {
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return fallback
      }
    }

    return parsed
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
    try {
      window.localStorage.removeItem(key)
    } catch (cleanupError) {
      console.error(`Failed to cleanup corrupted data for ${key}:`, cleanupError)
    }
    return fallback
  }
}

function saveJSONLocal<T>(key: string, value: T): void {
  if (!isClient) return

  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key)
      return
    }

    const serialized = JSON.stringify(value)
    window.localStorage.setItem(key, serialized)
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error)
  }
}

// 通过 API 与服务端 Redis 通信
async function loadJSONServer<T>(key: string, fallback: T): Promise<T> {
  if (!isClient) return fallback

  try {
    const response = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn(`Server storage unavailable for ${key}:`, errorData.error || response.statusText)
      return fallback
    }

    const result = await response.json()

    if (result.success && result.data !== null && result.data !== undefined) {
      // 同步到本地存储作为缓存
      saveJSONLocal(key, result.data)
      return result.data as T
    }

    return fallback
  } catch (error) {
    console.error(`Failed to load ${key} from server:`, error)
    return fallback
  }
}

async function saveJSONServer<T>(key: string, value: T): Promise<boolean> {
  if (!isClient) return false

  try {
    const response = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: value }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn(`Failed to save ${key} to server:`, errorData.error || response.statusText)
      return false
    }

    const result = await response.json()
    return result.success === true
  } catch (error) {
    console.error(`Failed to save ${key} to server:`, error)
    return false
  }
}

// 统一的加载函数 - 优先从服务端加载，备用本地存储
export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  // 先尝试从服务端加载
  const serverData = await loadJSONServer(key, fallback)
  if (serverData !== fallback) {
    return serverData
  }

  // 备用：从本地存储加载
  return loadJSONLocal(key, fallback)
}

// 统一的保存函数 - 优先保存到服务端，同时保存到本地
export async function saveJSON<T>(key: string, value: T): Promise<void> {
  // 立即保存到本地存储（同步）
  saveJSONLocal(key, value)

  // 异步保存到服务端
  try {
    const success = await saveJSONServer(key, value)
    if (!success) {
      console.warn(`Server save failed for ${key}, data only stored locally`)
    }
  } catch (error) {
    console.error("Error saving to server:", error)
  }
}

// 同步函数版本（向后兼容，仅本地存储）
export function loadJSONSync<T>(key: string, fallback: T): T {
  return loadJSONLocal(key, fallback)
}

export function saveJSONSync<T>(key: string, value: T): void {
  saveJSONLocal(key, value)
}

// 检查服务端存储是否可用
export async function isServerStorageAvailable(): Promise<boolean> {
  if (!isClient) return false

  try {
    const response = await fetch("/api/storage/health-check", {
      method: "GET",
      cache: "no-store",
    })
    return response.ok
  } catch (error) {
    console.error("Health check failed:", error)
    return false
  }
}

// 安全的UUID生成函数
export function generateId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID()
    }

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint8Array(16)
      crypto.getRandomValues(array)
      const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
    }

    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`
  } catch (error) {
    console.error("Failed to generate ID:", error)
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
