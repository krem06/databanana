import { useState } from 'react'

/**
 * Progress indicator component for individual batches
 * Shows real-time progress during generation
 */
function BatchProgressIndicator({ batchId, progress, onComplete, onError }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  if (!progress) return null

  const { status, progress: percentage, current_step, message, image_count } = progress

  // Handle completion
  if (status === 'completed' && onComplete) {
    onComplete(progress)
  }
  
  // Handle errors
  if (status === 'failed' && onError) {
    onError(progress)
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'processing': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getProgressBarColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'processing': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  const steps = [
    { key: 'ValidateAndSetup', label: 'Setup', icon: '🔧' },
    { key: 'GeneratePrompts', label: 'Prompts', icon: '✍️' },
    { key: 'StartImageGeneration', label: 'Generate', icon: '🎨' },
    { key: 'CheckImageStatus', label: 'Processing', icon: '⏳' },
    { key: 'ProcessImages', label: 'Download', icon: '📥' },
    { key: 'LabelImages', label: 'Analysis', icon: '🔍' },
    { key: 'SaveFinalResults', label: 'Save', icon: '💾' }
  ]

  const currentStepIndex = steps.findIndex(step => step.key === current_step)

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'processing' ? 'bg-blue-500 animate-pulse' : status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium text-sm">
            Batch {batchId.slice(-8)} • {status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'Processing'}
          </span>
          {image_count && (
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {image_count} images
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>{message || 'Processing...'}</span>
              <span>{percentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                style={{ width: `${percentage || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Step Timeline */}
          <div className="flex items-center justify-between text-xs">
            {steps.map((step, index) => {
              const isActive = step.key === current_step
              const isCompleted = index < currentStepIndex || status === 'completed'
              const isFailed = status === 'failed' && isActive
              
              return (
                <div key={step.key} className="flex flex-col items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                    isFailed ? 'bg-red-500 text-white' :
                    isActive ? 'bg-blue-500 text-white animate-pulse' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  }`}>
                    {isFailed ? '✗' : isCompleted ? '✓' : step.icon}
                  </div>
                  <span className={`text-xs ${
                    isActive ? 'text-blue-600 dark:text-blue-400 font-medium' :
                    isCompleted ? 'text-green-600 dark:text-green-400' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default BatchProgressIndicator