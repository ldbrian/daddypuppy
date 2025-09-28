"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { loadJSON, saveJSON } from "@/lib/storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImagePlus, Trash2, ZoomIn, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import PlayfulCard from "@/components/playful-card"
import type { Language, MemoryEntry } from "@/lib/types"

export default function PhotoWall({
  memoriesKey = "memoir_memories",
  extraKey = "memoir_photos",
  language = "zh",
}: {
  memoriesKey?: string
  extraKey?: string
  language?: Language
} = {}) {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [extras, setExtras] = useState<string[]>([])
  const [viewer, setViewer] = useState<{ open: boolean; src?: string; index?: number }>({ open: false })
  const [deleteMode, setDeleteMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null) // 添加文件错误状态

  const t = useMemo(() => {
    if (language === "zh") {
      return {
        photo: {
          title: "照片墙",
          count: "张",
          upload: "上传",
          preview: "预览",
          delete: "删除",
          deleteMode: "删除模式",
          exitDelete: "退出删除",
          confirmDelete: "确认删除",
          noPhotos: "暂无照片，上传一些美好瞬间吧。",
          deleteSuccess: "照片已删除",
          deleteInstruction: "点击照片即可删除",
          loading: "加载中...",
        },
      }
    } else {
      return {
        photo: {
          title: "Photo Wall",
          count: "photos",
          upload: "Upload",
          preview: "Preview",
          delete: "Delete",
          deleteMode: "Delete Mode",
          exitDelete: "Exit Delete",
          confirmDelete: "Confirm Delete",
          noPhotos: "No photos yet, upload some beautiful moments!",
          deleteSuccess: "Photo deleted",
          deleteInstruction: "Click photos to delete them",
          loading: "Loading...",
        },
      }
    }
  }, [language])

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [memoriesData, extrasData] = await Promise.all([
          loadJSON<MemoryEntry[]>(memoriesKey, []),
          loadJSON<string[]>(extraKey, []),
        ])

        // 安全地处理加载的数据，确保总是数组
        const validMemories = Array.isArray(memoriesData)
          ? memoriesData.filter((m) => m && typeof m === "object" && m.id)
          : []

        const validExtras = Array.isArray(extrasData)
          ? extrasData.filter((item) => typeof item === "string" && item.trim().length > 0)
          : []

        console.log("Loaded memories:", validMemories.length)
        console.log("Loaded extras:", validExtras.length)

        setMemories(validMemories)
        setExtras(validExtras)
      } catch (error) {
        console.error("Failed to load photo data:", error)
        // 确保在错误情况下也设置为空数组
        setMemories([])
        setExtras([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [memoriesKey, extraKey])

  const saveExtras = async (newExtras: string[]) => {
    try {
      if (Array.isArray(newExtras)) {
        await saveJSON(extraKey, newExtras)
        console.log("Extras saved successfully:", newExtras.length)
      }
    } catch (error) {
      console.error("Failed to save photo data:", error)
    }
  }

  const saveMemories = async (newMemories: MemoryEntry[]) => {
    try {
      if (Array.isArray(newMemories)) {
        await saveJSON(memoriesKey, newMemories)
        console.log("Memories saved successfully:", newMemories.length)
      }
    } catch (error) {
      console.error("Failed to save memories data:", error)
    }
  }

  const allImages = useMemo(() => {
    try {
      // 确保 memories 和 extras 都是数组
      const safeMemories = Array.isArray(memories) ? memories : []
      const safeExtras = Array.isArray(extras) ? extras : []

      console.log("Processing memories:", safeMemories.length)
      console.log("Processing extras:", safeExtras.length)

      // 从回忆中提取图片
      const fromMem = safeMemories.flatMap((m, memIndex) => {
        // 确保 m 存在且有 images 属性
        if (!m || typeof m !== "object" || !Array.isArray(m.images)) {
          return []
        }

        return m.images
          .filter((img) => typeof img === "string" && img.trim().length > 0)
          .map((img, imgIndex) => ({
            src: img,
            type: "memory" as const,
            memoryIndex: memIndex,
            imageIndex: imgIndex,
            memoryId: m.id,
          }))
      })

      // 从额外照片中提取图片
      const fromExtras = safeExtras
        .filter((img) => typeof img === "string" && img.trim().length > 0)
        .map((img, index) => ({
          src: img,
          type: "extra" as const,
          extraIndex: index,
        }))

      const result = [...fromMem, ...fromExtras]
      console.log("Total images processed:", result.length)
      console.log("Images breakdown:", {
        fromMemories: fromMem.length,
        fromExtras: fromExtras.length,
        total: result.length,
      })

      return result
    } catch (error) {
      console.error("Error processing images:", error)
      return []
    }
  }, [memories, extras])

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    // 清除之前的错误信息
    setFileError(null);

    // 检查文件大小限制 (1MB)
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        const errorMessage = language === "zh" 
          ? `图片"${files[i].name}"大小超过1MB限制，请压缩后重新上传` 
          : `Image "${files[i].name}" exceeds 1MB limit, please compress and try again`;
        setFileError(errorMessage);
        return;
      }
    }

    try {
      console.log("Adding files:", files.length)
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
          const validImages = imgs.filter((img) => typeof img === "string" && img.length > 0)
          console.log("Valid images to add:", validImages.length)

          // 确保 extras 是数组
          const currentExtras = Array.isArray(extras) ? extras : []
          const newExtras = [...validImages, ...currentExtras]

          console.log("New extras total:", newExtras.length)
          setExtras(newExtras)
          await saveExtras(newExtras)
        })
        .catch((error) => {
          console.error("Error processing uploaded files:", error)
        })
    } catch (error) {
      console.error("Error adding files:", error)
    }
  }

  const deletePhoto = async (item: (typeof allImages)[0]) => {
    try {
      console.log("Deleting photo:", item)

      if (item.type === "extra" && typeof item.extraIndex === "number") {
        console.log("Deleting extra photo at index:", item.extraIndex)

        // 确保 extras 是数组
        const currentExtras = Array.isArray(extras) ? extras : []
        const newExtras = currentExtras.filter((_, i) => i !== item.extraIndex)

        console.log("New extras array length:", newExtras.length)
        setExtras(newExtras)
        await saveExtras(newExtras)
        console.log("Extra photo deleted successfully")
      } else if (
        item.type === "memory" &&
        typeof item.memoryIndex === "number" &&
        typeof item.imageIndex === "number"
      ) {
        console.log("Deleting memory photo:", {
          memoryIndex: item.memoryIndex,
          imageIndex: item.imageIndex,
          memoryId: item.memoryId,
        })

        // 确保 memories 是数组
        const currentMemories = Array.isArray(memories) ? memories : []
        const newMemories = currentMemories.map((m, memIndex) => {
          if (memIndex === item.memoryIndex && m && Array.isArray(m.images)) {
            console.log("Original images count:", m.images.length)
            const newImages = m.images.filter((_, imgIndex) => imgIndex !== item.imageIndex)
            console.log("New images count after deletion:", newImages.length)
            return { ...m, images: newImages }
          }
          return m
        })

        console.log("Updated memories count:", newMemories.length)
        setMemories(newMemories)
        await saveMemories(newMemories)
        console.log("Memory photo deleted successfully")
      } else {
        console.error("Invalid item structure for deletion:", item)
      }
    } catch (error) {
      console.error("Error deleting photo:", error)
    }
  }

  const handleImageClick = (item: (typeof allImages)[0], index: number) => {
    if (deleteMode) {
      console.log("Delete mode: deleting photo", item)
      deletePhoto(item)
    } else {
      console.log("View mode: opening viewer", item)
      setViewer({ open: true, src: item.src, index })
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const target = e.target as HTMLImageElement
      target.src = "/photo-wall.png"
    } catch (error) {
      console.error("Error handling image error:", error)
    }
  }

  const navigateImage = (direction: "prev" | "next") => {
    if (viewer.index === undefined || !Array.isArray(allImages) || allImages.length === 0) return

    const newIndex =
      direction === "prev"
        ? (viewer.index - 1 + allImages.length) % allImages.length
        : (viewer.index + 1) % allImages.length

    setViewer({
      open: true,
      src: allImages[newIndex]?.src || "",
      index: newIndex,
    })
  }

  if (isLoading) {
    return (
      <PlayfulCard tiltSeed="photowall" className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-neutral-500 text-sm">{t.photo.loading}</div>
        </div>
      </PlayfulCard>
    )
  }

  // 安全地获取图片数量
  const imageCount = Array.isArray(allImages) ? allImages.length : 0

  return (
    <PlayfulCard tiltSeed="photowall" className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold tracking-wide">{t.photo.title}</h3>
        <div className="text-xs text-neutral-500">
          {imageCount} {t.photo.count}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          className="border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
          onClick={() => fileRef.current?.click()}
          disabled={deleteMode}
        >
          <ImagePlus className="mr-2 size-4" />
          {t.photo.upload}
        </Button>

        {imageCount > 0 && (
          <Button
            variant={deleteMode ? "destructive" : "outline"}
            size="sm"
            className={
              deleteMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
            }
            onClick={() => {
              console.log("Toggle delete mode:", !deleteMode)
              setDeleteMode(!deleteMode)
            }}
          >
            {deleteMode ? (
              <>
                <X className="mr-2 size-4" />
                {t.photo.exitDelete}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 size-4" />
                {t.photo.delete}
              </>
            )}
          </Button>
        )}
      </div>

      {fileError && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {fileError}
        </div>
      )}

      {deleteMode && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-700 flex items-center gap-1">
            <Trash2 className="size-3" />
            {t.photo.deleteInstruction}
          </p>
        </div>
      )}

      <Separator className="my-4 bg-neutral-200" />

      {imageCount === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-8">{t.photo.noPhotos}</div>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-3 gap-2">
            {allImages.map((item, i) => (
              <div key={`${item.type}-${i}-${item.src?.slice(-10) || "unknown"}`} className="group relative">
                <button
                  className="w-full relative overflow-hidden rounded-md"
                  onClick={() => handleImageClick(item, i)}
                  aria-label={deleteMode ? t.photo.delete : t.photo.preview}
                >
                  <img
                    src={item.src || "/placeholder.svg?height=300&width=300&query=photo%20wall%20image"}
                    alt={`照片 ${i + 1}`}
                    className={`aspect-square w-full object-cover border transition-all ${
                      deleteMode ? "border-red-300 hover:border-red-500" : "border-neutral-200 hover:border-pink-300"
                    }`}
                    crossOrigin="anonymous"
                    onError={handleImageError}
                    loading="lazy"
                  />

                  {/* 悬停效果 */}
                  <div
                    className={`absolute inset-0 transition-all duration-200 ${
                      deleteMode ? "bg-red-500/0 group-hover:bg-red-500/30" : "bg-black/0 group-hover:bg-black/20"
                    } flex items-center justify-center opacity-0 group-hover:opacity-100`}
                  >
                    {deleteMode ? (
                      <div className="bg-red-600 text-white rounded-full p-2 shadow-lg">
                        <Trash2 className="size-4" />
                      </div>
                    ) : (
                      <div className="bg-black/50 text-white rounded-full p-2 shadow-lg">
                        <ZoomIn className="size-4" />
                      </div>
                    )}
                  </div>

                  {/* 删除模式指示器 */}
                  {deleteMode && (
                    <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-sm">
                      <X className="size-3" />
                    </div>
                  )}
                </button>

                {/* 调试信息（开发时可见） */}
                {process.env.NODE_ENV === "development" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.type === "memory" ? `M${item.memoryIndex}-${item.imageIndex}` : `E${item.extraIndex}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图片查看器 */}
      <Dialog open={viewer.open} onOpenChange={(o) => setViewer((v) => ({ ...v, open: o }))}>
        <DialogContent className="sm:max-w-4xl bg-white text-neutral-900 border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-neutral-900 flex items-center justify-between">
              <span>{t.photo.preview}</span>
              {viewer.index !== undefined && imageCount > 0 && (
                <span className="text-sm text-neutral-500">
                  {viewer.index + 1} / {imageCount}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            {viewer.src && (
              <div className="flex justify-center">
                <img
                  src={viewer.src || "/placeholder.svg?height=640&width=960&query=photo%20preview"}
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

            {/* 导航按钮 */}
            {imageCount > 1 && viewer.index !== undefined && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => navigateImage("prev")}
                  aria-label="Previous image"
                >
                  <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => navigateImage("next")}
                  aria-label="Next image"
                >
                  <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PlayfulCard>
  )
}
