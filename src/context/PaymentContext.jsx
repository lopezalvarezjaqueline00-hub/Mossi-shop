import { useMemo } from 'react'
import { initialPayments } from '../data/initialPayments'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { normalizePaymentType } from '../utils/payments'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { PaymentContext } from './PaymentContextValue'

const ensurePaymentList = (payments) =>
  Array.isArray(payments) ? payments.filter(Boolean) : []

const normalizePayment = (payment, fallbackId) => {
  const id = payment.id || fallbackId || generateId()
  const createdAt = payment.createdAt || new Date().toISOString()
  const items = Array.isArray(payment.items)
    ? payment.items.filter(Boolean).map((item, index) => ({
        id: item.id || `${id}-item-${index}`,
        productId: item.productId || '',
        name: item.name || item.productName || 'Articulo',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }))
    : []

  return {
    ...payment,
    id,
    clientName: payment.clientName || '',
    productId: payment.productId || '',
    productName: payment.productName || items[0]?.name || '',
    items,
    purchaseTotal:
      Number(payment.purchaseTotal) ||
      items.reduce(
        (total, item) =>
          total + Number(item.price || 0) * Number(item.quantity || 1),
        0,
      ),
    amount: Number(payment.amount) || 0,
    method: payment.method || 'Transferencia',
    type: normalizePaymentType(payment.type),
    paymentDate: payment.paymentDate || new Date().toISOString().slice(0, 10),
    receiptGeneratedAt: payment.receiptGeneratedAt || createdAt,
    receiptNumber:
      payment.receiptNumber || String(id).slice(-8).toUpperCase(),
    notes: payment.notes || '',
    createdAt,
  }
}

export function PaymentProvider({ children }) {
  const [payments, setPayments] = useCloudStorage(
    STORAGE_KEYS.payments,
    initialPayments,
    'payments',
  )

  const value = useMemo(() => {
    const addPayment = (payment) => {
      const id = generateId()
      const createdAt = new Date().toISOString()
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
          payment.id === id ? normalizePayment({ ...payment, ...updates, id }) : payment,
        ),
      )
    }

    const deletePayment = (id) => {
      setPayments((current) =>
        ensurePaymentList(current).filter((payment) => payment.id !== id),
      )
    }

    const safePayments = ensurePaymentList(payments).map((payment, index) =>
      normalizePayment(payment, `payment-${index}`),
    )

    return {
      payments: safePayments,
      addPayment,
      updatePayment,
      deletePayment,
    }
  }, [payments, setPayments])

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  )
}
