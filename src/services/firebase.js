import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

let firebaseApp
let firestoreDb
let firebaseAuth

export const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  )

export const getFirebaseApp = () => {
  if (!isFirebaseConfigured()) {
    return null
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig)
  }

  return firebaseApp
}

export const getFirebaseDb = () => {
  const app = getFirebaseApp()

  if (!app) {
    return null
  }

  if (!firestoreDb) {
    firestoreDb = getFirestore(app)
  }

  return firestoreDb
}

export const getFirebaseAuth = () => {
  const app = getFirebaseApp()

  if (!app) {
    return null
  }

  if (!firebaseAuth) {
    firebaseAuth = getAuth(app)
  }

  return firebaseAuth
}
