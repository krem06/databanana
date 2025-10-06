function Home() {
  return (
    <div className="page">
      <div className="hero" style={{ 
        textAlign: 'center', 
        marginBottom: '3rem',
        padding: '3rem 2rem'
      }}>
        <img src="/src/assets/databanana.jpg" alt="Data Banana" style={{
          height: '180px',
          marginBottom: '2rem'
        }} />
        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div className="step-item">
            <div className="step-badge">1</div>
            <span style={{ color: '#475569', fontSize: '1rem' }}>Generate 10 VLM dataset images from your context</span>
          </div>
          
          <div className="step-item">
            <div className="step-badge">2</div>
            <span style={{ color: '#475569', fontSize: '1rem' }}>Validate images for quality and relevance (5-10 mins)</span>
          </div>
          
          <div className="step-item">
            <div style={{
              background: '#0ea5e9',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: '600',
              flexShrink: 0
            }}>3</div>
            <span style={{ color: '#475569', fontSize: '1rem' }}>Export in standard formats (COCO, YOLO, etc.)</span>
          </div>
          
          <div className="step-item">
            <div className="step-badge success">✓</div>
            <span style={{ color: '#475569', fontSize: '1rem' }}>Valid images added to public gallery for community use</span>
          </div>
        </div>
      </div>
      
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ color: '#1e293b', marginBottom: '1.5rem', fontSize: '1.25rem' }}>How it works</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                background: '#0ea5e9', 
                color: 'white', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>1</div>
              <span style={{ color: '#475569' }}>Add context + excluded tags</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                background: '#0ea5e9', 
                color: 'white', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>2</div>
              <span style={{ color: '#475569' }}>Generate 100 AI variations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                background: '#0ea5e9', 
                color: 'white', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>3</div>
              <span style={{ color: '#475569' }}>Select realistic images</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                background: '#0ea5e9', 
                color: 'white', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>4</div>
              <span style={{ color: '#475569' }}>Export as dataset format</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ color: '#1e293b', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Pricing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>$5</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>100 images generation</div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>$0.10</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>per image for dataset export</div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontWeight: '600', color: '#1e293b' }}>Free</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>gallery downloads (no metadata)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home