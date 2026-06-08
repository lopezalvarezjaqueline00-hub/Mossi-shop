import { useMemo } from 'react'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { normalizePaymentType } from '../utils/payments'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { PaymentContext } from './PaymentContextValue'

const ensurePaymentList = (payments) =>
  Array.isArray(payments)
    ? payments.filter(
        (payment) =>
          payment && typeof payment === 'object' && !Array.isArray(payment),
      )
    : []

const normalizePayment = (payment = {}, fallbackId) => {
  const safePayment =
    payment && typeof payment === 'object' && !Array.isArray(payment)
      ? payment
      : {}
  const id = safePayment.id || fallbackId || generateId()
  const createdAt = safePayment.createdAt || new Date().toISOString()
  const items = Array.isArray(safePayment.items)
    ? safePayment.items
        .filter(
          (item) =>
            item && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item, index) => ({
          id: item.id || `${id}-item-${index}`,
          productId: item.productId || '',
          name: item.name || item.productName || 'Articulo',
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        }))
    : []

  return {
    ...safePayment,
    id,
    clientName: safePayment.clientName || '',
    productId: safePayment.productId || '',
    productName: safePayment.productName || items[0]?.name || '',
    clientId: safePayment.clientId || '',
    saleId: safePayment.saleId || '',
    items,
    purchaseTotal:
      Number(safePayment.purchaseTotal) ||
      items.reduce(
        (total, item) =>
          total + Number(item.price || 0) * Number(item.quantity || 1),
        0,
      ),
    amount: Number(safePayment.amount) || 0,
    balanceBefore: Number(safePayment.balanceBefore) || 0,
    balanceAfter: Number(safePayment.balanceAfter) || 0,
    method: safePayment.method || 'Transferencia',
    type: normalizePaymentType(safePayment.type),
    paymentDate:
      safePayment.paymentDate || new Date().toISOString().slice(0, 10),
    receiptGeneratedAt: safePayment.receiptGeneratedAt || createdAt,
    receiptNumber:
      safePayment.receiptNumber || String(id).slice(-8).toUpperCase(),
    notes: safePayment.notes || '',
    kind: safePayment.kind || 'payment',
    createdAt,
  }
}

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useCloudStorage(
    STORAGE_KEYS.payments,
    [],
    'payments',
  )

  const value = useMemo(() => {
    const addPayment = (payment) => {
      const id = payment?.id || generateId()
      const createdAt = payment?.createdAt || new Date().toISOString()
      const nextPayment = normalizePayment({
        ...payment,
        id,
        receiptGeneratedAt: createdAt,
        receiptNumber: String(id).slice(-8).toUpperCase(),
        createdAt,
      })

      setPayments((current) => [nextPayment, ...ensurePaymentList(current)])
      return nextPayment
    }

    const updatePayment = (id, updates) => {
      setPayments((current) =>
        ensurePaymentList(current).map((payment) =>
          payment.id === id
            ? normalizePayment({ ...payment, ...updates, id })
            : payment,
        ),
      )
    }

    const deletePayment = (id) => {
      setPayments((current) =>
        ensurePaymentList(current).filter((payment) => payment.id !== id),
      )
    }

    const restorePayment = (payment) => addPayment(payment)

    const safePayments = ensurePaymentList(payments).map((payment, index) =>
      normalizePayment(payment, `payment-${index}`),
    )

    return {
      payments: safePayments,
      addPayment,
      updatePayment,
      deletePayment,
      restorePayment,
    }
  }, [payments, setPayments])

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  )
}
