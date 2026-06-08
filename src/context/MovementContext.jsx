import { useMemo } from 'react'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { MovementContext } from './MovementContextValue'

const ensureMovementList = (movements) =>
  Array.isArray(movements)
    ? movements.filter(
        (movement) =>
          movement && typeof movement === 'object' && !Array.isArray(movement),
      )
    : []

const normalizeMovement = (movement = {}, fallbackId) => {
  const safeMovement =
    movement && typeof movement === 'object' && !Array.isArray(movement)
      ? movement
      : {}

  return {
    ...safeMovement,
    id: safeMovement.id || fallbackId || generateId(),
    type: safeMovement.type || 'movimiento',
    title: safeMovement.title || 'Movimiento',
    description: safeMovement.description || '',
    amount: Number(safeMovement.amount) || 0,
    createdAt: safeMovement.createdAt || new Date().toISOString(),
    createdBy: safeMovement.createdBy || '',
  }
}

export function MovementProvider({ children }) {
  const [movements, setMovements] = useCloudStorage(
    STORAGE_KEYS.movements,
    [],
    'movements',
  )

  const value = useMemo(() => {
    const addMovement = (movement) => {
      const nextMovement = normalizeMovement({
        ...(movement && typeof movement === 'object' ? movement : {}),
        id: movement?.id || generateId(),
        createdAt: movement?.createdAt || new Date().toISOString(),
      })

      setMovements((current) => [nextMovement, ...ensureMovementList(current)])
      return nextMovement
    }

    const deleteMovement = (id) => {
      setMovements((current) =>
        ensureMovementList(current).filter((movement) => movement.id !== id),
      )
    }

    const safeMovements = ensureMovementList(movements).map((movement, index) =>
      normalizeMovement(movement, `movement-${index}`),
    )

    return {
      movements: safeMovements,
      addMovement,
      deleteMovement,
      restoreMovement: addMovement,
    }
  }, [movements, setMovements])

  return (
    <MovementContext.Provider value={value}>{children}</MovementContext.Provider>
  )
}
