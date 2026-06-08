import { useMemo } from 'react'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { SaleContext } from './SaleContextValue'

const SALE_STATUSES = ['Pagado', 'Pendiente', 'Apartado']

const ensureSaleList = (sales) =>
  Array.isArray(sales)
    ? sales.filter((sale) => sale && typeof sale === 'object' && !Array.isArray(sale))
    : []

const normalizeSaleItems = (sale) =>
  Array.isArray(sale?.items)
    ? sale.items
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item, index) => {
          const quantity = Number(item.quantity) || 1
          const price = Number(item.price) || 0
          const source =
            item.source || (item.productId ? 'Inventario' : 'Manual')

          return {
            id: item.id || `${sale.id || 'sale'}-item-${index}`,
            productId: item.productId || '',
            inventoryProductId: item.inventoryProductId || '',
            source,
            name: item.name || 'Articulo',
            description: item.description || '',
            quantity,
            price,
            subtotal: Number(item.subtotal) || quantity * price,
            saveToInventory: Boolean(item.saveToInventory),
          }
        })
    : []

const getSaleStatus = (sale, balance) => {
  if (SALE_STATUSES.includes(sale.status)) {
    return sale.status
  }

  return balance <= 0 ? 'Pagado' : 'Pendiente'
}

const normalizeSale = (sale = {}, fallbackId) => {
  const safeSale =
    sale && typeof sale === 'object' && !Array.isArray(sale) ? sale : {}
  const id = safeSale.id || fallbackId || generateId()
  const items = normalizeSaleItems({ ...safeSale, id })
  const total =
    Number(safeSale.total) ||
    items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
  const amountPaid = Number(safeSale.amountPaid) || 0
  const balance = Math.max(total - amountPaid, 0)

  return {
    ...safeSale,
    id,
    clientId: safeSale.clientId || '',
    clientName: safeSale.clientName || 'Clienta sin nombre',
    saleDate: safeSale.saleDate || new Date().toISOString().slice(0, 10),
    items,
    total,
    amountPaid,
    balance,
    status: getSaleStatus(safeSale, balance),
    notes: safeSale.notes || '',
    ticketNumber:
      safeSale.ticketNumber || String(id).slice(-8).toUpperCase(),
    createdAt: safeSale.createdAt || new Date().toISOString(),
  }
}

export function SaleProvider({ children }) {
  const [sales, setSales] = useCloudStorage(STORAGE_KEYS.sales, [], 'sales')

  const value = useMemo(() => {
    const addSale = (sale) => {
      const nextSale = normalizeSale({
        ...(sale && typeof sale === 'object' ? sale : {}),
        id: sale?.id || generateId(),
        createdAt: sale?.createdAt || new Date().toISOString(),
      })

      setSales((current) => [nextSale, ...ensureSaleList(current)])
      return nextSale
    }

    const updateSale = (id, updates) => {
      let nextSale

      setSales((current) =>
        ensureSaleList(current).map((sale) => {
          if (sale.id !== id) {
            return sale
          }

          nextSale = normalizeSale({ ...sale, ...updates, id })
          return nextSale
        }),
      )

      return nextSale
    }

    const deleteSale = (id) => {
      setSales((current) =>
        ensureSaleList(current).filter((sale) => sale.id !== id),
      )
    }

    const safeSales = ensureSaleList(sales).map((sale, index) =>
      normalizeSale(sale, `sale-${index}`),
    )

    return {
      sales: safeSales,
      addSale,
      updateSale,
      deleteSale,
      restoreSale: addSale,
    }
  }, [sales, setSales])

  return <SaleContext.Provider value={value}>{children}</SaleContext.Provider>
}
