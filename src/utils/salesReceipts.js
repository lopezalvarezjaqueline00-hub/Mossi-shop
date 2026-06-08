import { jsPDF } from 'jspdf'
import { formatCurrency, formatDate } from './formatters'

const PAGE = {
  margin: 48,
  width: 595.28,
  height: 841.89,
  bottom: 760,
}

const COLORS = {
  ink: [24, 23, 21],
  muted: [111, 105, 96],
  soft: [248, 246, 241],
  surface: [255, 255, 255],
  line: [224, 217, 207],
  accent: [127, 70, 59],
  accentSoft: [244, 226, 219],
}

const setFill = (doc, color) => doc.setFillColor(...color)
const setDraw = (doc, color) => doc.setDrawColor(...color)
const setText = (doc, color) => doc.setTextColor(...color)

const sanitizeFileName = (value) =>
  String(value || 'mossi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const receiptDate = (value) => formatDate(value ? `${value}T12:00:00` : new Date())

const addHeader = (doc, title, subtitle, date) => {
  setFill(doc, COLORS.soft)
  doc.rect(0, 0, PAGE.width, 138, 'F')
  setFill(doc, COLORS.ink)
  doc.rect(0, 0, 10, 138, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  setText(doc, COLORS.ink)
  doc.text('Mossi Shop', PAGE.margin, 54)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, COLORS.muted)
  doc.text(subtitle, PAGE.margin, 75)
  doc.text(`Generado: ${formatDate(new Date())}`, PAGE.margin, 92)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setText(doc, COLORS.ink)
  doc.text(title, PAGE.width - PAGE.margin, 54, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, COLORS.muted)
  doc.text(receiptDate(date), PAGE.width - PAGE.margin, 74, { align: 'right' })

  setDraw(doc, COLORS.line)
  doc.setLineWidth(0.8)
  doc.line(PAGE.margin, 118, PAGE.width - PAGE.margin, 118)
}

const addInfoCard = (doc, x, y, width, label, value) => {
  setFill(doc, COLORS.surface)
  setDraw(doc, COLORS.line)
  doc.roundedRect(x, y, width, 52, 8, 8, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, COLORS.muted)
  doc.text(String(label).toUpperCase(), x + 14, y + 19)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setText(doc, COLORS.ink)
  doc.text(String(value || '-'), x + 14, y + 36)
}

const ensureSpace = (doc, y, needed = 48) => {
  if (y + needed <= PAGE.bottom) {
    return y
  }

  doc.addPage()
  return 68
}

const addFooter = (doc) => {
  const pages = doc.internal.getNumberOfPages()

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    setDraw(doc, COLORS.line)
    doc.line(PAGE.margin, PAGE.height - 54, PAGE.width - PAGE.margin, PAGE.height - 54)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, COLORS.muted)
    doc.text('Generado por Mossi Shop', PAGE.margin, PAGE.height - 34)
    doc.text(`Pagina ${page} de ${pages}`, PAGE.width - PAGE.margin, PAGE.height - 34, {
      align: 'right',
    })
  }
}

const addTotals = (doc, y, rows) => {
  const x = 352
  const width = PAGE.width - PAGE.margin - x
  setFill(doc, COLORS.soft)
  setDraw(doc, COLORS.line)
  doc.roundedRect(x, y, width, rows.length * 25 + 18, 8, 8, 'FD')

  rows.forEach((row, index) => {
    const rowY = y + 24 + index * 25
    doc.setFont('helvetica', row.bold ? 'bold' : 'normal')
    doc.setFontSize(row.bold ? 12 : 9)
    setText(doc, row.bold ? COLORS.ink : COLORS.muted)
    doc.text(row.label, x + 16, rowY)
    doc.text(formatCurrency(row.value), x + width - 16, rowY, {
      align: 'right',
    })
  })
}

