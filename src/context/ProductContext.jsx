import { useMemo } from 'react'
import { initialProducts } from '../data/initialProducts'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { ProductContext } from './ProductContextValue'

export function ProductProvider({ children }) {
  const [products, setProducts] = useCloudStorage(
    STORAGE_KEYS.products,
    initialProducts,
    'products',
  )

  const value = useMemo(() => {
    const addProduct = (product) => {
      const nextProduct = {
        ...product,
        id: generateId(),
        price: Number(product.price) || 0,
        createdAt: new Date().toISOString(),
      }

      setProducts((current) => [nextProduct, ...current])
      return nextProduct
    }

    const updateProduct = (id, updates) => {
      setProducts((current) =>
        current.map((product) =>
          product.id === id
            ? { ...product, ...updates, price: Number(updates.price) || 0 }
            : product,
        ),
      )
    }

    const deleteProduct = (id) => {
      setProducts((current) => current.filter((product) => product.id !== id))
    }

    const updateStatus = (id, status) => {
      setProducts((current) =>
        current.map((product) =>
          product.id === id ? { ...product, status } : product,
        ),
      )
    }

    return {
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      updateStatus,
    }
  }, [products, setProducts])

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  )
}
