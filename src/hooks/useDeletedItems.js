import { useContext } from 'react'
import { DeletedItemsContext } from '../context/DeletedItemsContextValue'

export const useDeletedItems = () => {
  const context = useContext(DeletedItemsContext)

  if (!context) {
    throw new Error('useDeletedItems must be used inside DeletedItemsProvider')
  }

  return context
}
