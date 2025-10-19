import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import { spawn, ChildProcess } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * SIMPLE_WAYOUT Backend Server
 * 
 * Simple, clear backend inspired by term.everything's approach:
 * - Direct process management
 * - Clear API endpoints
 * - Minimal abstraction
 */

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  },
})

// Application state
const runningApps = new Map<string, {
  process: ChildProcess
  appId: string
  startedAt: Date
}>()

// Load applications configuration
const applicationsConfig = JSON.parse(
  readFileSync(join(__dirname, '../../applications.json'), 'utf-8')
)

// CORS
fastify.register(cors, {
  origin: true,
})

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  fastify.register(staticFiles, {
    root: join(__dirname, '../../frontend/dist'),
    prefix: '/',
  })
}

/**
 * Health check endpoint
 */
fastify.get('/health', async () => {
  return {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    runningApps: runningApps.size,
  }
})

/**
 * Get list of available applications
 */
fastify.get('/api/applications', async () => {
  return {
    applications: applicationsConfig.applications,
  }
})

/**
 * Launch an application
 */
fastify.post<{
  Params: { id: string }
}>('/api/applications/:id/launch', async (request, reply) => {
  const { id } = request.params

  // Find application config
  const app = applicationsConfig.applications.find((a: any) => a.id === id)
  if (!app) {
    return reply.code(404).send({
      success: false,
      error: 'Application not found',
    })
  }

  // Check if already running
  if (runningApps.has(id)) {
    return reply.code(400).send({
      success: false,
      error: 'Application already running',
    })
  }

  try {
    fastify.log.info(`Launching application: ${app.name}`)

    // Spawn process
    const process = spawn(app.executable, app.args || [], {
      env: {
        ...process.env,
        WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY || 'wayland-0',
        XDG_SESSION_TYPE: 'wayland',
        ...app.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Log output
    process.stdout?.on('data', (data) => {
      fastify.log.info(`[${app.id}] ${data.toString().trim()}`)
    })

    process.stderr?.on('data', (data) => {
      fastify.log.warn(`[${app.id}] ${data.toString().trim()}`)
    })

    // Handle exit
    process.on('exit', (code, signal) => {
      fastify.log.info(`Application exited: ${app.id}`, { code, signal })
      runningApps.delete(id)
    })

    // Store running app
    const runningAppId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    runningApps.set(id, {
      process,
      appId: id,
      startedAt: new Date(),
    })

    return {
      success: true,
      runningApp: {
        id: runningAppId,
        appId: id,
        pid: process.pid,
        startedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    fastify.log.error(`Failed to launch application: ${app.id}`, error)
    return reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Stop a running application
 */
fastify.delete<{
  Params: { id: string }
}>('/api/applications/:id/stop', async (request, reply) => {
  const { id } = request.params

  // Find running app (id could be appId or runningAppId)
  let appId: string | undefined
  for (const [key, value] of runningApps.entries()) {
    if (key === id || value.appId === id) {
      appId = key
      break
    }
  }

  if (!appId) {
    return reply.code(404).send({
      success: false,
      error: 'Application not running',
    })
  }

  const runningApp = runningApps.get(appId)
  if (!runningApp) {
    return reply.code(404).send({
      success: false,
      error: 'Application not found',
    })
  }

  try {
    fastify.log.info(`Stopping application: ${appId}`)

    // Kill process
    runningApp.process.kill('SIGTERM')

    // Force kill after 5 seconds if still running
    setTimeout(() => {
      if (runningApps.has(appId!)) {
        fastify.log.warn(`Force killing application: ${appId}`)
        runningApp.process.kill('SIGKILL')
      }
    }, 5000)

    runningApps.delete(appId)

    return {
      success: true,
    }
  } catch (error) {
    fastify.log.error(`Failed to stop application: ${appId}`, error)
    return reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Get list of running applications
 */
fastify.get('/api/applications/running', async () => {
  const running = Array.from(runningApps.entries()).map(([id, app]) => ({
    id,
    appId: app.appId,
    pid: app.process.pid,
    startedAt: app.startedAt.toISOString(),
  }))

  return {
    running,
  }
})

/**
 * Cleanup on shutdown
 */
process.on('SIGTERM', () => {
  fastify.log.info('SIGTERM received, cleaning up...')
  
  // Kill all running apps
  for (const [id, app] of runningApps.entries()) {
    fastify.log.info(`Killing application: ${id}`)
    app.process.kill('SIGTERM')
  }
  
  process.exit(0)
})

process.on('SIGINT', () => {
  fastify.log.info('SIGINT received, cleaning up...')
  
  // Kill all running apps
  for (const [id, app] of runningApps.entries()) {
    fastify.log.info(`Killing application: ${id}`)
    app.process.kill('SIGTERM')
  }
  
  process.exit(0)
})

/**
 * Start server
 */
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10)
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    
    fastify.log.info(`SIMPLE_WAYOUT backend started`)
    fastify.log.info(`Listening on ${host}:${port}`)
    fastify.log.info(`Loaded ${applicationsConfig.applications.length} applications`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
