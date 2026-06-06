import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) {
        return defaultValue
      }
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage is best-effort; app should continue even if write fails.
    }
  }, [key, value])

  return [value, setValue] as const
}
