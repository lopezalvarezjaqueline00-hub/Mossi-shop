import { useMemo } from 'react'
import { PRODUCT_STATUSES } from '../data/initialProducts'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { ProductContext } from './ProductContextValue'

const ensureProductList = (products) =>
  Array.isArray(products)
    ? products.filter(
        (product) =>
          product && typeof product === 'object' && !Array.isArray(product),
      )
    : []

const getProductStock = (product) => {
  const stock = Number(product.stock)

  if (Number.isFinite(stock)) {
    return Math.max(0, stock)
  }

  return ['Vendido', 'Agotado'].includes(product.status) ? 0 : 1
}

const normalizeProduct = (product = {}, fallbackId) => {
  const safeProduct =
    product && typeof product === 'object' && !Array.isArray(product)
      ? product
      : {}

  const initialStatus = PRODUCT_STATUSES.includes(safeProduct.status)
    ? safeProduct.status
    : 'Disponible'
  const stock = initialStatus === 'Agotado' ? 0 : getProductStock(safeProduct)
  const status =
    stock <= 0 && initialStatus === 'Disponible'
      ? 'Agotado'
      : initialStatus

  return {
    id: safeProduct.id || fallbackId || generateId(),
    name: String(safeProduct.name || 'Producto sin nombre').trim(),
    category: safeProduct.category || 'Ropa',
    description: safeProduct.description || '',
    price: Number(safeProduct.price) || 0,
    size: safeProduct.size || '',
    color: safeProduct.color || '',
    status,
    stock,
    notes: safeProduct.notes || '',
    createdAt: safeProduct.createdAt || new Date().toISOString(),
    images: Array.isArray(safeProduct.images)
      ? safeProduct.images.filter(Boolean)
      : [],
  }
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useCloudStorage(
    STORAGE_KEYS.products,
    [],
    'products',
  )

  const value = useMemo(() => {
    const addProduct = (product) => {
      try {
        const nextProduct = normalizeProduct({
          ...(product && typeof product === 'object' ? product : {}),
          id: product?.id || generateId(),
          createdAt: product?.createdAt || new Date().toISOString(),
        })

        setProducts((current) => {
          const safeCurrent = ensureProductList(current)
          return [nextProduct, ...safeCurrent]
        })
        return nextProduct
      } catch (error) {
        console.error('Product save failed:', error)
        throw error
      }
    }

    const updateProduct = (id, updates) => {
      try {
        setProducts((current) =>
          ensureProductList(current).map((product) =>
            product.id === id
              ? normalizeProduct({ ...product, ...updates, id })
              : product,
          ),
        )
      } catch (error) {
        console.error('Product update failed:', error)
        throw error
      }
    }

    const deleteProduct = (id) => {
      try {
        setProducts((current) =>
          ensureProductList(current).filter((product) => product.id !== id),
        )
      } catch (error) {
        console.error('Product delete failed:', error)
        throw error
      }
    }

    const updateStatus = (id, status) => {
      try {
        setProducts((current) =>
          ensureProductList(current).map((product) =>
            product.id === id
              ? normalizeProduct({
                  ...product,
                  status,
                  stock: status === 'Agotado' ? 0 : product.stock,
                })
              : product,
          ),
        )
      } catch (error) {
        console.error('Product status update failed:', error)
        throw error
      }
    }

    const restoreProduct = (product) => {
      const restoredProduct = normalizeProduct({
        ...(product && typeof product === 'object' ? product : {}),
        id: product?.id || generateId(),
        createdAt: product?.createdAt || new Date().toISOString(),
      })

      setProducts((current) => [restoredProduct, ...ensureProductList(current)])
      return restoredProduct
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
      restoreProduct,
    }
  }, [products, setProducts])

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  )
}
