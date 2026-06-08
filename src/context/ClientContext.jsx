import { useMemo } from 'react'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { generateId, STORAGE_KEYS } from '../utils/storage'
import { ClientContext } from './ClientContextValue'

const ensureClientList = (clients) =>
  Array.isArray(clients)
    ? clients.filter(
        (client) =>
          client && typeof client === 'object' && !Array.isArray(client),
      )
    : []

const normalizeClient = (client = {}, fallbackId) => {
  const safeClient =
    client && typeof client === 'object' && !Array.isArray(client)
      ? client
      : {}
  const id = safeClient.id || fallbackId || generateId()

  return {
    ...safeClient,
    id,
    name: String(safeClient.name || 'Clienta sin nombre').trim(),
    phone: safeClient.phone || '',
    notes: safeClient.notes || '',
    createdAt: safeClient.createdAt || new Date().toISOString(),
  }
}

export function ClientProvider({ children }) {
  const [clients, setClients] = useCloudStorage(
    STORAGE_KEYS.clients,
    [],
    'clients',
  )

  const value = useMemo(() => {
    const addClient = (client) => {
      const nextClient = normalizeClient({
        ...(client && typeof client === 'object' ? client : {}),
        id: client?.id || generateId(),
        createdAt: client?.createdAt || new Date().toISOString(),
      })

      setClients((current) => [nextClient, ...ensureClientList(current)])
      return nextClient
    }

    const updateClient = (id, updates) => {
      setClients((current) =>
        ensureClientList(current).map((client) =>
          client.id === id
            ? normalizeClient({ ...client, ...updates, id })
            : client,
        ),
      )
    }

    const deleteClient = (id) => {
      setClients((current) =>
        ensureClientList(current).filter((client) => client.id !== id),
      )
    }

    const safeClients = ensureClientList(clients).map((client, index) =>
      normalizeClient(client, `client-${index}`),
    )

    return {
      clients: safeClients,
      addClient,
      updateClient,
      deleteClient,
      restoreClient: addClient,
    }
  }, [clients, setClients])

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  )
}
