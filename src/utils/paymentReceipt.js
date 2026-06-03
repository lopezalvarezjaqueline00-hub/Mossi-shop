import { jsPDF } from 'jspdf'
import { formatCurrency, formatDate } from './formatters'
import {
  getPaymentPurchaseTotal,
  normalizePaymentItems,
  normalizePaymentType,
} from './payments'

const PAGE = {
  margin: 48,
  bottom: 760,
  width: 595.28,
  height: 841.89,
}

const COLORS = {
  ink: [24, 23, 21],
  muted: [111, 105, 96],
  soft: [248, 246, 241],
  surface: [255, 255, 255],
  line: [224, 217, 207],
  accent: [127, 70, 59],
  accentSoft: [244, 226, 219],
  success: [92, 120, 101],
  successSoft: [227, 235, 228],
  warning: [171, 121, 58],
  warningSoft: [246, 233, 211],
  danger: [156, 80, 80],
  dangerSoft: [244, 224, 224],
  dark: [20, 19, 17],
}

const setFill = (doc, color) => doc.setFillColor(...color)
const setDraw = (doc, color) => doc.setDrawColor(...color)
const setText = (doc, color) => doc.setTextColor(...color)

const sanitizeFileName = (value) =>
  String(value || 'pago')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const formatReceiptDate = (value) => {
  if (!value) {
    return formatDate(new Date())
  }

  return formatDate(`${value}T12:00:00`)
}

const ensureSpace = (doc, y, needed = 48) => {
  if (y + needed <= PAGE.bottom) {
    return y
  }

  doc.addPage()
  return 68
}

const addLabelValue = (doc, label, value, x, y) => {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setText(doc, COLORS.muted)
  doc.text(String(label).toUpperCase(), x, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  setText(doc, COLORS.ink)
  doc.text(String(value || '-'), x, y + 16)
}

const getStatusPalette = (value) => {
  const status = String(value || '').toLowerCase()

  if (status.includes('completo') || status.includes('disponible')) {
    return { fill: COLORS.successSoft, text: COLORS.success }
  }

  if (status.includes('anticipo') || status.includes('apartado')) {
    return { fill: COLORS.warningSoft, text: COLORS.warning }
  }

  if (status.includes('vendido')) {
    return { fill: COLORS.dangerSoft, text: COLORS.danger }
  }

  return { fill: COLORS.accentSoft, text: COLORS.accent }
}

const addPill = (doc, label, x, y, options = {}) => {
  const text = String(label || 'Sin estado')
  const palette = getStatusPalette(text)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const width = doc.getTextWidth(text.toUpperCase()) + 22
  const left = options.align === 'right' ? x - width : x

  setFill(doc, palette.fill)
  doc.roundedRect(left, y - 12, width, 20, 10, 10, 'F')
  setText(doc, palette.text)
  doc.text(text.toUpperCase(), left + width / 2, y + 1, { align: 'center' })
}

const addSectionTitle = (doc, title, y, subtitle) => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setText(doc, COLORS.ink)
  doc.text(title, PAGE.margin, y)

  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setText(doc, COLORS.muted)
    doc.text(subtitle, PAGE.margin, y + 16)
  }
}

const drawHeader = (doc, storeName, receiptNumber, paymentDate, paymentType) => {
  setFill(doc, COLORS.soft)
  doc.rect(0, 0, PAGE.width, 146, 'F')
  setFill(doc, COLORS.dark)
  doc.rect(0, 0, 11, 146, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(27)
  setText(doc, COLORS.ink)
  doc.text(storeName, PAGE.margin, 54)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, COLORS.muted)
  doc.text('Reporte de pago boutique', PAGE.margin, 75)
  doc.text(`Generado: ${formatDate(new Date())}`, PAGE.margin, 92)

  addPill(doc, paymentType, PAGE.margin, 121)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setText(doc, COLORS.ink)
  doc.text(`Recibo ${receiptNumber}`, PAGE.width - PAGE.margin, 54, {
    align: 'right',
  })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setText(doc, COLORS.muted)
  doc.text(formatReceiptDate(paymentDate), PAGE.width - PAGE.margin, 72, {
    align: 'right',
  })

  setDraw(doc, COLORS.line)
  doc.setLineWidth(0.8)
  doc.line(PAGE.margin, 128, PAGE.width - PAGE.margin, 128)
}

const drawInfoCard = (doc, x, y, width, label, value) => {
  setFill(doc, COLORS.surface)
  setDraw(doc, COLORS.line)
  doc.roundedRect(x, y, width, 54, 8, 8, 'FD')
  addLabelValue(doc, label, value, x + 16, y + 21)
}

const drawTableHeader = (doc, y) => {
  setFill(doc, COLORS.accentSoft)
  doc.roundedRect(PAGE.margin, y - 18, PAGE.width - PAGE.margin * 2, 30, 8, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setText(doc, COLORS.accent)
  doc.text('ART\u00cdCULO', PAGE.margin + 16, y)
  doc.text('CANT.', 324, y)
  doc.text('PRECIO', 388, y)
  doc.text('TOTAL', PAGE.width - PAGE.margin - 16, y, { align: 'right' })
}

const addFooter = (doc, storeName) => {
  const totalPages = doc.internal.getNumberOfPages()

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber)
    setDraw(doc, COLORS.line)
    doc.setLineWidth(0.6)
    doc.line(PAGE.margin, PAGE.height - 54, PAGE.width - PAGE.margin, PAGE.height - 54)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, COLORS.muted)
    doc.text(`Generado por ${storeName}`, PAGE.margin, PAGE.height - 34)
    doc.text(`P\u00e1gina ${pageNumber} de ${totalPages}`, PAGE.width - PAGE.margin, PAGE.height - 34, {
      align: 'right',
    })
  }
}

