import { useMemo, useState } from 'react'
import { FiPlus, FiTrash2, FiUserPlus } from 'react-icons/fi'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import { useAuth } from '../hooks/useAuth'
import { useClients } from '../hooks/useClients'
import { useDeletedItems } from '../hooks/useDeletedItems'
import { useMovements } from '../hooks/useMovements'
import { usePayments } from '../hooks/usePayments'
import { useSales } from '../hooks/useSales'
import { useToast } from '../hooks/useToast'
import { formatCurrency, formatDate } from '../utils/formatters'

const getAdminName = (user) => user?.name || user?.email || 'Administradora'

export default function ClientsPage() {
  const { user } = useAuth()
  const { clients, addClient, deleteClient } = useClients()
  const { addDeletedItem } = useDeletedItems()
  const { addMovement } = useMovements()
  const { payments } = usePayments()
  const { sales } = useSales()
  const { notify } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const safeClients = useMemo(
    () => (Array.isArray(clients) ? clients : []),
    [clients],
  )
  const safePayments = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments],
  )
  const safeSales = useMemo(() => (Array.isArray(sales) ? sales : []), [sales])

  const clientSummaries = useMemo(
    () =>
      safeClients.map((client) => {
        const clientSales = safeSales.filter((sale) => sale.clientId === client.id)
        const clientPayments = safePayments.filter(
          (payment) => payment.clientId === client.id,
        )
        const pending = clientSales.reduce(
          (sum, sale) => sum + Number(sale.balance || 0),
          0,
        )

        return {
          client,
          sales: clientSales,
          payments: clientPayments,
          pending,
        }
      }),
    [safeClients, safePayments, safeSales],
  )

  const totalPending = clientSummaries.reduce(
    (sum, summary) => sum + summary.pending,
    0,
  )

  const handleSaveClient = (payload) => {
    addClient(payload)
    addMovement({
      type: 'cliente',
      title: `Cliente ${payload.name}`,
      description: 'Cliente creada',
      createdBy: getAdminName(user),
    })
    notify({
      title: 'Clienta guardada',
      message: `${payload.name} se agrego al directorio.`,
    })
    setModalOpen(false)
  }

  const confirmDelete = () => {
    if (!deleteTarget) {
      return
    }

    addDeletedItem({
      type: 'cliente',
      originalId: deleteTarget.id,
      title: deleteTarget.name,
      description: deleteTarget.phone || '',
      data: deleteTarget,
      deletedBy: getAdminName(user),
    })
    deleteClient(deleteTarget.id)
    addMovement({
      type: 'eliminado',
      title: `Cliente ${deleteTarget.name} eliminada`,
      description: 'Movida a Eliminados recientemente',
      createdBy: getAdminName(user),
    })
    notify({
      title: 'Clienta movida',
      message: 'Puedes restaurarla desde Eliminados recientemente.',
      type: 'info',
    })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm uppercase text-[color:var(--muted)]">
            Directorio
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
            Clientes
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Historial de compras, abonos y saldo pendiente de cada clienta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <FiPlus className="h-4 w-4" />
          Agregar clienta
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Clientas"
          value={safeClients.length}
          helper="Registradas"
          icon={FiUserPlus}
        />
        <StatCard
          label="Compras"
          value={safeSales.length}
          helper="Ventas/tickets"
          icon={FiUserPlus}
        />
        <StatCard
          label="Saldo pendiente"
          value={formatCurrency(totalPending)}
          helper="Por cobrar"
          icon={FiUserPlus}
          tone="bg-[color:var(--warning)]/10 text-[color:var(--warning)]"
        />
      </section>

      {clientSummaries.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {clientSummaries.map((summary) => (
            <ClientCard
              key={summary.client.id}
              summary={summary}
              onDelete={setDeleteTarget}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No hay clientas registradas"
          description="Agrega una clienta o crea una venta nueva para verla aqui."
        />
      )}

      <ClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveClient}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Mover clienta a eliminados"
        description={`"${deleteTarget?.name}" se movera a Eliminados recientemente.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function ClientCard({ summary, onDelete }) {
  const { client, sales, payments, pending } = summary
  const safeSales = Array.isArray(sales) ? sales : []
  const safePayments = Array.isArray(payments) ? payments : []

  return (
    <article className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-[color:var(--ink)]">
            {client.name}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {client.phone || 'Sin telefono'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(client)}
          className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--danger)]/10 hover:text-[color:var(--danger)]"
          aria-label={`Eliminar ${client.name}`}
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-[color:var(--canvas)] p-3 text-sm">
        <Amount label="Compras" value={safeSales.length} />
        <Amount label="Pagos" value={safePayments.length} />
        <Amount label="Pendiente" value={formatCurrency(pending)} />
      </div>

      <div className="mt-4 space-y-3">
        {safeSales.slice(0, 3).map((sale) => (
          <div
            key={sale.id}
            className="rounded-md border border-[color:var(--line)] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-[color:var(--ink)]">
                {sale.ticketNumber}
              </p>
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                {formatCurrency(sale.total)}
              </p>
            </div>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              {formatDate(`${sale.saleDate}T12:00:00`)} · Abonado:{' '}
              {formatCurrency(sale.amountPaid)} · Pendiente:{' '}
              {formatCurrency(sale.balance)}
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

function Amount({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[color:var(--muted)]">{label}</p>
      <p className="font-semibold text-[color:var(--ink)]">{value}</p>
    </div>
  )
}

function ClientModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', phone: '', notes: '' })
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Escribe el nombre de la clienta.')
      return
    }

    onSave({ ...form, name: form.name.trim() })
    setForm({ name: '', phone: '', notes: '' })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/35 px-4 py-6 backdrop-blur-sm sm:py-10">
      <form
        onSubmit={handleSubmit}
        className="glass-panel mx-auto w-full max-w-xl rounded-lg p-4 sm:p-6"
      >
        <div className="border-b border-[color:var(--line)] pb-4">
          <p className="text-xs uppercase text-[color:var(--muted)]">
            Mossi Shop
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
            Nueva clienta
          </h2>
        </div>
        <div className="mt-6 space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          />
          <Input
            label="Telefono opcional"
            value={form.phone}
            onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
          />
          <label className="block">
            <span className="text-sm font-medium text-[color:var(--ink)]">
              Notas
            </span>
            <textarea
              value={form.notes}
              rows="3"
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              className="focus-ring mt-2 w-full resize-none rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
            />
          </label>
          {error ? (
            <p className="rounded-md border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm font-medium text-[color:var(--danger)]">
              {error}
            </p>
          ) : null}
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
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[color:var(--ink)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
      />
    </label>
  )
}
