import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import Sidebar, { MobileMenuButton } from '../components/Sidebar'
import { useSettings } from '../hooks/useSettings'

export default function AppLayout({
  activePage,
  onNavigate,
  onCreateProduct,
  onCreatePayment,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { settings } = useSettings()

  return (
    <div className="min-h-screen bg-[color:var(--canvas)] text-[color:var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar
          activePage={activePage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={onNavigate}
          onCreateProduct={onCreateProduct}
          onCreatePayment={onCreatePayment}
        />
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[color:var(--canvas)]/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <MobileMenuButton onClick={() => setSidebarOpen(true)} />
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase text-[color:var(--muted)]">
                  {settings.storeName}
                </p>
                <h1 className="truncate text-xl font-semibold text-[color:var(--ink)] sm:text-2xl">
                  Inventario personal shopper
                </h1>
              </div>
              <div className="hidden w-full max-w-xs items-center gap-2 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--muted)] lg:flex">
                <FiSearch className="h-4 w-4" />
                <span>Busca desde Productos</span>
              </div>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
