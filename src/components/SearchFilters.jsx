import { FiFilter, FiSearch } from 'react-icons/fi'
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../data/initialProducts'
import { formatCurrency } from '../utils/formatters'

export default function SearchFilters({
  filters,
  onFiltersChange,
  maxInventoryPrice,
}) {
  const setFilter = (field, value) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
          <input
            value={filters.query}
            onChange={(event) => setFilter('query', event.target.value)}
            className="focus-ring w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] py-3 pl-10 pr-3 text-sm text-[color:var(--ink)] outline-none"
            placeholder="Buscar por nombre"
          />
        </label>

        <label className="relative block">
          <FiFilter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
          <select
            value={filters.category}
            onChange={(event) => setFilter('category', event.target.value)}
            className="focus-ring w-full appearance-none rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] py-3 pl-10 pr-3 text-sm text-[color:var(--ink)] outline-none"
          >
            <option>Todas</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <select
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
            className="focus-ring w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
          >
            <option>Todos</option>
            {PRODUCT_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>

        <div className="rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[color:var(--muted)]">Precio max.</span>
            <span className="text-xs font-semibold text-[color:var(--ink)]">
              {formatCurrency(filters.maxPrice || maxInventoryPrice)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={maxInventoryPrice}
            value={filters.maxPrice || maxInventoryPrice}
            onChange={(event) => setFilter('maxPrice', Number(event.target.value))}
            className="mt-2 w-full accent-[color:var(--accent)]"
          />
        </div>
      </div>
    </div>
  )
}
