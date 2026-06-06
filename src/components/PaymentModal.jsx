import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { FiCreditCard, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../data/initialPayments'
import { formatCurrency } from '../utils/formatters'
import {
  getPaymentPurchaseTotal,
  normalizePaymentItems,
  normalizePaymentType,
} from '../utils/payments'

const getToday = () => new Date().toISOString().slice(0, 10)

const blankPayment = {
  clientName: '',
  productId: '',
  productName: '',
  items: [],
  purchaseTotal: 0,
  amount: '0',
  method: 'Transferencia',
  type: 'Sin Pago',
  paymentDate: getToday(),
  notes: '',
}

const getInitialForm = (payment) =>
  payment
    ? {
        ...blankPayment,
        ...payment,
        items: normalizePaymentItems(payment),
        purchaseTotal: getPaymentPurchaseTotal(payment),
        type: normalizePaymentType(payment.type),
      }
    : { ...blankPayment }

const blankItem = {
  productId: '',
  name: '',
  quantity: 1,
  price: '',
}

const createItemId = () =>
  crypto?.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`

export default function PaymentModal({
  isOpen,
  payment,
  products,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => getInitialForm(payment))
  const [itemDraft, setItemDraft] = useState(blankItem)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  )
  const safeItems = useMemo(
    () => (Array.isArray(form.items) ? form.items : []),
    [form.items],
  )
  const title = useMemo(
    () => (payment ? 'Editar pago' : 'Registrar pago'),
    [payment],
  )
  const purchaseTotal = useMemo(
    () =>
      safeItems.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 1),
        0,
      ),
    [safeItems],
  )
  const pendingAmount = Math.max(purchaseTotal - Number(form.amount || 0), 0)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateItemDraft = (field, value) => {
    setItemDraft((current) => ({ ...current, [field]: value }))
  }

  const updatePaymentType = (value) => {
    const type = normalizePaymentType(value)
    setForm((current) => ({
      ...current,
      type,
      amount: type === 'Sin Pago' && current.amount === '' ? '0' : current.amount,
    }))
  }

  const handleDraftProductChange = (productId) => {
    const product = safeProducts.find((item) => item.id === productId)
    setItemDraft((current) => ({
      ...current,
      productId,
      name: product ? product.name : current.name,
      price: product ? product.price : current.price,
    }))
  }

  const addItem = () => {
    if (!itemDraft.name.trim()) {
      return
    }

    const nextItem = {
      ...itemDraft,
      id: createItemId(),
      name: itemDraft.name.trim(),
      productId: itemDraft.productId || '',
      quantity: Number(itemDraft.quantity) || 1,
      price: Number(itemDraft.price) || 0,
    }

    setForm((current) => ({
      ...current,
      items: [
        ...(Array.isArray(current.items) ? current.items : []),
        nextItem,
      ],
    }))
    setItemDraft(blankItem)
    setFormError('')
  }

  const removeItem = (itemId) => {
    setForm((current) => ({
      ...current,
      items: (Array.isArray(current.items) ? current.items : []).filter(
        (item) => item.id !== itemId,
      ),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const clientName = form.clientName.trim()
    const type = normalizePaymentType(form.type)
    const amount = Number(form.amount || 0)

    if (!clientName) {
      setFormError('Escribe el nombre de la clienta para guardar el pago.')
      return
    }

    if (Number.isNaN(amount) || amount < 0) {
      setFormError('El monto recibido debe ser un numero valido.')
      return
    }

    if (type !== 'Sin Pago' && amount <= 0) {
      setFormError('Para anticipo o pago completo, el monto debe ser mayor a cero.')
      return
    }

    const items = safeItems
      .map((item) => ({
        id: item.id || createItemId(),
        productId: item.productId || '',
        name: String(item.name || '').trim(),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }))
      .filter((item) => item.name)
    const total = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0,
    )
    const firstItem = items[0]
    const productName = items.length
      ? items.map((item) => item.name).join(', ')
      : form.productName.trim()

    setIsSaving(true)

    try {
      await Promise.resolve(
        onSave({
          ...form,
          clientName,
          productId: firstItem?.productId || form.productId || '',
          productName,
          items,
          purchaseTotal: total,
          amount,
          type,
        }),
      )
    } catch {
      setIsSaving(false)
      setFormError('No se pudo guardar el pago. Intentalo otra vez.')
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
            noValidate
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel mx-auto w-full max-w-3xl rounded-lg p-4 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] pb-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                  <FiCreditCard className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase text-[color:var(--muted)]">
                    Mossi Shop
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
                    {title}
                  </h2>
                </div>
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  Cliente
                </span>
                <input
                  value={form.clientName}
                  onChange={(event) =>
                    updateField('clientName', event.target.value)
                  }
                  className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                  placeholder="Nombre de la clienta"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  Monto recibido
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.amount}
                  onChange={(event) => updateField('amount', event.target.value)}
                  className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                  placeholder="0"
                  required
                />
              </label>

              <div className="sm:col-span-2 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      Articulos de la compra
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                      Agrega todo lo que compro la clienta: perfumes, ropa,
                      bolsas, zapatos o piezas del inventario.
                    </p>
                  </div>
                  <div className="rounded-md bg-[color:var(--canvas)] px-3 py-2 text-sm">
                    <span className="text-[color:var(--muted)]">Total compra </span>
                    <span className="font-semibold text-[color:var(--ink)]">
                      {formatCurrency(purchaseTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_0.7fr_0.75fr_auto]">
                  <label className="block">
                    <span className="text-xs font-medium text-[color:var(--muted)]">
                      Inventario
                    </span>
                    <select
                      value={itemDraft.productId}
                      onChange={(event) =>
                        handleDraftProductChange(event.target.value)
                      }
                      className="focus-ring mt-1 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none"
                    >
                      <option value="">Manual</option>
                      {safeProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-[color:var(--muted)]">
                      Articulo
                    </span>
                    <input
                      value={itemDraft.name}
                      onChange={(event) =>
                        updateItemDraft('name', event.target.value)
                      }
                      className="focus-ring mt-1 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none"
                      placeholder="Perfume, bolsa..."
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-[color:var(--muted)]">
                      Cant.
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={itemDraft.quantity}
                      onChange={(event) =>
                        updateItemDraft('quantity', event.target.value)
                      }
                      className="focus-ring mt-1 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-[color:var(--muted)]">
                      Precio
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={itemDraft.price}
                      onChange={(event) =>
                        updateItemDraft('price', event.target.value)
                      }
                      className="focus-ring mt-1 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none"
                      placeholder="0"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={addItem}
                    className="focus-ring mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-3 py-2.5 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <FiPlus className="h-4 w-4" />
                    Agregar
                  </button>
                </div>

                {safeItems.length ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--line)]">
                    {safeItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 border-b border-[color:var(--line)] bg-[color:var(--canvas)] p-3 last:border-b-0 sm:grid-cols-[1fr_auto_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[color:var(--ink)]">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-[color:var(--muted)]">
                            Cant. {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[color:var(--ink)]">
                          {formatCurrency(
                            Number(item.price || 0) * Number(item.quantity || 1),
                          )}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md border border-dashed border-[color:var(--line)] px-3 py-5 text-center text-sm text-[color:var(--muted)]">
                    Aun no hay articulos en esta compra.
                  </p>
                )}
              </div>

              <label className="block">
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  Metodo de pago
                </span>
                <select
                  value={form.method}
                  onChange={(event) => updateField('method', event.target.value)}
                  className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  Tipo de pago
                </span>
                <select
                  value={form.type}
                  onChange={(event) => updatePaymentType(event.target.value)}
                  className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                >
                  {PAYMENT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  Fecha de pago
                </span>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) =>
                    updateField('paymentDate', event.target.value)
                  }
                  className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                  required
                />
              </label>

              <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase text-[color:var(--muted)]">
                  Resumen
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-[color:var(--muted)]">Compra</p>
                    <p className="font-semibold text-[color:var(--ink)]">
                      {formatCurrency(purchaseTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[color:var(--muted)]">Pagado</p>
                    <p className="font-semibold text-[color:var(--ink)]">
                      {formatCurrency(form.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[color:var(--muted)]">Resta</p>
                    <p className="font-semibold text-[color:var(--ink)]">
                      {formatCurrency(pendingAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-[color:var(--ink)]">
                  Notas
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  rows="4"
                  className="focus-ring mt-2 w-full resize-none rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
                  placeholder="Referencia, banco, resta por pagar, entrega..."
                />
              </label>
            </div>

            {formError ? (
              <p className="mt-4 rounded-md border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm font-medium text-[color:var(--danger)]">
                {formError}
              </p>
            ) : null}

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
                disabled={isSaving}
                className="focus-ring rounded-md bg-[color:var(--ink)] px-5 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isSaving ? 'Guardando...' : 'Guardar pago'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
