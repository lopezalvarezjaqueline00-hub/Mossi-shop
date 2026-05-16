const STATUS_STYLES = {
  Disponible:
    'border-[color:var(--success)]/30 bg-[color:var(--success)]/10 text-[color:var(--success)]',
  Vendido:
    'border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 text-[color:var(--danger)]',
  Apartado:
    'border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 text-[color:var(--warning)]',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] || STATUS_STYLES.Disponible
      }`}
    >
      {status}
    </span>
  )
}
