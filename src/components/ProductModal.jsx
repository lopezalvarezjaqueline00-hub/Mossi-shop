import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { FiImage, FiPlus, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi'
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../data/initialProducts'

const blankProduct = {
  name: '',
  category: 'Ropa',
  description: '',
  price: '',
  stock: 1,
  size: '',
  color: '',
  status: 'Disponible',
  notes: '',
  images: [],
}

const getProductImages = (product) =>
  Array.isArray(product?.images) ? product.images : []

const getInitialForm = (product) =>
  product
    ? { ...blankProduct, ...product, images: getProductImages(product) }
    : { ...blankProduct, images: [] }

const normalizeStock = (value) => {
  const stock = Number.parseInt(value, 10)
  return Number.isFinite(stock) ? Math.max(0, stock) : 0
}

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function ProductModal({ isOpen, product, onClose, onSave }) {
  const [form, setForm] = useState(() => getInitialForm(product))
  const [dragging, setDragging] = useState(false)
  const safeImages = useMemo(
    () => (Array.isArray(form.images) ? form.images : []),
    [form.images],
  )

  const title = useMemo(
    () => (product ? 'Editar producto' : 'Agregar producto'),
    [product],
  )

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateStock = (value) => {
    updateField('stock', value === '' ? '' : normalizeStock(value))
  }

  const addFiles = async (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (!imageFiles.length) {
      return
    }

    const images = await Promise.all(imageFiles.map(fileToDataUrl))
    setForm((current) => ({
      ...current,
      images: [
        ...(Array.isArray(current.images) ? current.images : []),
        ...images,
      ],
    }))
  }

  const removeImage = (imageIndex) => {
    setForm((current) => ({
      ...current,
      images: (Array.isArray(current.images) ? current.images : []).filter(
        (_, index) => index !== imageIndex,
      ),
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    try {
      onSave({
        ...form,
        name: form.name.trim(),
        price: Number(form.price) || 0,
        stock: normalizeStock(form.stock),
        images: safeImages,
      })
    } catch (error) {
      console.error('Product modal submit failed:', error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-sm sm:py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel mx-auto w-full max-w-4xl rounded-lg p-4 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] pb-4">
              <div>
                <p className="text-xs uppercase text-[color:var(--muted)]">
                  Mossi Shop
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--ink)]"
                aria-label="Cerrar modal"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-[color:var(--ink)]">
                    Nombre del producto
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
                    placeholder="Ej. Bolsa piel mini taupe"
                    required
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[color:var(--ink)]">
                      Categoria
                    </span>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        updateField('category', event.target.value)
                      }
                      className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                    >
                      {PRODUCT_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[color:var(--ink)]">
                      Estado
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateField('status', event.target.value)
                      }
                      className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                    >
                      {PRODUCT_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <label className="block">
                    <span className="text-sm font-medium text-[color:var(--ink)]">
                      Precio
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) =>
                        updateField('price', event.target.value)
                      }
                      className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                      placeholder="0"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[color:var(--ink)]">
                      Cantidad
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={form.stock}
                      onChange={(event) => updateStock(event.target.value)}
                      className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                      placeholder="1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[color:var(--ink)]">
                      Talla
                    </span>
                    <input
                      value={form.size}
                      onChange={(event) => updateField('size', event.target.value)}
                      className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                      placeholder="S, M, 24.5"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[color:var(--ink)]">
                      Color
                    </span>
                    <input
                      value={form.color}
                      onChange={(event) =>
                        updateField('color', event.target.value)
                      }
                      className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                      placeholder="Negro"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-[color:var(--ink)]">
                    Descripcion
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField('description', event.target.value)
                    }
                    rows="4"
                    className="focus-ring mt-2 w-full resize-none rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                    placeholder="Material, corte, condicion, detalles..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[color:var(--ink)]">
                    Notas
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    rows="3"
                    className="focus-ring mt-2 w-full resize-none rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                    placeholder="Cliente, pago, entrega, pendientes..."
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    addFiles(event.dataTransfer.files)
                  }}
                  className={`rounded-lg border border-dashed p-6 text-center transition ${
                    dragging
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                      : 'border-[color:var(--line)] bg-[color:var(--surface)]/70'
                  }`}
                >
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                    <FiUploadCloud className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[color:var(--ink)]">
                    Arrastra imagenes aqui
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    JPG, PNG o WEBP. Se guardan en LocalStorage.
                  </p>
                  <label className="focus-ring mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]">
                    <FiPlus className="h-4 w-4" />
                    Seleccionar imagenes
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => addFiles(event.target.files)}
                    />
                  </label>
                </div>

                {safeImages.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {safeImages.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)]"
                      >
                        <img
                          src={image}
                          alt={`Producto ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="focus-ring absolute right-2 top-2 rounded-md bg-black/55 p-2 text-white opacity-0 transition group-hover:opacity-100"
                          aria-label="Eliminar imagen"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid aspect-square place-items-center rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--muted)]">
                    <div className="text-center">
                      <FiImage className="mx-auto h-8 w-8" />
                      <p className="mt-2 text-sm">Sin imagenes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[color:var(--line)] pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="focus-ring rounded-md bg-[color:var(--ink)] px-5 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Guardar producto
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
