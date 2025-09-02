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

export default function MoodCalendar({ language = "zh" }: { language?: Language }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [moods, setMoods] = useState<Record<string, DualMood>>({})
  const [selectedIdentity, setSelectedIdentity] = useState<Identity>("daddy")
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

  const setMood = async (date: string, mood: MoodKey) => {
    const currentMood = moods[date] || {}
    const newMood: DualMood = {
      ...currentMood,
      [selectedIdentity]: mood,
    }

    const newMoods = {
      ...moods,
      [date]: newMood,
    }
    setMoods(newMoods)
    await saveMoods(newMoods)
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

  if (isLoading) {
    return (
      <PlayfulCard tiltSeed="moodcalendar" className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-neutral-500 text-sm">{language === "zh" ? "加载中..." : "Loading..."}</div>
        </div>
      </PlayfulCard>
    )
  }

  return (
    <PlayfulCard tiltSeed="moodcalendar" className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="size-4 text-pink-600" />
        <h3 className="font-semibold tracking-wide">{t.mood.title}</h3>
      </div>

      {/* 身份选择 */}
      <div className="mb-4">
        <div className="text-xs text-neutral-600 mb-2">{t.mood.selectIdentity}</div>
        <div className="flex gap-2">
          <Button
            variant={selectedIdentity === "daddy" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedIdentity("daddy")}
            className={
              selectedIdentity === "daddy"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
            }
          >
            <User className="size-3 mr-1" />
            {t.mood.daddy}
          </Button>
          <Button
            variant={selectedIdentity === "puppy" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedIdentity("puppy")}
            className={
              selectedIdentity === "puppy"
                ? "bg-pink-600 hover:bg-pink-700 text-white"
                : "border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
            }
          >
            <Heart className="size-3 mr-1" />
            {t.mood.puppy}
          </Button>
        </div>
      </div>

      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} aria-label={t.mood.prevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <h4 className="font-medium text-sm">{monthName}</h4>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} aria-label={t.mood.nextMonth}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["日", "一", "二", "三", "四", "五", "六"].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-neutral-500 p-1">
            {language === "zh" ? day : ["S", "M", "T", "W", "T", "F", "S"][index]}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {monthDays.map(({ date, isCurrentMonth }, index) => {
          const dateStr = formatDate(date)
          const dualMood = moods[dateStr]
          const dayIsToday = isToday(date)

          // 获取两人的心情
          const daddyMood = dualMood?.daddy ? MOODS[dualMood.daddy] : null
          const puppyMood = dualMood?.puppy ? MOODS[dualMood.puppy] : null
          const currentUserMood = dualMood?.[selectedIdentity] ? MOODS[dualMood[selectedIdentity]!] : null

          return (
            <div key={index} className="relative">
              <button
                onClick={() => {
                  if (isCurrentMonth) {
                    // 循环切换当前选中身份的心情
                    const moodKeys = Object.keys(MOODS) as MoodKey[]
                    const currentMoodIndex = currentUserMood ? moodKeys.indexOf(dualMood![selectedIdentity]!) : -1
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
                } ${currentUserMood ? currentUserMood.color + " text-white hover:opacity-80" : ""}`}
                disabled={!isCurrentMonth}
              >
                {/* 日期数字 */}
                <span className="relative z-10">{date.getDate()}</span>

                {/* 双人心情显示 */}
                {(daddyMood || puppyMood) && (
                  <div className="absolute inset-0 flex">
                    {/* Daddy的心情（左半边） */}
                    {daddyMood && (
                      <div
                        className={`w-1/2 h-full flex items-center justify-center ${
                          selectedIdentity === "daddy" ? "z-20" : "z-10"
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${
                            daddyMood.color.replace("bg-", "").includes("emerald")
                              ? "#10b981"
                              : daddyMood.color.replace("bg-", "").includes("green")
                                ? "#4ade80"
                                : daddyMood.color.replace("bg-", "").includes("yellow")
                                  ? "#facc15"
                                  : daddyMood.color.replace("bg-", "").includes("orange")
                                    ? "#fb923c"
                                    : "#ef4444"
                          }, transparent)`,
                        }}
                      >
                        <span className="text-xs">{daddyMood.emoji}</span>
                      </div>
                    )}

                    {/* Puppy的心情（右半边） */}
                    {puppyMood && (
                      <div
                        className={`w-1/2 h-full flex items-center justify-center ml-auto ${
                          selectedIdentity === "puppy" ? "z-20" : "z-10"
                        }`}
                        style={{
                          background: `linear-gradient(225deg, ${
                            puppyMood.color.replace("bg-", "").includes("emerald")
                              ? "#10b981"
                              : puppyMood.color.replace("bg-", "").includes("green")
                                ? "#4ade80"
                                : puppyMood.color.replace("bg-", "").includes("yellow")
                                  ? "#facc15"
                                  : puppyMood.color.replace("bg-", "").includes("orange")
                                    ? "#fb923c"
                                    : "#ef4444"
                          }, transparent)`,
                        }}
                      >
                        <span className="text-xs">{puppyMood.emoji}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 当前选中身份的高亮边框 */}
                {currentUserMood && (
                  <div
                    className={`absolute inset-0 border-2 rounded-md ${
                      selectedIdentity === "daddy" ? "border-blue-400" : "border-pink-400"
                    } opacity-60`}
                  />
                )}
              </button>
            </div>
          )
        })}
      </div>

      <Separator className="my-3 bg-neutral-200" />

      {/* 心情选择区域 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-neutral-600">
            {selectedIdentity === "daddy" ? t.mood.daddy : t.mood.puppy}
            {t.mood.yourMood}
          </h4>
          <Badge
            variant="outline"
            className={
              selectedIdentity === "daddy"
                ? "border-blue-200 text-blue-700 bg-blue-50"
                : "border-pink-200 text-pink-700 bg-pink-50"
            }
          >
            {selectedIdentity === "daddy" ? t.mood.daddy : t.mood.puppy}
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

        {/* 今日双人心情显示 */}
        {(() => {
          const today = formatDate(new Date())
          const todayMood = moods[today]
          if (todayMood && (todayMood.daddy || todayMood.puppy)) {
            return (
              <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                <div className="text-xs font-medium text-neutral-600 mb-2">{t.mood.today}</div>
                <div className="flex items-center gap-3">
                  {todayMood.daddy && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                        {t.mood.daddy}
                      </Badge>
                      <span className="text-lg">{MOODS[todayMood.daddy].emoji}</span>
                      <span className="text-xs text-neutral-600">
                        {language === "zh" ? MOODS[todayMood.daddy].name : MOODS[todayMood.daddy].nameEn}
                      </span>
                    </div>
                  )}
                  {todayMood.puppy && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-pink-200 text-pink-700 bg-pink-50">
                        {t.mood.puppy}
                      </Badge>
                      <span className="text-lg">{MOODS[todayMood.puppy].emoji}</span>
                      <span className="text-xs text-neutral-600">
                        {language === "zh" ? MOODS[todayMood.puppy].name : MOODS[todayMood.puppy].nameEn}
                      </span>
                    </div>
                  )}
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
