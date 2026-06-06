import { useMemo, useState } from 'react'
import { FiDownload, FiMoon, FiRefreshCw, FiSave, FiSun } from 'react-icons/fi'
import { defaultSettings } from '../data/defaultSettings'
import { usePayments } from '../hooks/usePayments'
import { useProducts } from '../hooks/useProducts'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'

const themes = [
  { id: 'mossi', label: 'Mossi', swatch: '#9f5f52' },
  { id: 'rose', label: 'Rose', swatch: '#a75d70' },
  { id: 'olive', label: 'Olive', swatch: '#68735d' },
  { id: 'graphite', label: 'Graphite', swatch: '#313234' },
]

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { products } = useProducts()
  const { payments } = usePayments()
  const { notify } = useToast()
  const [storeName, setStoreName] = useState(settings.storeName)
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  )
  const safePayments = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments],
  )

  const saveStoreName = () => {
    updateSettings({ storeName: storeName.trim() || defaultSettings.storeName })
    notify({
      title: 'Configuracion guardada',
      message: 'El nombre de la tienda se actualizo.',
    })
  }

  const exportInventory = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      products: safeProducts,
      payments: safePayments,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mossi-shop-inventario.json'
    link.click()
    URL.revokeObjectURL(url)
    notify({
      title: 'Inventario exportado',
      message: 'Se descargo un archivo JSON con productos, pagos y configuracion.',
      type: 'info',
    })
  }

  const resetSettings = () => {
    updateSettings(defaultSettings)
    setStoreName(defaultSettings.storeName)
    notify({
      title: 'Tema restaurado',
      message: 'La configuracion visual volvio a Mossi.',
      type: 'info',
    })
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm uppercase text-[color:var(--muted)]">
          Preferencias
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
          Configuracion
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
          Ajusta la identidad visual, modo oscuro y exportacion del inventario.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <p className="text-sm uppercase text-[color:var(--muted)]">Tienda</p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
            Nombre de la tienda
          </h3>
          <label className="mt-5 block">
            <span className="text-sm font-medium text-[color:var(--ink)]">
              Nombre visible
            </span>
            <input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] px-3 py-3 text-sm text-[color:var(--ink)] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={saveStoreName}
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <FiSave className="h-4 w-4" />
            Guardar
          </button>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <p className="text-sm uppercase text-[color:var(--muted)]">
            Apariencia
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
            Tema
          </h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {themes.map((theme) => (
              <button
                type="button"
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={`focus-ring rounded-lg border p-3 text-left transition ${
                  settings.theme === theme.id
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                    : 'border-[color:var(--line)] hover:bg-[color:var(--surface-muted)]'
                }`}
              >
                <span
                  className="block h-8 w-8 rounded-full"
                  style={{ background: theme.swatch }}
                />
                <span className="mt-3 block text-sm font-semibold text-[color:var(--ink)]">
                  {theme.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col justify-between gap-4 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas)] p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                Modo oscuro
              </p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Cambia la interfaz completa a una version nocturna.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`focus-ring flex h-10 w-20 items-center rounded-full border p-1 transition ${
                settings.darkMode
                  ? 'justify-end border-[color:var(--accent)] bg-[color:var(--accent)]'
                  : 'justify-start border-[color:var(--line)] bg-[color:var(--surface)]'
              }`}
              aria-label="Cambiar modo oscuro"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--surface)] text-[color:var(--ink)] shadow">
                {settings.darkMode ? (
                  <FiMoon className="h-4 w-4" />
                ) : (
                  <FiSun className="h-4 w-4" />
                )}
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <p className="text-sm uppercase text-[color:var(--muted)]">Datos</p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
            Exportar inventario
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Descarga un respaldo JSON con productos, pagos, imagenes guardadas
            y configuracion.
          </p>
          <button
            type="button"
            onClick={exportInventory}
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
          >
            <FiDownload className="h-4 w-4" />
            Exportar JSON
          </button>
        </div>

        <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm">
          <p className="text-sm uppercase text-[color:var(--muted)]">Sistema</p>
          <h3 className="mt-1 text-xl font-semibold text-[color:var(--ink)]">
            Restaurar apariencia
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Vuelve al nombre, tema claro y paleta original de Mossi Shop.
          </p>
          <button
            type="button"
            onClick={resetSettings}
            className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-muted)]"
          >
            <FiRefreshCw className="h-4 w-4" />
            Restaurar
          </button>
        </div>
      </section>
    </div>
  )
}
