import { useEffect, useMemo } from 'react'
import { defaultSettings } from '../data/defaultSettings'
import { useCloudStorage } from '../hooks/useCloudStorage'
import { STORAGE_KEYS } from '../utils/storage'
import { SettingsContext } from './SettingsContextValue'

const isObjectRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const normalizeSettings = (value) => ({
  ...defaultSettings,
  ...(isObjectRecord(value) ? value : {}),
})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useCloudStorage(
    STORAGE_KEYS.settings,
    defaultSettings,
    'settings',
  )
  const safeSettings = useMemo(() => normalizeSettings(settings), [settings])

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      Boolean(safeSettings.darkMode),
    )
    document.body.dataset.theme = safeSettings.theme || 'mossi'
    document.title = `${safeSettings.storeName || 'Mossi Shop'} Inventory`
  }, [safeSettings])

  const value = useMemo(() => {
    const updateSettings = (nextSettings) => {
      setSettings((current) => ({
        ...normalizeSettings(current),
        ...(isObjectRecord(nextSettings) ? nextSettings : {}),
      }))
    }

    return { settings: safeSettings, updateSettings }
  }, [setSettings, safeSettings])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
