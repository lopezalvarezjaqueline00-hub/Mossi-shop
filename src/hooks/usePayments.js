import { useContext } from 'react'
import { PaymentContext } from '../context/PaymentContextValue'

export function usePayments() {
  const context = useContext(PaymentContext)

  if (!context) {
    throw new Error('usePayments must be used inside PaymentProvider')
  }

  return context
}
