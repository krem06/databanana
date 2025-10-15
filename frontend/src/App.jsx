import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ThemeProvider } from './ThemeContext'
import AuthModal from './components/AuthModal'
import PrivateRoute from './components/PrivateRoute'
import ThemeToggle from './components/ThemeToggle'
import PWAPrompt from './components/PWAPrompt'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Generate from './pages/Generate'
import Account from './pages/Account'
import { apiClient } from './api'
import { useOffline } from './hooks/useOffline'

function Navigation() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [credits, setCredits] = useState(0)
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const { isOffline } = useOffline()

  // Auto-show login modal when redirected from private route
  useEffect(() => {
    if (location.state?.showLogin) {
      setShowAuthModal(true)
    }
  }, [location])

  // Fetch user credits when authenticated
  useEffect(() => {
    const fetchCredits = async () => {
      if (isAuthenticated) {
        try {
          const userData = await apiClient.getUser()
          setCredits(userData.credits || 0)
        } catch (error) {
          console.error('Failed to fetch credits:', error)
        }
      } else {
        setCredits(0)
      }
    }
    
    fetchCredits()
  }, [isAuthenticated])

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className="nav-light border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/src/assets/databanana-top.jpg" alt="Data Banana" className="w-8 h-8 rounded" />
            <span className="text-xl font-semibold text-manual">databanana.ai</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${isActive('/') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Home</Link>
            <Link to="/gallery" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${isActive('/gallery') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Gallery</Link>
            {isAuthenticated && (
              <>
                <Link to="/generate" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${isActive('/generate') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Generate</Link>
                <Link to="/account" className={`text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${isActive('/account') ? 'text-blue-600 dark:text-blue-400' : ''}`}>Account</Link>
              </>
            )}
            
            <ThemeToggle />
            
            <div className="flex items-center gap-3">
              {isOffline && (
                <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Offline
                </div>
              )}
              {isAuthenticated ? (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Credits: <span className="font-medium text-green-600 dark:text-green-400">${credits}</span>
                </div>
              ) : (
                <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>


      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}

function AppContent() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/generate" element={<PrivateRoute><Generate /></PrivateRoute>} />
          <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
          <PWAPrompt />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
