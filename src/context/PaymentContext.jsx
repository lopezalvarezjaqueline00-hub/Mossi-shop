import { useMemo } from 'react'
import { initialPayments } from '../data/initialPayments'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { normalizePaymentType } from '../utils/payments'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { PaymentContext } from './PaymentContextValue'

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
      const nextPayment = {
        ...payment,
        id,
        amount: Number(payment.amount) || 0,
        type: normalizePaymentType(payment.type),
        paymentDate:
          payment.paymentDate || new Date().toISOString().slice(0, 10),
        receiptGeneratedAt: createdAt,
        receiptNumber: String(id).slice(-8).toUpperCase(),
        createdAt,
      }

      setPayments((current) => [nextPayment, ...current])
      return nextPayment
    }

    const updatePayment = (id, updates) => {
      setPayments((current) =>
        current.map((payment) =>
          payment.id === id
            ? {
                ...payment,
                ...updates,
                amount: Number(updates.amount) || 0,
                type: normalizePaymentType(updates.type || payment.type),
              }
            : payment,
        ),
      )
    }

    const deletePayment = (id) => {
      setPayments((current) => current.filter((payment) => payment.id !== id))
    }

    return {
      payments,
      addPayment,
      updatePayment,
      deletePayment,
    }
  }, [payments, setPayments])

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  )
}
