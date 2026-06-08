import { useContext } from 'react'
import { SaleContext } from '../context/SaleContextValue'

export const useSales = () => {
  const context = useContext(SaleContext)

  if (!context) {
    throw new Error('useSales must be used inside SaleProvider')
  }

  return context
}
