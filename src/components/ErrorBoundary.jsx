import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = {
    error: null,
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React render crashed:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
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
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
