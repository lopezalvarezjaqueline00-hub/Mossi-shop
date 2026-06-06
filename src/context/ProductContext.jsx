import { useMemo } from 'react'
import { PRODUCT_STATUSES, initialProducts } from '../data/initialProducts'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { ProductContext } from './ProductContextValue'

const ensureProductList = (products) =>
  Array.isArray(products) ? products.filter(Boolean) : []

const normalizeProduct = (product, fallbackId) => ({
  id: product.id || fallbackId || generateId(),
  name: String(product.name || 'Producto sin nombre').trim(),
  category: product.category || 'Ropa',
  description: product.description || '',
  price: Number(product.price) || 0,
  size: product.size || '',
  color: product.color || '',
  status: PRODUCT_STATUSES.includes(product.status)
    ? product.status
    : 'Disponible',
  notes: product.notes || '',
  createdAt: product.createdAt || new Date().toISOString(),
  images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
})

export function ProductProvider({ children }) {
  const [products, setProducts] = useCloudStorage(
    STORAGE_KEYS.products,
    initialProducts,
    'products',
  )

  const value = useMemo(() => {
    const addProduct = (product) => {
      const nextProduct = normalizeProduct({
        ...product,
        id: generateId(),
        createdAt: new Date().toISOString(),
      })

      setProducts((current) => [nextProduct, ...ensureProductList(current)])
      return nextProduct
    }

    const updateProduct = (id, updates) => {
      setProducts((current) =>
        ensureProductList(current).map((product) =>
          product.id === id
            ? normalizeProduct({ ...product, ...updates, id })
            : product,
        ),
      )
    }

    const deleteProduct = (id) => {
      setProducts((current) =>
        ensureProductList(current).filter((product) => product.id !== id),
      )
    }

    const updateStatus = (id, status) => {
      setProducts((current) =>
        ensureProductList(current).map((product) =>
          product.id === id ? { ...product, status } : product,
        ),
      )
    }

    const safeProducts = ensureProductList(products).map((product, index) =>
      normalizeProduct(product, `product-${index}`),
    )

    return {
      products: safeProducts,
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
