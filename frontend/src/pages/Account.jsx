import { useState, useEffect } from 'react'
import { updatePassword } from 'aws-amplify/auth'
import { useAuth } from '../AuthContext'
import { apiClient } from '../api'
import { useSync } from '../hooks/useSync'
import { offlineStorage } from '../utils/offlineStorage'
import { useOffline } from '../hooks/useOffline'
import ImageValidationGallery from '../components/ImageValidationGallery'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Mail, Lock, CreditCard, Download, History, LogOut, Shield, CheckCircle, AlertCircle, Loader2, Database, Wallet, Plus } from 'lucide-react'

function Account() {
  const [credits, setCredits] = useState(0)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [processingPayment, setProcessingPayment] = useState(null) // null, 5, 10, or 25
  const [paymentMessage, setPaymentMessage] = useState('')
  const [datasets, setDatasets] = useState([])
  const [validationState, setValidationState] = useState({ selectedImages: new Set(), rejectedImages: new Set() })
  
  const { user, logout } = useAuth()
  const { isOffline } = useOffline()
  useSync() // Just initialize sync

  const userEmail = user?.signInDetails?.loginId || 'Not logged in'

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fetch user credits from backend
  const fetchUserCredits = async () => {
    try {
      const userData = await apiClient.getUser()
      setCredits(userData.credits || 0)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  // Load datasets 
  const loadDatasets = async () => {
    try {
      // Simple: online = API, offline = cache
      if (isOffline) {
        setDatasets(offlineStorage.getCachedDatasets())
      } else {
        const datasetsData = await apiClient.getBatches()
        offlineStorage.cacheDatasets(datasetsData) // Always cache for offline
        setDatasets(datasetsData)
      }
    } catch (error) {
      console.error('Error loading datasets:', error)
      setDatasets([])
    }
  }

  // Fetch user credits on mount
  useEffect(() => {
    fetchUserCredits()
    loadDatasets()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle payment success/cancel from URL (run once on mount)
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

  const handleDatasetExport = async (dataset, format) => {
    // Get all selected images across all batches in the dataset
    const allSelectedImages = dataset.batches.flatMap(batch => 
      batch.images.filter(img => validationState.selectedImages.has(img.id))
    )
    const exportCost = allSelectedImages.length * 0.10
    
    if (allSelectedImages.length === 0) {
      alert('No images selected in this dataset for export')
      return
    }
    
    const result = confirm(`Export ${allSelectedImages.length} images from "${dataset.name}" dataset in ${format.toUpperCase()} format?\n\nCost: $${exportCost.toFixed(2)}`)
    
    if (!result) return
    
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate download
      const filename = `${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format}_${new Date().toISOString().split('T')[0]}.zip`
      
      alert(`✅ Export Complete!\n\nDataset: ${dataset.name}\nFormat: ${format.toUpperCase()}\nImages: ${allSelectedImages.length}\nDownload: ${filename}\n\nCost: $${exportCost.toFixed(2)} deducted from your account.`)
    } catch (error) {
      alert(`Export error: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

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
    setProcessingPayment(amount)
    try {
      const data = await apiClient.createPayment(amount)
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert('Payment setup failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment error: ' + error.message)
    } finally {
      setProcessingPayment(null)
    }
  }

  return (
    <PageContainer maxWidth="7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground">Manage your profile, security, and billing preferences</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Your profile and security settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input 
                  id="email"
                  type="email" 
                  value={userEmail}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>
              
              <Separator />
          
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Current Password
                  </Label>
                  <Input 
                    id="currentPassword"
                    type="password" 
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                    placeholder="Enter your current password"
                    required
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
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                    placeholder="Create a new secure password"
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm New Password
                  </Label>
                  <Input 
                    id="confirmPassword"
                    type="password" 
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                    className={passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm ? 'border-destructive' : ''}
                  />
                  {passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                    <p className="text-destructive text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )}
                </div>
                
                {passwordMessage && (
                  <Alert variant={passwordMessage.includes('successfully') ? 'default' : 'destructive'}>
                    {passwordMessage.includes('successfully') ? 
                      <CheckCircle className="h-4 w-4 text-primary" /> : 
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    }
                    <AlertDescription>
                      {passwordMessage}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isUpdatingPassword}
                  size="lg"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
          
              <Separator />
              
              <Button 
                onClick={logout}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        
          {/* Credits & Billing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Credits & Billing</CardTitle>
                  <CardDescription>Manage your account balance and payments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-muted rounded-xl">
                <div className="text-3xl font-bold text-primary mb-2">
                  ${credits.toFixed(2)}
                </div>
                <p className="text-muted-foreground">Current Balance</p>
                <Badge variant="outline" className="mt-2">
                  100 images = $5
                </Badge>
              </div>
              
              {paymentMessage && (
                <Alert variant={paymentMessage.includes('successful') ? 'default' : 'destructive'}>
                  {paymentMessage.includes('successful') ? 
                    <CheckCircle className="h-4 w-4 text-primary" /> : 
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  }
                  <AlertDescription>
                    {paymentMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Add Credits
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => handlePayment(5)}
                    disabled={processingPayment === 5}
                    className="h-12 flex-col space-y-1"
                  >
                    {processingPayment === 5 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="font-semibold">$5</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handlePayment(10)}
                    disabled={processingPayment === 10}
                    className="h-12 flex-col space-y-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {processingPayment === 10 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="font-semibold">$10</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handlePayment(25)}
                    disabled={processingPayment === 25}
                    className="h-12 flex-col space-y-1"
                  >
                    {processingPayment === 25 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="font-semibold">$25</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
      
        {/* Export Datasets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Export Datasets</CardTitle>
                <CardDescription>Export your curated datasets in standard machine learning formats</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
        
            {datasets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No datasets available for export. Generate some images first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {datasets.map((dataset) => {
                  const totalSelectedInDataset = dataset.batches.reduce((sum, batch) => 
                    sum + batch.images.filter(img => validationState.selectedImages.has(img.id)).length, 0)
                  const exportCost = totalSelectedInDataset * 0.10
                  
                  return (
                    <Card key={dataset.id} className="border-2 border-muted hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                              <Database className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{dataset.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{dataset.batches.length} batches</span>
                                <Badge variant="outline" className="text-xs">
                                  {totalSelectedInDataset} selected
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  ${exportCost.toFixed(2)} cost
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {formatDate(new Date(dataset.created_at))}
                          </Badge>
                        </div>
                        
                        {totalSelectedInDataset === 0 ? (
                          <p className="text-sm text-muted-foreground italic bg-muted p-3 rounded-lg">
                            No images selected for export - use the validation gallery below to select images
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleDatasetExport(dataset, 'coco')}
                              disabled={isExporting}
                              className="h-10"
                            >
                              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'COCO'}
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleDatasetExport(dataset, 'yolo')}
                              disabled={isExporting}
                              className="h-10"
                            >
                              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'YOLO'}
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleDatasetExport(dataset, 'pascal')}
                              disabled={isExporting}
                              className="h-10"
                            >
                              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pascal VOC'}
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleDatasetExport(dataset, 'csv')}
                              disabled={isExporting}
                              className="h-10"
                            >
                              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CSV'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
        
            <Card className="mt-6 bg-muted/50">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Formats
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">COCO</Badge>
                    <span className="text-muted-foreground">JSON format with bounding boxes and metadata</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">YOLO</Badge>
                    <span className="text-muted-foreground">TXT files with normalized coordinates</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">Pascal</Badge>
                    <span className="text-muted-foreground">XML annotations with image metadata</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">CSV</Badge>
                    <span className="text-muted-foreground">Simple tabular format with image paths and labels</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Generation History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <History className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Generation History</CardTitle>
                  <CardDescription>Review and validate your generated images</CardDescription>
                </div>
              </div>
              {datasets.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  💡 Click images to select • Shift+Click to reject
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ImageValidationGallery
              datasets={datasets}
              showDatasetHeaders={true}
              onSelectionChange={setValidationState}
            />
          </CardContent>
        </Card>
    </PageContainer>
  )
}

export default Account