export const downloadPaymentReceipt = (payment, settings = {}) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const storeName = settings.storeName || 'Mossi Shop'
  const items = normalizePaymentItems(payment)
  const purchaseTotal = getPaymentPurchaseTotal(payment)
  const paidAmount = Number(payment.amount || 0)
  const pendingAmount = Math.max(purchaseTotal - paidAmount, 0)
  const paymentType = normalizePaymentType(payment.type)
  const receiptNumber =
    payment.receiptNumber ||
    String(payment.id || Date.now()).slice(-8).toUpperCase()
  let y = 168

  drawHeader(doc, storeName, receiptNumber, payment.paymentDate, paymentType)

  drawInfoCard(doc, PAGE.margin, y, 155, 'Clienta', payment.clientName)
  drawInfoCard(doc, 214, y, 155, 'M\u00e9todo', payment.method || '-')
  drawInfoCard(doc, 381, y, 166, 'Fecha de pago', formatReceiptDate(payment.paymentDate))

  y += 88
  addSectionTitle(
    doc,
    'Art\u00edculos de la compra',
    y,
    'Detalle de piezas, cantidades e importes registrados para esta clienta.',
  )

  y += 44
  drawTableHeader(doc, y)
  y += 28

  if (items.length) {
    items.forEach((item, index) => {
      const quantity = Number(item.quantity || 1)
      const price = Number(item.price || 0)
      const total = quantity * price
      const itemTitle = `${index + 1}. ${item.name}`
      const itemLines = doc.splitTextToSize(itemTitle, 240)
      const rowHeight = Math.max(48, itemLines.length * 13 + 24)
      const pageBefore = doc.internal.getCurrentPageInfo().pageNumber

      y = ensureSpace(doc, y, rowHeight + 22)

      if (doc.internal.getCurrentPageInfo().pageNumber !== pageBefore) {
        drawTableHeader(doc, y)
        y += 28
      }

      if (index % 2 === 0) {
        setFill(doc, COLORS.soft)
        doc.roundedRect(PAGE.margin, y - 18, PAGE.width - PAGE.margin * 2, rowHeight, 7, 7, 'F')
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      setText(doc, COLORS.ink)
      doc.text(itemLines, PAGE.margin + 16, y)

      if (item.status) {
        addPill(doc, item.status, PAGE.margin + 16, y + itemLines.length * 13 + 12)
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      setText(doc, COLORS.ink)
      doc.text(String(quantity), 334, y)
      doc.text(formatCurrency(price), 388, y)
      doc.setFont('helvetica', 'bold')
      doc.text(formatCurrency(total), PAGE.width - PAGE.margin - 16, y, {
        align: 'right',
      })

      y += rowHeight + 10
      setDraw(doc, COLORS.line)
      doc.setLineWidth(0.4)
      doc.line(PAGE.margin + 16, y - 12, PAGE.width - PAGE.margin - 16, y - 12)
    })
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    setText(doc, COLORS.muted)
    setFill(doc, COLORS.soft)
    doc.roundedRect(PAGE.margin, y - 18, PAGE.width - PAGE.margin * 2, 46, 8, 8, 'F')
    doc.text('Sin art\u00edculos registrados.', PAGE.margin + 16, y + 2)
    y += 56
  }

  y = ensureSpace(doc, y, 132)
  setFill(doc, COLORS.dark)
  doc.roundedRect(PAGE.width - 254, y, 206, 116, 10, 10, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(217, 210, 202)
  doc.text('Total compra', PAGE.width - 232, y + 30)
  doc.text('Pagado', PAGE.width - 232, y + 58)
  doc.text('Resta', PAGE.width - 232, y + 86)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(formatCurrency(purchaseTotal), PAGE.width - PAGE.margin - 20, y + 30, {
    align: 'right',
  })
  doc.text(formatCurrency(paidAmount), PAGE.width - PAGE.margin - 20, y + 58, {
    align: 'right',
  })
  setText(doc, pendingAmount > 0 ? COLORS.warningSoft : COLORS.successSoft)
  doc.text(formatCurrency(pendingAmount), PAGE.width - PAGE.margin - 20, y + 86, {
    align: 'right',
  })

  if (payment.notes) {
    y += 150
    y = ensureSpace(doc, y, 92)
    addSectionTitle(doc, 'Notas', y)
    y += 18
    setFill(doc, COLORS.soft)
    setDraw(doc, COLORS.line)
    doc.roundedRect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 66, 8, 8, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    setText(doc, COLORS.muted)
    doc.text(doc.splitTextToSize(payment.notes, 430), PAGE.margin + 16, y + 22)
  }

  addFooter(doc, storeName)

  const clientName = sanitizeFileName(payment.clientName)
  const datePart = sanitizeFileName(payment.paymentDate)
  doc.save(`mossi-shop-pago-${clientName || 'clienta'}-${datePart}.pdf`)
}
