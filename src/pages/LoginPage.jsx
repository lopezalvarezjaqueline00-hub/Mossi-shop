import { motion } from 'framer-motion'
import { useState } from 'react'
import { FiArrowRight, FiLock, FiMail } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { useToast } from '../hooks/useToast'

export default function LoginPage() {
  const { login } = useAuth()
  const { settings } = useSettings()
  const { notify } = useToast()
  const [email, setEmail] = useState('lopezalvarezjaqueline00@gmail.com')
  const [password, setPassword] = useState('Mossi2026!')
  const [submitting, setSubmitting] = useState(false)
  const logoSrc = `${import.meta.env.BASE_URL}logo-mossi.png`

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
    <main className="login-shell min-h-screen text-[color:var(--ink)]">
      <div className="login-frame grid min-h-screen bg-[color:var(--surface)] lg:grid-cols-[1fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="login-editorial relative flex min-h-[390px] flex-col bg-[#f1efea] px-6 py-7 sm:px-10 lg:min-h-screen lg:px-12 lg:py-8"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[color:var(--ink)]">
              Private atelier
            </span>
            <span className="border border-[#d7d3cc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--ink)]">
              SS 2026
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <div className="login-logo-window">
              <img
                src={logoSrc}
                alt={settings.storeName}
                className="login-brand-logo"
              />
            </div>
            <div className="mt-12 h-px w-28 bg-[#d8d4cc]" />
            <p className="mt-9 max-w-xl text-base leading-8 text-[color:var(--muted)] sm:text-lg">
              Inventario privado para compras, pagos y piezas listas para
              entregar.
            </p>
          </div>

          <div className="hidden h-px w-full bg-[#dedad2] lg:block" />
        </motion.section>

        <section className="flex items-center justify-center bg-white px-6 py-8 sm:px-10 lg:min-h-screen lg:items-start lg:px-16 lg:pt-24">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="w-full max-w-[455px]"
          >
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
                Acceso privado
              </p>
              <h1 className="mt-4 text-[clamp(3.25rem,6.2vw,4.6rem)] font-semibold leading-[0.98] text-[color:var(--ink)]">
                Bienvenida
              </h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-[color:var(--muted)]">
                Entra al panel de Mossi Shop para continuar con el inventario.
              </p>
            </div>

            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
                  Correo electronico
                </span>
                <div className="mt-3 flex h-14 items-center gap-4 border border-[#dedbd5] bg-white px-5 transition focus-within:border-[color:var(--ink)]">
                  <FiMail className="h-5 w-5 shrink-0 text-[color:var(--muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="focus-ring w-full min-w-0 bg-transparent text-base text-[color:var(--ink)] outline-none"
                    placeholder="admin@mossishop.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[color:var(--muted)]">
                  Contrasena
                </span>
                <div className="mt-3 flex h-14 items-center gap-4 border border-[#dedbd5] bg-white px-5 transition focus-within:border-[color:var(--ink)]">
                  <FiLock className="h-5 w-5 shrink-0 text-[color:var(--muted)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="focus-ring w-full min-w-0 bg-transparent text-base text-[color:var(--ink)] outline-none"
                    placeholder="********"
                    required
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring mt-9 flex h-14 w-full items-center justify-between bg-black px-6 text-base font-medium text-white transition hover:bg-[#272521] disabled:opacity-60"
            >
              <span>{submitting ? 'Entrando...' : 'Entrar al dashboard'}</span>
              <FiArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="focus-ring mx-auto mt-7 block text-base font-medium uppercase tracking-[0.08em] text-[color:var(--muted)] transition hover:text-[color:var(--ink)]"
              onClick={() =>
                notify({
                  title: 'Administradoras',
                  message:
                    'Por ahora las administradoras se agregan desde la configuracion del proyecto.',
                  type: 'info',
                })
              }
            >
              Crear nueva administradora
            </button>
          </motion.form>
        </section>
      </div>
    </main>
  )
}
