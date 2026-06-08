import {
  FiBarChart2,
  FiBox,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiRotateCcw,
  FiSettings,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
  { id: 'products', label: 'Productos', icon: FiBox },
  { id: 'payments', label: 'Pagos', icon: FiCreditCard },
  { id: 'clients', label: 'Clientes', icon: FiUsers },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
  { id: 'deleted', label: 'Eliminados', icon: FiRotateCcw },
  { id: 'settings', label: 'Configuracion', icon: FiSettings },
]

export default function Sidebar({
  activePage,
  isOpen,
  onClose,
  onNavigate,
  onCreateProduct,
  onCreatePayment,
}) {
  const { logout, user } = useAuth()
  const { settings } = useSettings()

  const handleNavigate = (id) => {
    onNavigate(id)
    onClose()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[color:var(--line)] bg-[color:var(--surface)]/95 p-4 shadow-xl backdrop-blur transition-transform duration-300 ease-out md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="focus-ring flex items-center gap-3 rounded-md p-1 text-left"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[color:var(--ink)] text-sm font-semibold text-[color:var(--surface)]">
              MS
            </span>
            <span>
              <span className="block text-sm font-semibold text-[color:var(--ink)]">
                {settings.storeName}
              </span>
              <span className="block text-xs text-[color:var(--muted)]">
                Boutique inventory
              </span>
            </span>
          </button>
          <button
            type="button"
            className="focus-ring rounded-md p-2 text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] md:hidden"
            onClick={onClose}
            aria-label="Cerrar menu"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onCreateProduct()
            onClose()
          }}
          className="focus-ring mt-8 flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <FiPlus className="h-4 w-4" />
          Agregar producto
        </button>

        <button
          type="button"
          onClick={() => {
            onCreatePayment()
            onClose()
          }}
          className="focus-ring mt-3 flex items-center justify-center gap-2 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
        >
          <FiCreditCard className="h-4 w-4" />
          Registrar pago
        </button>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.id

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`focus-ring flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                    : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--ink)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-3">
          <p className="text-xs uppercase text-[color:var(--muted)]">
            Sesion activa
          </p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--ink)]">
            {user.name}
          </p>
          <p className="text-xs text-[color:var(--muted)]">{user.email}</p>
          <button
            type="button"
            onClick={logout}
            className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--ink)] hover:text-[color:var(--surface)]"
          >
            <FiLogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] p-2 text-[color:var(--ink)] shadow-sm md:hidden"
      aria-label="Abrir menu"
    >
      <FiMenu className="h-5 w-5" />
    </button>
  )
}
