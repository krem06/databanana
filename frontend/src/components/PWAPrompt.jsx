import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA installed')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-sm">Install Data Banana</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Install as app for better offline experience and faster access
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleInstall}
              size="sm"
              className="text-xs h-7 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="text-xs h-7"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWAPrompt