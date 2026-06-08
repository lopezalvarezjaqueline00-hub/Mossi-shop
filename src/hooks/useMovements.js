import { useContext } from 'react'
import { MovementContext } from '../context/MovementContextValue'

export const useMovements = () => {
  const context = useContext(MovementContext)

  if (!context) {
    throw new Error('useMovements must be used inside MovementProvider')
  }

  return context
}
