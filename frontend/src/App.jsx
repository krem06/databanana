import { useState } from 'react'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Generate from './pages/Generate'
import Account from './pages/Account'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home />
      case 'gallery': return <Gallery />
      case 'generate': return <Generate />
      case 'account': return <Account />
      default: return <Home />
    }
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">
          <img src="/src/assets/databanana-top.jpg" alt="Data Banana" className="logo" />
          <span>databanana.ai</span>
        </div>
        <div className="nav-links">
          <button onClick={() => setCurrentPage('home')} className={currentPage === 'home' ? 'active' : ''}>Home</button>
          <button onClick={() => setCurrentPage('gallery')} className={currentPage === 'gallery' ? 'active' : ''}>Gallery</button>
          <button onClick={() => setCurrentPage('generate')} className={currentPage === 'generate' ? 'active' : ''}>Generate</button>
          <button onClick={() => setCurrentPage('account')} className={currentPage === 'account' ? 'active' : ''}>Account</button>
          <button className="btn" style={{ marginLeft: '1rem' }}>Login</button>
        </div>
      </nav>
      <main className="main">
        {renderPage()}
      </main>
      <div className="dev-notice" style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        background: 'rgba(14, 165, 233, 0.9)',
        color: 'white',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
        backdropFilter: 'blur(10px)'
      }}>
        Demo Mode - Deploy backend for authentication
      </div>
    </div>
  )
}

export default App
