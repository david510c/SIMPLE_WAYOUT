/**
 * Type definitions for SIMPLE_WAYOUT
 * 
 * Clear, explicit types - no magic
 */

export interface Application {
  id: string
  name: string
  description: string
  icon: string
  category: string
  executable: string
}

export interface RunningApp {
  id: string
  appId: string
  pid: number
  startedAt: string
}
