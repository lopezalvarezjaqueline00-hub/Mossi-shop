import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from '../services/firebase'
import {
  getSupabaseClient,
  isSupabaseConfigured,
  SUPABASE_STATE_TABLE,
} from '../services/supabase'
import { safeJsonParse } from '../utils/storage'

const getInitialValue = (initialValue) =>
  typeof initialValue === 'function' ? initialValue() : initialValue

const getStateDoc = (db, cloudKey) =>
  doc(db, 'stores', 'mossi-shop', 'state', cloudKey)

const isObjectRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const normalizeStoredValue = (nextValue, fallbackValue) => {
  if (Array.isArray(fallbackValue)) {
    return Array.isArray(nextValue)
      ? nextValue.filter((item) => isObjectRecord(item))
      : fallbackValue
  }

  if (isObjectRecord(fallbackValue)) {
    return isObjectRecord(nextValue) ? nextValue : fallbackValue
  }

  return nextValue ?? fallbackValue
}

const notifyStorageError = (cloudKey, message) => {
  window.dispatchEvent(
    new CustomEvent('mossi-storage-error', {
      detail: {
        message: `No se pudo guardar ${cloudKey} en Supabase: ${message}`,
      },
    }),
  )
}

const getLocalValue = (key, fallbackValue) =>
  normalizeStoredValue(safeJsonParse(localStorage.getItem(key), fallbackValue), fallbackValue)

