import { useMemo } from 'react'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { DeletedItemsContext } from './DeletedItemsContextValue'

const ensureDeletedList = (items) =>
  Array.isArray(items)
    ? items.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    : []

const normalizeDeletedItem = (item = {}, fallbackId) => {
  const safeItem = item && typeof item === 'object' && !Array.isArray(item) ? item : {}

  return {
    ...safeItem,
    id: safeItem.id || fallbackId || generateId(),
    type: safeItem.type || 'movimiento',
    originalId: safeItem.originalId || safeItem.data?.id || '',
    title: safeItem.title || 'Elemento eliminado',
    description: safeItem.description || '',
    amount: Number(safeItem.amount) || 0,
    data: safeItem.data && typeof safeItem.data === 'object' ? safeItem.data : {},
    deletedAt: safeItem.deletedAt || new Date().toISOString(),
    deletedBy: safeItem.deletedBy || '',
  }
}

export function DeletedItemsProvider({ children }) {
  const [deletedItems, setDeletedItems] = useCloudStorage(
    STORAGE_KEYS.deletedItems,
    [],
    'deleted_items',
  )

  const value = useMemo(() => {
    const addDeletedItem = (item) => {
      const nextItem = normalizeDeletedItem({
        ...(item && typeof item === 'object' ? item : {}),
        id: item?.id || generateId(),
        deletedAt: item?.deletedAt || new Date().toISOString(),
      })

      setDeletedItems((current) => [nextItem, ...ensureDeletedList(current)])
      return nextItem
    }

    const removeDeletedItem = (id) => {
      setDeletedItems((current) =>
        ensureDeletedList(current).filter((item) => item.id !== id),
      )
    }

    const safeDeletedItems = ensureDeletedList(deletedItems).map((item, index) =>
      normalizeDeletedItem(item, `deleted-${index}`),
    )

    return {
      deletedItems: safeDeletedItems,
      addDeletedItem,
      removeDeletedItem,
      permanentlyDelete: removeDeletedItem,
    }
  }, [deletedItems, setDeletedItems])

  return (
    <DeletedItemsContext.Provider value={value}>
      {children}
    </DeletedItemsContext.Provider>
  )
}
