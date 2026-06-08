import { Component } from 'react'
import { STORAGE_KEYS } from '../utils/storage'

const getSafeErrorMessage = (error) =>
  error?.message ? String(error.message) : 'Error desconocido'

const getComponentHint = (errorInfo) => {
  const firstLine = errorInfo?.componentStack
    ?.split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  return firstLine || ''
}

export default class ErrorBoundary extends Component {
  state = {
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React render crashed:', error, errorInfo)
    this.setState({ errorInfo })
  }

  reloadApp = () => {
    window.location.reload()
  }

  clearLocalCache = () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      const errorMessage = getSafeErrorMessage(this.state.error)
      const componentHint = getComponentHint(this.state.errorInfo)

      return (
        <main className="grid min-h-screen place-items-center bg-[color:var(--canvas)] px-6 text-[color:var(--ink)]">
          <section className="max-w-md rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-sm">
            <p className="text-sm uppercase text-[color:var(--muted)]">
              Mossi Shop
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Ocurrio un error al cargar.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Recarga la pagina. La app no se quedo en blanco y el error quedo
              registrado en consola.
            </p>
            <div className="mt-4 rounded-md border border-[color:var(--line)] bg-[color:var(--canvas)] p-3 text-xs leading-5 text-[color:var(--muted)]">
              <p>
                <span className="font-semibold text-[color:var(--ink)]">
                  Error:
                </span>{' '}
                {errorMessage}
              </p>
              {componentHint ? (
                <p className="mt-1">
                  <span className="font-semibold text-[color:var(--ink)]">
                    Componente:
                  </span>{' '}
                  {componentHint}
                </p>
              ) : null}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={this.reloadApp}
                className="focus-ring rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)]"
              >
                Recargar app
              </button>
              <button
                type="button"
                onClick={this.clearLocalCache}
                className="focus-ring rounded-md border border-[color:var(--line)] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
              >
                Limpiar cache local y recargar
              </button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
