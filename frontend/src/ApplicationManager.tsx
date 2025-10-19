import { useState, useEffect } from 'react'
import { ApplicationList } from './ApplicationList'
import { CanvasDisplay } from './CanvasDisplay'
import type { Application, RunningApp } from './types'

/**
 * ApplicationManager - Single Responsibility: Manage application lifecycle
 * 
 * Inspired by term.everything's clean separation:
 * - No Greenfield knowledge
 * - Just manages app state
 * - Clear API boundaries
 */

export function ApplicationManager() {
  const [applications, setApplications] = useState<Application[]>([])
  const [runningApp, setRunningApp] = useState<RunningApp | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [])

  /**
   * Load available applications from backend
   */
  async function loadApplications() {
    try {
      console.log('[ApplicationManager] Loading applications')
      const response = await fetch('/api/applications')
      const data = await response.json()
      setApplications(data.applications)
      console.log('[ApplicationManager] Loaded', data.applications.length, 'applications')
    } catch (error) {
      console.error('[ApplicationManager] Failed to load applications:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Launch an application
   * Simple, direct API call - no magic
   */
  async function launchApplication(appId: string) {
    try {
      console.log('[ApplicationManager] Launching', appId)
      
      const response = await fetch(`/api/applications/${appId}/launch`, {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setRunningApp(data.runningApp)
        console.log('[ApplicationManager] Launched', appId)
      } else {
        console.error('[ApplicationManager] Launch failed:', data.error)
      }
    } catch (error) {
      console.error('[ApplicationManager] Launch error:', error)
    }
  }

  /**
   * Stop the running application
   * Simple, direct API call - no magic
   */
  async function stopApplication() {
    if (!runningApp) return

    try {
      console.log('[ApplicationManager] Stopping', runningApp.id)
      
      await fetch(`/api/applications/${runningApp.id}/stop`, {
        method: 'DELETE',
      })
      
      setRunningApp(null)
      console.log('[ApplicationManager] Stopped')
    } catch (error) {
      console.error('[ApplicationManager] Stop error:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#1a1a1a',
        color: '#fff',
      }}>
        Loading applications...
      </div>
    )
  }

  // Show canvas display if app is running
  if (runningApp) {
    return (
      <CanvasDisplay
        app={runningApp}
        onStop={stopApplication}
      />
    )
  }

  // Show application list
  return (
    <ApplicationList
      applications={applications}
      onLaunch={launchApplication}
    />
  )
}
