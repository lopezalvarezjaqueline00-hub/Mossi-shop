import { useMemo } from 'react'
import { initialPayments } from '../data/initialPayments'
import { useCloudStorage } from '../hooks/useCloudStorage'
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
      const nextPayment = {
        ...payment,
        id: generateId(),
        amount: Number(payment.amount) || 0,
        paymentDate:
          payment.paymentDate || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      }

      setPayments((current) => [nextPayment, ...current])
      return nextPayment
    }

    const updatePayment = (id, updates) => {
      setPayments((current) =>
        current.map((payment) =>
          payment.id === id
            ? { ...payment, ...updates, amount: Number(updates.amount) || 0 }
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
