import { useCallback, useEffect, useMemo, useState } from 'react'
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

  useEffect(() => {
    const handleStorageError = (event) => {
      notify({
        title: 'Error al guardar',
        message:
          event.detail?.message ||
          'No se pudo sincronizar la informacion con Supabase.',
        type: 'error',
      })
    }

    window.addEventListener('mossi-storage-error', handleStorageError)
    return () =>
      window.removeEventListener('mossi-storage-error', handleStorageError)
  }, [notify])

  const value = useMemo(
    () => ({ notify, removeToast, toasts }),
    [notify, removeToast, toasts],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