export function useCloudStorage(key, initialValue, cloudKey) {
  const [value, setValue] = useState(() => {
    const fallback = getInitialValue(initialValue)
    return getLocalValue(key, fallback)
  })
  const lastRemoteValue = useRef(null)
  const cloudReady = useRef(false)

  const fallbackValue = useMemo(() => getInitialValue(initialValue), [initialValue])
  const normalizedValue = useMemo(
    () => normalizeStoredValue(value, fallbackValue),
    [fallbackValue, value],
  )

  const setSafeValue = useCallback(
    (nextValue) => {
      setValue((current) => {
        const safeCurrent = normalizeStoredValue(current, fallbackValue)
        const resolvedValue =
          typeof nextValue === 'function' ? nextValue(safeCurrent) : nextValue

        return normalizeStoredValue(resolvedValue, safeCurrent)
      })
    },
    [fallbackValue],
  )

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(normalizedValue))
  }, [key, normalizedValue])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return undefined
    }

    const supabase = getSupabaseClient()

    if (!supabase) {
      return undefined
    }

    let isMounted = true
    cloudReady.current = false

    const syncInitialValue = async () => {
      try {
        const localValue = getLocalValue(key, fallbackValue)

        const { data, error } = await supabase
          .from(SUPABASE_STATE_TABLE)
          .select('value')
          .eq('key', cloudKey)
          .maybeSingle()

        if (!isMounted) {
          return
        }

        if (error) {
          console.warn(`Supabase sync disabled for ${cloudKey}:`, error.message)
          notifyStorageError(cloudKey, error.message)
          return
        }

        if (data) {
          const remoteFallback = Array.isArray(fallbackValue)
            ? []
            : localValue
          const nextValue = normalizeStoredValue(data.value, remoteFallback)
          lastRemoteValue.current = JSON.stringify(data.value)
          setValue(nextValue)
          cloudReady.current = true
          return
        }

        const serializedLocalValue = JSON.stringify(localValue)
        lastRemoteValue.current = serializedLocalValue
        cloudReady.current = true

        const { error: upsertError } = await supabase
          .from(SUPABASE_STATE_TABLE)
          .upsert({
            key: cloudKey,
            value: localValue,
            updated_at: new Date().toISOString(),
          })
          .select('value')
          .single()

        if (upsertError) {
          console.warn(
            `Supabase sync disabled for ${cloudKey}:`,
            upsertError.message,
          )
          notifyStorageError(cloudKey, upsertError.message)
        }
      } catch (error) {
        console.error(`Supabase sync crashed for ${cloudKey}:`, error)
        notifyStorageError(cloudKey, error.message || 'Error desconocido')
      }
    }

    syncInitialValue()

    const channel = supabase
      .channel(`mossi-state-${cloudKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: SUPABASE_STATE_TABLE,
          filter: `key=eq.${cloudKey}`,
        },
        (payload) => {
          const nextValue = payload.new?.value

          if (nextValue === undefined) {
            return
          }

          setValue((current) => {
            const fallback = normalizeStoredValue(current, fallbackValue)
            const remoteFallback = Array.isArray(fallbackValue) ? [] : fallback
            const safeNextValue = normalizeStoredValue(nextValue, remoteFallback)
            lastRemoteValue.current = JSON.stringify(nextValue)
            return safeNextValue
          })
          cloudReady.current = true
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [cloudKey, fallbackValue, key])

  useEffect(() => {
    if (isSupabaseConfigured() || !isFirebaseConfigured()) {
      return undefined
    }

    const auth = getFirebaseAuth()
    const db = getFirebaseDb()

    if (!auth || !db) {
      return undefined
    }

    let unsubscribeSnapshot = null

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
        unsubscribeSnapshot = null
      }

      cloudReady.current = false

      if (!firebaseUser) {
        return
      }

      const stateDoc = getStateDoc(db, cloudKey)

      unsubscribeSnapshot = onSnapshot(
        stateDoc,
        async (snapshot) => {
          if (snapshot.exists()) {
            const nextValue = normalizeStoredValue(
              snapshot.data().value,
              fallbackValue,
            )
            lastRemoteValue.current = JSON.stringify(nextValue)
            setValue(nextValue)
            cloudReady.current = true
            return
          }

          const localValue = getLocalValue(key, fallbackValue)
          lastRemoteValue.current = JSON.stringify(localValue)
          cloudReady.current = true
          await setDoc(stateDoc, {
            value: localValue,
            updatedAt: serverTimestamp(),
            updatedBy: firebaseUser.email,
          })
        },
        (error) => {
          console.warn(`Cloud sync disabled for ${cloudKey}:`, error.message)
          notifyStorageError(cloudKey, error.message)
        },
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
      }
    }
  }, [cloudKey, fallbackValue, key])

  useEffect(() => {
    if (!cloudReady.current) {
      return undefined
    }

    const serializedValue = JSON.stringify(normalizedValue)

    if (serializedValue === lastRemoteValue.current) {
      return undefined
    }

    const timeout = window.setTimeout(async () => {
      try {
        if (isSupabaseConfigured()) {
          const supabase = getSupabaseClient()

          if (!supabase) {
            return
          }

          const { data, error } = await supabase
            .from(SUPABASE_STATE_TABLE)
            .upsert({
              key: cloudKey,
              value: normalizedValue,
              updated_at: new Date().toISOString(),
            })
            .select('value')
            .single()

          if (error) {
            console.warn(`Supabase write failed for ${cloudKey}:`, error.message)
            notifyStorageError(cloudKey, error.message)
            return
          }

          const savedValue = normalizeStoredValue(
            data?.value ?? normalizedValue,
            Array.isArray(fallbackValue) ? [] : normalizedValue,
          )
          lastRemoteValue.current = JSON.stringify(savedValue)
          return
        }

        const auth = getFirebaseAuth()
        const db = getFirebaseDb()
        const firebaseUser = auth?.currentUser

        if (!db || !firebaseUser) {
          return
        }

        const stateDoc = getStateDoc(db, cloudKey)
        await setDoc(
          stateDoc,
          {
            value: normalizedValue,
            updatedAt: serverTimestamp(),
            updatedBy: firebaseUser.email,
          },
          { merge: true },
        )
        lastRemoteValue.current = serializedValue
      } catch (error) {
        console.error(`Cloud write crashed for ${cloudKey}:`, error)
        notifyStorageError(cloudKey, error.message || 'Error desconocido')
      }
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [cloudKey, fallbackValue, normalizedValue])

  return [normalizedValue, setSafeValue]
}
