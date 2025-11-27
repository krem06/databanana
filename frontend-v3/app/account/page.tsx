"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Download, Calendar, Image, ArrowLeft, Eye, EyeOff, CreditCard, Plus, X, ImageIcon, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"

interface BatchHistory {
  id: string
  date: string
  context: string
  template: string
  imageCount: number
  datasetName: string
}

export default function Account() {
  const { user, logout, isAuthenticated } = useAuth()
  
  const [userInfo, setUserInfo] = useState({
    email: user?.signInDetails?.loginId || "user@example.com"
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  const [balance, setBalance] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [realBatches, setRealBatches] = useState<BatchHistory[]>([])
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')
  
  const handlePayment = async (amount: number) => {
    setProcessingPayment(true)
    setPaymentMessage('')
    
    try {
      const data = await apiClient.createPayment(amount)
      if ((data as any)?.checkout_url) {
        window.location.href = (data as any).checkout_url
      } else {
        setPaymentMessage('Payment setup failed. Please try again.')
      }
    } catch (error: any) {
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
      // Refresh user data
      fetchUserData()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'cancelled') {
      setPaymentMessage('Payment was cancelled.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])
  
  const fetchUserData = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true)
        
        // Fetch user info and credits
        const userData = await apiClient.getUser()
        setBalance((userData as any)?.credits || 0)
        
        if ((userData as any)?.email) {
          setUserInfo({ email: (userData as any).email })
        }
        
        // Fetch batch history and flatten to individual batches
        const batchData = await apiClient.getBatches()
        const flattenedBatches: BatchHistory[] = []
        
        if (Array.isArray(batchData)) {
          batchData.forEach((dataset: any) => {
            if (dataset.batches && Array.isArray(dataset.batches)) {
              dataset.batches.forEach((batch: any) => {
                flattenedBatches.push({
                  id: batch.id,
                  date: batch.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
                  context: batch.context || 'No context',
                  template: batch.template || 'Unknown',
                  imageCount: batch.images?.length || 0,
                  datasetName: dataset.name || 'Unknown Dataset'
                })
              })
            }
          })
        }
        
        setRealBatches(flattenedBatches)
        
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  // Fetch user data when authenticated
  useEffect(() => {
    fetchUserData()
  }, [isAuthenticated])
  
  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const batchHistory = realBatches

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Account</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/gallery">
                <ImageIcon className="h-4 w-4" />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Information</CardTitle>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="text-center text-muted-foreground">
                  Loading user data...
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Remove Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  paymentMessage.includes('successful') 
                    ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                }`}>
                  {paymentMessage}
                </div>
              )}
              
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                <div className="text-3xl font-bold mb-1">${balance.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Available balance</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePayment(5)}
                  disabled={processingPayment}
                >
                  $5
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePayment(10)}
                  disabled={processingPayment}
                >
                  $10
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePayment(20)}
                  disabled={processingPayment}
                >
                  $20
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePayment(50)}
                  disabled={processingPayment}
                >
                  $50
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handlePayment(100)}
                  disabled={processingPayment}
                >
                  $100
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Password */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>
            <Button className="w-full md:w-auto">Update Password</Button>
          </CardContent>
        </Card>

        {/* Generation History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
          </CardHeader>
          <CardContent>
            {batchHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No generations yet. <Link href="/" className="text-primary underline">Start generating!</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {batchHistory.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{batch.context}</h4>
                      <div className="text-sm text-muted-foreground">
                        {batch.template} • {batch.date} • {batch.imageCount} images
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/gallery">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-background rounded-lg p-6 max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-destructive">Remove Account</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">This action cannot be undone. The following will be permanently deleted:</p>
                <div className="space-y-2 pl-4">
                  <p>• All account information and settings</p>
                  <p>• All generation history ({batchHistory.length} batches)</p>
                  <p>• All exclusively owned images and files</p>
                  <p>• Remaining account balance (${balance.toFixed(2)})</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}