import { AnimatePresence, motion } from 'framer-motion'
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'
import { useToast } from '../hooks/useToast'

const icons = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || FiCheckCircle

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 28, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 28, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="glass-panel rounded-lg p-4 text-[color:var(--ink)]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[color:var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.message ? (
                    <p className="mt-1 text-sm leading-5 text-[color:var(--muted)]">
                      {toast.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="focus-ring rounded-md p-1 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--ink)]"
                  aria-label="Cerrar notificacion"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
