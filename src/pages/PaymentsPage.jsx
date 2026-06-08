import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import { PAYMENT_METHODS } from '../data/initialPayments'
import { useAuth } from '../hooks/useAuth'
import { useClients } from '../hooks/useClients'
import { useDeletedItems } from '../hooks/useDeletedItems'
import { useMovements } from '../hooks/useMovements'
import { usePayments } from '../hooks/usePayments'
import { useProducts } from '../hooks/useProducts'
import { useSales } from '../hooks/useSales'
import { useToast } from '../hooks/useToast'
import { formatCurrency, formatDate, normalizeText } from '../utils/formatters'
import { getPaymentItemsLabel } from '../utils/payments'
import { downloadAbonoReceipt, downloadSaleTicket } from '../utils/salesReceipts'

const saleStatuses = ['Pagado', 'Pendiente', 'Apartado']

const initialFilters = {
  query: '',
}

const statusStyles = {
  Pagado:
    'border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]',
  Pendiente:
    'border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 text-[color:var(--warning)]',
  Apartado:
    'border-[color:var(--accent)]/30 bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]',
}

const getToday = () => new Date().toISOString().slice(0, 10)

const getAdminName = (user) => user?.name || user?.email || 'Administradora'

const getProductStock = (product) => {
  const stock = Number(product.stock)
  return Number.isFinite(stock) ? Math.max(0, stock) : 1
}

