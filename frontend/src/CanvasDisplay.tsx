import { useEffect, useState } from 'react'
import { useGreenfield } from './GreenfieldManager'
import type { RunningApp } from './types'

/**
 * CanvasDisplay - Single Responsibility: Show/hide canvas and controls
 * 
 * Inspired by term.everything's Terminal_Window:
 * - Just manages display
 * - No application logic
 * - No Greenfield logic
 * - Pure UI component
 */

interface Props {
  app: RunningApp
  onStop: () => void
}

export function CanvasDisplay({ app, onStop }: Props) {
  const { ready } = useGreenfield()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  /**
   * Show canvas when component mounts
   * Hide canvas when component unmounts
   * Simple, explicit, no magic
   */
  useEffect(() => {
    if (!ready) return

    console.log('[CanvasDisplay] Showing canvas for', app.appId)
    const canvas = document.getElementById('greenfield-canvas') as HTMLCanvasElement
    
    if (canvas) {
      canvas.style.display = 'block'
      canvas.style.zIndex = isFullscreen ? '9999' : '1'
    }

    // Cleanup: hide canvas when unmounting
    return () => {
      console.log('[CanvasDisplay] Hiding canvas')
      if (canvas) {
        canvas.style.display = 'none'
      }
    }
  }, [ready, app, isFullscreen])

  /**
   * Toggle fullscreen mode
   */
  function toggleFullscreen() {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  /**
   * Auto-hide controls in fullscreen
   */
  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true)
      return
    }

    // Hide after 3 seconds of no mouse movement
    let timeout: number
    
    const resetTimer = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    window.addEventListener('mousemove', resetTimer)
    resetTimer()

    return () => {
      window.removeEventListener('mousemove', resetTimer)
      clearTimeout(timeout)
    }
  }, [isFullscreen])

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
      }}>
        Waiting for compositor...
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#000',
    }}>
      {/* Status indicator */}
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        padding: '8px 16px',
        background: 'rgba(16, 185, 129, 0.5)',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#fff',
        backdropFilter: 'blur(10px)',
        opacity: showControls ? 1 : 0,
        transition: 'opacity 0.3s',
        zIndex: 10000,
      }}>
        ● {app.appId}
      </div>

      {/* Controls */}
      {showControls && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          padding: '12px 20px',
          background: 'rgba(26, 26, 26, 0.5)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          zIndex: 10000,
        }}>
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '10px 20px',
              background: '#2a2a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {isFullscreen ? '⊡ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>

          <button
            onClick={onStop}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            ■ Stop
          </button>
        </div>
      )}
    </div>
  )
}
