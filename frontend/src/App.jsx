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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, Images, Zap, User } from 'lucide-react'

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
      <nav className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Database className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Data Banana
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Button 
              variant={isActive('/') ? 'default' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link to="/" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Home
              </Link>
            </Button>
            
            <Button 
              variant={isActive('/gallery') ? 'default' : 'ghost'} 
              size="sm" 
              asChild
            >
              <Link to="/gallery" className="flex items-center gap-2">
                <Images className="h-4 w-4" />
                Gallery
              </Link>
            </Button>

            {isAuthenticated && (
              <>
                <Button 
                  variant={isActive('/generate') ? 'default' : 'ghost'} 
                  size="sm" 
                  asChild
                >
                  <Link to="/generate" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Generate
                  </Link>
                </Button>
                
                <Button 
                  variant={isActive('/account') ? 'default' : 'ghost'} 
                  size="sm" 
                  asChild
                >
                  <Link to="/account" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {isOffline && (
              <Badge variant="destructive" className="text-xs">
                Offline
              </Badge>
            )}
            
            {isAuthenticated ? (
              <Badge variant="secondary">
                ${credits}
              </Badge>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} size="sm">
                Sign In
              </Button>
            )}
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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main>
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
