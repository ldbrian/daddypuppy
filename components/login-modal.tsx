"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Lock, Eye, EyeOff, Clock, Shield } from "lucide-react"
import { Pacifico } from "next/font/google"
import { cn } from "@/lib/utils"
import type { Language } from "@/lib/types"

const titleFont = Pacifico({
  weight: "400",
  subsets: ["latin"],
})

// 简单的密码（可以根据需要修改）
const CORRECT_PASSWORD = "dongdey1023"
const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30分钟

interface LoginModalProps {
  isOpen: boolean
  onLogin: () => void
  language?: Language
}

interface LockoutInfo {
  attempts: number
  lockedUntil: number | null
}

export default function LoginModal({ isOpen, onLogin, language = "zh" }: LoginModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [lockoutInfo, setLockoutInfo] = useState<LockoutInfo>({ attempts: 0, lockedUntil: null })
  const [remainingTime, setRemainingTime] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const t =
    language === "zh"
      ? {
          title: "Daddy & Puppy",
          subtitle: "私密回忆空间",
          placeholder: "请输入访问密码",
          login: "进入",
          wrongPassword: "密码错误，请重试",
          welcome: "欢迎回来",
          hint: "输入密码解锁美好回忆",
          locked: "访问已锁定",
          lockMessage: "密码错误次数过多，请稍后再试",
          remainingTime: "剩余时间",
          minutes: "分钟",
          seconds: "秒",
          attemptsLeft: "剩余尝试次数",
        }
      : {
          title: "Daddy & Puppy",
          subtitle: "Private Memory Space",
          placeholder: "Enter access password",
          login: "Enter",
          wrongPassword: "Wrong password, please try again",
          welcome: "Welcome back",
          hint: "Enter password to unlock beautiful memories",
          locked: "Access Locked",
          lockMessage: "Too many failed attempts, please try again later",
          remainingTime: "Time remaining",
          minutes: "minutes",
          seconds: "seconds",
          attemptsLeft: "Attempts left",
        }

  // 加载锁定信息
  useEffect(() => {
    try {
      const stored = localStorage.getItem("memoir_lockout")
      if (stored) {
        const info: LockoutInfo = JSON.parse(stored)
        const now = Date.now()

        if (info.lockedUntil && now < info.lockedUntil) {
          setLockoutInfo(info)
          setRemainingTime(Math.ceil((info.lockedUntil - now) / 1000))
        } else if (info.lockedUntil && now >= info.lockedUntil) {
          // 锁定时间已过，重置
          const resetInfo = { attempts: 0, lockedUntil: null }
          setLockoutInfo(resetInfo)
          localStorage.setItem("memoir_lockout", JSON.stringify(resetInfo))
        } else {
          setLockoutInfo(info)
        }
      }
    } catch (error) {
      console.error("Error loading lockout info:", error)
    }
  }, [])

  // 倒计时
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // 时间到了，解除锁定
            const resetInfo = { attempts: 0, lockedUntil: null }
            setLockoutInfo(resetInfo)
            localStorage.setItem("memoir_lockout", JSON.stringify(resetInfo))
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [remainingTime])

  useEffect(() => {
    if (isOpen && inputRef.current && !isLocked) {
      inputRef.current.focus()
    }
  }, [isOpen, remainingTime])

  const isLocked = lockoutInfo.lockedUntil && Date.now() < lockoutInfo.lockedUntil

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isLocked) return

    if (password === CORRECT_PASSWORD) {
      // 登录成功，重置尝试次数
      const resetInfo = { attempts: 0, lockedUntil: null }
      setLockoutInfo(resetInfo)
      localStorage.setItem("memoir_lockout", JSON.stringify(resetInfo))
      localStorage.setItem("memoir_authenticated", "true")
      onLogin()
    } else {
      // 密码错误
      const newAttempts = lockoutInfo.attempts + 1
      let newLockoutInfo: LockoutInfo

      if (newAttempts >= MAX_ATTEMPTS) {
        // 达到最大尝试次数，锁定账户
        const lockUntil = Date.now() + LOCKOUT_DURATION
        newLockoutInfo = { attempts: newAttempts, lockedUntil: lockUntil }
        setRemainingTime(Math.ceil(LOCKOUT_DURATION / 1000))
      } else {
        newLockoutInfo = { attempts: newAttempts, lockedUntil: null }
      }

      setLockoutInfo(newLockoutInfo)
      localStorage.setItem("memoir_lockout", JSON.stringify(newLockoutInfo))

      setIsShaking(true)
      setPassword("")

      // 停止摇晃动画
      setTimeout(() => setIsShaking(false), 500)

      // 重新聚焦输入框（如果没有被锁定）
      if (!newLockoutInfo.lockedUntil) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLocked) {
      handleSubmit(e as any)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}${t.minutes} ${secs}${t.seconds}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200">
        {/* 可爱的背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 浮动的心形 */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Heart
                className={`text-pink-300/30 ${i % 3 === 0 ? "size-4" : i % 3 === 1 ? "size-6" : "size-8"}`}
                fill="currentColor"
              />
            </div>
          ))}

          {/* 渐变光斑 */}
          <div
            className="absolute -top-20 -left-20 w-40 h-40 bg-pink-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-60 h-60 bg-rose-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />
        </div>
      </div>

      {/* 登录卡片 */}
      <Card
        className={cn(
          "relative w-full max-w-md mx-4 bg-white/95 backdrop-blur-sm border-0 shadow-2xl transition-all duration-300",
          isShaking && "animate-bounce",
        )}
        style={{
          boxShadow: "0 25px 50px -12px rgba(236, 72, 153, 0.25)",
        }}
      >
        <CardContent className="p-8 text-center">
          {/* 可爱的锁图标 */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                  isLocked
                    ? "bg-gradient-to-br from-red-400 to-red-600"
                    : "bg-gradient-to-br from-pink-400 to-rose-500",
                )}
              >
                {isLocked ? <Shield className="size-8 text-white" /> : <Lock className="size-8 text-white" />}
              </div>
              {/* 小心形装饰 */}
              <div className="absolute -top-1 -right-1">
                <Heart
                  className={cn("size-4 animate-pulse", isLocked ? "text-red-500" : "text-pink-500")}
                  fill="currentColor"
                />
              </div>
            </div>
          </div>

          {/* 标题 */}
          <h1 className={cn("text-3xl text-pink-600 mb-2", titleFont.className)}>{t.title}</h1>
          <p className="text-neutral-600 mb-2 font-medium">{t.subtitle}</p>

          {isLocked ? (
            <>
              <p className="text-sm text-red-600 mb-4 font-medium">{t.locked}</p>
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="size-5 text-red-600" />
                  <p className="text-sm text-red-600 font-medium">{t.lockMessage}</p>
                </div>
                <div className="text-lg font-mono text-red-700 bg-red-100 rounded-md py-2 px-3">
                  {t.remainingTime}: {formatTime(remainingTime)}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500 mb-6">{t.hint}</p>
          )}

          {/* 尝试次数提示 */}
          {!isLocked && lockoutInfo.attempts > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-600 flex items-center justify-center gap-2">
                <span>⚠️</span>
                {t.wrongPassword} ({t.attemptsLeft}: {MAX_ATTEMPTS - lockoutInfo.attempts})
              </p>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.placeholder}
                className={cn(
                  "pr-12 h-12 text-center text-lg transition-all",
                  isLocked
                    ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-white border-pink-200 focus:border-pink-400 focus:ring-pink-400",
                )}
                autoComplete="off"
                disabled={isLocked}
              />
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-pink-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              )}
            </div>

            <Button
              type="submit"
              className={cn(
                "w-full h-12 font-semibold text-lg shadow-lg transition-all duration-200",
                isLocked
                  ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:shadow-xl",
              )}
              disabled={!password.trim() || isLocked}
            >
              {isLocked ? (
                <>
                  <Shield className="mr-2 size-5" />
                  {t.locked}
                </>
              ) : (
                <>
                  <Heart className="mr-2 size-5" fill="currentColor" />
                  {t.login}
                </>
              )}
            </Button>
          </form>

          {/* 可爱的底部装饰 */}
          <div className="mt-6 flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn("w-2 h-2 rounded-full animate-pulse", isLocked ? "bg-red-300" : "bg-pink-300")}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
