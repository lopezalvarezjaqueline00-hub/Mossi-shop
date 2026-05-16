import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { FiCheck, FiClock, FiEdit2, FiShoppingBag, FiX } from 'react-icons/fi'
import StatusBadge from './StatusBadge'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
}) {
  const [activeImage, setActiveImage] = useState(0)

  if (!product) {
    return null
  }

  const images = product.images?.length ? product.images : []
  const mainImage = images[activeImage] || images[0]

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-sm sm:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.98 }}
            className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] shadow-2xl lg:grid-cols-[0.92fr_1fr]"
          >
            <div className="bg-[color:var(--surface-muted)] p-3">
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-[color:var(--surface)]">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="h-full w-full object-cover [object-position:center_58%]"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-[color:var(--muted)]">
                    Sin imagen
                  </div>
                )}
              </div>
              {images.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() => setActiveImage(index)}
                      className={`focus-ring h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
                        activeImage === index
                          ? 'border-[color:var(--accent)]'
                          : 'border-[color:var(--line)]'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Vista ${index + 1}`}
                        className="h-full w-full object-cover [object-position:center_58%]"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-[color:var(--muted)]">
                    {product.category}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                    {product.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--ink)]"
                  aria-label="Cerrar vista rapida"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StatusBadge status={product.status} />
                <span className="text-2xl font-semibold text-[color:var(--ink)]">
                  {formatCurrency(product.price)}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[color:var(--line)] p-3">
                  <p className="text-xs text-[color:var(--muted)]">Talla</p>
                  <p className="mt-1 font-semibold text-[color:var(--ink)]">
                    {product.size || 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg border border-[color:var(--line)] p-3">
                  <p className="text-xs text-[color:var(--muted)]">Color</p>
                  <p className="mt-1 font-semibold text-[color:var(--ink)]">
                    {product.color || 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg border border-[color:var(--line)] p-3">
                  <p className="text-xs text-[color:var(--muted)]">Agregado</p>
                  <p className="mt-1 font-semibold text-[color:var(--ink)]">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    Descripcion
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {product.description || 'Sin descripcion registrada.'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    Notas
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {product.notes || 'Sin notas.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => onStatusChange(product.id, 'Vendido')}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <FiShoppingBag className="h-4 w-4" />
                  Marcar vendido
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(product.id, 'Apartado')}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
                >
                  <FiClock className="h-4 w-4" />
                  Apartar
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(product.id, 'Disponible')}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
                >
                  <FiCheck className="h-4 w-4" />
                  Disponible
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
                >
                  <FiEdit2 className="h-4 w-4" />
                  Editar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
