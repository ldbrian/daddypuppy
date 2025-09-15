"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { loadJSON, saveJSON } from "@/lib/storage"
import { ChevronLeft, ChevronRight, Calendar, Heart, User } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import PlayfulCard from "@/components/playful-card"
import type { Language, MoodKey, DualMood } from "@/lib/types"

const MOODS = {
  great: { emoji: "😄", color: "bg-emerald-500", name: "很棒", nameEn: "Great" },
  good: { emoji: "😊", color: "bg-green-400", name: "不错", nameEn: "Good" },
  ok: { emoji: "😐", color: "bg-yellow-400", name: "一般", nameEn: "Okay" },
  down: { emoji: "😔", color: "bg-orange-400", name: "不好", nameEn: "Bad" },
  bad: { emoji: "😢", color: "bg-red-500", name: "糟糕", nameEn: "Terrible" },
} as const

type Identity = "daddy" | "puppy"

export default function MoodCalendar({ 
  language = "zh",
  currentUser = "daddy" // 添加currentUser属性
}: { 
  language?: Language,
  currentUser?: Identity // 添加currentUser类型
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [moods, setMoods] = useState<Record<string, DualMood>>({})
  const [isLoading, setIsLoading] = useState(true)

  const t = useMemo(() => {
    if (language === "zh") {
      return {
        mood: {
          title: "心情日历",
          selectMood: "选择心情",
          noMood: "点击日期记录心情",
          today: "今天",
          prevMonth: "上个月",
          nextMonth: "下个月",
          daddy: "Daddy",
          puppy: "Puppy",
          selectIdentity: "选择身份",
          bothMoods: "双人心情",
          yourMood: "的心情",
        },
      }
    } else {
      return {
        mood: {
          title: "Mood Calendar",
          selectMood: "Select Mood",
          noMood: "Click date to record mood",
          today: "Today",
          prevMonth: "Previous month",
          nextMonth: "Next month",
          daddy: "Daddy",
          puppy: "Puppy",
          selectIdentity: "Select Identity",
          bothMoods: "Both Moods",
          yourMood: "'s Mood",
        },
      }
    }
  }, [language])

  useEffect(() => {
    const loadMoods = async () => {
      try {
        setIsLoading(true)
        const savedMoods = await loadJSON<Record<string, DualMood>>("memoir_moods", {})
        setMoods(savedMoods || {})
      } catch (error) {
        console.error("Failed to load moods:", error)
        setMoods({})
      } finally {
        setIsLoading(false)
      }
    }

    loadMoods()
  }, [])

  const saveMoods = async (newMoods: Record<string, DualMood>) => {
    try {
      await saveJSON("memoir_moods", newMoods)
    } catch (error) {
      console.error("Failed to save moods:", error)
    }
  }

  // 修改setMood函数，直接使用currentUser而不是selectedIdentity
  const setMood = async (date: string, mood: MoodKey) => {
    try {
      const newMoods = {
        ...moods,
        [date]: {
          ...(moods[date] || {}),
          [currentUser]: mood, // 使用currentUser而不是selectedIdentity
        },
      }
      
      setMoods(newMoods)
      await saveJSON("memoir_moods", newMoods)
    } catch (error) {
      console.error("Failed to save mood:", error)
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // 添加上个月的日期填充
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // 添加当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      days.push({ date: currentDate, isCurrentMonth: true })
    }

    // 添加下个月的日期填充
    const remainingDays = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push({ date: nextDate, isCurrentMonth: false })
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const monthDays = getMonthDays(currentDate)
  const monthName = currentDate.toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
  })

  // 创建单独的日期生成函数
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // 添加上个月的日期填充
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push(prevDate)
    }

    // 添加当前月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      days.push(currentDate)
    }

    // 添加下个月的日期填充
    const remainingDays = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day)
      days.push(nextDate)
    }

    return days
  }

  // 辅助函数用于比较两个日期是否相同
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  // 修改渲染日历的函数，移除身份切换逻辑
  const renderCalendar = () => {
    // 获取星期几的缩写（周一到周日）
    const weekDays = language === "zh" 
      ? ["一", "二", "三", "四", "五", "六", "日"] 
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    const calendarDays = getCalendarDays(currentDate).map((date, index) => {
      const isCurrentMonth = date.getMonth() === currentDate.getMonth()
      const dateStr = formatDate(date)
      const dualMood = moods[dateStr]
      const dayIsToday = isSameDay(date, new Date())

      // 获取当前用户的心情
      const userMood = dualMood?.[currentUser] ? MOODS[dualMood[currentUser]!] : null

      return (
        <div key={index} className="relative">
          <button
            onClick={() => {
              if (isCurrentMonth) {
                // 循环切换当前用户的心情
                const moodKeys = Object.keys(MOODS) as MoodKey[]
                const currentMoodIndex = userMood ? moodKeys.indexOf(dualMood![currentUser]!) : -1
                const nextMoodIndex = (currentMoodIndex + 1) % moodKeys.length
                setMood(dateStr, moodKeys[nextMoodIndex])
              }
            }}
            className={`w-8 h-8 text-xs rounded-md transition-all relative overflow-hidden ${
              isCurrentMonth
                ? dayIsToday
                  ? "bg-pink-100 border-2 border-pink-400 text-pink-700 font-bold"
                  : "hover:bg-neutral-100 text-neutral-700"
                : "text-neutral-300"
            } ${userMood ? userMood.color + " text-white hover:opacity-80" : ""}`}
            disabled={!isCurrentMonth}
          >
            {/* 日期数字 */}
            <span className="relative z-10">{date.getDate()}</span>

            {/* 用户心情显示 */}
            {userMood && (
              <div
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{
                  background: `linear-gradient(135deg, ${
                    userMood.color.replace("bg-", "").includes("emerald")
                      ? "#10b981"
                      : userMood.color.replace("bg-", "").includes("green")
                        ? "#4ade80"
                        : userMood.color.replace("bg-", "").includes("yellow")
                          ? "#facc15"
                          : userMood.color.replace("bg-", "").includes("orange")
                            ? "#fb923c"
                            : "#ef4444"
                  }, transparent)`,
                }}
              >
                <span className="text-lg relative z-20">{userMood.emoji}</span>
              </div>
            )}
          </button>
        </div>
      )
    })

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-neutral-500 py-1">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>
    )
  }

  if (isLoading) {
    return (
      <PlayfulCard className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </PlayfulCard>
    )
  }

  return (
    <PlayfulCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
          <Calendar className="size-4 text-pink-500" />
          {t.mood.title}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="h-7 w-7 text-neutral-600 hover:bg-neutral-100"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(new Date())}
            className="h-7 w-7 text-neutral-600 hover:bg-neutral-100"
          >
            {t.mood.today}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="h-7 w-7 text-neutral-600 hover:bg-neutral-100"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {renderCalendar()}

      <Separator className="my-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-neutral-600">
            {currentUser === "daddy" ? t.mood.daddy : t.mood.puppy}
            {t.mood.yourMood}
          </h4>
          <Badge
            variant="outline"
            className={
              currentUser === "daddy"
                ? "border-blue-200 text-blue-700 bg-blue-50"
                : "border-pink-200 text-pink-700 bg-pink-50"
            }
          >
            {currentUser === "daddy" ? t.mood.daddy : t.mood.puppy}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(MOODS).map(([key, mood]) => (
            <button
              key={key}
              onClick={() => {
                const today = formatDate(new Date())
                setMood(today, key as MoodKey)
              }}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-50 transition-colors text-left"
            >
              <span className="text-lg">{mood.emoji}</span>
              <span className="text-xs text-neutral-600">{language === "zh" ? mood.name : mood.nameEn}</span>
            </button>
          ))}
        </div>

        {/* 今日心情显示 */}
        {(() => {
          const today = formatDate(new Date())
          const todayMood = moods[today]
          if (todayMood && todayMood[currentUser]) {
            return (
              <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                <div className="text-xs font-medium text-neutral-600 mb-2">{t.mood.today}</div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={
                    currentUser === "daddy"
                      ? "border-blue-200 text-blue-700 bg-blue-50"
                      : "border-pink-200 text-pink-700 bg-pink-50"
                  }>
                    {currentUser === "daddy" ? t.mood.daddy : t.mood.puppy}
                  </Badge>
                  <span className="text-lg">{MOODS[todayMood[currentUser]].emoji}</span>
                  <span className="text-xs text-neutral-600">
                    {language === "zh" ? MOODS[todayMood[currentUser]].name : MOODS[todayMood[currentUser]].nameEn}
                  </span>
                </div>
              </div>
            )
          }
          return null
        })()}
      </div>
    </PlayfulCard>
  )
}
