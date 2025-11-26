import { useState, useEffect } from 'react'
import { wsUrl } from '@/lib/config'

interface ProgressData {
  progress: number
  message: string
  step: string
  status: string
}

export function useProgress(executionId: string | null) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)

  useEffect(() => {
    if (!executionId) return

    if (wsUrl.includes('your-websocket-api-id')) {
      console.log('WebSocket URL not configured - skipping real-time progress')
      return
    }

    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        ws?.send(JSON.stringify({
          action: 'subscribe',
          execution_id: executionId
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'progress_update' && message.data.execution_id === executionId) {
            const { progress, current_step, message: progressMessage, status } = message.data
            setProgressData({
              progress: progress || 0,
              message: progressMessage || 'Processing...',
              step: current_step || '',
              status: status || 'processing'
            })
          }
        } catch (e) {
          console.error('WebSocket message error:', e)
        }
      }

      ws.onerror = () => {
        console.error('WebSocket connection failed')
      }

    } catch (e) {
      console.error('Failed to create WebSocket:', e)
    }

    return () => {
      ws?.close()
      setProgressData(null)
    }
  }, [executionId])

  return progressData
}