export const downloadSaleTicket = (sale) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = 160
  const saleItems = Array.isArray(sale.items) ? sale.items : []

  addHeader(
    doc,
    `Ticket ${sale.ticketNumber || ''}`,
    'Ticket de venta boutique',
    sale.saleDate,
  )
  addInfoCard(doc, PAGE.margin, y, 180, 'Clienta', sale.clientName)
  addInfoCard(doc, 242, y, 138, 'Estado', sale.status)
  addInfoCard(doc, 392, y, 154, 'Fecha', receiptDate(sale.saleDate))

  y += 88
  setFill(doc, COLORS.accentSoft)
  doc.roundedRect(PAGE.margin, y - 18, PAGE.width - PAGE.margin * 2, 30, 8, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setText(doc, COLORS.accent)
  doc.text('PRODUCTO', PAGE.margin + 14, y)
  doc.text('CANT.', 312, y)
  doc.text('PRECIO', 380, y)
  doc.text('SUBTOTAL', PAGE.width - PAGE.margin - 14, y, { align: 'right' })
  y += 30

  saleItems.forEach((item, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${item.name}`, 250)
    const source = item.source || (item.productId ? 'Inventario' : 'Manual')
    const itemDescription = item.description
      ? `${source} · ${item.description}`
      : source
    const detailLines = doc.splitTextToSize(itemDescription, 250)
    const rowHeight = Math.max(
      54,
      lines.length * 13 + detailLines.length * 11 + 24,
    )
    y = ensureSpace(doc, y, rowHeight + 18)

    if (index % 2 === 0) {
      setFill(doc, COLORS.soft)
      doc.roundedRect(PAGE.margin, y - 16, PAGE.width - PAGE.margin * 2, rowHeight, 7, 7, 'F')
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    setText(doc, COLORS.ink)
    doc.text(lines, PAGE.margin + 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, COLORS.muted)
    doc.text(detailLines, PAGE.margin + 14, y + lines.length * 13 + 8)
    doc.setFontSize(10)
    setText(doc, COLORS.ink)
    doc.setFont('helvetica', 'normal')
    doc.text(String(item.quantity), 322, y)
    doc.text(formatCurrency(item.price), 380, y)
    doc.text(formatCurrency(item.subtotal), PAGE.width - PAGE.margin - 14, y, {
      align: 'right',
    })
    y += rowHeight
  })

  y = ensureSpace(doc, y, 120)
  addTotals(doc, y + 8, [
    { label: 'Total', value: sale.total, bold: true },
    { label: 'Monto pagado', value: sale.amountPaid },
    { label: 'Saldo pendiente', value: sale.balance, bold: true },
  ])

  addFooter(doc)
  doc.save(`mossi-ticket-${sanitizeFileName(sale.clientName)}.pdf`)
}

export const downloadAbonoReceipt = (payment) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = 160

  addHeader(doc, 'Comprobante de abono', 'Registro de pago Mossi Shop', payment.paymentDate)
  addInfoCard(doc, PAGE.margin, y, 230, 'Clienta', payment.clientName)
  addInfoCard(doc, 292, y, 120, 'Metodo', payment.method || '-')
  addInfoCard(doc, 424, y, 122, 'Fecha', receiptDate(payment.paymentDate))

  y += 95
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  setText(doc, COLORS.ink)
  doc.text('Gracias por tu pago', PAGE.margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setText(doc, COLORS.muted)
  doc.text(
    'Este comprobante resume el abono recibido y el nuevo saldo pendiente.',
    PAGE.margin,
    y + 20,
  )

  y += 58
  addTotals(doc, y, [
    { label: 'Saldo anterior', value: payment.balanceBefore },
    { label: 'Cantidad abonada', value: payment.amount, bold: true },
    { label: 'Nuevo saldo pendiente', value: payment.balanceAfter, bold: true },
  ])

  if (payment.notes) {
    y += 116
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    setText(doc, COLORS.ink)
    doc.text('Notas', PAGE.margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setText(doc, COLORS.muted)
    doc.text(doc.splitTextToSize(payment.notes, 420), PAGE.margin, y + 18)
  }

  addFooter(doc)
  doc.save(`mossi-abono-${sanitizeFileName(payment.clientName)}.pdf`)
}
