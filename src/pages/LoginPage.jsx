import { motion } from 'framer-motion'
import { useState } from 'react'
import { FiLock, FiMail } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'

export default function LoginPage() {
  const { login } = useAuth()
  const { settings } = useSettings()
  const { notify } = useToast()
  const [email, setEmail] = useState('sofia@mossishop.com')
  const [password, setPassword] = useState('Mossi2026!')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitting(true)

    window.setTimeout(async () => {
      const success = await login(email, password)
      setSubmitting(false)

      if (!success) {
        notify({
          title: 'Acceso no autorizado',
          message: 'Revisa el correo y la contrasena de administradora.',
          type: 'error',
        })
      }
    }, 350)
  }

  return (
    <main className="min-h-screen bg-[color:var(--canvas)] px-4 py-8 text-[color:var(--ink)]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.82fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:block"
        >
          <p className="text-sm uppercase text-[color:var(--muted)]">
            Personal shopper suite
          </p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-[1.05] text-[color:var(--ink)]">
            {settings.storeName}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[color:var(--muted)]">
            Inventario boutique para organizar compras, apartados, ventas y
            piezas listas para entregar.
          </p>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              'Curated closet',
              'Luxury basics',
              'Smart stock',
            ].map((label) => (
              <div
                key={label}
                className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-sm font-medium shadow-sm"
              >
                {label}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="glass-panel mx-auto w-full max-w-md rounded-lg p-6 sm:p-8"
        >
          <div className="mb-8">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-[color:var(--ink)] text-sm font-semibold text-[color:var(--surface)]">
              MS
            </span>
            <p className="mt-6 text-sm uppercase text-[color:var(--muted)]">
              Acceso privado
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
              Bienvenida
            </h2>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[color:var(--ink)]">
              Correo electronico
            </span>
            <div className="mt-2 flex items-center gap-3 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 transition focus-within:border-[color:var(--accent)]">
              <FiMail className="h-4 w-4 text-[color:var(--muted)]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="focus-ring w-full bg-transparent text-sm text-[color:var(--ink)] outline-none"
                placeholder="admin@mossishop.com"
                required
              />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-[color:var(--ink)]">
              Contrasena
            </span>
            <div className="mt-2 flex items-center gap-3 rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-3 transition focus-within:border-[color:var(--accent)]">
              <FiLock className="h-4 w-4 text-[color:var(--muted)]" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="focus-ring w-full bg-transparent text-sm text-[color:var(--ink)] outline-none"
                placeholder="********"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring mt-6 w-full rounded-md bg-[color:var(--ink)] px-5 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
          >
            {submitting ? 'Entrando...' : 'Entrar al dashboard'}
          </button>
        </motion.form>
      </div>
    </main>
  )
}
