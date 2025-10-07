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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : mode === 'confirm' ? 'Confirm Email' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode !== 'confirm' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
                disabled={mode === 'confirm'}
              />
            </div>
          )}

          {mode === 'confirm' && (
            <div className="mb-4">
              <p className="mb-4 text-gray-600">
                Enter the confirmation code sent to <strong>{email}</strong>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation Code:</label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="input-field"
                required
                placeholder="123456"
              />
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="mb-4">
                <p className="mb-4 text-gray-600">
                  Enter the reset code sent to <strong>{email}</strong> and your new password
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reset Code:</label>
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="input-field"
                  required
                  placeholder="123456"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {mode !== 'confirm' && mode !== 'forgot' && mode !== 'reset' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                minLength={6}
              />
            </div>
          )}

          {message && (
            <p className={`text-sm mb-4 ${
              message.includes('Check your email') || message.includes('confirmed') || message.includes('successfully')
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {message}
            </p>
          )}

          <button 
            type="submit" 
            className={`w-full mb-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading ? 'Loading...' : (mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : mode === 'confirm' ? 'Confirm' : mode === 'forgot' ? 'Send Reset Code' : 'Reset Password')}
          </button>
        </form>

        {mode !== 'confirm' && mode !== 'forgot' && mode !== 'reset' && (
          <div className="text-center text-sm">
            {mode === 'login' ? (
              <>
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:text-blue-700 underline bg-transparent border-none cursor-pointer"
                  >
                    Sign up
                  </button>
                </p>
                <p className="mt-2">
                  <button
                    onClick={() => setMode('forgot')}
                    className="text-blue-600 hover:text-blue-700 underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </p>
              </>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:text-blue-700 underline bg-transparent border-none cursor-pointer"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        )}

        {mode === 'confirm' && (
          <p className="text-center text-sm">
            Didn't receive the code?{' '}
            <button
              onClick={() => setMode('signup')}
              className="text-blue-600 hover:text-blue-700 underline bg-transparent border-none cursor-pointer"
            >
              Try again
            </button>
          </p>
        )}

        {mode === 'forgot' && (
          <p className="text-center text-sm">
            <button
              onClick={() => setMode('login')}
              className="text-blue-600 hover:text-blue-700 underline bg-transparent border-none cursor-pointer"
            >
              Back to login
            </button>
          </p>
        )}
      </div>
    </div>
  )
}