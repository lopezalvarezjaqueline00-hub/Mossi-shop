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

const getRecordKey = (item) => item?.id || JSON.stringify(item)

const mergeStoredValues = (remoteValue, pendingValue, fallbackValue, baseValue) => {
  if (Array.isArray(fallbackValue)) {
    const remoteList = normalizeStoredValue(remoteValue, [])
    const pendingList = normalizeStoredValue(pendingValue, [])
    const baseList = normalizeStoredValue(baseValue, [])
    const pendingKeys = new Set(pendingList.map(getRecordKey))
    const deletedKeys = new Set(
      baseList
        .map(getRecordKey)
        .filter((key) => key && !pendingKeys.has(key)),
    )
    const seenKeys = new Set()

    return [...pendingList, ...remoteList].filter((item) => {
      const key = getRecordKey(item)

      if (!key || seenKeys.has(key) || deletedKeys.has(key)) {
        return false
      }

      seenKeys.add(key)
      return true
    })
  }

  if (isObjectRecord(fallbackValue)) {
    return {
      ...normalizeStoredValue(remoteValue, fallbackValue),
      ...normalizeStoredValue(pendingValue, fallbackValue),
    }
  }

  return normalizeStoredValue(pendingValue, fallbackValue)
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

const formatCloudError = (error) => {
  if (!error) {
    return 'Error desconocido'
  }

  if (typeof error === 'string') {
    return error
  }

  return [
    error.message,
    error.code ? `codigo: ${error.code}` : '',
    error.details ? `detalles: ${error.details}` : '',
    error.hint ? `hint: ${error.hint}` : '',
  ]
    .filter(Boolean)
    .join(' | ')
}

const logCloudError = (label, error) => {
  console.error(label, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    error,
  })
}

const getLocalValue = (key, fallbackValue) =>
  normalizeStoredValue(safeJsonParse(localStorage.getItem(key), fallbackValue), fallbackValue)

export function useCloudStorage(key, initialValue, cloudKey) {
  const fallbackValue = useMemo(() => getInitialValue(initialValue), [initialValue])
  const initialLocalValue = useMemo(
    () => getLocalValue(key, fallbackValue),
    [fallbackValue, key],
  )
  const [value, setValue] = useState(initialLocalValue)
  const initialLocalValueRef = useRef(initialLocalValue)
  const lastRemoteValue = useRef(null)
  const cloudReady = useRef(false)
  const pendingLocalValue = useRef(null)

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
        const safeResolvedValue = normalizeStoredValue(
          resolvedValue,
          safeCurrent,
        )

        if (!cloudReady.current) {
          pendingLocalValue.current = safeResolvedValue
        }

        return safeResolvedValue
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
          logCloudError(`Supabase sync failed for ${cloudKey}`, error)
          notifyStorageError(cloudKey, formatCloudError(error))
          return
        }

        if (data) {
          const remoteFallback = Array.isArray(fallbackValue)
            ? []
            : localValue
          const nextValue =
            pendingLocalValue.current === null
              ? normalizeStoredValue(data.value, remoteFallback)
              : mergeStoredValues(
                  data.value,
                  pendingLocalValue.current,
                  fallbackValue,
                  initialLocalValueRef.current,
                )
          lastRemoteValue.current = JSON.stringify(data.value)
          setValue(nextValue)
          cloudReady.current = true

          if (pendingLocalValue.current !== null) {
            pendingLocalValue.current = null
            const { data: savedData, error: pendingWriteError } = await supabase
              .from(SUPABASE_STATE_TABLE)
              .upsert({
                key: cloudKey,
                value: nextValue,
                updated_at: new Date().toISOString(),
              })
              .select('value')
              .single()

            if (pendingWriteError) {
              logCloudError(
                `Supabase pending write failed for ${cloudKey}`,
                pendingWriteError,
              )
              notifyStorageError(cloudKey, formatCloudError(pendingWriteError))
              return
            }

            lastRemoteValue.current = JSON.stringify(
              normalizeStoredValue(
                savedData?.value ?? nextValue,
                Array.isArray(fallbackValue) ? [] : nextValue,
              ),
            )
          }

          return
        }

        const nextLocalValue =
          pendingLocalValue.current === null
            ? localValue
            : normalizeStoredValue(pendingLocalValue.current, localValue)
        const serializedLocalValue = JSON.stringify(nextLocalValue)
        lastRemoteValue.current = serializedLocalValue
        cloudReady.current = true
        pendingLocalValue.current = null

        const { error: upsertError } = await supabase
          .from(SUPABASE_STATE_TABLE)
          .upsert({
            key: cloudKey,
            value: nextLocalValue,
            updated_at: new Date().toISOString(),
          })
          .select('value')
          .single()

        if (upsertError) {
          logCloudError(`Supabase initial write failed for ${cloudKey}`, upsertError)
          notifyStorageError(cloudKey, formatCloudError(upsertError))
        }
      } catch (error) {
        logCloudError(`Supabase sync crashed for ${cloudKey}`, error)
        notifyStorageError(cloudKey, formatCloudError(error))
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
          logCloudError(`Cloud sync disabled for ${cloudKey}`, error)
          notifyStorageError(cloudKey, formatCloudError(error))
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
            logCloudError(`Supabase write failed for ${cloudKey}`, error)
            notifyStorageError(cloudKey, formatCloudError(error))
            return
          }

          const savedValue = normalizeStoredValue(
            data?.value ?? normalizedValue,
            Array.isArray(fallbackValue) ? [] : normalizedValue,
          )
          lastRemoteValue.current = JSON.stringify(savedValue)
          pendingLocalValue.current = null
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
        logCloudError(`Cloud write crashed for ${cloudKey}`, error)
        notifyStorageError(cloudKey, formatCloudError(error))
      }
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [cloudKey, fallbackValue, normalizedValue])

  return [normalizedValue, setSafeValue]
}
