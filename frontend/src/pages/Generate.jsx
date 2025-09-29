import { useState } from 'react'

function Generate() {
  const [context, setContext] = useState('')
  const [excludeTags, setExcludeTags] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = () => {
    if (context.length < 10) {
      alert('Context must be at least 10 characters')
      return
    }
    setGenerating(true)
    // TODO: Call API
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Generate Batch</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Context (80 chars max):</label>
          <input 
            type="text" 
            value={context}
            onChange={(e) => setContext(e.target.value.slice(0, 80))}
            placeholder="A realistic scene description..."
            className="input"
            maxLength={80}
          />
          <small>{context.length}/80 characters</small>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Exclude tags (comma-separated):</label>
          <input 
            type="text" 
            value={excludeTags}
            onChange={(e) => setExcludeTags(e.target.value)}
            placeholder="cartoon, anime, abstract..."
            className="input"
          />
        </div>
        
        <button 
          className="btn" 
          onClick={handleGenerate}
          disabled={generating || context.length < 10}
        >
          {generating ? 'Generating...' : 'Generate 100 Images ($5)'}
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