"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { HardDrive, Wifi, WifiOff, CheckCircle } from "lucide-react"
import { isServerStorageAvailable } from "@/lib/storage"

export default function StorageStatus({ language = "zh" }: { language?: "zh" | "en" }) {
  const [isServerAvailable, setIsServerAvailable] = useState<boolean | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  const t =
    language === "zh"
      ? {
          cloudSync: "云端同步",
          localOnly: "仅本地",
          online: "在线",
          offline: "离线",
          checking: "检查中",
        }
      : {
          cloudSync: "Cloud Sync",
          localOnly: "Local Only",
          online: "Online",
          offline: "Offline",
          checking: "Checking",
        }

  useEffect(() => {
    // 检查服务端存储是否可用
    const checkServerStorage = async () => {
      try {
        const available = await isServerStorageAvailable()
        setIsServerAvailable(available)
      } catch (error) {
        console.error("Failed to check server storage:", error)
        setIsServerAvailable(false)
      }
    }

    // 检查网络状态
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    checkServerStorage()
    updateOnlineStatus()

    // 定期检查服务端状态
    const interval = setInterval(checkServerStorage, 30000) // 每30秒检查一次

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      {/* 存储状态 */}
      {isServerAvailable === null ? (
        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
          <div className="size-3 animate-pulse bg-blue-400 rounded-full" />
          <span className="ml-1">{t.checking}</span>
        </Badge>
      ) : isServerAvailable && isOnline ? (
        <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
          <CheckCircle className="size-3" />
          <span className="ml-1">{t.cloudSync}</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
          <HardDrive className="size-3" />
          <span className="ml-1">{t.localOnly}</span>
        </Badge>
      )}

      {/* 网络状态 */}
      <Badge
        variant="outline"
        className={`text-xs ${
          isOnline ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"
        }`}
      >
        {isOnline ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
        <span className="ml-1">{isOnline ? t.online : t.offline}</span>
      </Badge>
    </div>
  )
}
