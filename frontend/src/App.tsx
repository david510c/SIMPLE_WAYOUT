import { GreenfieldManager } from './GreenfieldManager'
import { ApplicationManager } from './ApplicationManager'
import './App.css'

/**
 * Root component - Inspired by term.everything's simplicity
 * 
 * Key principle: Canvas MUST exist before Greenfield initializes
 * This is the #1 lesson from debugging WAYOUT
 */
export function App() {
  return (
    <>
      {/* 
        CRITICAL: Canvas must be rendered FIRST, before GreenfieldManager
        
        Why? Greenfield's initScene() needs the canvas element to exist in DOM.
        If we put this inside GreenfieldManager or any child component,
        there will be timing issues.
        
        This is inspired by term.everything's approach where the terminal
        is set up before the Wayland socket listener starts.
      */}
      <canvas
        id="greenfield-canvas"
        width={1920}
        height={1080}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'none',  // Hidden by default, shown when app runs
          zIndex: 1,
          background: '#000',
        }}
      />

      {/*
        GreenfieldManager initializes AFTER canvas exists
        This eliminates all timing issues
      */}
      <GreenfieldManager>
        <ApplicationManager />
      </GreenfieldManager>
    </>
  )
}
