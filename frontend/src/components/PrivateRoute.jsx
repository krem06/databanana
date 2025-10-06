import { useAuth } from '../AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location, showLogin: true }} replace />
  }

  return children
}

export default PrivateRoute