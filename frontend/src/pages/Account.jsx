import { useState, useEffect } from 'react'
import { updatePassword } from 'aws-amplify/auth'
import { useAuth } from '../AuthContext'
import { apiClient } from '../api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Lock, LogOut, Loader2, CreditCard } from 'lucide-react'

function Account() {
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [credits, setCredits] = useState(0)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')
  
  const { user, logout } = useAuth()
  const userEmail = user?.signInDetails?.loginId || 'Not logged in'

  // Fetch user credits
  const fetchUserCredits = async () => {
    try {
      const userData = await apiClient.getUser()
      setCredits(userData.credits || 0)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  useEffect(() => {
    fetchUserCredits()
  }, [])

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordMessage('')

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordMessage('New passwords do not match')
      setIsUpdatingPassword(false)
      return
    }

    try {
      await updatePassword({ oldPassword: passwordForm.current, newPassword: passwordForm.new })
      setPasswordMessage('Password updated successfully!')
      setPasswordForm({ current: '', new: '', confirm: '' })
    } catch (error) {
      setPasswordMessage(error.message || 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handlePayment = async (amount) => {
    setProcessingPayment(true)
    setPaymentMessage('')
    
    try {
      const data = await apiClient.createPayment(amount)
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setPaymentMessage('Payment setup failed. Please try again.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentMessage('Payment error: ' + error.message)
    } finally {
      setProcessingPayment(false)
    }
  }

  // Handle payment success/cancel from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    
    if (paymentStatus === 'success') {
      setPaymentMessage('Payment successful! Your credits have been updated.')
      fetchUserCredits()
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setPaymentMessage(''), 5000)
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage('Payment was cancelled.')
      setTimeout(() => setPaymentMessage(''), 5000)
    }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Account
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your account settings and security.
          </p>
        </div>

        {/* Account Details */}
        <Card className="mb-8">
          <CardContent className="pt-6 space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                type="email" 
                value={userEmail}
                disabled
                className="bg-muted"
              />
            </div>
            
            {/* Password Update */}
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword"
                  type="password" 
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                  placeholder="Enter current password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword"
                  type="password" 
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword"
                  type="password" 
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className={passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm ? 'border-red-500' : ''}
                />
                {passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                  <p className="text-red-500 text-sm">
                    Passwords do not match
                  </p>
                )}
              </div>
              
              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  passwordMessage.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {passwordMessage}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
            
            {/* Sign Out */}
            <Button 
              onClick={logout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Credits & Payment */}
        <Card className="mb-8">
          <CardContent className="pt-6 space-y-6">
            {/* Current Balance */}
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">
                ${credits.toFixed(2)}
              </div>
              <p className="text-muted-foreground">Current Balance</p>
              <p className="text-xs text-muted-foreground mt-1">
                $0.10 per standard image • $0.20 per exclusive image
              </p>
            </div>

            {/* Payment Message */}
            {paymentMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                paymentMessage.includes('successful') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {paymentMessage}
              </div>
            )}

            {/* Add Credits */}
            <div className="space-y-4">
              <Label>Add Credits</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline"
                  onClick={() => handlePayment(5)}
                  disabled={processingPayment}
                  className="h-16 flex-col"
                >
                  {processingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mb-1" />
                      <span className="font-semibold">$5.00</span>
                      <span className="text-xs text-muted-foreground">50 images</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handlePayment(10)}
                  disabled={processingPayment}
                  className="h-16 flex-col border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {processingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mb-1" />
                      <span className="font-semibold">$10.00</span>
                      <span className="text-xs text-muted-foreground">100 images</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handlePayment(25)}
                  disabled={processingPayment}
                  className="h-16 flex-col"
                >
                  {processingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mb-1" />
                      <span className="font-semibold">$25.00</span>
                      <span className="text-xs text-muted-foreground">250 images</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default Account