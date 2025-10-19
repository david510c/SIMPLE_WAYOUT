import type { Application } from './types'

/**
 * ApplicationList - Simple UI component
 * 
 * Just displays applications and handles clicks
 * No business logic, no state management
 */

interface Props {
  applications: Application[]
  onLaunch: (appId: string) => void
}

export function ApplicationList({ applications, onLaunch }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          margin: 0,
        }}>
          SIMPLE_WAYOUT
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#888',
          margin: '8px 0 0 0',
        }}>
          Clean architecture inspired by term.everything
        </p>
      </header>

      {/* Application grid */}
      <main style={{
        padding: '40px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '24px',
        }}>
          Available Applications
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => onLaunch(app.id)}
              style={{
                padding: '24px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a2a2a'
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a'
                e.currentTarget.style.borderColor = '#333'
              }}
            >
              <div style={{
                fontSize: '32px',
                marginBottom: '12px',
              }}>
                {app.icon}
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 8px 0',
                color: '#fff',
              }}>
                {app.name}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#888',
                margin: '0 0 8px 0',
              }}>
                {app.description}
              </p>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: '#3b82f620',
                color: '#3b82f6',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
              }}>
                {app.category}
              </span>
            </button>
          ))}
        </div>

        {applications.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#888',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <div>No applications available</div>
          </div>
        )}
      </main>
    </div>
  )
}
