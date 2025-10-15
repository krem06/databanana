/**
 * Shows WebSocket connection status for real-time updates
 */
function ConnectionStatus({ status, className = "" }) {
  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: '🟢',
          text: 'Live updates active'
        }
      case 'reconnecting':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: '🟡',
          text: 'Reconnecting...'
        }
      case 'error':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: '🔴',
          text: 'Connection failed'
        }
      default:
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
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