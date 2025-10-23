/**
 * Shows WebSocket connection status for real-time updates
 */
function ConnectionStatus({ status, className = "" }) {
  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          icon: '🟢',
          text: 'Live updates active'
        }
      case 'reconnecting':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          icon: '🟡',
          text: 'Reconnecting...'
        }
      case 'error':
        return {
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          icon: '🔴',
          text: 'Connection failed'
        }
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          icon: '⚫',
          text: 'Not connected'
        }
    }
  }

  const statusInfo = getStatusInfo()

  if (status === 'disconnected') return null

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color} ${className}`}>
      <span className="animate-pulse">{statusInfo.icon}</span>
      <span>{statusInfo.text}</span>
    </div>
  )
}

export default ConnectionStatus