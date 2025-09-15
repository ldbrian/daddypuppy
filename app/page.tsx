"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Pacifico } from "next/font/google"
import { Languages, NotebookPen, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { getLanguageFromStorage, setLanguageToStorage } from "@/lib/i18n"
import type { Language, Identity } from "@/lib/types"
import Timeline from "@/components/timeline"
import MoodCalendar from "@/components/mood-calendar"
import WishList from "@/components/wish-list"
import PhotoWall from "@/components/photo-wall"
import BackgroundDecor from "@/components/background-decor"
import LoginModal from "@/components/login-modal"
import MusicPlayer from "@/components/music-player"
import StorageStatus from "@/components/storage-status"
import OurVault from "@/components/our-vault"
import { Role } from "@/src/types/Role"

const titleFont = Pacifico({
  weight: "400",
  subsets: ["latin"],
})

export default function Page() {
  const [language, setLanguage] = useState<Language>("zh")
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [currentUser, setCurrentUser] = useState<Identity>("daddy")

  useEffect(() => {
    try {
      const storedLanguage = getLanguageFromStorage()
      if (storedLanguage) {
        setLanguage(storedLanguage)
      }
      
      // 检查是否已经认证
      const authenticated = localStorage.getItem("memoir_authenticated") === "true"
      if (authenticated) {
        setIsAuthenticated(true)
      }
      
      // 获取保存的用户角色
      const savedUserRole = localStorage.getItem("memoir_user_role") as Identity
      if (savedUserRole) {
        setCurrentUser(savedUserRole)
      }
    } catch (error) {
      console.error("Failed to load language preference:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleLanguage = () => {
    const newLanguage = language === "zh" ? "en" : "zh"
    setLanguage(newLanguage)
    setLanguageToStorage(newLanguage)
  }

  const handleLogin = () => {
    setShowLogin(true)
  }

  const handleLoginSuccess = (userRole: Role) => {
    setIsAuthenticated(true)
    setShowLogin(false)
    // 将Role类型转换为Identity类型
    const identity: Identity = userRole === Role.DADDY ? "daddy" : "puppy"
    setCurrentUser(identity)
    // 保存用户角色到localStorage
    localStorage.setItem("memoir_user_role", identity)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    // 清除认证状态和用户角色
    localStorage.removeItem("memoir_authenticated")
    localStorage.removeItem("memoir_user_role")
    // 显示登录模态框
    setShowLogin(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 relative overflow-hidden">
      <BackgroundDecor />
      
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md py-4 px-6 flex justify-between items-center shadow-sm">
        <h1 className={cn("text-3xl font-bold gradient-text leading-normal", titleFont.className)}>
          Daddy&Puppy
        </h1>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
          >
            <Languages className="h-5 w-5" />
          </Button>
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
            >
              <NotebookPen className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* 主内容区域 - 三列布局 */}
      <main className="pt-20 pb-20 px-2 sm:px-4 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 左侧栏 */}
          <div className="w-full lg:w-1/4 flex flex-col gap-4">
            <div>
              <MoodCalendar language={language} currentUser={currentUser} />
            </div>
            <div className="flex-grow">
              <MusicPlayer language={language} />
            </div>
          </div>
          
          {/* 中间内容区 */}
          <div className="w-full lg:w-1/2">
            <Timeline language={language} currentUser={currentUser} />
          </div>
          
          {/* 右侧栏 */}
          <div className="w-full lg:w-1/4 flex flex-col gap-4">
            <div>
              <WishList language={language} currentUser={currentUser} />
            </div>
            <div>
              <OurVault language={language} currentUser={currentUser === "daddy" ? Role.DADDY : Role.PUPPY} />
            </div>
            <div className="flex-grow">
              <PhotoWall language={language} />
            </div>
          </div>
        </div>
      </main>

      {/* 登录模态框 */}
      <LoginModal 
        isOpen={showLogin} 
        onLogin={handleLoginSuccess}
        language={language}
      />

      {/* 存储状态 */}
      <StorageStatus language={language} />

      {/* 背景装饰元素 */}
      <div className="fixed top-1/4 left-10 w-20 h-20 rounded-full bg-pink-200 opacity-30 blur-xl animate-pulse z-0"></div>
      <div className="fixed bottom-1/3 right-10 w-32 h-32 rounded-full bg-rose-200 opacity-30 blur-xl animate-pulse z-0"></div>
    </div>
  )
}