import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FiBarChart2, FiDollarSign, FiPackage } from 'react-icons/fi'
import StatCard from '../components/StatCard'
import { PAYMENT_METHODS, PAYMENT_TYPES } from '../data/initialPayments'
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../data/initialProducts'
import { usePayments } from '../hooks/usePayments'
import { useProducts } from '../hooks/useProducts'
import { formatCurrency } from '../utils/formatters'
import { normalizePaymentType } from '../utils/payments'

const chartColors = ['#9f5f52', '#68735d', '#af8138', '#313234', '#d9a79b']

export default function AnalyticsPage() {
  const { products } = useProducts()
  const { payments } = usePayments()
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  )
  const safePayments = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments],
  )

  const analytics = useMemo(() => {
    const byCategory = PRODUCT_CATEGORIES.map((category) => ({
      category,
      productos: safeProducts.filter((product) => product.category === category)
        .length,
      valor: safeProducts
        .filter((product) => product.category === category)
        .reduce((sum, product) => sum + Number(product.price || 0), 0),
    })).filter((item) => item.productos > 0)

    const byStatus = PRODUCT_STATUSES.map((status) => ({
      name: status,
      value: safeProducts.filter((product) => product.status === status).length,
    }))

    const totalValue = safeProducts.reduce(
      (sum, product) =>
        product.status === 'Vendido' ? sum : sum + Number(product.price || 0),
      0,
    )
    const soldValue = safeProducts
      .filter((product) => product.status === 'Vendido')
      .reduce((sum, product) => sum + Number(product.price || 0), 0)
    const totalReceived = safePayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    )
    const paymentsByMethod = PAYMENT_METHODS.map((method) => ({
      method,
      monto: safePayments
        .filter((payment) => payment.method === method)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    })).filter((item) => item.monto > 0)
    const paymentsByType = PAYMENT_TYPES.map((type) => ({
      type,
      monto: safePayments
        .filter((payment) => normalizePaymentType(payment.type) === type)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    })).filter((item) => item.monto > 0)

    return {
      byCategory,
      byStatus,
      totalValue,
      soldValue,
      totalReceived,
      paymentsByMethod,
      paymentsByType,
    }
  }, [safePayments, safeProducts])

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm uppercase text-[color:var(--muted)]">
          Estadisticas
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
          Analytics
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Lectura rapida del inventario por categoria, estado y valor activo.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Productos"
          value={safeProducts.length}
          helper="Piezas registradas"
          icon={FiPackage}
        />
        <StatCard
          label="Valor activo"
          value={formatCurrency(analytics.totalValue)}
          helper="Disponible + apartado"
          icon={FiDollarSign}
        />
        <StatCard
          label="Vendido"
          value={formatCurrency(analytics.soldValue)}
          helper="Valor historico vendido"
          icon={FiBarChart2}
        />
        <StatCard
          label="Pagos recibidos"
          value={formatCurrency(analytics.totalReceived)}
          helper={`${safePayments.length} movimientos`}
          icon={FiDollarSign}
          tone="bg-[color:var(--success)]/10 text-[color:var(--success)]"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-sm uppercase text-[color:var(--muted)]">
              Categorias
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
              Productos por categoria
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis
                  dataKey="category"
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--line)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(159, 95, 82, 0.08)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                />
                <Bar dataKey="productos" radius={[6, 6, 0, 0]}>
                  {analytics.byCategory.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-sm uppercase text-[color:var(--muted)]">
              Estado
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
              Vendidos vs disponibles
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={66}
                  outerRadius={105}
                  paddingAngle={4}
                >
                  {analytics.byStatus.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {analytics.byStatus.map((item, index) => (
              <div
                key={item.name}
                className="rounded-md border border-[color:var(--line)] p-3"
              >
                <span
                  className="mb-2 block h-2 w-8 rounded-full"
                  style={{ background: chartColors[index % chartColors.length] }}
                />
                <p className="text-xs text-[color:var(--muted)]">{item.name}</p>
                <p className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-sm uppercase text-[color:var(--muted)]">
            Valor por categoria
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
            Inventario valuado
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {analytics.byCategory.map((item) => (
            <div
              key={item.category}
              className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas)] p-4"
            >
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                {item.category}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[color:var(--ink)]">
                {formatCurrency(item.valor)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {item.productos} productos
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-sm uppercase text-[color:var(--muted)]">Caja</p>
            <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
              Pagos por metodo
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.paymentsByMethod}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis
                  dataKey="method"
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--line)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  cursor={{ fill: 'rgba(159, 95, 82, 0.08)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                  }}
                />
                <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                  {analytics.paymentsByMethod.map((entry, index) => (
                    <Cell
                      key={entry.method}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-sm uppercase text-[color:var(--muted)]">
              Cobros
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
              Pagos por tipo
            </h3>
          </div>
          <div className="space-y-3">
            {analytics.paymentsByType.map((item, index) => (
              <div
                key={item.type}
                className="rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas)] p-4"
              >
                <span
                  className="mb-3 block h-2 w-10 rounded-full"
                  style={{ background: chartColors[index % chartColors.length] }}
                />
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  {item.type}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
                  {formatCurrency(item.monto)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
