import { useMemo } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { ADMINS } from '../data/admins'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase'
import { STORAGE_KEYS } from '../utils/storage'
import { AuthContext } from './AuthContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage(STORAGE_KEYS.auth, null)

  const value = useMemo(() => {
    const login = async (email, password) => {
      const admin = ADMINS.find(
        (item) =>
          item.email.toLowerCase() === email.trim().toLowerCase(),
      )

      if (isFirebaseConfigured() && !admin) {
        return false
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

      if (!admin || admin.password !== password) {
        return false
      }

      setUser({
        email: admin.email,
        name: admin.name,
        role: admin.role,
      })
      return true
    }

    const logout = async () => {
      if (isFirebaseConfigured()) {
        const auth = getFirebaseAuth()
        await signOut(auth)
      }

      setUser(null)
    }

    return { user, login, logout }
  }, [setUser, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
