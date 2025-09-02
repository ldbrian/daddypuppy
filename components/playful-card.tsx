"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PlayfulCardProps {
  children: React.ReactNode
  className?: string
  tiltSeed?: string
}

export default function PlayfulCard({ children, className, tiltSeed = "default" }: PlayfulCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // 根据 tiltSeed 生成一个稳定的随机角度
  const getTiltAngle = (seed: string) => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    // 将 hash 转换为 -1 到 1 之间的小数，然后乘以最大倾斜角度
    return (((hash % 200) - 100) / 100) * 0.8 // 最大倾斜 0.8 度
  }

  const tiltAngle = getTiltAngle(tiltSeed)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    card.addEventListener("mouseenter", handleMouseEnter)
    card.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      card.removeEventListener("mouseenter", handleMouseEnter)
      card.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <Card
      ref={cardRef}
      className={cn(
        "bg-white border-neutral-200 shadow-sm transition-all duration-300 ease-out",
        isHovered
          ? "shadow-[0_8px_32px_rgba(0,0,0,0.08)] scale-[1.02] -translate-y-1"
          : "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        className,
      )}
      style={{
        transform: `rotate(${tiltAngle}deg) ${isHovered ? `scale(1.02) translateY(-4px) rotate(${tiltAngle * 0.5}deg)` : ""}`,
      }}
    >
      {children}
    </Card>
  )
}