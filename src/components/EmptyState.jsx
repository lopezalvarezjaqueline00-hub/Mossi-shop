import { FiPackage } from 'react-icons/fi'

export default function EmptyState({
  title = 'Sin productos',
  description = 'Agrega una pieza para empezar a organizar el inventario.',
  action,
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-12 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
        <FiPackage className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[color:var(--ink)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[color:var(--muted)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
