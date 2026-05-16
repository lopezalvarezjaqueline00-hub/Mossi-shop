import { useEffect, useMemo } from 'react'
import { defaultSettings } from '../data/defaultSettings'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { STORAGE_KEYS } from '../utils/storage'
import { SettingsContext } from './SettingsContextValue'

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useCloudStorage(
    STORAGE_KEYS.settings,
    defaultSettings,
    'settings',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', Boolean(settings.darkMode))
    document.body.dataset.theme = settings.theme || 'mossi'
    document.title = `${settings.storeName || 'Mossi Shop'} Inventory`
  }, [settings])

  const value = useMemo(() => {
    const updateSettings = (nextSettings) => {
      setSettings((current) => ({ ...current, ...nextSettings }))
    }

    return { settings, updateSettings }
  }, [setSettings, settings])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
