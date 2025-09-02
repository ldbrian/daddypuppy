"use client"

import React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"
import { Images, NotebookPen, Pencil, Trash2, X, Smile, ZoomIn, Pin, PinOff, Heart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { saveJSON, generateId, loadJSON } from "@/lib/storage"
import { formatDateKey, safeParseDate } from "@/lib/date-utils"
import type { MemoryEntry, MoodKey, DualMood, Language, Identity, Comment } from "@/lib/types"
import PlayfulCard from "@/components/playful-card"

type MoodMap = Record<string, DualMood>

const MOOD_COLORS: Record<MoodKey, string> = {
  great: "bg-yellow-400",
  good: "bg-green-400",
  ok: "bg-blue-300",
  down: "bg-purple-300",
  bad: "bg-red-400",
}
const MOOD_BORDER: Record<MoodKey, string> = {
  great: "border-l-yellow-400",
  good: "border-l-green-400",
  ok: "border-l-blue-300",
  down: "border-l-purple-300",
  bad: "border-l-red-400",
}

// 常用emoji列表
const EMOJI_LIST = [
  "😊",
  "😍",
  "🥰",
  "😘",
  "💕",
  "❤️",
  "💖",
  "💝",
  "🌹",
  "🌸",
  "🎉",
  "🎊",
  "✨",
  "⭐",
  "🌟",
  "💫",
  "🔥",
  "👏",
  "🙌",
  "💪",
  "🍰",
  "🎂",
  "🍕",
  "🍜",
  "☕",
  "🍷",
  "🥂",
  "🍾",
  "🎵",
  "🎶",
  "📸",
  "🎬",
  "🎨",
  "📚",
  "✈️",
  "🏖️",
  "🌅",
  "🌄",
  "🏠",
  "🛏️",
  "😂",
  "🤣",
  "😭",
  "🥺",
  "😴",
  "🤗",
  "🤔",
  "😎",
  "🤩",
  "🥳",
]

// 获取当天的主要心情（优先显示较好的心情）
const getPrimaryMood = (dualMood: DualMood | undefined): MoodKey | undefined => {
  if (!dualMood || typeof dualMood !== "object") return undefined
  const { daddy, puppy } = dualMood
  if (!daddy && !puppy) return undefined
  if (!daddy) return puppy
  if (!puppy) return daddy

  // 如果两人都有心情，选择较好的那个
  const moodOrder: MoodKey[] = ["great", "good", "ok", "down", "bad"]
  const daddyIndex = moodOrder.indexOf(daddy)
  const puppyIndex = moodOrder.indexOf(puppy)
  return daddyIndex <= puppyIndex ? daddy : puppy
}

// 简化的翻译函数
function getTimelineText(language: Language) {
  if (language === "zh") {
    return {
      createMemory: "创建回忆",
      date: "日期",
      title: "标题（可选）",
      content: "内容（可选）",
      imageUrl: "图片链接（可选）",
      uploadImage: "上传图片",
      add: "添加",
      edit: "编辑",
      delete: "删除",
      save: "保存",
      cancel: "取消",
      addMore: "追加图片",
      noRecords: "还没有记录，开始写下第一条回忆吧。",
      untitled: "无标题",
      updateContent: "更新内容...",
      deleteImage: "删除图片",
      addEmoji: "添加表情",
      viewImage: "查看大图",
      imagePreview: "图片预览",
      titlePlaceholder: "给这个美好的回忆起个标题...",
      pin: "置顶",
      unpin: "取消置顶",
      pinned: "已置顶",
      identity: "身份",
      daddy: "Daddy",
      puppy: "Puppy",
      selectIdentity: "选择身份",
      comments: "评论",
      addComment: "添加评论",
      commentPlaceholder: "写下你的评论...",
      noComments: "暂无评论，快来添加第一条评论吧！",
    }
  } else {
    return {
      createMemory: "Create Memory",
      date: "Date",
      title: "Title (Optional)",
      content: "Content (Optional)",
      imageUrl: "Image URL (Optional)",
      uploadImage: "Upload Image",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      addMore: "Add More Images",
      noRecords: "No records yet, start writing your first memory!",
      untitled: "Untitled",
      updateContent: "Update content...",
      deleteImage: "Delete Image",
      addEmoji: "Add Emoji",
      viewImage: "View Image",
      imagePreview: "Image Preview",
      titlePlaceholder: "Give this beautiful memory a title...",
      pin: "Pin",
      unpin: "Unpin",
      pinned: "Pinned",
      identity: "Identity",
      daddy: "Daddy",
      puppy: "Puppy",
      selectIdentity: "Select Identity",
      comments: "Comments",
      addComment: "Add Comment",
      commentPlaceholder: "Write your comment...",
      noComments: "No comments yet, be the first to comment!",
    }
  }
}

export default function Timeline({
  memoriesKey = "memoir_memories",
  moodsKey = "memoir_moods",
  language = "zh",
}: {
  memoriesKey?: string
  moodsKey?: string
  language?: Language
} = {}) {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [moods, setMoods] = useState<MoodMap>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [form, setForm] = useState<{ date: string; title: string; text: string; imageUrl: string; identity: Identity }>({
    date: new Date().toISOString().slice(0, 10),
    title: "",
    text: "",
    imageUrl: "",
    identity: "daddy", // 默认身份为daddy
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [imageViewer, setImageViewer] = useState<{ open: boolean; src?: string }>({ open: false })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createFileInputRef = useRef<HTMLInputElement>(null)
  const createTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [visibleSet, setVisibleSet] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState<{[key: string]: string}>({}) // 为每个记忆存储新评论文本

  const t = getTimelineText(language)
  const locale = language === "zh" ? zhCN : enUS

  // 初始加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // 异步加载数据
        const [memoriesData, moodsData] = await Promise.all([
          loadJSON<MemoryEntry[]>(memoriesKey, []),
          loadJSON<MoodMap>(moodsKey, {}),
        ])

        // 验证和清理数据
        const validMemories = Array.isArray(memoriesData)
          ? memoriesData.filter((m) => m && typeof m === "object" && m.id && m.date)
          : []

        const validMoods = moodsData && typeof moodsData === "object" ? moodsData : {}

        // 如果没有有效数据，使用演示数据
        setMemories(validMemories.length > 0 ? validMemories : demoSeed())
        setMoods(validMoods)
      } catch (error) {
        console.error("Failed to load timeline data:", error)
        setMemories(demoSeed())
        setMoods({})
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [memoriesKey, moodsKey])

  // 保存数据到存储
  const saveMemories = async (newMemories: MemoryEntry[]) => {
    try {
      if (Array.isArray(newMemories) && newMemories.length >= 0) {
        await saveJSON(memoriesKey, newMemories)
      }
    } catch (error) {
      console.error("Failed to save memories:", error)
    }
  }

  const saveMoods = async (newMoods: MoodMap) => {
    try {
      if (newMoods && typeof newMoods === "object") {
        await saveJSON(moodsKey, newMoods)
      }
    } catch (error) {
      console.error("Failed to save moods:", error)
    }
  }

  // 修改排序逻辑：置顶的在最上面，然后按时间倒序排列
  const ordered = useMemo(() => {
    if (!Array.isArray(memories)) return []
    return [...memories]
      .filter((m) => m && typeof m === "object" && m.id && m.date)
      .sort((a, b) => {
        try {
          // 首先按置顶状态排序
          if (a.pinned && !b.pinned) return -1
          if (!a.pinned && b.pinned) return 1

          // 然后按时间倒序排列（最新的在前面）
          const ta = safeParseDate(a.date).getTime()
          const tb = safeParseDate(b.date).getTime()
          if (ta === tb) return (b.createdAt || 0) - (a.createdAt || 0) // 创建时间也倒序
          return tb - ta // 时间倒序
        } catch (error) {
          console.error("Error sorting memories:", error)
          return 0
        }
      })
  }, [memories])

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return

    try {
      const observer = new IntersectionObserver(
        (entries) => {
          setVisibleSet((prev) => {
            const next = new Set(prev)
            for (const e of entries) {
              const id = e.target.getAttribute("data-id")
              if (!id) continue
              if (e.isIntersecting) next.add(id)
            }
            return next
          })
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
      )

      const nodes = document.querySelectorAll<HTMLElement>("[data-timeline-entry='true']")
      nodes.forEach((n) => observer.observe(n))
      return () => observer.disconnect()
    } catch (error) {
      console.error("Error setting up intersection observer:", error)
    }
  }, [ordered.length])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!form.date.trim() || (!form.title.trim() && !form.text.trim() && !form.imageUrl.trim())) return

      const entry: MemoryEntry = {
        id: generateId(),
        date: form.date,
        title: form.title.trim(),
        text: form.text.trim(),
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
        createdAt: Date.now(),
        pinned: false, // 新创建的回忆默认不置顶
        identity: form.identity, // 添加身份信息
        comments: [], // 初始化评论数组
      }

      const newMemories = [...memories, entry]
      setMemories(newMemories)
      await saveMemories(newMemories)

      // 重置表单并关闭弹窗
      setForm({ date: new Date().toISOString().slice(0, 10), title: "", text: "", imageUrl: "", identity: "daddy" })
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Error adding memory:", error)
    }
  }

  const handleEditSave = async (id: string, patch: Partial<MemoryEntry>) => {
    try {
      const newMemories = memories.map((m) => (m.id === id ? { ...m, ...patch } : m))
      setMemories(newMemories)
      await saveMemories(newMemories)
      setEditingId(null)
    } catch (error) {
      console.error("Error saving edit:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const newMemories = memories.filter((m) => m.id !== id)
      setMemories(newMemories)
      await saveMemories(newMemories)
    } catch (error) {
      console.error("Error deleting memory:", error)
    }
  }

  // 新增：置顶/取消置顶功能
  const handleTogglePin = async (id: string) => {
    try {
      const newMemories = memories.map((m) => {
        if (m.id === id) {
          return { ...m, pinned: !m.pinned }
        }
        // 如果当前回忆要置顶，取消其他回忆的置顶状态（只允许一个置顶）
        if (m.pinned && memories.find((mem) => mem.id === id && !mem.pinned)) {
          return { ...m, pinned: false }
        }
        return m
      })
      setMemories(newMemories)
      await saveMemories(newMemories)
    } catch (error) {
      console.error("Error toggling pin:", error)
    }
  }

  const addFileImages = (files: FileList | null, isCreate = false) => {
    if (!files || files.length === 0) return

    try {
      const readers = Array.from(files).map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            try {
              const reader = new FileReader()
              reader.onload = () => resolve(String(reader.result || ""))
              reader.onerror = () => reject(new Error("Failed to read file"))
              reader.readAsDataURL(f)
            } catch (error) {
              reject(error)
            }
          }),
      )

      Promise.all(readers)
        .then(async (imgs) => {
          const validImages = imgs.filter(Boolean)
          if (isCreate) {
            // 创建模式：设置到表单中
            setForm((f) => ({ ...f, imageUrl: validImages[0] || f.imageUrl }))
          } else if (editingId) {
            // 编辑模式：添加到现有回忆
            const newMemories = memories.map((m) =>
              m.id === editingId ? { ...m, images: [...(m.images || []), ...validImages] } : m,
            )
            setMemories(newMemories)
            await saveMemories(newMemories)
          }
        })
        .catch((error) => {
          console.error("Error processing file images:", error)
        })
    } catch (error) {
      console.error("Error adding file images:", error)
    }
  }

  // 删除图片
  const deleteImage = async (memoryId: string, imageIndex: number) => {
    try {
      const newMemories = memories.map((m) => {
        if (m.id === memoryId && m.images) {
          const newImages = m.images.filter((_, i) => i !== imageIndex)
          return { ...m, images: newImages }
        }
        return m
      })
      setMemories(newMemories)
      await saveMemories(newMemories)
    } catch (error) {
      console.error("Error deleting image:", error)
    }
  }

  // 添加emoji到文本
  const addEmoji = (emoji: string, targetId: string) => {
    if (targetId === "create") {
      const textarea = createTextareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newText = form.text.slice(0, start) + emoji + form.text.slice(end)
        setForm((f) => ({ ...f, text: newText }))

        // 恢复光标位置
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + emoji.length, start + emoji.length)
        }, 0)
      } else {
        setForm((f) => ({ ...f, text: f.text + emoji }))
      }
    } else if (editingId === targetId) {
      // 这里需要在EditForm组件中处理
    }
    setShowEmojiPicker(null)
  }

  // 查看图片
  const viewImage = (src: string) => {
    setImageViewer({ open: true, src })
  }

  // 添加评论
  const handleAddComment = async (memoryId: string) => {
    try {
      const commentText = newComment[memoryId]?.trim()
      if (!commentText) return

      const newCommentObj: Comment = {
        id: generateId(),
        identity: "daddy", // 默认为daddy，实际应用中应根据当前用户身份设置
        text: commentText,
        createdAt: Date.now(),
      }

      const newMemories = memories.map(memory => {
        if (memory.id === memoryId) {
          const updatedComments = [...(memory.comments || []), newCommentObj]
          return { ...memory, comments: updatedComments }
        }
        return memory
      })

      setMemories(newMemories)
      await saveMemories(newMemories)
      
      // 清空评论输入框
      setNewComment(prev => ({ ...prev, [memoryId]: "" }))
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  // 删除评论
  const handleDeleteComment = async (memoryId: string, commentId: string) => {
    try {
      const newMemories = memories.map(memory => {
        if (memory.id === memoryId) {
          const updatedComments = (memory.comments || []).filter(comment => comment.id !== commentId)
          return { ...memory, comments: updatedComments }
        }
        return memory
      })

      setMemories(newMemories)
      await saveMemories(newMemories)
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-neutral-500">{language === "zh" ? "加载中..." : "Loading..."}</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 relative">
        {/* 创建回忆按钮 - 位于时间轴顶部 */}
        <div className="flex justify-center mb-6">
          <button
            className="h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold bg-pink-600 hover:bg-pink-500 text-white rounded-full shadow-[0_8px_24px_rgba(236,72,153,0.35)] transition-colors"
            onClick={() => setShowCreateDialog(true)}
          >
            {t.createMemory}
          </button>
        </div>

        {/* 单列"瀑布流感"时间轴 */}
        <div className="relative pt-4">
          {/* 渐变时间轨道（浅色） */}
          <div
            className="absolute left-2 sm:left-3 top-0 bottom-0 w-0.5 sm:w-1 rounded-full"
            aria-hidden="true"
            style={{
              background: "linear-gradient(180deg, rgba(236,72,153,0.35), rgba(244,63,94,0.25), rgba(236,72,153,0.3))",
            }}
          />

          {ordered.length === 0 ? (
            <div className="text-center text-neutral-500 py-8 sm:py-12">
              <NotebookPen className="mx-auto size-5 sm:size-6 mb-2" />
              <p className="text-sm sm:text-base">{t.noRecords}</p>
            </div>
          ) : null}

          <ul className="relative pl-8 sm:pl-10">
            {ordered.map((item, index) => {
              try {
                const itemDate = safeParseDate(item.date)
                const dualMood = moods[formatDateKey(itemDate)]
                const mood = getPrimaryMood(dualMood)
                const moodColor = mood ? MOOD_COLORS[mood] : "bg-pink-300"
                const moodBorder = mood ? MOOD_BORDER[mood] : "border-l-pink-300"
                const anchorId = `timeline-${formatDateKey(itemDate)}`
                const visible = visibleSet.has(item.id)

                // 检查是否需要显示月份标题（对于倒序排列需要调整逻辑）
                const currentDate = itemDate
                const nextDate = index < ordered.length - 1 ? safeParseDate(ordered[index + 1].date) : null
                const showMonthHeader =
                  index === 0 || // 第一个总是显示
                  !nextDate ||
                  format(currentDate, "yyyy-MM") !== format(nextDate, "yyyy-MM")

                return (
                  <React.Fragment key={item.id}>
                    {/* 月份标题 */}
                    {showMonthHeader && (
                      <li className="relative mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* 月份圆点 */}
                          <span
                            className="absolute -left-[9px] sm:-left-[10px] size-3 sm:size-4 rounded-full bg-pink-500 ring-2 ring-white border border-neutral-200 shadow-[0_0_16px_rgba(236,72,153,0.4)]"
                            aria-hidden="true"
                          />
                          <div className="bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-pink-200 text-xs sm:text-sm font-medium text-pink-700">
                            {format(currentDate, language === "zh" ? "yyyy年MM月" : "MMMM yyyy", { locale })}
                          </div>
                        </div>
                      </li>
                    )}

                    {/* 回忆条目 */}
                    <li
                      id={anchorId}
                      data-id={item.id}
                      data-timeline-entry="true"
                      className={cn(
                        "relative mb-5 sm:mb-7 last:mb-0 transition-all duration-500",
                        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                      )}
                    >
                      {/* 发光圆点（浅底） */}
                      <span
                        className={cn(
                          "absolute -left-[8px] sm:-left-[10px] top-4 sm:top-6 size-2.5 sm:size-3 rounded-full ring-2 ring-white border border-neutral-200",
                          "shadow-[0_0_16px_rgba(236,72,153,0.35)]",
                          moodColor,
                          item.pinned && "ring-4 ring-yellow-200 shadow-[0_0_20px_rgba(251,191,36,0.5)]", // 置顶时的特殊样式
                        )}
                        aria-hidden="true"
                      />

                      <PlayfulCard
                        tiltSeed={item.id}
                        className={cn(
                          "p-3 sm:p-4 border-l-2 sm:border-l-4",
                          moodBorder,
                          item.pinned && "ring-2 ring-yellow-200 bg-yellow-50/30", // 置顶时的特殊背景
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-xs sm:text-sm text-neutral-500">
                                {format(itemDate, language === "zh" ? "MM月dd日 EEE" : "MMM dd, EEE", {
                                  locale,
                                })}
                              </div>
                              {item.pinned && (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs px-1.5 py-0.5"
                                >
                                  <Pin className="size-2.5 mr-1" />
                                  {t.pinned}
                                </Badge>
                              )}
                              {item.identity && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs px-1.5 py-0.5",
                                    item.identity === "daddy" 
                                      ? "bg-blue-100 text-blue-700 border-blue-300" 
                                      : "bg-pink-100 text-pink-700 border-pink-300"
                                  )}
                                >
                                  {item.identity === "daddy" ? (
                                    <User className="size-2.5 mr-1" />
                                  ) : (
                                    <Heart className="size-2.5 mr-1" />
                                  )}
                                  {t[item.identity]}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold tracking-wide text-sm sm:text-base truncate">
                              {item.title || t.untitled}
                            </h3>
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className={cn(
                                "h-7 w-7 sm:h-8 sm:w-8",
                                item.pinned
                                  ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                  : "text-neutral-600 hover:text-yellow-600 hover:bg-yellow-50",
                              )}
                              onClick={() => handleTogglePin(item.id)}
                              aria-label={item.pinned ? t.unpin : t.pin}
                            >
                              {item.pinned ? (
                                <PinOff className="size-3 sm:size-4" />
                              ) : (
                                <Pin className="size-3 sm:size-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-neutral-600 hover:text-pink-600 hover:bg-pink-50 h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => setEditingId(item.id)}
                              aria-label={t.edit}
                            >
                              <Pencil className="size-3 sm:size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              aria-label={t.delete}
                              className="text-rose-600 hover:text-rose-500 hover:bg-rose-50 h-7 w-7 sm:h-8 sm:w-8"
                            >
                              <Trash2 className="size-3 sm:size-4" />
                            </Button>
                          </div>
                        </div>

                        {item.text ? (
                          <p className="mt-2 text-sm sm:text-[15px] leading-5 sm:leading-6 text-neutral-800 whitespace-pre-wrap">
                            {item.text}
                          </p>
                        ) : null}

                        {Array.isArray(item.images) && item.images.length > 0 ? (
                          <>
                            <Separator className="my-2 sm:my-3 bg-neutral-200" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                              {item.images.map((src, i) => (
                                <div key={i} className="relative group">
                                  <img
                                    src={src || "/placeholder.svg?height=160&width=240&query=timeline%20memory%20image"}
                                    alt="回忆图片"
                                    className="h-20 sm:h-28 w-full object-cover rounded-md border border-neutral-200 cursor-pointer"
                                    crossOrigin="anonymous"
                                    onClick={() => viewImage(src)}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/timeline-memory.png"
                                    }}
                                  />
                                  {/* 查看大图按钮 */}
                                  <button
                                    onClick={() => viewImage(src)}
                                    className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    aria-label={t.viewImage}
                                  >
                                    <ZoomIn className="size-4 text-white" />
                                  </button>
                                  {/* 编辑模式下的删除按钮 */}
                                  {editingId === item.id && (
                                    <button
                                      onClick={() => deleteImage(item.id, i)}
                                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm"
                                      aria-label={t.deleteImage}
                                    >
                                      <X className="size-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : null}

                        {/* 评论部分 */}
                        <div className="mt-3">
                          <Separator className="my-3 bg-neutral-200" />
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-700 flex items-center">
                              <span className="mr-2">💬</span>
                              {t.comments} 
                              {item.comments && item.comments.length > 0 && (
                                <span className="ml-2 text-xs text-neutral-500">
                                  ({item.comments.length})
                                </span>
                              )}
                            </h4>
                            
                            {/* 评论列表 */}
                            {item.comments && item.comments.length > 0 ? (
                              <div className="space-y-3">
                                {item.comments.map((comment) => (
                                  <div key={comment.id} className="flex items-start gap-2 p-2 bg-neutral-50 rounded-md">
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                      comment.identity === "daddy" 
                                        ? "bg-blue-100 text-blue-700" 
                                        : "bg-pink-100 text-pink-700"
                                    )}>
                                      {comment.identity === "daddy" ? "D" : "P"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-neutral-700">
                                          {t[comment.identity]}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                          {format(new Date(comment.createdAt), "MM-dd HH:mm")}
                                        </span>
                                      </div>
                                      <p className="text-sm text-neutral-800 mt-1">{comment.text}</p>
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-5 w-5 text-neutral-400 hover:text-red-500"
                                      onClick={() => handleDeleteComment(item.id, comment.id)}
                                    >
                                      <X className="size-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500 italic">{t.noComments}</p>
                            )}
                            
                            {/* 添加评论 */}
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={newComment[item.id] || ""}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder={t.commentPlaceholder}
                                className="flex-1 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleAddComment(item.id)
                                  }
                                }}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleAddComment(item.id)}
                                disabled={!newComment[item.id]?.trim()}
                                className="bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                {t.addComment}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {editingId === item.id ? (
                          <>
                            <Separator className="my-2 sm:my-3 bg-neutral-200" />
                            <EditForm
                              item={item}
                              onCancel={() => setEditingId(null)}
                              onSave={(patch) => handleEditSave(item.id, patch)}
                              onAddFiles={(files) => addFileImages(files)}
                              onAddEmoji={(emoji) => addEmoji(emoji, item.id)}
                              showEmojiPicker={showEmojiPicker === item.id}
                              onToggleEmojiPicker={() =>
                                setShowEmojiPicker(showEmojiPicker === item.id ? null : item.id)
                              }
                              language={language}
                            />
                          </>
                        ) : null}
                      </PlayfulCard>
                    </li>
                  </React.Fragment>
                )
              } catch (error) {
                console.error("Error rendering timeline item:", error, item)
                return null
              }
            })}
          </ul>
        </div>

        {/* 图片查看器 */}
        <Dialog open={imageViewer.open} onOpenChange={(open) => setImageViewer({ ...imageViewer, open })}>
          <DialogContent className="sm:max-w-4xl bg-white text-neutral-900 border-neutral-200">
            <DialogHeader>
              <DialogTitle className="text-neutral-900">{t.imagePreview}</DialogTitle>
            </DialogHeader>
            {imageViewer.src && (
              <div className="flex justify-center">
                <img
                  src={imageViewer.src || "/placeholder.svg"}
                  alt="预览大图"
                  className="max-w-full max-h-[70vh] object-contain rounded-md"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/photo-preview.png"
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* 创建回忆弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto bg-white border border-neutral-200 shadow-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-neutral-900">{t.createMemory}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t.date}</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full bg-white border-neutral-300 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
            
            {/* 身份选择 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t.identity}</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={form.identity === "daddy" ? "default" : "outline"}
                  onClick={() => setForm(f => ({ ...f, identity: "daddy" }))}
                  className={cn(
                    "flex-1",
                    form.identity === "daddy" 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "border-blue-200 text-blue-700 hover:bg-blue-50"
                  )}
                >
                  <User className="size-4 mr-2" />
                  {t.daddy}
                </Button>
                <Button
                  type="button"
                  variant={form.identity === "puppy" ? "default" : "outline"}
                  onClick={() => setForm(f => ({ ...f, identity: "puppy" }))}
                  className={cn(
                    "flex-1",
                    form.identity === "puppy" 
                      ? "bg-pink-600 hover:bg-pink-700 text-white" 
                      : "border-pink-200 text-pink-700 hover:bg-pink-50"
                  )}
                >
                  <Heart className="size-4 mr-2" />
                  {t.puppy}
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t.title}</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t.titlePlaceholder}
                className="w-full bg-white border-neutral-300 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-neutral-700">{t.content}</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(showEmojiPicker === "create" ? null : "create")}
                  className="text-neutral-600 hover:text-pink-600 hover:bg-pink-50 h-6 px-2"
                >
                  <Smile className="size-3 mr-1" />
                  {t.addEmoji}
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  ref={createTextareaRef}
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}

                  className="w-full bg-white border-neutral-300 focus:border-pink-500 focus:ring-pink-500"
                  rows={4}
                />
                {/* Emoji选择器 */}
                {showEmojiPicker === "create" && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg p-3 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-10 gap-1">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmoji(emoji, "create")}
                          className="text-lg hover:bg-neutral-100 rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{t.imageUrl}</label>
              <div className="flex gap-2">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 bg-white border-neutral-300 focus:border-pink-500 focus:ring-pink-500"
                />
                <input
                  ref={createFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => addFileImages(e.target.files, true)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => createFileInputRef.current?.click()}
                  className="border-pink-200 text-pink-700 hover:bg-pink-50"
                >
                  <Images className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setForm({ date: new Date().toISOString().slice(0, 10), title: "", text: "", imageUrl: "", identity: "daddy" })
                }}
                className="flex-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                {t.cancel}
              </Button>
              <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">
                {t.add}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EditForm({
  item,
  onCancel,
  onSave,
  onAddFiles,
  onAddEmoji,
  showEmojiPicker,
  onToggleEmojiPicker,
  language,
}: {
  item: MemoryEntry
  onCancel: () => void
  onSave: (patch: Partial<MemoryEntry>) => void
  onAddFiles: (files: FileList | null) => void
  onAddEmoji: (emoji: string) => void
  showEmojiPicker: boolean
  onToggleEmojiPicker: () => void
  language: Language
}) {
  const [title, setTitle] = useState(item.title || "")
  const [text, setText] = useState(item.text || "")
  const [date, setDate] = useState(item.date.slice(0, 10))
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const t = getTimelineText(language)

  const handleSave = () => {
    try {
      onSave({ title, text, date })
    } catch (error) {
      console.error("Error saving edit form:", error)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    // 在光标位置插入emoji
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = text.slice(0, start) + emoji + text.slice(end)
      setText(newText)

      // 恢复光标位置
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    } else {
      setText(text + emoji)
    }
    onToggleEmojiPicker()
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs text-neutral-600 block">{t.date}</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white border-neutral-200 text-neutral-900 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-neutral-600 block">{t.title}</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white border-neutral-200 text-neutral-900 text-sm"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-neutral-600 block">{t.content}</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleEmojiPicker}
            className="text-neutral-600 hover:text-pink-600 hover:bg-pink-50 h-6 px-2"
          >
            <Smile className="size-3 mr-1" />
            {t.addEmoji}
          </Button>
        </div>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.updateContent}
            className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-sm"
          />
          {/* Emoji选择器 */}
          {showEmojiPicker && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-neutral-200 rounded-md shadow-lg p-3 max-h-32 overflow-y-auto">
              <div className="grid grid-cols-10 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-lg hover:bg-neutral-100 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onAddFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
          onClick={() => fileRef.current?.click()}
        >
          <Images className="mr-2 size-4" />
          {t.addMore}
        </Button>
        <div className="flex gap-2 sm:ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-neutral-600 hover:text-pink-600 hover:bg-pink-50 flex-1 sm:flex-none"
            onClick={onCancel}
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-pink-600 hover:bg-pink-500 text-white flex-1 sm:flex-none"
            onClick={handleSave}
          >
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  )
}

function demoSeed(): MemoryEntry[] {
  try {
    const today = new Date()
    const d1 = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 6))
    const d2 = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 3))
    const d3 = today

    return [
      {
        id: generateId(),
        date: d1.toISOString().slice(0, 10),
        title: "第一次一起散步 🚶‍♂️🚶‍♀️",
        text: "沿着河边走了很久，风很温柔。💕",
        images: ["/river-walk-date.png"],
        createdAt: Date.now() - 3_000_000,
        pinned: false,
        identity: "daddy",
        comments: [
          {
            id: generateId(),
            identity: "puppy",
            text: "那天真的很开心！",
            createdAt: Date.now() - 2_900_000,
          }
        ],
      },
      {
        id: generateId(),
        date: d2.toISOString().slice(0, 10),
        title: "做饭实验 👨‍🍳",
        text: "一起做了番茄意面，比想象中好吃！🍝✨",
        images: ["/homemade-pasta-dinner.png"],
        createdAt: Date.now() - 2_000_000,
        pinned: false,
        identity: "puppy",
        comments: [],
      },
      {
        id: generateId(),
        date: d3.toISOString().slice(0, 10),
        title: "电影之夜 🎬",
        text: "窝在沙发看了一部老电影。🛋️💕",
        images: ["/cozy-movie-night-couch.png"],
        createdAt: Date.now() - 1_000_000,
        pinned: false,
        identity: "daddy",
        comments: [],
      },
    ]
  } catch (error) {
    console.error("Error creating demo seed:", error)
    return []
  }
}