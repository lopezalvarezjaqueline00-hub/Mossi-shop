import { motion } from 'framer-motion'

export default function StatCard({ label, value, helper, icon: Icon, tone }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[color:var(--muted)]">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-[color:var(--ink)]">
            {value}
          </p>
        </div>
        {Icon ? (
          <span
            className={`grid h-10 w-10 place-items-center rounded-lg ${
              tone || 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {helper ? (
        <p className="mt-4 text-xs text-[color:var(--muted)]">{helper}</p>
      ) : null}
    </motion.div>
  )
}
