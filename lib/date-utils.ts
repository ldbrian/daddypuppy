import { addDays, endOfMonth, format, isValid, parseISO, startOfMonth, startOfWeek } from "date-fns"

export function formatDateKey(d: Date | string): string {
  try {
    const date = typeof d === "string" ? parseISO(d) : d

    // 检查日期是否有效
    if (!isValid(date)) {
      console.error("Invalid date provided to formatDateKey:", d)
      return format(new Date(), "yyyy-MM-dd")
    }

    return format(date, "yyyy-MM-dd")
  } catch (error) {
    console.error("Error formatting date key:", error, d)
    return format(new Date(), "yyyy-MM-dd")
  }
}

// 安全的日期解析
export function safeParseDate(dateString: string): Date {
  try {
    const parsed = parseISO(dateString)
    if (isValid(parsed)) {
      return parsed
    }

    // 尝试其他格式
    const fallbackParsed = new Date(dateString)
    if (isValid(fallbackParsed)) {
      return fallbackParsed
    }

    console.error("Failed to parse date:", dateString)
    return new Date()
  } catch (error) {
    console.error("Error parsing date:", error, dateString)
    return new Date()
  }
}

// Generate 6x7 grid (42 days) covering the month view starting from Monday
export function getMonthGrid(month: Date): Date[] {
  try {
    if (!isValid(month)) {
      console.error("Invalid month provided to getMonthGrid:", month)
      month = new Date()
    }

    const start = startOfMonth(month)
    const gridStart = startOfWeek(start, { weekStartsOn: 1 })
    const end = endOfMonth(month)
    const days: Date[] = []

    for (let i = 0; i < 42; i++) {
      const day = addDays(gridStart, i)
      if (isValid(day)) {
        days.push(day)
      }
    }

    // 确保至少返回42天
    while (days.length < 42) {
      const lastDay = days[days.length - 1] || new Date()
      const nextDay = addDays(lastDay, 1)
      if (isValid(nextDay)) {
        days.push(nextDay)
      } else {
        break
      }
    }

    return days.slice(0, 42)
  } catch (error) {
    console.error("Error generating month grid:", error)
    // 返回当前月份的安全网格
    const today = new Date()
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      days.push(addDays(today, i - 21)) // 前后各21天
    }
    return days
  }
}
