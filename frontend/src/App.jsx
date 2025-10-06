import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import AuthModal from './components/AuthModal'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Generate from './pages/Generate'
import Account from './pages/Account'
import './App.css'

function Navigation() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()

  // Auto-show login modal when redirected from private route
  useEffect(() => {
    if (location.state?.showLogin) {
      setShowAuthModal(true)
    }
  }, [location])

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav className="nav">
        <div className="nav-brand">
          <img src="/src/assets/databanana-top.jpg" alt="Data Banana" className="logo" />
          <span>databanana.ai</span>
        </div>
        <div className="nav-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
          <Link to="/gallery" className={isActive('/gallery') ? 'active' : ''}>Gallery</Link>
          {isAuthenticated && (
            <>
              <Link to="/generate" className={isActive('/generate') ? 'active' : ''}>Generate</Link>
              <Link to="/account" className={isActive('/account') ? 'active' : ''}>Account</Link>
            </>
          )}
          
          {isAuthenticated ? (
            <button className="btn" style={{ marginLeft: '1rem' }} onClick={logout}>
              Logout
            </button>
          ) : (
            <button className="btn" style={{ marginLeft: '1rem' }} onClick={() => setShowAuthModal(true)}>
              Login
            </button>
          )}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading...
      </div>
    )
  }

  return (
    <div className="app">
      <Navigation />
      
      <main className="main">
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
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
