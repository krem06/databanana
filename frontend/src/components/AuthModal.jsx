import { useState } from 'react'
import { useAuth } from '../AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login') // 'login', 'signup', 'confirm', 'forgot', 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { login, signup, confirmEmail, forgotPassword, confirmForgotPassword } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'login') {
        const success = await login(email, password)
        if (success) {
          onClose()
          setEmail('')
          setPassword('')
        }
      } else if (mode === 'signup') {
        await signup(email, password)
        setMessage('Check your email for the confirmation code.')
        setMode('confirm')
      } else if (mode === 'confirm') {
        await confirmEmail(email, confirmationCode)
        setMessage('Account confirmed! You can now login.')
        setMode('login')
        setConfirmationCode('')
      } else if (mode === 'forgot') {
        await forgotPassword(email)
        setMessage('Password reset code sent to your email. Enter the code below.')
        setMode('reset')
      } else if (mode === 'reset') {
        await confirmForgotPassword(email, confirmationCode, newPassword)
        setMessage('Password reset successfully! You can now login.')
        setMode('login')
        setConfirmationCode('')
        setNewPassword('')
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ width: '400px', margin: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>{mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : mode === 'confirm' ? 'Confirm Email' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}</h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode !== 'confirm' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                disabled={mode === 'confirm'}
              />
            </div>
          )}

          {mode === 'confirm' && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                Enter the confirmation code sent to <strong>{email}</strong>
              </p>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirmation Code:</label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="input"
                required
                placeholder="123456"
              />
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                  Enter the reset code sent to <strong>{email}</strong> and your new password
                </p>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Reset Code:</label>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="input"
                  required
                  placeholder="123456"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {mode !== 'confirm' && mode !== 'forgot' && mode !== 'reset' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={6}
              />
            </div>
          )}

          {message && (
            <p style={{ 
              color: message.includes('Check your email') ? '#059669' : '#dc2626',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginBottom: '1rem',
              backgroundColor: loading ? '#64748b' : '#3b82f6'
            }}
          >
            {loading ? 'Loading...' : (mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : mode === 'confirm' ? 'Confirm' : mode === 'forgot' ? 'Send Reset Code' : 'Reset Password')}
          </button>
        </form>

        {mode !== 'confirm' && mode !== 'forgot' && mode !== 'reset' && (
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign up
                </button>
                <br />
                <button
                  onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}
                >
                  Forgot password?
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Login
                </button>
              </>
            )}
          </p>
        )}

        {mode === 'confirm' && (
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Didn't receive the code?{' '}
            <button
              onClick={() => setMode('signup')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Try again
            </button>
          </p>
        )}

        {mode === 'forgot' && (
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <button
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to login
            </button>
          </p>
        )}
      </div>
    </div>
  )
}