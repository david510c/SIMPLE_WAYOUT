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
        Canvas is in index.html, not React-rendered
        This matches the working Greenfield example pattern
        GreenfieldManager will find it via document.getElementById
      */}
      <GreenfieldManager>
        <ApplicationManager />
      </GreenfieldManager>
    </>
  )
}
