import { useState } from 'react'

function Account() {
  const [credits, setCredits] = useState(0)
  const [email, setEmail] = useState('')

  return (
    <div className="page">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2>Account Details</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email:</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <button className="btn">Update Profile</button>
        </div>
        
        <div className="card">
          <h2>Credits</h2>
          <p>Current balance: <strong>${credits}</strong></p>
          <p>100 images = $5</p>
          
          <div style={{ marginTop: '1rem' }}>
            <button className="btn" style={{ marginRight: '0.5rem' }}>Add $5</button>
            <button className="btn" style={{ marginRight: '0.5rem' }}>Add $10</button>
            <button className="btn">Add $25</button>
          </div>
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