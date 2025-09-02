export type Language = "zh" | "en"

export const DEFAULT_LANGUAGE: Language = "zh"

export function getLanguageFromStorage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE

  try {
    const stored = localStorage.getItem("memoir_language")
    if (stored === "zh" || stored === "en") {
      return stored
    }
  } catch (error) {
    console.error("Failed to get language from storage:", error)
  }

  return DEFAULT_LANGUAGE
}

export function setLanguageToStorage(language: Language): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem("memoir_language", language)
  } catch (error) {
    console.error("Failed to set language to storage:", error)
  }
}
