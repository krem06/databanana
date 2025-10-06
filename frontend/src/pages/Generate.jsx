import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { apiClient } from '../api'

function Generate() {
  const [context, setContext] = useState('')
  const [excludeTags, setExcludeTags] = useState('')
  const [imageCount, setImageCount] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [userCredits, setUserCredits] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const userData = await apiClient.getUser()
      setUserCredits(userData.credits || 0)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const calculateCost = () => {
    // Cost: $0.05 per image
    return (imageCount * 0.05).toFixed(2)
  }

  const canAfford = () => {
    return userCredits >= parseFloat(calculateCost())
  }

  const handleGenerate = async () => {
    if (context.length < 10) {
      alert('Context must be at least 10 characters')
      return
    }

    if (!canAfford()) {
      alert(`Insufficient credits. Need $${calculateCost()} but you have $${userCredits.toFixed(2)}`)
      return
    }

    setGenerating(true)
    try {
      await apiClient.generateBatch(context, excludeTags, imageCount)
      // Refresh user credits after generation
      await fetchUserData()
    } catch (error) {
      console.error('Error generating batch:', error)
      alert('Error generating images. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Generate Batch</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Available Credits: <strong>${userCredits.toFixed(2)}</strong>
        </p>
        
        <div className="form-field">
          <label className="form-label">Context (80 chars max):</label>
          <input 
            type="text" 
            value={context}
            onChange={(e) => setContext(e.target.value.slice(0, 80))}
            placeholder="A realistic scene description..."
            className="input"
            maxLength={80}
          />
          <div className="form-hint">{context.length}/80 characters</div>
        </div>
        
        <div className="form-field">
          <label className="form-label">Exclude tags (comma-separated):</label>
          <input 
            type="text" 
            value={excludeTags}
            onChange={(e) => setExcludeTags(e.target.value)}
            placeholder="cartoon, anime, abstract..."
            className="input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Number of images:</label>
          <input 
            type="number" 
            value={imageCount}
            onChange={(e) => setImageCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), 100))}
            min="1"
            max="100"
            className="input"
          />
          <div className="form-hint">
            Cost: ${calculateCost()} ({canAfford() ? '✓ Can afford' : '✗ Insufficient credits'})
          </div>
        </div>
        
        <button 
          className="btn" 
          onClick={handleGenerate}
          disabled={generating || context.length < 10 || !canAfford()}
        >
          {generating ? 'Generating...' : `Generate ${imageCount} Images ($${calculateCost()})`}
        </button>
        
        {generating && (
          <div style={{ marginTop: '2rem' }}>
            <p>Generating variations...</p>
            <div className="grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div style={{ height: '150px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                  <label>
                    <input type="checkbox" /> Keep this image
                  </label>
                </div>
              ))}
            </div>
            <button className="btn" style={{ marginTop: '1rem' }}>Export Selected</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Generate