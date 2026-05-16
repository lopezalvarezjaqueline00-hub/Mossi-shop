import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  FiCreditCard,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
} from 'react-icons/fi'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import PaymentModal from '../components/PaymentModal'
import StatCard from '../components/StatCard'
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../data/initialPayments'
import { usePayments } from '../hooks/usePayments'
import { useProducts } from '../hooks/useProducts'
import { useToast } from '../hooks/useToast'
import { formatCurrency, formatDate, normalizeText } from '../utils/formatters'
import {
  getPaymentItemsLabel,
  getPaymentPurchaseTotal,
  normalizePaymentItems,
} from '../utils/payments'

const initialFilters = {
  query: '',
  method: 'Todos',
  type: 'Todos',
}

const TYPE_STYLES = {
  Anticipo:
    'border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 text-[color:var(--warning)]',
  Liquidacion:
    'border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]',
  'Pago completo':
    'border-[color:var(--accent)]/30 bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]',
}

function PaymentTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        TYPE_STYLES[type] || TYPE_STYLES.Anticipo
      }`}
    >
      {type}
    </span>
  )
}

export default function PaymentsPage({
  openCreateOnMount = false,
  onCreateRequestHandled,
}) {
  const {
    payments,
    addPayment,
    updatePayment,
    deletePayment,
  } = usePayments()
  const { products } = useProducts()
  const { notify } = useToast()
  const [filters, setFilters] = useState(initialFilters)
  const [modalOpen, setModalOpen] = useState(openCreateOnMount)
  const [editingPayment, setEditingPayment] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 280)
    return () => window.clearTimeout(timeout)
  }, [])

  const stats = useMemo(() => {
    const totalReceived = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    )
    const advances = payments
      .filter((payment) => payment.type === 'Anticipo')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const completePayments = payments
      .filter((payment) => payment.type === 'Pago completo')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    return {
      totalReceived,
      advances,
      completePayments,
      count: payments.length,
    }
  }, [payments])

  const filteredPayments = useMemo(() => {
    const query = normalizeText(filters.query)

    return [...payments]
      .filter((payment) => {
        const itemsText = normalizePaymentItems(payment)
          .map((item) => `${item.name} ${item.category}`)
          .join(' ')
        const searchable = normalizeText(
          `${payment.clientName} ${payment.productName} ${itemsText} ${payment.notes}`,
        )
        const matchesQuery = query ? searchable.includes(query) : true
        const matchesMethod =
          filters.method === 'Todos' || payment.method === filters.method
        const matchesType =
          filters.type === 'Todos' || payment.type === filters.type

        return matchesQuery && matchesMethod && matchesType
      })
      .sort(
        (a, b) =>
          new Date(`${b.paymentDate}T12:00:00`) -
          new Date(`${a.paymentDate}T12:00:00`),
      )
  }, [filters, payments])

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleCreate = () => {
    setEditingPayment(null)
    setModalOpen(true)
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
    setModalOpen(true)
  }

  const closePaymentModal = () => {
    setModalOpen(false)
    setEditingPayment(null)
    if (openCreateOnMount) {
      onCreateRequestHandled()
    }
  }

  const handleSave = (payload) => {
    if (editingPayment) {
      updatePayment(editingPayment.id, payload)
      notify({
        title: 'Pago actualizado',
        message: `Se actualizo el pago de ${payload.clientName}.`,
      })
    } else {
      addPayment(payload)
      notify({
        title: 'Pago registrado',
        message: `${formatCurrency(payload.amount)} de ${payload.clientName}.`,
      })
    }

    closePaymentModal()
  }

  const confirmDelete = () => {
    if (!deleteTarget) {
      return
    }

    deletePayment(deleteTarget.id)
    notify({
      title: 'Pago eliminado',
      message: `Se elimino el pago de ${deleteTarget.clientName}.`,
      type: 'info',
    })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm uppercase text-[color:var(--muted)]">Caja</p>
          <h2 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
            Pagos
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Registra anticipos, liquidaciones y pagos completos con cliente,
            producto, metodo y notas.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCreate}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <FiPlus className="h-4 w-4" />
            Registrar pago
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total recibido"
          value={formatCurrency(stats.totalReceived)}
          helper="Pagos registrados"
          icon={FiCreditCard}
        />
        <StatCard
          label="Anticipos"
          value={formatCurrency(stats.advances)}
          helper="Dinero apartado"
          icon={FiCreditCard}
          tone="bg-[color:var(--warning)]/10 text-[color:var(--warning)]"
        />
        <StatCard
          label="Pagos completos"
          value={formatCurrency(stats.completePayments)}
          helper="Liquidado en una exhibicion"
          icon={FiCreditCard}
          tone="bg-[color:var(--success)]/10 text-[color:var(--success)]"
        />
        <StatCard
          label="Movimientos"
          value={stats.count}
          helper="Registros de pago"
          icon={FiCreditCard}
        />
      </section>

      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <label className="relative block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              value={filters.query}
              onChange={(event) => setFilter('query', event.target.value)}
              className="focus-ring w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] py-3 pl-10 pr-3 text-sm text-[color:var(--ink)] outline-none"
              placeholder="Buscar cliente, producto o nota"
            />
          </label>
          <select
            value={filters.method}
            onChange={(event) => setFilter('method', event.target.value)}
            className="focus-ring w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
          >
            <option>Todos</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
          <select
            value={filters.type}
            onChange={(event) => setFilter('type', event.target.value)}
            className="focus-ring w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
          >
            <option>Todos</option>
            {PAYMENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)]"
            />
          ))}
        </div>
      ) : filteredPayments.length ? (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <EmptyState
          title="No hay pagos registrados"
          description="Registra el primer anticipo, liquidacion o pago completo para tener caja al dia."
          action={
            <button
              type="button"
              onClick={handleCreate}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)]"
            >
              <FiPlus className="h-4 w-4" />
              Registrar pago
            </button>
          }
        />
      )}

      {modalOpen ? (
        <PaymentModal
          isOpen={modalOpen}
          payment={editingPayment}
          products={products}
          onClose={closePaymentModal}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Eliminar pago"
        description={`Esta accion eliminara el pago de "${deleteTarget?.clientName}" del historial local.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function PaymentRow({ payment, onEdit, onDelete }) {
  const items = normalizePaymentItems(payment)
  const purchaseTotal = getPaymentPurchaseTotal(payment)
  const paidAmount = Number(payment.amount || 0)
  const pendingAmount = Math.max(purchaseTotal - paidAmount, 0)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr_0.85fr_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-[color:var(--ink)]">
              {payment.clientName}
            </h3>
            <PaymentTypeBadge type={payment.type} />
            {items.length > 1 ? (
              <span className="inline-flex rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs font-medium text-[color:var(--muted)]">
                {items.length} articulos
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm text-[color:var(--muted)]">
            {getPaymentItemsLabel(payment)}
          </p>
          {items.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {items.slice(0, 4).map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-[color:var(--surface-muted)] px-2.5 py-1 text-xs text-[color:var(--muted)]"
                >
                  {item.quantity}x {item.name}
                </span>
              ))}
              {items.length > 4 ? (
                <span className="rounded-full bg-[color:var(--surface-muted)] px-2.5 py-1 text-xs text-[color:var(--muted)]">
                  +{items.length - 4} mas
                </span>
              ) : null}
            </div>
          ) : null}
          {payment.notes ? (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[color:var(--muted)]">
              {payment.notes}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs text-[color:var(--muted)]">Metodo</p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--ink)]">
            {payment.method}
          </p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            {formatDate(`${payment.paymentDate}T12:00:00`)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-[color:var(--canvas)] p-3 text-sm">
          <div>
            <p className="text-xs text-[color:var(--muted)]">Compra</p>
            <p className="font-semibold text-[color:var(--ink)]">
              {formatCurrency(purchaseTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[color:var(--muted)]">Pagado</p>
            <p className="font-semibold text-[color:var(--ink)]">
              {formatCurrency(paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[color:var(--muted)]">Resta</p>
            <p className="font-semibold text-[color:var(--ink)]">
              {formatCurrency(pendingAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 xl:justify-end">
          <p className="text-xl font-semibold text-[color:var(--ink)]">
            {formatCurrency(payment.amount)}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEdit(payment)}
              className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--accent-strong)]"
              aria-label={`Editar pago de ${payment.clientName}`}
              title="Editar"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(payment)}
              className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
              aria-label={`Eliminar pago de ${payment.clientName}`}
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
