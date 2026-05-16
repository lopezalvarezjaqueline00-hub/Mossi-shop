import { useCallback, useMemo, useState } from 'react'
import { generateId } from '../utils/storage'
import { ToastContext } from './ToastContextValue'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    ({ title, message, type = 'success' }) => {
      const id = generateId()
      setToasts((current) => [
        ...current,
        {
          id,
          title,
          message,
          type,
        },
      ])

      window.setTimeout(() => removeToast(id), 3600)
    },
    [removeToast],
  )

  const value = useMemo(
    () => ({ notify, removeToast, toasts }),
    [notify, removeToast, toasts],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
