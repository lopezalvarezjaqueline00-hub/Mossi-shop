import { useMemo } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { ADMINS } from '../data/admins'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase'
import { STORAGE_KEYS } from '../utils/storage'
import { AuthContext } from './AuthContextValue'

const isObjectRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const normalizeUser = (value) =>
  isObjectRecord(value) && value.email
    ? {
        email: String(value.email),
        name: value.name || value.email,
        role: value.role || 'admin',
      }
    : null

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage(STORAGE_KEYS.auth, null)
  const safeUser = useMemo(() => normalizeUser(user), [user])

  const value = useMemo(() => {
    const login = async (email, password) => {
      const normalizedEmail = email.trim().toLowerCase()
      const admin = ADMINS.find(
        (item) => item.email.toLowerCase() === normalizedEmail,
      )

      if (!admin) {
        return false
      }

      if (admin.password === password) {
        setUser({
          email: admin.email,
          name: admin.name,
          role: admin.role,
        })
        return true
      }

      if (isFirebaseConfigured()) {
        try {
          const auth = getFirebaseAuth()
          const credentials = await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password,
          )
          const firebaseEmail = credentials.user.email || email.trim()
          const firebaseAdmin = ADMINS.find(
            (item) => item.email.toLowerCase() === firebaseEmail.toLowerCase(),
          )

          if (!firebaseAdmin) {
            await signOut(auth)
            return false
          }

          setUser({
            email: firebaseEmail,
            name: firebaseAdmin.name,
            role: firebaseAdmin.role,
          })
          return true
        } catch {
          return false
        }
      }

      return false
    }

    const logout = async () => {
      if (isFirebaseConfigured()) {
        const auth = getFirebaseAuth()
        await signOut(auth)
      }

      setUser(null)
    }

    return { user: safeUser, login, logout }
  }, [setUser, safeUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
