import { useMemo, useState } from 'react'
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { useClients } from '../hooks/useClients'
import { useDeletedItems } from '../hooks/useDeletedItems'
import { useMovements } from '../hooks/useMovements'
import { usePayments } from '../hooks/usePayments'
import { useProducts } from '../hooks/useProducts'
import { useSales } from '../hooks/useSales'
import { useToast } from '../hooks/useToast'
import { formatCurrency, formatDate } from '../utils/formatters'

const getAdminName = (user) => user?.name || user?.email || 'Administradora'

export default function DeletedItemsPage() {
  const { user } = useAuth()
  const { deletedItems, removeDeletedItem, permanentlyDelete } = useDeletedItems()
  const { addMovement, restoreMovement } = useMovements()
  const { restorePayment } = usePayments()
  const { restoreProduct } = useProducts()
  const { restoreSale } = useSales()
  const { restoreClient } = useClients()
  const { notify } = useToast()
  const [deleteTarget, setDeleteTarget] = useState(null)

  const safeDeletedItems = useMemo(
    () => (Array.isArray(deletedItems) ? deletedItems : []),
    [deletedItems],
  )

  const restoreItem = (item) => {
    if (item.type === 'producto') {
      restoreProduct(item.data)
    }

    if (item.type === 'pago') {
      restorePayment(item.data)
    }

    if (item.type === 'venta') {
      restoreSale(item.data)
    }

    if (item.type === 'cliente') {
      restoreClient(item.data)
    }

    if (item.type === 'movimiento') {
      restoreMovement(item.data)
    }

    removeDeletedItem(item.id)
    addMovement({
      type: 'restaurado',
      title: `${item.title} restaurado`,
      description: `Tipo: ${item.type}`,
      amount: item.amount,
      createdBy: getAdminName(user),
    })
    notify({
      title: 'Elemento restaurado',
      message: `${item.title} regreso a su seccion original.`,
    })
  }

  const confirmPermanentDelete = () => {
    if (!deleteTarget) {
      return
    }

    permanentlyDelete(deleteTarget.id)
    addMovement({
      type: 'eliminado definitivo',
      title: `${deleteTarget.title} eliminado definitivo`,
      description: 'Esta accion no se puede deshacer',
      amount: deleteTarget.amount,
      createdBy: getAdminName(user),
    })
    notify({
      title: 'Eliminado definitivo',
      message: 'El registro se borro permanentemente de Supabase.',
      type: 'info',
    })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm uppercase text-[color:var(--muted)]">
          Recuperacion
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
          Eliminados recientemente
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Restaura registros eliminados o borralos definitivamente con
          confirmacion.
        </p>
      </section>

      {safeDeletedItems.length ? (
        <section className="space-y-3">
          {safeDeletedItems.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-[color:var(--line)] px-2.5 py-1 text-xs font-medium text-[color:var(--muted)]">
                      {item.type}
                    </span>
                    <h3 className="truncate text-base font-semibold text-[color:var(--ink)]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {item.description || 'Sin descripcion'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-[color:var(--canvas)] p-3 text-sm">
                  <div>
                    <p className="text-xs text-[color:var(--muted)]">
                      Eliminado
                    </p>
                    <p className="font-semibold text-[color:var(--ink)]">
                      {formatDate(item.deletedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[color:var(--muted)]">Monto</p>
                    <p className="font-semibold text-[color:var(--ink)]">
                      {item.amount ? formatCurrency(item.amount) : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-[color:var(--muted)]">
                      Eliminado por
                    </p>
                    <p className="truncate font-semibold text-[color:var(--ink)]">
                      {item.deletedBy || 'Sin usuario'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => restoreItem(item)}
                    className="focus-ring inline-flex items-center gap-2 rounded-md border border-[color:var(--line)] px-3 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
                  >
                    <FiRefreshCw className="h-4 w-4" />
                    Restaurar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="focus-ring inline-flex items-center gap-2 rounded-md border border-[color:var(--line)] px-3 py-2 text-sm font-semibold text-[color:var(--danger)] transition hover:bg-[color:var(--danger)]/10"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Definitivo
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No hay eliminados recientes"
          description="Los productos, ventas, pagos, clientes y movimientos eliminados apareceran aqui."
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Eliminar definitivo"
        description="Esta acción no se puede deshacer"
        confirmLabel="Eliminar definitivo"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmPermanentDelete}
      />
    </div>
  )
}
