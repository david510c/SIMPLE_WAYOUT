# Getting Started with SIMPLE_WAYOUT

## Prerequisites

- Node.js 18 or higher
- Docker
- Modern browser (Chrome, Firefox, Edge)

## Installation

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd SIMPLE_WAYOUT
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Start Compositor Proxy

```bash
# Using Docker
docker run -d \
  -p 8081:8081 \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -e DISPLAY=$DISPLAY \
  --name compositor-proxy \
  david510c/greenfield-base:v1.5-diagnostic-fixed-v4

# Verify it's running
docker logs compositor-proxy
```

### Step 4: Start Frontend

```bash
cd frontend
npm run dev
```

### Step 5: Open Browser

```bash
open http://localhost:3000
```

## Development Workflow

### Running Locally

```bash
# Terminal 1: Compositor proxy
docker start compositor-proxy

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Making Changes

1. Edit files in `frontend/src/`
2. Vite will hot-reload automatically
3. Check browser console for errors
4. Check compositor logs: `docker logs compositor-proxy`

### Debugging

#### Enable Verbose Logging

```typescript
// In GreenfieldManager.tsx
console.log('[GreenfieldManager] Step X: ...')
```

All components use `console.log` with prefixes for easy filtering.

#### Check Greenfield Session

```javascript
// In browser console
window.greenfieldSession
```

This gives you access to the Greenfield session for debugging.

#### Common Issues

**Canvas not found:**
```
Error: Canvas not found after 5 seconds
```
Solution: Check that canvas is rendered in App.tsx before GreenfieldManager

**initScene fails:**
```
Error: Cannot read properties of undefined
```
Solution: Check that canvas has width/height and is in DOM

**WebSocket connection failed:**
```
Error: WebSocket connection to 'ws://localhost:8081' failed
```
Solution: Check that compositor-proxy is running

## Testing

### Manual Testing

1. Open http://localhost:3000
2. Check console for initialization logs
3. Click an application
4. Verify canvas appears
5. Verify controls work
6. Click Stop
7. Verify canvas disappears

### Automated Testing (TODO)

```bash
npm run test
```

## Building for Production

### Build Frontend

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

### Build Docker Image

```bash
docker build -t simple-wayout .
```

### Run Production Build

```bash
docker run -p 8080:8080 simple-wayout
```

## Project Structure Explained

```
frontend/
├── src/
│   ├── App.tsx                    # Root component
│   │                              # - Renders canvas FIRST
│   │                              # - Then GreenfieldManager
│   │
│   ├── GreenfieldManager.tsx      # Greenfield initialization
│   │                              # - Loads WASM
│   │                              # - Creates session
│   │                              # - Initializes scene
│   │                              # - Provides session to children
│   │
│   ├── ApplicationManager.tsx     # Application lifecycle
│   │                              # - Lists applications
│   │                              # - Launches applications
│   │                              # - Stops applications
│   │
│   ├── CanvasDisplay.tsx          # Display management
│   │                              # - Shows/hides canvas
│   │                              # - Handles fullscreen
│   │                              # - Displays controls
│   │
│   ├── ApplicationList.tsx        # Application catalog UI
│   │                              # - Displays available apps
│   │                              # - Handles click events
│   │
│   └── types.ts                   # TypeScript definitions
│
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
└── vite.config.ts                 # Vite configuration
```

## Understanding the Code

### Initialization Flow

```typescript
// 1. App.tsx renders
<canvas id="greenfield-canvas" />  // Canvas first!
<GreenfieldManager>                // Then Greenfield

// 2. GreenfieldManager mounts
useEffect(() => {
  initialize()  // Start initialization
}, [])

// 3. Initialize sequence
async function initialize() {
  await initWasm()              // Load WASM
  const session = await createCompositorSession()
  const canvas = await waitForCanvas()  // Wait for canvas
  session.userShell.actions.initScene(() => ({ canvas, id: canvas.id }))
  session.globals.register()
  setReady(true)                // Done!
}

// 4. ApplicationManager renders
// 5. User sees application list
```

### Application Launch Flow

```typescript
// 1. User clicks app
<button onClick={() => onLaunch('calculator')}>

// 2. ApplicationManager launches
async function launchApplication(appId) {
  const response = await fetch(`/api/applications/${appId}/launch`, {
    method: 'POST'
  })
  setRunningApp(response.data)
}

// 3. CanvasDisplay mounts
useEffect(() => {
  canvas.style.display = 'block'  // Show canvas
}, [])

// 4. User sees application
```

## Customization

### Adding New Applications

Edit the backend API to return your applications:

```typescript
// backend/server.ts
app.get('/api/applications', (req, res) => {
  res.json({
    applications: [
      {
        id: 'my-app',
        name: 'My App',
        description: 'My custom application',
        icon: '🚀',
        category: 'Custom',
        executable: '/path/to/my-app'
      }
    ]
  })
})
```

### Customizing UI

All UI is in React components. Just edit the JSX:

```typescript
// ApplicationList.tsx
<button style={{ /* your styles */ }}>
  {app.name}
</button>
```

### Adding Features

Follow the single-responsibility principle:

1. Create new component
2. Give it one clear job
3. Keep it independent
4. Add to component tree

Example:

```typescript
// StatusBar.tsx - Shows system status
export function StatusBar() {
  return <div>Status info</div>
}

// Add to App.tsx
<GreenfieldManager>
  <StatusBar />
  <ApplicationManager />
</GreenfieldManager>
```

## Troubleshooting

### Greenfield won't initialize

Check console for specific error:

```javascript
// Look for these logs
[GreenfieldManager] Starting initialization
[GreenfieldManager] Step 1: Loading WASM
[GreenfieldManager] ✓ WASM loaded
// ... etc
```

If it stops at a specific step, that's where the problem is.

### Canvas not showing

Check:
1. Is canvas in DOM? `document.getElementById('greenfield-canvas')`
2. Is display set? `canvas.style.display`
3. Is CanvasDisplay mounted? Check React DevTools

### Application won't launch

Check:
1. Backend logs: `docker logs compositor-proxy`
2. Network tab: Is API call succeeding?
3. Console: Any JavaScript errors?

## Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture
2. Explore the code - it's designed to be readable
3. Make changes - it's designed to be modifiable
4. Add features - it's designed to be extensible

## Getting Help

- Check console logs (they're verbose on purpose)
- Check `window.greenfieldSession` in browser console
- Check compositor logs: `docker logs compositor-proxy`
- Read the code (it's simple and well-commented)

---

Remember: SIMPLE_WAYOUT is designed to be understood. If something is confusing, that's a bug in the design, not in your understanding.
