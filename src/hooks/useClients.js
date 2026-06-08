import { useContext } from 'react'
import { ClientContext } from '../context/ClientContextValue'

export const useClients = () => {
  const context = useContext(ClientContext)

  if (!context) {
    throw new Error('useClients must be used inside ClientProvider')
  }

  return context
}