const getDeleteMeta = (kind, item) => {
  if (kind === 'sale') {
    return {
      typeLabel: 'venta',
      title: `Venta ${item.clientName}`,
      description: item.ticketNumber,
      amount: item.total,
    }
  }

  if (kind === 'payment') {
    return {
      typeLabel: 'pago',
      title: `Pago ${item.clientName}`,
      description: item.productName,
      amount: item.amount,
    }
  }

  return {
    typeLabel: 'movimiento',
    title: item.title,
    description: item.description,
    amount: item.amount,
  }
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        statusStyles[status] || statusStyles.Pendiente
      }`}
    >
      {status}
    </span>
  )
}

function ActionCard({ icon: Icon, title, description, buttonLabel, onClick }) {
  return (
    <article className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[color:var(--ink)]">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {description}
          </p>
          <button
            type="button"
            onClick={onClick}
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <FiPlus className="h-4 w-4" />
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function PaymentsPage({
  openCreateOnMount = false,
  onCreateRequestHandled,
}) {
  const { user } = useAuth()
  const { clients, addClient } = useClients()
  const { addDeletedItem } = useDeletedItems()
  const { movements, addMovement, deleteMovement } = useMovements()
  const { payments, addPayment, deletePayment } = usePayments()
  const { products, addProduct, updateProduct } = useProducts()
  const { sales, addSale, updateSale, deleteSale } = useSales()
  const { notify } = useToast()
  const [filters, setFilters] = useState(initialFilters)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [abonoModalOpen, setAbonoModalOpen] = useState(openCreateOnMount)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  const safeClients = useMemo(
    () => (Array.isArray(clients) ? clients : []),
    [clients],
  )
  const safePayments = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments],
  )
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  )
  const safeSales = useMemo(() => (Array.isArray(sales) ? sales : []), [sales])
  const safeMovements = useMemo(
    () => (Array.isArray(movements) ? movements : []),
    [movements],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 280)
    return () => window.clearTimeout(timeout)
  }, [])

  const stats = useMemo(() => {
    const totalReceived = safePayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    )
    const pendingTotal = safeSales.reduce(
      (sum, sale) => sum + Number(sale.balance || 0),
      0,
    )

    return {
      salesCount: safeSales.length,
      totalReceived,
      pendingTotal,
      paymentsCount: safePayments.length,
    }
  }, [safePayments, safeSales])

  const filteredSales = useMemo(() => {
    const query = normalizeText(filters.query)

    return [...safeSales]
      .filter((sale) => {
        const itemText = sale.items?.map((item) => item.name).join(' ') || ''
        const searchable = normalizeText(
          `${sale.clientName} ${sale.ticketNumber} ${sale.status} ${itemText}`,
        )
        return query ? searchable.includes(query) : true
      })
      .sort(
        (a, b) =>
          new Date(`${b.saleDate}T12:00:00`) -
          new Date(`${a.saleDate}T12:00:00`),
      )
  }, [filters.query, safeSales])

  const filteredPayments = useMemo(() => {
    const query = normalizeText(filters.query)

    return [...safePayments]
      .filter((payment) => {
        const searchable = normalizeText(
          `${payment.clientName} ${payment.productName} ${payment.notes}`,
        )
        return query ? searchable.includes(query) : true
      })
      .sort(
        (a, b) =>
          new Date(`${b.paymentDate}T12:00:00`) -
          new Date(`${a.paymentDate}T12:00:00`),
      )
  }, [filters.query, safePayments])

  const filteredMovements = useMemo(() => {
    const query = normalizeText(filters.query)

    return [...safeMovements]
      .filter((movement) => {
        const searchable = normalizeText(
          `${movement.title} ${movement.description} ${movement.type}`,
        )
        return query ? searchable.includes(query) : true
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [filters.query, safeMovements])

  const pendingSales = useMemo(
    () =>
      safeSales.filter(
        (sale) => Number(sale.balance || 0) > 0 || sale.status !== 'Pagado',
      ),
    [safeSales],
  )

  const closeAbonoModal = () => {
    setAbonoModalOpen(false)
    if (openCreateOnMount) {
      onCreateRequestHandled()
    }
  }

  const handleSaveSale = (payload) => {
    try {
      const saleItems = Array.isArray(payload.items) ? payload.items : []

      if (!saleItems.length) {
        throw new Error('Agrega al menos un producto a la venta.')
      }

      saleItems
        .filter((item) => item.source !== 'Manual')
        .forEach((item) => {
          const product = safeProducts.find(
            (entry) => entry.id === item.productId,
          )

          if (!product) {
            throw new Error(`No encontramos ${item.name} en inventario.`)
          }

          if (Number(item.quantity || 0) > getProductStock(product)) {
            throw new Error(
              `Stock insuficiente para ${item.name}. Disponible: ${getProductStock(product)}.`,
            )
          }
        })

      let client = safeClients.find((item) => item.id === payload.clientId)

      if (!client) {
        client = addClient({
          name: payload.clientName,
          phone: payload.clientPhone,
        })
      }

      const sale = addSale({
        clientId: client.id,
        clientName: client.name,
        clientPhone: payload.clientPhone,
        saleDate: payload.saleDate,
        items: saleItems,
        total: payload.total,
        amountPaid: payload.amountPaid,
        balance: payload.balance,
        status: payload.status,
        notes: payload.notes,
      })

      saleItems
        .filter((item) => item.source !== 'Manual')
        .forEach((item) => {
          const product = safeProducts.find((entry) => entry.id === item.productId)

          if (!product) {
            return
          }

          const nextStock = Math.max(getProductStock(product) - item.quantity, 0)
          updateProduct(product.id, {
            stock: nextStock,
            status: nextStock <= 0 ? 'Agotado' : product.status,
          })
        })

      const nextSaleItems = saleItems.map((item) => {
        if (item.source !== 'Manual' || !item.saveToInventory) {
          return item
        }

        const createdProduct = addProduct({
          name: item.name,
          category: 'Ropa',
          description: item.description,
          price: item.price,
          stock: item.quantity,
          status: 'Disponible',
          notes: `Creado desde ticket ${sale.ticketNumber}. Cantidad vendida: ${item.quantity}.`,
          images: [],
        })
        updateProduct(createdProduct.id, {
          stock: 0,
          status: 'Agotado',
        })

        return {
          ...item,
          productId: createdProduct.id,
          inventoryProductId: createdProduct.id,
        }
      })

      const finalSale =
        nextSaleItems.some((item) => item.inventoryProductId)
          ? updateSale(sale.id, { items: nextSaleItems }) || {
              ...sale,
              items: nextSaleItems,
            }
          : sale

      if (payload.amountPaid > 0) {
        addPayment({
          clientId: client.id,
          saleId: finalSale.id,
          clientName: client.name,
          productName: `Ticket ${finalSale.ticketNumber}`,
          items: finalSale.items,
          purchaseTotal: finalSale.total,
          amount: payload.amountPaid,
          balanceBefore: finalSale.total,
          balanceAfter: finalSale.balance,
          method: 'No especificado',
          type: finalSale.balance <= 0 ? 'Pago Completo' : 'Anticipo',
          paymentDate: payload.saleDate,
          kind: 'sale_payment',
          notes: payload.notes,
        })
      }

      addMovement({
        type: 'venta',
        title: `Venta ${client.name}`,
        description: `${finalSale.items.length} articulos vendidos`,
        amount: finalSale.total,
        createdBy: getAdminName(user),
      })

      try {
        downloadSaleTicket(finalSale)
      } catch (error) {
        console.error('Sale ticket PDF failed:', error)
      }

      notify({
        title: 'Venta guardada',
        message: `Ticket de ${client.name} generado.`,
      })
      setSaleModalOpen(false)
      return true
    } catch (error) {
      console.error('Sale save failed:', error)
      notify({
        title: 'No se pudo guardar la venta',
        message: error?.message || 'Revisa la conexion con Supabase.',
        type: 'error',
      })
      return false
    }
  }

  const handleSaveAbono = (payload) => {
    const sale = safeSales.find((item) => item.id === payload.saleId)

    if (!sale) {
      notify({
        title: 'Venta no encontrada',
        message: 'Selecciona una venta pendiente para registrar el abono.',
        type: 'error',
      })
      return
    }

    const amount = Number(payload.amount) || 0
    const balanceBefore = Number(sale.balance || 0)
    const balanceAfter = Math.max(balanceBefore - amount, 0)
    const nextAmountPaid = Number(sale.amountPaid || 0) + amount
    const nextStatus = balanceAfter <= 0 ? 'Pagado' : sale.status

    const updatedSale = updateSale(sale.id, {
      amountPaid: nextAmountPaid,
      balance: balanceAfter,
      status: nextStatus,
    }) || { ...sale, amountPaid: nextAmountPaid, balance: balanceAfter, status: nextStatus }

    const payment = addPayment({
      clientId: sale.clientId,
      saleId: sale.id,
      clientName: sale.clientName,
      productName: `Abono ${sale.ticketNumber}`,
      items: sale.items,
      purchaseTotal: sale.total,
      amount,
      balanceBefore,
      balanceAfter,
      method: payload.method,
      type: balanceAfter <= 0 ? 'Pago Completo' : 'Anticipo',
      paymentDate: payload.paymentDate,
      notes: payload.notes,
      kind: 'abono',
    })

    addMovement({
      type: 'abono',
      title: `Abono ${sale.clientName}`,
      description: `Saldo nuevo ${formatCurrency(balanceAfter)}`,
      amount,
      createdBy: getAdminName(user),
    })

    try {
      downloadAbonoReceipt(payment)
    } catch (error) {
      console.error('Abono PDF failed:', error)
    }

    notify({
      title: balanceAfter <= 0 ? 'Venta pagada' : 'Abono guardado',
      message: `${formatCurrency(amount)} registrado para ${updatedSale.clientName}.`,
    })
    closeAbonoModal()
  }

  const requestDelete = (kind, item) => {
    setDeleteTarget({ kind, item })
  }

  const confirmDelete = () => {
    if (!deleteTarget) {
      return
    }

    const { kind, item } = deleteTarget
    const deleteMeta = getDeleteMeta(kind, item)

    addDeletedItem({
      type: deleteMeta.typeLabel,
      originalId: item.id,
      title: deleteMeta.title,
      description: deleteMeta.description,
      amount: deleteMeta.amount,
      data: item,
      deletedBy: getAdminName(user),
    })

    if (kind === 'sale') {
      deleteSale(item.id)
    } else if (kind === 'payment') {
      deletePayment(item.id)
    } else {
      deleteMovement(item.id)
    }

    addMovement({
      type: 'eliminado',
      title: `${deleteMeta.title} eliminada`,
      description: 'Movido a Eliminados recientemente',
      amount: deleteMeta.amount,
      createdBy: getAdminName(user),
    })

    notify({
      title: 'Movido a eliminados',
      message: `${deleteMeta.title} se puede restaurar desde Eliminados recientemente.`,
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
            Registra ventas, genera tickets y controla abonos pendientes por
            clienta.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActionCard
          icon={FiShoppingBag}
          title="Nueva venta / Generar ticket"
          description="Registra productos vendidos, descuenta inventario y genera el ticket PDF."
          buttonLabel="Nueva venta"
          onClick={() => setSaleModalOpen(true)}
        />
        <ActionCard
          icon={FiCreditCard}
          title="Registrar pago / Abono"
          description="Selecciona una venta pendiente, guarda el abono y actualiza el saldo."
          buttonLabel="Registrar abono"
          onClick={() => setAbonoModalOpen(true)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Ventas"
          value={stats.salesCount}
          helper="Tickets generados"
          icon={FiFileText}
        />
        <StatCard
          label="Recibido"
          value={formatCurrency(stats.totalReceived)}
          helper="Pagos y abonos"
          icon={FiCreditCard}
          tone="bg-[color:var(--success)]/10 text-[color:var(--success)]"
        />
        <StatCard
          label="Pendiente"
          value={formatCurrency(stats.pendingTotal)}
          helper="Saldo por cobrar"
          icon={FiShoppingBag}
          tone="bg-[color:var(--warning)]/10 text-[color:var(--warning)]"
        />
        <StatCard
          label="Movimientos"
          value={stats.paymentsCount}
          helper="Abonos registrados"
          icon={FiCreditCard}
        />
      </section>

      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
            className="focus-ring w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] py-3 pl-10 pr-3 text-sm text-[color:var(--ink)] outline-none"
            placeholder="Buscar clienta, ticket o nota"
          />
        </label>
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
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <SectionHeader eyebrow="Ventas" title="Ventas realizadas" />
            {filteredSales.length ? (
              <AnimatePresence mode="popLayout">
                {filteredSales.map((sale) => (
                  <SaleRow
                    key={sale.id}
                    sale={sale}
                    onDelete={(item) => requestDelete('sale', item)}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <EmptyState
                title="No hay ventas registradas"
                description="Crea una venta para generar el primer ticket."
              />
            )}
          </div>

          <div className="space-y-4">
            <SectionHeader eyebrow="Abonos" title="Pagos y pendientes" />
            {filteredPayments.length ? (
              <div className="space-y-3">
                {filteredPayments.slice(0, 6).map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onDelete={(item) => requestDelete('payment', item)}
                  />
                ))}
              </div>
            ) : null}

            {pendingSales.length ? (
              <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase text-[color:var(--muted)]">
                  Pagos pendientes
                </p>
                <div className="mt-3 space-y-3">
                  {pendingSales.slice(0, 5).map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between gap-3 rounded-md bg-[color:var(--canvas)] p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--ink)]">
                          {sale.clientName}
                        </p>
                        <p className="text-xs text-[color:var(--muted)]">
                          {sale.ticketNumber}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[color:var(--ink)]">
                        {formatCurrency(sale.balance)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {filteredMovements.length ? (
              <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase text-[color:var(--muted)]">
                  Historial
                </p>
                <div className="mt-3 space-y-3">
                  {filteredMovements.slice(0, 6).map((movement) => (
                    <MovementRow
                      key={movement.id}
                      movement={movement}
                      onDelete={(item) => requestDelete('movement', item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <SaleModal
        isOpen={saleModalOpen}
        clients={safeClients}
        products={safeProducts}
        onClose={() => setSaleModalOpen(false)}
        onSave={handleSaveSale}
      />

      <AbonoModal
        isOpen={abonoModalOpen}
        clients={safeClients}
        sales={pendingSales}
        onClose={closeAbonoModal}
        onSave={handleSaveAbono}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Mover a eliminados"
        description={`Esta accion movera "${
          deleteTarget?.item?.clientName || 'este registro'
        }" a Eliminados recientemente.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div>
      <p className="text-sm uppercase text-[color:var(--muted)]">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
        {title}
      </h3>
    </div>
  )
}

