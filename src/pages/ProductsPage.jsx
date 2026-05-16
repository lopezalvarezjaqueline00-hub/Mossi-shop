import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import ProductQuickView from '../components/ProductQuickView'
import SearchFilters from '../components/SearchFilters'
import { ProductCardSkeleton } from '../components/Skeletons'
import { useProducts } from '../hooks/useProducts'
import { useToast } from '../hooks/useToast'
import { normalizeText } from '../utils/formatters'

const initialFilters = {
  query: '',
  category: 'Todas',
  status: 'Todos',
  maxPrice: 0,
}

export default function ProductsPage({
  openCreateOnMount = false,
  onCreateRequestHandled,
}) {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStatus,
  } = useProducts()
  const { notify } = useToast()
  const [filters, setFilters] = useState(initialFilters)
  const [modalOpen, setModalOpen] = useState(openCreateOnMount)
  const [editingProduct, setEditingProduct] = useState(null)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 420)
    return () => window.clearTimeout(timeout)
  }, [])

  const maxInventoryPrice = useMemo(
    () =>
      Math.max(
        1000,
        ...products.map((product) => Number(product.price) || 0),
      ),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = normalizeText(filters.query)
    const maxPrice = filters.maxPrice || maxInventoryPrice

    return products.filter((product) => {
      const matchesQuery = query
        ? normalizeText(product.name).includes(query)
        : true
      const matchesCategory =
        filters.category === 'Todas' || product.category === filters.category
      const matchesStatus =
        filters.status === 'Todos' || product.status === filters.status
      const matchesPrice = Number(product.price || 0) <= maxPrice

      return matchesQuery && matchesCategory && matchesStatus && matchesPrice
    })
  }, [filters, maxInventoryPrice, products])

  const handleCreate = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const closeProductModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
    if (openCreateOnMount) {
      onCreateRequestHandled()
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleSave = (payload) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, payload)
      notify({
        title: 'Producto actualizado',
        message: `${payload.name} quedo guardado.`,
      })
    } else {
      addProduct(payload)
      notify({
        title: 'Producto agregado',
        message: `${payload.name} ya esta en inventario.`,
      })
    }

    closeProductModal()
  }

  const confirmDelete = () => {
    if (!deleteTarget) {
      return
    }

    deleteProduct(deleteTarget.id)
    notify({
      title: 'Producto eliminado',
      message: `${deleteTarget.name} salio del inventario.`,
      type: 'info',
    })
    setDeleteTarget(null)
  }

  const handleStatusChange = (id, status) => {
    updateStatus(id, status)
    setQuickViewProduct((current) =>
      current?.id === id ? { ...current, status } : current,
    )
    notify({
      title: 'Estado actualizado',
      message: `Producto marcado como ${status.toLowerCase()}.`,
    })
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm uppercase text-[color:var(--muted)]">
            Catalogo
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
            Productos
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            Gestiona fotos, precios, estados, tallas, colores y notas de cada
            pieza.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCreate}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)] transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <FiPlus className="h-4 w-4" />
            Agregar producto
          </button>
        </div>
      </section>

      <SearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        maxInventoryPrice={maxInventoryPrice}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredProducts.length ? (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <EmptyState
          title="No encontramos productos"
          description="Ajusta la busqueda o registra una nueva pieza para verla aqui."
          action={
            <button
              type="button"
              onClick={handleCreate}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-[color:var(--ink)] px-4 py-3 text-sm font-semibold text-[color:var(--surface)]"
            >
              <FiPlus className="h-4 w-4" />
              Agregar producto
            </button>
          }
        />
      )}

      {modalOpen ? (
        <ProductModal
          isOpen={modalOpen}
          product={editingProduct}
          onClose={closeProductModal}
          onSave={handleSave}
        />
      ) : null}

      <ProductQuickView
        isOpen={Boolean(quickViewProduct)}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onEdit={(product) => {
          setQuickViewProduct(null)
          handleEdit(product)
        }}
        onStatusChange={handleStatusChange}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Eliminar producto"
        description={`Esta accion eliminara "${deleteTarget?.name}" del inventario local.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
