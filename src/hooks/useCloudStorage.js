import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import {
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
} from '../services/firebase'
import { safeJsonParse } from '../utils/storage'

const getInitialValue = (initialValue) =>
  typeof initialValue === 'function' ? initialValue() : initialValue

const getStateDoc = (db, cloudKey) =>
  doc(db, 'stores', 'mossi-shop', 'state', cloudKey)

export function useCloudStorage(key, initialValue, cloudKey) {
  const [value, setValue] = useState(() => {
    const fallback = getInitialValue(initialValue)
    return safeJsonParse(localStorage.getItem(key), fallback)
  })
  const lastRemoteValue = useRef(null)
  const cloudReady = useRef(false)

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  useEffect(() => {
    if (!isFirebaseConfigured()) {
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
            const nextValue = snapshot.data().value ?? getInitialValue(initialValue)
            lastRemoteValue.current = JSON.stringify(nextValue)
            setValue(nextValue)
            cloudReady.current = true
            return
          }

          const localValue = safeJsonParse(
            localStorage.getItem(key),
            getInitialValue(initialValue),
          )
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
        },
      )
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
      }
    }
  }, [cloudKey, initialValue, key])

  useEffect(() => {
    if (!isFirebaseConfigured() || !cloudReady.current) {
      return undefined
    }

    const auth = getFirebaseAuth()
    const db = getFirebaseDb()
    const firebaseUser = auth?.currentUser

    if (!db || !firebaseUser) {
      return undefined
    }

    const serializedValue = JSON.stringify(value)

    if (serializedValue === lastRemoteValue.current) {
      return undefined
    }

    const timeout = window.setTimeout(async () => {
      const stateDoc = getStateDoc(db, cloudKey)
      lastRemoteValue.current = serializedValue
      await setDoc(
        stateDoc,
        {
          value,
          updatedAt: serverTimestamp(),
          updatedBy: firebaseUser.email,
        },
        { merge: true },
      )
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [cloudKey, value])

  return [value, setValue]
}
