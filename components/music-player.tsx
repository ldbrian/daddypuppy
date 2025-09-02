"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import PlayfulCard from "@/components/playful-card"
import { loadJSON, saveJSON } from "@/lib/storage"
import type { Language } from "@/lib/types"

interface Song {
  id: string
  title: string
  artist: string
  url: string
  duration: number
}

const DEFAULT_SONGS: Song[] = [
  {
    id: "1",
    title: "Our Song",
    artist: "Memory Lane",
    url: "/placeholder-audio.mp3",
    duration: 180,
  },
  {
    id: "2",
    title: "Together Forever",
    artist: "Love Notes",
    url: "/placeholder-audio.mp3",
    duration: 210,
  },
  {
    id: "3",
    title: "Sweet Dreams",
    artist: "Gentle Waves",
    url: "/placeholder-audio.mp3",
    duration: 195,
  },
]

export default function MusicPlayer({ language = "zh" }: { language?: Language }) {
  const [songs, setSongs] = useState<Song[]>(DEFAULT_SONGS)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [showAddSong, setShowAddSong] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const t = {
    zh: {
      title: "音乐播放器",
      addSong: "添加歌曲",
      songTitle: "歌曲标题",
      artist: "艺术家",
      songUrl: "音频链接",
      save: "保存",
      cancel: "取消",
      playlist: "播放列表",
      nowPlaying: "正在播放",
      loading: "加载中...",
      play: "播放",
      pause: "暂停",
      invalidUrl: "请输入有效的音频URL",
      error: "播放错误",
    },
    en: {
      title: "Music Player",
      addSong: "Add Song",
      songTitle: "Song Title",
      artist: "Artist",
      songUrl: "Audio URL",
      save: "Save",
      cancel: "Cancel",
      playlist: "Playlist",
      nowPlaying: "Now Playing",
      loading: "Loading...",
      play: "Play",
      pause: "Pause",
      invalidUrl: "Please enter a valid audio URL",
      error: "Playback error",
    },
  }

  const currentT = t[language]
  const currentSong = songs[currentSongIndex]

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setIsLoading(true)
        const savedSongs = await loadJSON<Song[]>("memoir_songs", DEFAULT_SONGS)
        setSongs(Array.isArray(savedSongs) && savedSongs.length > 0 ? savedSongs : DEFAULT_SONGS)
      } catch (error) {
        console.error("Failed to load songs:", error)
        setSongs(DEFAULT_SONGS)
      } finally {
        setIsLoading(false)
      }
    }

    loadSongs()
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      nextSong()
    }
    const handleError = () => {
      setError(`${currentT.error}: ${audio.error?.message || 'Unknown error'}`)
      setIsPlaying(false)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [currentSongIndex, currentT.error])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume / 100
  }, [volume, currentSongIndex])

  const saveSongs = async (newSongs: Song[]) => {
    try {
      await saveJSON("memoir_songs", newSongs)
    } catch (error) {
      console.error("Failed to save songs:", error)
    }
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      setError(null)
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        // 尝试播放音频
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true)
            })
            .catch((error) => {
              console.error("Error playing audio:", error)
              setError(`${currentT.error}: ${error.message || 'Failed to play'}`)
              setIsPlaying(false)
            })
        }
      }
    } catch (error: any) {
      console.error("Error playing audio:", error)
      setError(`${currentT.error}: ${error.message || 'Failed to play'}`)
      setIsPlaying(false)
    }
  }

  const nextSong = () => {
    setError(null)
    const nextIndex = (currentSongIndex + 1) % songs.length
    setCurrentSongIndex(nextIndex)
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const prevSong = () => {
    setError(null)
    const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1
    setCurrentSongIndex(prevIndex)
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const seekTo = (time: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = time
    setCurrentTime(time)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const addSong = async (title: string, artist: string, url: string) => {
    // 简单验证URL
    if (!url || !url.startsWith('http')) {
      setError(currentT.invalidUrl)
      return
    }

    const newSong: Song = {
      id: Date.now().toString(),
      title,
      artist,
      url,
      duration: 0, // 将在播放时获取实际时长
    }

    const updatedSongs = [...songs, newSong]
    setSongs(updatedSongs)
    await saveSongs(updatedSongs)
    setShowAddSong(false)
    setError(null)
  }

  const removeSong = async (id: string) => {
    if (songs.length <= 1) {
      setError("Cannot remove the last song")
      return
    }
    
    const updatedSongs = songs.filter((song) => song.id !== id)
    setSongs(updatedSongs)
    await saveSongs(updatedSongs)

    // 如果删除的是当前播放的歌曲
    if (currentSong.id === id) {
      if (currentSongIndex >= updatedSongs.length) {
        setCurrentSongIndex(0)
      }
      setCurrentTime(0)
      setIsPlaying(false)
    }
    
    setError(null)
  }

  if (isLoading) {
    return (
      <PlayfulCard tiltSeed="musicplayer" className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-neutral-500 text-sm">{currentT.loading}</div>
        </div>
      </PlayfulCard>
    )
  }

  return (
    <PlayfulCard tiltSeed="musicplayer" className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="size-4 text-pink-600" />
          <h3 className="font-semibold tracking-wide">{currentT.title}</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowAddSong(true)
            setError(null)
          }}
          className="border-pink-200 text-pink-600 hover:bg-pink-50"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* 错误信息显示 */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {/* Current Song Info */}
      <div className="text-center mb-4">
        <h4 className="font-medium text-sm text-neutral-900 truncate">{currentSong.title}</h4>
        <p className="text-xs text-neutral-600 truncate">{currentSong.artist}</p>
        <Badge variant="secondary" className="mt-1 text-xs">
          {currentT.nowPlaying}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[currentTime]}
          max={duration || currentSong.duration}
          step={1}
          onValueChange={([value]) => seekTo(value)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || currentSong.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button size="icon" variant="outline" onClick={prevSong} className="h-8 w-8 bg-transparent">
          <SkipBack className="size-4" />
        </Button>
        <Button 
          size="icon" 
          onClick={togglePlay} 
          className="h-10 w-10 bg-pink-600 hover:bg-pink-700 text-white"
          disabled={!currentSong.url}
        >
          {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <Button size="icon" variant="outline" onClick={nextSong} className="h-8 w-8 bg-transparent">
          <SkipForward className="size-4" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="size-4 text-neutral-600" />
        <Slider value={[volume]} max={100} step={1} onValueChange={([value]) => setVolume(value)} className="flex-1" />
        <span className="text-xs text-neutral-600 w-8">{volume}%</span>
      </div>

      {/* Playlist */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-600">{currentT.playlist}</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
                index === currentSongIndex ? "bg-pink-50 text-pink-700" : "hover:bg-neutral-50 text-neutral-700"
              }`}
            >
              <button
                onClick={() => {
                  setCurrentSongIndex(index)
                  setIsPlaying(false)
                  setCurrentTime(0)
                  setError(null)
                }}
                className="flex-1 text-left truncate"
              >
                <div className="font-medium truncate">{song.title}</div>
                <div className="text-neutral-500 truncate">{song.artist}</div>
              </button>
              {songs.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeSong(song.id)}
                  className="h-6 w-6 text-neutral-400 hover:text-red-600"
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={currentSong.url} 
        preload="metadata" 
      />

      {/* Add Song Dialog */}
      <Dialog open={showAddSong} onOpenChange={(open) => {
        setShowAddSong(open)
        if (!open) setError(null)
      }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{currentT.addSong}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const title = formData.get("title") as string
              const artist = formData.get("artist") as string
              const url = formData.get("url") as string

              if (title && artist && url) {
                addSong(title, artist, url)
              }
            }}
            className="space-y-4"
          >
            {/* 错误信息显示在表单中 */}
            {error && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded-md">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-neutral-700">{currentT.songTitle}</label>
              <Input name="title" required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">{currentT.artist}</label>
              <Input name="artist" required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">{currentT.songUrl}</label>
              <Input name="url" type="url" required className="mt-1" placeholder="https://" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddSong(false)
                setError(null)
              }}>
                {currentT.cancel}
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">
                {currentT.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PlayfulCard>
  )
}