function SaleRow({ sale, onDelete }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-[color:var(--ink)]">
              {sale.clientName}
            </h3>
            <StatusBadge status={sale.status} />
          </div>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {sale.ticketNumber} · {sale.items.length} articulos ·{' '}
            {formatDate(`${sale.saleDate}T12:00:00`)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-[color:var(--canvas)] p-3 text-sm">
          <Amount label="Total" value={sale.total} />
          <Amount label="Pagado" value={sale.amountPaid} />
          <Amount label="Resta" value={sale.balance} />
        </div>
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => downloadSaleTicket(sale)}
            className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--ink)]"
            aria-label={`Descargar ticket de ${sale.clientName}`}
            title="Descargar ticket"
          >
            <FiDownload className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(sale)}
            className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
            aria-label={`Eliminar venta de ${sale.clientName}`}
            title="Eliminar"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function PaymentRow({ payment, onDelete }) {
  return (
    <article className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[color:var(--ink)]">
            {payment.clientName}
          </h3>
          <p className="mt-1 truncate text-xs text-[color:var(--muted)]">
            {getPaymentItemsLabel(payment)}
          </p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            {formatDate(`${payment.paymentDate}T12:00:00`)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-[color:var(--ink)]">
            {formatCurrency(payment.amount)}
          </p>
          <button
            type="button"
            onClick={() => onDelete(payment)}
            className="focus-ring mt-2 rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
            aria-label={`Eliminar pago de ${payment.clientName}`}
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

function MovementRow({ movement, onDelete }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-[color:var(--canvas)] p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[color:var(--ink)]">
          {movement.title}
        </p>
        <p className="truncate text-xs text-[color:var(--muted)]">
          {movement.description || movement.type}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-[color:var(--ink)]">
          {movement.amount ? formatCurrency(movement.amount) : ''}
        </p>
        <button
          type="button"
          onClick={() => onDelete(movement)}
          className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
          aria-label={`Eliminar movimiento ${movement.title}`}
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Amount({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[color:var(--muted)]">{label}</p>
      <p className="font-semibold text-[color:var(--ink)]">
        {formatCurrency(value)}
      </p>
    </div>
  )
}

const emptyManualDraft = {
  name: '',
  price: '',
  quantity: 1,
  description: '',
  saveToInventory: false,
}

const safeList = (value) => (Array.isArray(value) ? value : [])

const getPositiveInteger = (value, fallback = 1) => {
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) ? Math.max(1, number) : fallback
}

const getPositiveMoney = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : 0
}

const getCartItems = (items) =>
  safeList(items).filter(
    (item) => item && typeof item === 'object' && !Array.isArray(item),
  )

function SaleModal({ isOpen, clients, products, onClose, onSave }) {
  const [form, setForm] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    saleDate: getToday(),
    status: 'Pendiente',
    amountPaid: '',
    notes: '',
  })
  const [draft, setDraft] = useState({ productId: '', quantity: 1 })
  const [manualDraft, setManualDraft] = useState(emptyManualDraft)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const safeClients = useMemo(() => safeList(clients), [clients])
  const safeCartItems = useMemo(() => getCartItems(items), [items])

  const availableProducts = useMemo(
    () =>
      safeList(products).filter(
        (product) =>
          !['Vendido', 'Agotado'].includes(product.status) &&
          getProductStock(product) > 0,
      ),
    [products],
  )

  const selectedProduct = availableProducts.find(
    (product) => product.id === draft.productId,
  )
  const selectedStock = selectedProduct ? getProductStock(selectedProduct) : 0
  const total = safeCartItems.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0,
  )
  const amountPaid = getPositiveMoney(form.amountPaid)
  const balance = Math.max(total - amountPaid, 0)
  const statusHint = (() => {
    if (form.status === 'Pagado' && total > 0 && amountPaid !== total) {
      return 'Para una venta pagada, el monto pagado deberia coincidir con el total.'
    }

    if (amountPaid === 0 && form.status !== 'Pendiente') {
      return 'Con monto pagado en cero, lo mas claro es dejar el estado como Pendiente.'
    }

    if (amountPaid > 0 && amountPaid < total && form.status === 'Pagado') {
      return 'Aun queda saldo pendiente; puedes marcarla como Pendiente o Apartado.'
    }

    return ''
  })()

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const selectClient = (clientId) => {
    const client = safeClients.find((item) => item.id === clientId)
    setForm((current) => ({
      ...current,
      clientId,
      clientName: client ? client.name : '',
      clientPhone: client ? client.phone : '',
    }))
  }

  const updateManualDraft = (field, value) => {
    setManualDraft((current) => ({ ...current, [field]: value }))
  }

  const addInventoryItem = () => {
    if (!selectedProduct) {
      setError('Selecciona un producto del inventario.')
      return
    }

    const quantity = getPositiveInteger(draft.quantity)
    const currentQuantity = safeCartItems
      .filter((item) => item.productId === selectedProduct.id)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)

    if (quantity + currentQuantity > selectedStock) {
      setError(`Solo hay ${selectedStock} disponibles de este producto.`)
      return
    }

    const price = Number(selectedProduct.price || 0)
    setItems((current) => {
      const safeCurrent = getCartItems(current)
      const existingItem = safeCurrent.find(
        (item) => item.productId === selectedProduct.id,
      )

      if (!existingItem) {
        return [
          ...safeCurrent,
          {
            id: `${selectedProduct.id}-${Date.now()}`,
            productId: selectedProduct.id,
            source: 'Inventario',
            name: selectedProduct.name,
            description: selectedProduct.description || '',
            quantity,
            price,
            subtotal: quantity * price,
          },
        ]
      }

      return safeCurrent.map((item) => {
        if (item.productId !== selectedProduct.id) {
          return item
        }

        const nextQuantity = item.quantity + quantity

        return {
          ...item,
          quantity: nextQuantity,
          subtotal: nextQuantity * item.price,
        }
      })
    })
    setDraft({ productId: '', quantity: 1 })
    setError('')
  }

  const addManualItem = () => {
    const name = manualDraft.name.trim()
    const quantity = getPositiveInteger(manualDraft.quantity)
    const price = getPositiveMoney(manualDraft.price)

    if (!name) {
      setError('Escribe el nombre del producto manual.')
      return
    }

    setItems((current) => [
      ...getCartItems(current),
      {
        id: `manual-${Date.now()}`,
        productId: '',
        source: 'Manual',
        name,
        description: manualDraft.description.trim(),
        quantity,
        price,
        subtotal: quantity * price,
        saveToInventory: Boolean(manualDraft.saveToInventory),
      },
    ])
    setManualDraft(emptyManualDraft)
    setError('')
  }

  const removeItem = (itemId) => {
    setItems((current) =>
      getCartItems(current).filter((item) => item.id !== itemId),
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!form.clientName.trim()) {
      setError('Escribe o selecciona una clienta.')
      return
    }

    if (!safeCartItems.length) {
      setError('Agrega al menos un producto a la venta.')
      return
    }

    if (amountPaid > total) {
      setError('El monto pagado no puede ser mayor al total.')
      return
    }

    try {
      const saved = onSave({
        ...form,
        clientName: form.clientName.trim(),
        items: safeCartItems,
        total,
        amountPaid,
        balance,
        status: balance <= 0 ? 'Pagado' : form.status,
      })

      if (saved === false) {
        setError('No se pudo guardar la venta. Revisa el mensaje de error e intenta de nuevo.')
        return
      }
    } catch (saveError) {
      console.error('Sale modal save failed:', saveError)
      setError(saveError?.message || 'No se pudo guardar la venta.')
      return
    }

    setForm({
      clientId: '',
      clientName: '',
      clientPhone: '',
      saleDate: getToday(),
      status: 'Pendiente',
      amountPaid: '',
      notes: '',
    })
    setManualDraft(emptyManualDraft)
    setItems([])
  }

  if (!isOpen) {
    return null
  }

  return (
    <ModalShell
      title="Nueva venta / Generar ticket"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Guardar venta / generar PDF"
    >
      <TicketSection eyebrow="Paso 1" title="Datos de la clienta">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[color:var(--ink)]">
              Clienta existente
            </span>
            <select
              value={form.clientId}
              onChange={(event) => selectClient(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
            >
              <option value="">Crear nueva</option>
              {safeClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
          <TextInput
            label="Nombre de clienta"
            value={form.clientName}
            onChange={(value) => updateForm('clientName', value)}
            required
          />
          <TextInput
            label="Telefono opcional"
            value={form.clientPhone}
            onChange={(value) => updateForm('clientPhone', value)}
          />
          <TextInput
            label="Fecha"
            type="date"
            value={form.saleDate}
            onChange={(value) => updateForm('saleDate', value)}
          />
        </div>
      </TicketSection>

      <TicketSection eyebrow="Paso 2" title="Agregar productos">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas)] p-4">
            <p className="text-sm font-semibold text-[color:var(--ink)]">
              Desde inventario
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.35fr]">
              <label className="block">
                <span className="text-xs font-medium text-[color:var(--muted)]">
                  Producto
                </span>
                <select
                  value={draft.productId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      productId: event.target.value,
                    }))
                  }
                  className="focus-ring mt-1 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none"
                >
                  <option value="">Seleccionar producto</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
              </label>
              <TextInput
                label="Cantidad"
                type="number"
                value={draft.quantity}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, quantity: value }))
                }
              />
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[color:var(--muted)]">
                Stock disponible: {selectedProduct ? selectedStock : '-'}
              </p>
              <button
                type="button"
                onClick={addInventoryItem}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-2.5 text-sm font-semibold text-[color:var(--surface)]"
              >
                <FiPlus className="h-4 w-4" />
                Agregar al ticket
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas)] p-4">
            <p className="text-sm font-semibold text-[color:var(--ink)]">
              Producto manual
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextInput
                label="Nombre del producto"
                value={manualDraft.name}
                onChange={(value) => updateManualDraft('name', value)}
              />
              <TextInput
                label="Precio"
                type="number"
                value={manualDraft.price}
                onChange={(value) => updateManualDraft('price', value)}
              />
              <TextInput
                label="Cantidad"
                type="number"
                value={manualDraft.quantity}
                onChange={(value) => updateManualDraft('quantity', value)}
              />
              <label className="mt-7 flex items-center gap-2 text-sm text-[color:var(--ink)]">
                <input
                  type="checkbox"
                  checked={manualDraft.saveToInventory}
                  onChange={(event) =>
                    updateManualDraft('saveToInventory', event.target.checked)
                  }
                  className="h-4 w-4 rounded border-[color:var(--line)] accent-[color:var(--ink)]"
                />
                Guardar tambien en inventario
              </label>
            </div>
            <TextArea
              label="Descripcion opcional"
              value={manualDraft.description}
              onChange={(value) => updateManualDraft('description', value)}
            />
            <button
              type="button"
              onClick={addManualItem}
              className="focus-ring mt-3 inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
            >
              <FiPlus className="h-4 w-4" />
              Agregar manual al ticket
            </button>
          </div>
        </div>
      </TicketSection>

      <TicketSection eyebrow="Paso 3" title="Productos en este ticket">
        {safeCartItems.length ? (
          <div className="space-y-3">
            {safeCartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-md bg-[color:var(--canvas)] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--ink)]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {item.source || 'Inventario'} · Cantidad: {item.quantity} ·{' '}
                    {formatCurrency(item.price)} c/u
                  </p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[color:var(--muted)]">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-start gap-3">
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {formatCurrency(item.subtotal)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
                    aria-label={`Quitar ${item.name}`}
                    title="Quitar"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md bg-[color:var(--canvas)] p-4 text-sm text-[color:var(--muted)]">
            Todavia no hay productos en este ticket.
          </div>
        )}
      </TicketSection>

      <TicketSection eyebrow="Paso 4" title="Resumen del ticket">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Monto pagado"
            type="number"
            value={form.amountPaid}
            onChange={(value) => updateForm('amountPaid', value)}
          />
          <label className="block">
            <span className="text-sm font-medium text-[color:var(--ink)]">
              Estado
            </span>
            <select
              value={form.status}
              onChange={(event) => updateForm('status', event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
            >
              {saleStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        {statusHint ? (
          <p className="text-xs text-[color:var(--muted)]">{statusHint}</p>
        ) : null}
        <Summary total={total} paid={amountPaid} balance={balance} />
        <TextArea
          label="Notas"
          value={form.notes}
          onChange={(value) => updateForm('notes', value)}
        />
      </TicketSection>
      <ModalError error={error} />
    </ModalShell>
  )
}

function TicketSection({ eyebrow, title, children }) {
  return (
    <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
      <div className="mb-4">
        <p className="text-xs uppercase text-[color:var(--muted)]">{eyebrow}</p>
        <h3 className="mt-1 text-base font-semibold text-[color:var(--ink)]">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function AbonoModal({ isOpen, clients, sales, onClose, onSave }) {
  const [form, setForm] = useState({
    clientId: '',
    saleId: '',
    amount: '',
    paymentDate: getToday(),
    method: 'Transferencia',
    notes: '',
  })
  const [error, setError] = useState('')
  const safeClients = safeList(clients)
  const safeSales = safeList(sales)
  const clientSales = safeSales.filter((sale) => sale.clientId === form.clientId)
  const selectedSale = safeSales.find((sale) => sale.id === form.saleId)
  const amount = Number(form.amount || 0)
  const nextBalance = Math.max(Number(selectedSale?.balance || 0) - amount, 0)

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!selectedSale) {
      setError('Selecciona una venta pendiente.')
      return
    }

    if (!amount || amount <= 0) {
      setError('El abono debe ser mayor a cero.')
      return
    }

    onSave({ ...form, amount })
    setForm({
      clientId: '',
      saleId: '',
      amount: '',
      paymentDate: getToday(),
      method: 'Transferencia',
      notes: '',
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <ModalShell title="Registrar pago / abono" onClose={onClose} onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[color:var(--ink)]">
            Clienta
          </span>
          <select
            value={form.clientId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                clientId: event.target.value,
                saleId: '',
              }))
            }
            className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
          >
            <option value="">Seleccionar clienta</option>
            {safeClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[color:var(--ink)]">
            Venta pendiente
          </span>
          <select
            value={form.saleId}
            onChange={(event) => updateForm('saleId', event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
          >
            <option value="">Seleccionar venta</option>
            {clientSales.map((sale) => (
              <option key={sale.id} value={sale.id}>
                {sale.ticketNumber} · {formatCurrency(sale.balance)}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="Cantidad abonada"
          type="number"
          value={form.amount}
          onChange={(value) => updateForm('amount', value)}
        />
        <TextInput
          label="Fecha"
          type="date"
          value={form.paymentDate}
          onChange={(value) => updateForm('paymentDate', value)}
        />
        <label className="block">
          <span className="text-sm font-medium text-[color:var(--ink)]">
            Metodo opcional
          </span>
          <select
            value={form.method}
            onChange={(event) => updateForm('method', event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
      </div>

      <Summary
        total={selectedSale?.balance || 0}
        paid={amount}
        balance={nextBalance}
        totalLabel="Saldo actual"
        paidLabel="Abono"
      />
      <TextArea
        label="Notas"
        value={form.notes}
        onChange={(value) => updateForm('notes', value)}
      />
      <ModalError error={error} />
    </ModalShell>
  )
}

function ModalShell({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Guardar',
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-sm sm:py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.form
          onSubmit={onSubmit}
          noValidate
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
          <div className="mt-6 space-y-4">{children}</div>
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
              {submitLabel}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  )
}

function TextInput({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[color:var(--ink)]">
        {label}
      </span>
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
      />
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[color:var(--ink)]">
        {label}
      </span>
      <textarea
        value={value}
        rows="3"
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-2 w-full resize-none rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
      />
    </label>
  )
}

function Summary({
  total,
  paid,
  balance,
  totalLabel = 'Total',
  paidLabel = 'Pagado',
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-[color:var(--canvas)] p-3 text-sm">
      <Amount label={totalLabel} value={total} />
      <Amount label={paidLabel} value={paid} />
      <Amount label="Pendiente" value={balance} />
    </div>
  )
}

function ModalError({ error }) {
  return error ? (
    <p className="rounded-md border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm font-medium text-[color:var(--danger)]">
      {error}
    </p>
  ) : null
}
