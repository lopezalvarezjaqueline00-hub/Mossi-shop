export const STORAGE_KEYS = {
  auth: 'mossi-shop:auth',
  products: 'mossi-shop:products',
  payments: 'mossi-shop:payments',
  clients: 'mossi-shop:clients',
  sales: 'mossi-shop:sales',
  movements: 'mossi-shop:movements',
  deletedItems: 'mossi-shop:deleted-items',
  settings: 'mossi-shop:settings',
}

export const generateId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID()
  }

  return `mossi-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}
