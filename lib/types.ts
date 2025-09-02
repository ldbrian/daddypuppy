export type Language = "zh" | "en"

export type MoodKey = "great" | "good" | "ok" | "down" | "bad"

export type DualMood = {
  daddy?: MoodKey
  puppy?: MoodKey
}

export type Identity = "daddy" | "puppy"

export type Comment = {
  id: string
  identity: Identity
  text: string
  createdAt: number
}

export type MemoryEntry = {
  id: string
  date: string // ISO date string
  title: string
  text: string
  images?: string[]
  createdAt: number
  pinned?: boolean // 新增：是否置顶
  identity?: Identity // 新增：记录创建者身份
  comments?: Comment[] // 新增：评论列表
}