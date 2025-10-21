import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Mail, Lock, Shield, Key, CheckCircle, AlertCircle, Loader2, UserPlus, LogIn } from 'lucide-react'

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

  const getModeConfig = () => {
    const configs = {
      login: { title: 'Welcome Back', description: 'Sign in to your account', icon: LogIn, color: 'blue' },
      signup: { title: 'Create Account', description: 'Join Data Banana today', icon: UserPlus, color: 'green' },
      confirm: { title: 'Verify Email', description: 'Enter the code sent to your email', icon: Shield, color: 'orange' },
      forgot: { title: 'Forgot Password', description: 'We\'ll send you a reset code', icon: Key, color: 'purple' },
      reset: { title: 'Reset Password', description: 'Create your new password', icon: Lock, color: 'red' }
    }
    return configs[mode] || configs.login
  }

  const config = getModeConfig()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                config.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                config.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                config.color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                config.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                <config.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <CardDescription className="text-base mt-2">{config.description}</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'confirm' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={mode === 'confirm'}
                  className="h-12"
                />
              </div>
            )}

            {mode === 'confirm' && (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Enter the confirmation code sent to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="confirmationCode" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Confirmation Code
                  </Label>
                  <Input
                    id="confirmationCode"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    placeholder="123456"
                    required
                    className="h-12 text-center text-lg font-mono"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <div className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Enter the reset code sent to <strong>{email}</strong> and create a new password
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="resetCode" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Reset Code
                  </Label>
                  <Input
                    id="resetCode"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    placeholder="123456"
                    required
                    className="h-12 text-center text-lg font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                    minLength={6}
                    className="h-12"
                  />
                </div>
              </div>
            )}

            {mode !== 'confirm' && mode !== 'forgot' && mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                  required
                  minLength={6}
                  className="h-12"
                />
              </div>
            )}

            {message && (
              <Alert variant={message.includes('Check your email') || message.includes('confirmed') || message.includes('successfully') ? 'default' : 'destructive'}>
                {message.includes('Check your email') || message.includes('confirmed') || message.includes('successfully') ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <AlertCircle className="h-4 w-4 text-red-600" />
                }
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <config.icon className="h-4 w-4 mr-2" />
                  {mode === 'login' ? 'Sign In' : 
                   mode === 'signup' ? 'Create Account' : 
                   mode === 'confirm' ? 'Verify Email' : 
                   mode === 'forgot' ? 'Send Reset Code' : 
                   'Update Password'}
                </>
              )}
            </Button>
          </form>

          {mode !== 'confirm' && mode !== 'forgot' && mode !== 'reset' && (
            <>
              <Separator className="my-6" />
              <div className="text-center space-y-3">
                {mode === 'login' ? (
                  <>
                    <p className="text-muted-foreground">
                      Don't have an account?{' '}
                      <Button
                        variant="link"
                        onClick={() => setMode('signup')}
                        className="p-0 h-auto font-medium text-primary"
                      >
                        Sign up
                      </Button>
                    </p>
                    <p>
                      <Button
                        variant="link"
                        onClick={() => setMode('forgot')}
                        className="p-0 h-auto text-muted-foreground hover:text-primary"
                      >
                        Forgot password?
                      </Button>
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <Button
                      variant="link"
                      onClick={() => setMode('login')}
                      className="p-0 h-auto font-medium text-primary"
                    >
                      Sign in
                    </Button>
                  </p>
                )}
              </div>
            </>
          )}

          {mode === 'confirm' && (
            <>
              <Separator className="my-6" />
              <div className="text-center">
                <p className="text-muted-foreground">
                  Didn't receive the code?{' '}
                  <Button
                    variant="link"
                    onClick={() => setMode('signup')}
                    className="p-0 h-auto font-medium text-primary"
                  >
                    Try again
                  </Button>
                </p>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <Separator className="my-6" />
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setMode('login')}
                  className="p-0 h-auto text-muted-foreground hover:text-primary"
                >
                  Back to sign in
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}