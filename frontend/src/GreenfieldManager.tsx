import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { initWasm, createCompositorSession } from '@gfld/compositor'
import type { CompositorSession } from '@gfld/compositor'

/**
 * GreenfieldManager - Single Responsibility: Initialize Greenfield
 * 
 * Inspired by term.everything's Wayland_Socket_Listener:
 * - Clear initialization sequence
 * - Single responsibility
 * - Explicit error handling
 * - No hidden state
 */

interface GreenfieldContextValue {
  session: CompositorSession | null
  ready: boolean
  error: string | null
}

const GreenfieldContext = createContext<GreenfieldContextValue>({
  session: null,
  ready: false,
  error: null,
})

export const useGreenfield = () => useContext(GreenfieldContext)

interface Props {
  children: ReactNode
}

export function GreenfieldManager({ children }: Props) {
  const [session, setSession] = useState<CompositorSession | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Small delay to ensure canvas is in DOM
    // This is explicit and obvious, not hidden
    setTimeout(() => {
      initialize()
    }, 100)
  }, [])

  /**
   * Initialize Greenfield - Clear, sequential steps
   * Like term.everything's main_loop(), but for Greenfield
   */
  async function initialize() {
    try {
      console.log('[GreenfieldManager] Starting initialization')

      // Step 1: Load WASM decoder
      await initWasm()
      console.log('[GreenfieldManager] ✓ WASM loaded')

      // Step 2: Create compositor session - use exact same mode as working example
      const newSession = await createCompositorSession({ mode: 'experimental-fullscreen' })
      console.log('[GreenfieldManager] ✓ Session created')

      // Step 3: Get canvas (it's already in the DOM from index.html)
      const canvas = document.getElementById('output') as HTMLCanvasElement
      if (!canvas) {
        throw new Error('Canvas element not found')
      }
      console.log('[GreenfieldManager] ✓ Canvas found')

      // Step 4: Initialize scene - EXACTLY like the working example
      newSession.userShell.actions.initScene(() => ({ canvas, id: canvas.id }))
      console.log('[GreenfieldManager] ✓ Scene initialized')

      // Step 5: Register globals
      newSession.globals.register()
      console.log('[GreenfieldManager] ✓ Globals registered')

      // Step 6: Set up event handlers
      setupEventHandlers(newSession)
      console.log('[GreenfieldManager] ✓ Events configured')

      // Done!
      setSession(newSession)
      setReady(true)
      console.log('[GreenfieldManager] 🎉 Initialization complete')

      // Make session available for debugging
      ;(window as any).greenfieldSession = newSession

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[GreenfieldManager] ❌ Initialization failed:', errorMessage)
      setError(errorMessage)
    }
  }

  /**
   * Wait for canvas to be ready
   * Explicit polling with timeout - no magic
   */
  function waitForCanvas(): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 50 // 5 seconds

      const check = () => {
        const canvas = document.getElementById('output') as HTMLCanvasElement

        // Check all requirements
        if (
          canvas &&
          canvas instanceof HTMLCanvasElement &&
          document.body.contains(canvas) &&
          canvas.width > 0 &&
          canvas.height > 0
        ) {
          resolve(canvas)
          return
        }

        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('Canvas not found after 5 seconds'))
          return
        }

        setTimeout(check, 100)
      }

      check()
    })
  }

  /**
   * Verify canvas meets all requirements
   * Explicit checks - no assumptions
   */
  function verifyCanvas(canvas: HTMLCanvasElement) {
    if (!canvas) {
      throw new Error('Canvas is null')
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Not a canvas element')
    }

    if (!document.body.contains(canvas)) {
      throw new Error('Canvas not in DOM')
    }

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has no dimensions')
    }

    if (typeof canvas.addEventListener !== 'function') {
      throw new Error('Canvas missing addEventListener')
    }
  }

  /**
   * Set up Greenfield event handlers
   * Like term.everything's event handling, but for Greenfield
   */
  function setupEventHandlers(session: CompositorSession) {
    session.userShell.events.notify = (variant, message) => {
      console.log(`[Greenfield] ${variant}: ${message}`)
    }

    session.userShell.events.surfaceActivationUpdated = (surface, active) => {
      console.log(`[Greenfield] Surface ${surface.id} ${active ? 'activated' : 'deactivated'}`)
    }

    session.userShell.events.surfaceTitleUpdated = (surface, title) => {
      console.log(`[Greenfield] Surface ${surface.id} title: ${title}`)
      // Update browser title
      if (title) {
        document.title = `${title} - SIMPLE_WAYOUT`
      }
    }

    session.userShell.events.surfaceDestroyed = (surface) => {
      console.log(`[Greenfield] Surface ${surface.id} destroyed`)
    }
  }

  // Render status while initializing
  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#ef4444',
        fontSize: '18px',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <div>Greenfield initialization failed</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#888' }}>
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#fff',
        fontSize: '18px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #333',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <div>Initializing Greenfield...</div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Provide session to children
  return (
    <GreenfieldContext.Provider value={{ session, ready, error }}>
      {children}
    </GreenfieldContext.Provider>
  )
}
