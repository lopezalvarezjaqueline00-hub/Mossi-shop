import { useEffect, useState } from 'react'
import { safeJsonParse } from '../utils/storage'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const fallback =
      typeof initialValue === 'function' ? initialValue() : initialValue
    return safeJsonParse(localStorage.getItem(key), fallback)
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
