export const normalizePaymentType = (type) => {
  const value = String(type || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (value === 'sin pago') {
    return 'Sin Pago'
  }

  if (value === 'pago completo' || value === 'liquidacion') {
    return 'Pago Completo'
  }

  return 'Anticipo'
}

export const normalizePaymentItems = (payment) => {
  if (Array.isArray(payment?.items) && payment.items.length) {
    return payment.items
      .filter(
        (item) =>
          item && typeof item === 'object' && !Array.isArray(item),
      )
      .map((item, index) => ({
        id: item.id || `${payment.id || 'payment'}-item-${index}`,
        productId: item.productId || '',
        name: item.name || item.productName || 'Articulo',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }))
  }

  if (payment?.productName || payment?.productId) {
    return [
      {
        id: `${payment.id || 'payment'}-legacy-item`,
        productId: payment.productId || '',
        name: payment.productName || 'Articulo',
        quantity: 1,
        price: Number(payment.purchaseTotal || payment.amount) || 0,
      },
    ]
  }

  return []
}

export const getPaymentPurchaseTotal = (payment) => {
  const itemsTotal = normalizePaymentItems(payment).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  )

  return Number(payment?.purchaseTotal) || itemsTotal
}

export const getPaymentItemsLabel = (payment) => {
  const items = normalizePaymentItems(payment)

  if (!items.length) {
    return payment?.productName || 'Sin articulos registrados'
  }

  const firstItems = items.slice(0, 2).map((item) => item.name)
  const remaining = items.length - firstItems.length

  return remaining > 0
    ? `${firstItems.join(', ')} +${remaining} mas`
    : firstItems.join(', ')
}
