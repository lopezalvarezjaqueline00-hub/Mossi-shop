import { motion } from 'framer-motion'
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi'
import StatusBadge from './StatusBadge'
import { formatCurrency } from '../utils/formatters'

export default function ProductCard({ product, onEdit, onDelete, onQuickView }) {
  const image = product.images?.[0]

  return (
    <motion.article
      layout
      whileHover={{ y: -5 }}
      className="group overflow-hidden rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] shadow-sm transition hover:shadow-xl"
    >
      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--surface-muted)]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover [object-position:center_58%] transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-[color:var(--muted)]">
              Sin imagen
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={product.status} />
          </div>
        </div>
      </button>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase text-[color:var(--muted)]">
              {product.category}
            </p>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold text-[color:var(--ink)]">
              {product.name}
            </h3>
          </div>
          <p className="shrink-0 text-sm font-semibold text-[color:var(--ink)]">
            {formatCurrency(product.price)}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[color:var(--line)] pt-3">
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--ink)]"
            aria-label={`Vista rapida de ${product.name}`}
            title="Vista rapida"
          >
            <FiEye className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--accent-strong)]"
              aria-label={`Editar ${product.name}`}
              title="Editar"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
              aria-label={`Eliminar ${product.name}`}
              title="Eliminar"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
