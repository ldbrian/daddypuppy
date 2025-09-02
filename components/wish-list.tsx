"use client"

import { useState, useEffect } from "react"
import { CheckSquare, Square, Plus, X, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PlayfulCard from "@/components/playful-card"
import { loadJSON, saveJSON } from "@/lib/storage"
import type { Language } from "@/lib/types"

interface TodoItem {
  id: string
  title: string
  description: string
  completed: boolean
  priority: "low" | "medium" | "high"
  dueDate?: string
  createdAt: string
}

export default function WishList({ language = "zh" }: { language?: Language }) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const t = {
    zh: {
      title: "待办清单",
      addTodo: "添加待办",
      noTodos: "暂无待办事项，点击添加按钮创建第一个任务！",
      todoTitle: "任务标题",
      todoDescription: "任务描述",
      priority: "优先级",
      dueDate: "截止日期",
      save: "保存",
      cancel: "取消",
      edit: "编辑",
      delete: "删除",
      completed: "已完成",
      pending: "待完成",
      high: "高",
      medium: "中",
      low: "低",
      loading: "加载中...",
    },
    en: {
      title: "To-Do List",
      addTodo: "Add Todo",
      noTodos: "No todos yet. Click the add button to create your first task!",
      todoTitle: "Task Title",
      todoDescription: "Task Description",
      priority: "Priority",
      dueDate: "Due Date",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      completed: "Completed",
      pending: "Pending",
      high: "High",
      medium: "Medium",
      low: "Low",
      loading: "Loading...",
    },
  }

  const currentT = t[language]

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  }

  useEffect(() => {
    const loadTodos = async () => {
      try {
        setIsLoading(true)
        const savedTodos = await loadJSON<TodoItem[]>("memoir_todos", [])
        setTodos(Array.isArray(savedTodos) ? savedTodos : [])
      } catch (error) {
        console.error("Failed to load todos:", error)
        setTodos([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTodos()
  }, [])

  const saveTodos = async (newTodos: TodoItem[]) => {
    try {
      await saveJSON("memoir_todos", newTodos)
    } catch (error) {
      console.error("Failed to save todos:", error)
    }
  }

  const addTodo = async (todo: Omit<TodoItem, "id" | "createdAt">) => {
    const newTodo: TodoItem = {
      ...todo,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedTodos = [newTodo, ...todos]
    setTodos(updatedTodos)
    await saveTodos(updatedTodos)
    setShowAdd(false)
  }

  const updateTodo = async (id: string, updates: Partial<TodoItem>) => {
    const updatedTodos = todos.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
    setTodos(updatedTodos)
    await saveTodos(updatedTodos)
    setEditingTodo(null)
  }

  const deleteTodo = async (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id)
    setTodos(updatedTodos)
    await saveTodos(updatedTodos)
  }

  const toggleComplete = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (todo) {
      await updateTodo(id, { completed: !todo.completed })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")
  }

  const completedTodos = todos.filter((todo) => todo.completed)
  const pendingTodos = todos.filter((todo) => !todo.completed)

  if (isLoading) {
    return (
      <PlayfulCard tiltSeed="wishlist" className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-neutral-500 text-sm">{currentT.loading}</div>
        </div>
      </PlayfulCard>
    )
  }

  return (
    <>
      <PlayfulCard tiltSeed="wishlist" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="size-4 text-pink-600" />
            <h3 className="font-semibold tracking-wide">{currentT.title}</h3>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="size-4 mr-1" />
            {currentT.addTodo}
          </Button>
        </div>

        {todos.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="size-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500 mb-4">{currentT.noTodos}</p>
            <Button onClick={() => setShowAdd(true)} className="bg-pink-600 hover:bg-pink-700 text-white">
              <Plus className="size-4 mr-2" />
              {currentT.addTodo}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Todos */}
            {pendingTodos.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-neutral-600 mb-2 flex items-center gap-2">
                  <Square className="size-3" />
                  {currentT.pending} ({pendingTodos.length})
                </h4>
                <div className="space-y-2">
                  {pendingTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <button
                        onClick={() => toggleComplete(todo.id)}
                        className="mt-0.5 text-neutral-400 hover:text-pink-600 transition-colors"
                      >
                        <Square className="size-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm text-neutral-900 truncate">{todo.title}</h5>
                            {todo.description && (
                              <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{todo.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingTodo(todo)}
                              className="h-6 w-6 text-neutral-400 hover:text-neutral-600"
                            >
                              <Edit3 className="size-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteTodo(todo.id)}
                              className="h-6 w-6 text-neutral-400 hover:text-red-600"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={priorityColors[todo.priority]}>
                            {currentT[todo.priority]}
                          </Badge>
                          {todo.dueDate && <span className="text-xs text-neutral-500">{formatDate(todo.dueDate)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-neutral-600 mb-2 flex items-center gap-2">
                  <CheckSquare className="size-3" />
                  {currentT.completed} ({completedTodos.length})
                </h4>
                <div className="space-y-2">
                  {completedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg opacity-75"
                    >
                      <button
                        onClick={() => toggleComplete(todo.id)}
                        className="mt-0.5 text-pink-600 hover:text-pink-700 transition-colors"
                      >
                        <CheckSquare className="size-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm text-neutral-600 line-through truncate">{todo.title}</h5>
                            {todo.description && (
                              <p className="text-xs text-neutral-500 mt-1 line-through line-clamp-2">
                                {todo.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteTodo(todo.id)}
                            className="h-6 w-6 text-neutral-400 hover:text-red-600"
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PlayfulCard>

      {/* Add/Edit Todo Dialog - 移到最外层 */}
      <Dialog
        open={showAdd || !!editingTodo}
        onOpenChange={() => {
          setShowAdd(false)
          setEditingTodo(null)
        }}
      >
        <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto bg-white border border-neutral-200 shadow-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-neutral-900">
              {editingTodo ? currentT.edit : currentT.addTodo}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const title = formData.get("title") as string
              const description = formData.get("description") as string
              const priority = formData.get("priority") as "low" | "medium" | "high"
              const dueDate = formData.get("dueDate") as string

              if (title) {
                if (editingTodo) {
                  updateTodo(editingTodo.id, {
                    title,
                    description,
                    priority,
                    dueDate: dueDate || undefined,
                  })
                } else {
                  addTodo({
                    title,
                    description,
                    priority,
                    dueDate: dueDate || undefined,
                    completed: false,
                  })
                }
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{currentT.todoTitle}</label>
              <Input
                name="title"
                required
                defaultValue={editingTodo?.title || ""}
                className="w-full bg-white border-neutral-300 focus:border-pink-500 focus:ring-pink-500"
                placeholder={currentT.todoTitle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{currentT.todoDescription}</label>
              <Textarea
                name="description"
                defaultValue={editingTodo?.description || ""}
                className="w-full bg-white border-neutral-300 focus:border-pink-500 focus:ring-pink-500"
                rows={3}
                placeholder={currentT.todoDescription}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{currentT.priority}</label>
              <select
                name="priority"
                defaultValue={editingTodo?.priority || "medium"}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
              >
                <option value="low">{currentT.low}</option>
                <option value="medium">{currentT.medium}</option>
                <option value="high">{currentT.high}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">{currentT.dueDate}</label>
              <Input
                name="dueDate"
                type="date"
                defaultValue={editingTodo?.dueDate || ""}
                className="w-full bg-white border-neutral-300 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAdd(false)
                  setEditingTodo(null)
                }}
                className="flex-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                {currentT.cancel}
              </Button>
              <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">
                {currentT.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
