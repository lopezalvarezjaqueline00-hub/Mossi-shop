import { AnimatePresence, motion } from 'framer-motion'
import { FiAlertTriangle, FiX } from 'react-icons/fi'

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Eliminar',
  onCancel,
  onConfirm,
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/30 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            className="w-full max-w-md rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--danger)]/10 text-[color:var(--danger)]">
                  <FiAlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--ink)]">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="focus-ring rounded-md p-1.5 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--ink)]"
                aria-label="Cerrar"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="focus-ring rounded-md border border-[color:var(--line)] px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="focus-ring rounded-md bg-[color:var(--danger)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
