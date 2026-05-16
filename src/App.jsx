import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import AppLayout from './layouts/AppLayout'
import AnalyticsPage from './pages/AnalyticsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import PaymentsPage from './pages/PaymentsPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import { AuthProvider } from './context/AuthContext'
import { PaymentProvider } from './context/PaymentContext'
import { ProductProvider } from './context/ProductContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './context/ToastContext'
import ToastContainer from './components/ToastContainer'
import { useAuth } from './hooks/useAuth'

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
}

function AuthenticatedApp() {
  const { user } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [createProductRequest, setCreateProductRequest] = useState(null)
  const [createPaymentRequest, setCreatePaymentRequest] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activePage])

  if (!user) {
    return <LoginPage />
  }

  const openCreateProduct = () => {
    setCreateProductRequest(Date.now())
    setActivePage('products')
  }

  const openCreatePayment = () => {
    setCreatePaymentRequest(Date.now())
    setActivePage('payments')
  }

  const renderPage = () => {
    if (activePage === 'analytics') {
      return <AnalyticsPage />
    }

    if (activePage === 'settings') {
      return <SettingsPage />
    }

    if (activePage === 'payments') {
      return (
        <PaymentsPage
          key={createPaymentRequest || 'payments'}
          openCreateOnMount={Boolean(createPaymentRequest)}
          onCreateRequestHandled={() => setCreatePaymentRequest(null)}
        />
      )
    }

    if (activePage === 'products') {
      return (
        <ProductsPage
          key={createProductRequest || 'products'}
          openCreateOnMount={Boolean(createProductRequest)}
          onCreateRequestHandled={() => setCreateProductRequest(null)}
        />
      )
    }

    return (
      <DashboardPage
        onNavigate={setActivePage}
        onCreateProduct={openCreateProduct}
        onCreatePayment={openCreatePayment}
      />
    )
  }

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={setActivePage}
      onCreateProduct={openCreateProduct}
      onCreatePayment={openCreatePayment}
    >
      <AnimatePresence mode="wait">
        <motion.div key={activePage} {...pageMotion}>
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  )
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ToastProvider>
          <ProductProvider>
            <PaymentProvider>
              <AuthenticatedApp />
              <ToastContainer />
            </PaymentProvider>
          </ProductProvider>
        </ToastProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}

export default App
