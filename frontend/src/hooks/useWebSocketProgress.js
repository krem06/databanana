import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for tracking image generation progress via WebSocket
 * Integrates with existing batch system
 */
export function useWebSocketProgress() {
  const [progressData, setProgressData] = useState(new Map())
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const wsRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const subscribedBatchesRef = useRef(new Set())
  const maxReconnectAttempts = 5
  
  // Get WebSocket URL from environment
  const wsUrl = import.meta.env.VITE_WS_URL || 'wss://your-websocket-api.execute-api.region.amazonaws.com/prod'

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to WebSocket:', wsUrl)
        wsRef.current = new WebSocket(wsUrl)
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected for progress tracking')
          setConnectionStatus('connected')
          reconnectAttemptsRef.current = 0
          
          // Re-subscribe to all tracked executions
          subscribedBatchesRef.current.forEach(executionId => {
            wsRef.current.send(JSON.stringify({
              action: 'subscribe',
              execution_id: executionId
            }))
          })
          
          resolve()
        }
        
        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            console.log('WebSocket message received:', message)
            
            if (message.type === 'progress_update') {
              const { execution_id, ...progressInfo } = message.data
              if (execution_id) {
                setProgressData(prev => {
                  const newMap = new Map(prev)
                  newMap.set(execution_id, {
                    ...progressInfo,
                    lastUpdate: Date.now()
                  })
                  return newMap
                })
              }
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
        
        wsRef.current.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          setConnectionStatus('disconnected')
          
          // Auto-reconnect if not intentionally closed and we have executions to track
          if (event.code !== 1000 && subscribedBatchesRef.current.size > 0 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            setConnectionStatus('reconnecting')
            setTimeout(() => {
              reconnectAttemptsRef.current++
              connect().catch(console.error)
            }, 2000 * reconnectAttemptsRef.current)
          }
        }
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
          setConnectionStatus('error')
          reject(error)
        }
        
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        setConnectionStatus('error')
        reject(error)
      }
    })
  }, [wsUrl])

  const trackBatch = useCallback(async (executionId) => {
    if (!executionId) return
    
    console.log('Starting to track execution:', executionId)
    subscribedBatchesRef.current.add(executionId)
    
    try {
      await connect()
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          action: 'subscribe',
          execution_id: executionId
        }))
        
        // Initialize progress data for this execution
        setProgressData(prev => {
          const newMap = new Map(prev)
          newMap.set(executionId, {
            status: 'processing',
            progress: 0,
            current_step: 'ValidateAndSetup',
            message: 'Initializing generation...',
            lastUpdate: Date.now()
          })
          return newMap
        })
        
        console.log(`Now tracking progress for execution ${executionId}`)
      }
    } catch (error) {
      console.error('Failed to track execution:', error)
    }
  }, [connect])

  const stopTracking = useCallback((executionId) => {
    console.log('Stopping tracking for execution:', executionId)
    subscribedBatchesRef.current.delete(executionId)
    
    setProgressData(prev => {
      const newMap = new Map(prev)
      newMap.delete(executionId)
      return newMap
    })
    
    // If no more executions to track, close connection
    if (subscribedBatchesRef.current.size === 0) {
      disconnect()
    }
  }, [])

  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket')
    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect')
      wsRef.current = null
    }
    setConnectionStatus('disconnected')
    subscribedBatchesRef.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    progressData,
    connectionStatus,
    trackBatch,
    stopTracking,
    disconnect,
    connect
  }
}