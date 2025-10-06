import { useState, useEffect } from 'react'
import { fetchAuthSession, updatePassword } from 'aws-amplify/auth'
import { useAuth } from '../AuthContext'
import { awsConfig } from '../config'

function Account() {
  const [credits, setCredits] = useState(0)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('coco')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [processingPayment, setProcessingPayment] = useState(null) // null, 5, 10, or 25
  const [paymentMessage, setPaymentMessage] = useState('')
  
  const { user } = useAuth()

  const userEmail = user?.signInDetails?.loginId || 'Not logged in'

  // Fetch user credits from backend
  const fetchUserCredits = async () => {
    
    try {
      const session = await fetchAuthSession()
      const token = session.tokens.idToken.toString()
      
      const response = await fetch(`${awsConfig.API.REST.databanana.endpoint}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setCredits(userData.credits || 0)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  // Fetch user credits on mount
  useEffect(() => {
    fetchUserCredits()
  }, [])

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

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Get authenticated session
      const session = await fetchAuthSession()
      const token = session.tokens.idToken.toString()
      
      const response = await fetch(`${awsConfig.API.REST.databanana.endpoint}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          format: exportFormat
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Download the export file
        const link = document.createElement('a')
        link.href = data.export_url
        link.download = `databanana_export_${exportFormat}_${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert(`Export completed! Downloaded ${data.image_count} images in ${data.format.toUpperCase()} format.`)
      } else {
        alert(`Export failed: ${data.error}`)
      }
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
      // Get authenticated session
      const session = await fetchAuthSession()
      const token = session.tokens.idToken.toString()
      
      // Call your payment endpoint
      const response = await fetch(`${awsConfig.API.REST.databanana.endpoint}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      })
      
      const data = await response.json()
      
      if (response.ok && data.checkout_url) {
        // Redirect to Stripe Checkout using the URL from the session
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
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2>Account Details</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
            <input 
              type="email" 
              value={userEmail}
              className="input"
              disabled
              style={{ backgroundColor: '#f8fafc', color: '#64748b' }}
            />
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
              Email cannot be changed
            </p>
          </div>
          
          <form onSubmit={handlePasswordUpdate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Current Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                  className="input"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password:</label>
                <input 
                  type="password" 
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  className="input"
                  required
                  minLength={6}
                  style={{
                    borderColor: passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm ? '#dc2626' : undefined
                  }}
                />
                {passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                  <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Passwords do not match
                  </p>
                )}
              </div>
              
              {passwordMessage && (
                <p style={{ 
                  color: passwordMessage.includes('successfully') ? '#059669' : '#dc2626',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}>
                  {passwordMessage}
                </p>
              )}
              
              <button 
                type="submit" 
                className="btn"
                disabled={isUpdatingPassword}
                style={{ 
                  backgroundColor: isUpdatingPassword ? '#64748b' : '#3b82f6',
                  cursor: isUpdatingPassword ? 'not-allowed' : 'pointer'
                }}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
          </form>
        </div>
        
        <div className="card">
          <h2>Credits</h2>
          <p>Current balance: <strong>${credits}</strong></p>
          <p>100 images = $5</p>
          
          {paymentMessage && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              backgroundColor: paymentMessage.includes('successful') ? '#d4edda' : '#f8d7da',
              color: paymentMessage.includes('successful') ? '#155724' : '#721c24',
              border: `1px solid ${paymentMessage.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {paymentMessage}
            </div>
          )}
          
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn" 
              style={{ 
                marginRight: '0.5rem',
                backgroundColor: processingPayment === 5 ? '#64748b' : '#3b82f6',
                cursor: processingPayment === 5 ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handlePayment(5)}
              disabled={processingPayment === 5}
            >
              {processingPayment === 5 ? 'Processing...' : 'Add $5'}
            </button>
            <button 
              className="btn" 
              style={{ 
                marginRight: '0.5rem',
                backgroundColor: processingPayment === 10 ? '#64748b' : '#3b82f6',
                cursor: processingPayment === 10 ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handlePayment(10)}
              disabled={processingPayment === 10}
            >
              {processingPayment === 10 ? 'Processing...' : 'Add $10'}
            </button>
            <button 
              className="btn"
              style={{ 
                backgroundColor: processingPayment === 25 ? '#64748b' : '#3b82f6',
                cursor: processingPayment === 25 ? 'not-allowed' : 'pointer'
              }}
              onClick={() => handlePayment(25)}
              disabled={processingPayment === 25}
            >
              {processingPayment === 25 ? 'Processing...' : 'Add $25'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Export Selected Images</h2>
        <p style={{ marginBottom: '1rem', color: '#64748b' }}>
          Export your selected images with annotations for machine learning training
        </p>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Export Format:</label>
          <select 
            value={exportFormat} 
            onChange={(e) => setExportFormat(e.target.value)}
            className="input"
            style={{ marginBottom: '1rem' }}
          >
            <option value="coco">COCO Format (JSON annotations)</option>
            <option value="yolo">YOLO Format (TXT annotations)</option>
          </select>
        </div>
        
        <button 
          className="btn"
          onClick={handleExport}
          disabled={isExporting}
          style={{ 
            backgroundColor: isExporting ? '#64748b' : '#3b82f6',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {isExporting ? 'Exporting...' : `Export Selected Images (${exportFormat.toUpperCase()})`}
        </button>
        
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
          <p>• COCO format includes JSON annotations with bounding boxes</p>
          <p>• YOLO format includes TXT files with normalized coordinates</p>
          <p>• Only images marked as "selected" will be included</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Generation History</h2>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Context</th>
              <th>Images</th>
              <th>Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-01-15</td>
              <td>Urban street scene</td>
              <td>100</td>
              <td>$5.00</td>
              <td>Completed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Account