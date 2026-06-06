import { useMemo, useState } from 'react'
import {
  FiArchive,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiPlus,
  FiSearch,
  FiShoppingBag,
} from 'react-icons/fi'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { usePayments } from '../hooks/usePayments'
import { useProducts } from '../hooks/useProducts'
import { formatCurrency, formatDate, normalizeText } from '../utils/formatters'
import { getPaymentItemsLabel, normalizePaymentType } from '../utils/payments'

export default function DashboardPage({
  onNavigate,
  onCreateProduct,
  onCreatePayment,
}) {
  const { products } = useProducts()
  const { payments } = usePayments()
  const [query, setQuery] = useState('')
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  )
  const safePayments = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments],
  )

  const stats = useMemo(() => {
    const available = safeProducts.filter(
      (product) => product.status === 'Disponible',
    )
    const sold = safeProducts.filter((product) => product.status === 'Vendido')
    const reserved = safeProducts.filter(
      (product) => product.status === 'Apartado',
    )
    const totalValue = safeProducts.reduce(
      (sum, product) =>
        product.status === 'Vendido' ? sum : sum + Number(product.price || 0),
      0,
    )

    return {
      total: safeProducts.length,
      available: available.length,
      sold: sold.length,
      reserved: reserved.length,
      totalValue,
    }
  }, [safeProducts])

  const paymentStats = useMemo(() => {
    const totalReceived = safePayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    )
    const recentPayments = [...safePayments]
      .sort(
        (a, b) =>
          new Date(`${b.paymentDate}T12:00:00`) -
          new Date(`${a.paymentDate}T12:00:00`),
      )
      .slice(0, 4)

    return {
      totalReceived,
      recentPayments,
    }
  }, [safePayments])

  const recentProducts = useMemo(
    () =>
      [...safeProducts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [safeProducts],
  )

  const searchedProducts = useMemo(() => {
    const normalized = normalizeText(query)
    if (!normalized) {
      return []
    }

    return safeProducts
      .filter((product) => normalizeText(product.name).includes(normalized))
      .slice(0, 4)
  }, [safeProducts, query])

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm sm:p-6">
          <p className="text-sm uppercase text-[color:var(--muted)]">
            Control de inventario
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5">
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-[color:var(--ink)] sm:text-4xl">
                Piezas organizadas para comprar, vender y entregar sin
                confusiones.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
                Estado, precio, imagenes y notas en un solo lugar para que las
                dos administradoras trabajen con la misma informacion.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCreateProduct}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <FiPlus className="h-4 w-4" />
                Nuevo producto
              </button>
              <button
                type="button"
                onClick={onCreatePayment}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
              >
                <FiCreditCard className="h-4 w-4" />
                Registrar pago
              </button>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
              >
                <FiBarChart2 className="h-4 w-4" />
                Ver analytics
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--ink)] p-5 text-[color:var(--surface)] shadow-sm sm:p-6">
          <p className="text-sm text-white/65">Valor total activo</p>
          <p className="mt-4 text-4xl font-semibold">
            {formatCurrency(stats.totalValue)}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
            <span className="rounded-md bg-white/10 px-2 py-3">
              {stats.available} disponibles
            </span>
            <span className="rounded-md bg-white/10 px-2 py-3">
              {stats.reserved} apartados
            </span>
            <span className="rounded-md bg-white/10 px-2 py-3">
              {stats.sold} vendidos
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Total productos"
          value={stats.total}
          helper="Todas las piezas registradas"
          icon={FiArchive}
        />
        <StatCard
          label="Disponibles"
          value={stats.available}
          helper="Listos para vender"
          icon={FiCheckCircle}
          tone="bg-[color:var(--success)]/10 text-[color:var(--success)]"
        />
        <StatCard
          label="Vendidos"
          value={stats.sold}
          helper="Cerrados en inventario"
          icon={FiShoppingBag}
          tone="bg-[color:var(--danger)]/10 text-[color:var(--danger)]"
        />
        <StatCard
          label="Apartados"
          value={stats.reserved}
          helper="Pendientes de pago"
          icon={FiClock}
          tone="bg-[color:var(--warning)]/10 text-[color:var(--warning)]"
        />
        <StatCard
          label="Inventario"
          value={formatCurrency(stats.totalValue)}
          helper="Sin piezas vendidas"
          icon={FiDollarSign}
        />
        <StatCard
          label="Pagos recibidos"
          value={formatCurrency(paymentStats.totalReceived)}
          helper={`${safePayments.length} movimientos`}
          icon={FiCreditCard}
          tone="bg-[color:var(--success)]/10 text-[color:var(--success)]"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[color:var(--muted)]">
                Busqueda rapida
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
                Encuentra una pieza
              </h2>
            </div>
          </div>
          <label className="relative mt-5 block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="focus-ring w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] py-3 pl-10 pr-3 text-sm text-[color:var(--ink)] outline-none"
              placeholder="Buscar por nombre"
            />
          </label>

          <div className="mt-4 space-y-2">
            {searchedProducts.length ? (
              searchedProducts.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  onClick={() => onNavigate('products')}
                  className="focus-ring flex w-full items-center justify-between gap-4 rounded-md border border-[color:var(--line)] px-3 py-3 text-left transition hover:bg-[color:var(--surface-muted)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[color:var(--ink)]">
                      {product.name}
                    </span>
                    <span className="text-xs text-[color:var(--muted)]">
                      {product.category}
                    </span>
                  </span>
                  <StatusBadge status={product.status} />
                </button>
              ))
            ) : (
              <p className="rounded-md border border-dashed border-[color:var(--line)] px-3 py-6 text-center text-sm text-[color:var(--muted)]">
                {query ? 'Sin coincidencias' : 'Escribe para buscar'}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[color:var(--muted)]">
                Caja
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
                Pagos recientes
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="focus-ring rounded-md border border-[color:var(--line)] px-3 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
            >
              Ver pagos
            </button>
          </div>
          <div className="mt-5 divide-y divide-[color:var(--line)]">
            {paymentStats.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--ink)]">
                    {payment.clientName}
                  </p>
                  <p className="mt-1 truncate text-xs text-[color:var(--muted)]">
                    {normalizePaymentType(payment.type)} ·{' '}
                    {getPaymentItemsLabel(payment)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[color:var(--ink)]">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase text-[color:var(--muted)]">
                Recientes
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
                Productos agregados recientemente
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="focus-ring rounded-md border border-[color:var(--line)] px-3 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
            >
              Ver todos
            </button>
          </div>
          <div className="mt-5 divide-y divide-[color:var(--line)]">
            {recentProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <img
                  src={product.images?.[0]}
                  alt={product.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--ink)]">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {formatDate(product.createdAt)} · {product.category}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  {formatCurrency(product.price)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
