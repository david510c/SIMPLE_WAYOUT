# SIMPLE_WAYOUT Architecture

## Philosophy

Inspired by term.everything's simplicity while leveraging Greenfield's proven compositor.

### Core Principles

1. **Minimal Abstraction** - Direct, clear code paths
2. **Single Responsibility** - Each component does one thing
3. **Obvious Flow** - Easy to trace from input to output
4. **No Magic** - Everything is explicit

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  App.tsx (Root)                                     │    │
│  │  - Renders canvas FIRST                             │    │
│  │  - Then renders GreenfieldManager                   │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  GreenfieldManager (Single Responsibility)         │    │
│  │  - Initialize WASM                                  │    │
│  │  - Create session                                   │    │
│  │  - Setup canvas                                     │    │
│  │  - Register globals                                 │    │
│  │  - Provide session to children                     │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ApplicationManager                                 │    │
│  │  - List applications                                │    │
│  │  - Launch applications                              │    │
│  │  - Stop applications                                │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  CanvasDisplay                                      │    │
│  │  - Show/hide canvas                                 │    │
│  │  - Handle fullscreen                                │    │
│  │  - Display controls                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                         Server                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  compositor-proxy-cli (Greenfield)                 │    │
│  │  - Wayland compositor                               │    │
│  │  - Video encoding                                   │    │
│  │  - Application lifecycle                            │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Native Wayland Applications                        │    │
│  │  - Calculator, Terminal, Firefox, etc.             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Components

#### 1. App.tsx (Root Component)
**Responsibility:** Render canvas and initialize Greenfield

```typescript
function App() {
  return (
    <>
      {/* Canvas MUST be first - before any Greenfield code runs */}
      <canvas id="greenfield-canvas" width={1920} height={1080} />
      
      {/* Manager initializes after canvas exists */}
      <GreenfieldManager>
        <ApplicationManager />
      </GreenfieldManager>
    </>
  )
}
```

**Why this order?**
- Canvas must exist in DOM before Greenfield initializes
- Greenfield's initScene() needs the canvas element
- Simple, explicit, no timing issues

#### 2. GreenfieldManager
**Responsibility:** Initialize and manage Greenfield session

```typescript
class GreenfieldManager {
  // State
  session: Session | null
  ready: boolean
  error: string | null
  
  // Lifecycle
  async initialize() {
    await this.loadWASM()
    await this.createSession()
    await this.setupCanvas()
    await this.registerGlobals()
    this.ready = true
  }
  
  // Provide session to children
  render() {
    return (
      <GreenfieldContext.Provider value={this.session}>
        {this.props.children}
      </GreenfieldContext.Provider>
    )
  }
}
```

**Why separate?**
- Single responsibility: manage Greenfield
- Easy to test
- Clear initialization sequence
- No hidden dependencies

#### 3. ApplicationManager
**Responsibility:** Manage application lifecycle

```typescript
class ApplicationManager {
  // State
  applications: Application[]
  runningApp: Application | null
  
  // Actions
  async launchApp(appId: string) {
    const response = await fetch(`/api/apps/${appId}/launch`, { method: 'POST' })
    this.runningApp = await response.json()
  }
  
  async stopApp() {
    await fetch(`/api/apps/${this.runningApp.id}/stop`, { method: 'DELETE' })
    this.runningApp = null
  }
  
  // Render
  render() {
    if (this.runningApp) {
      return <CanvasDisplay app={this.runningApp} onStop={this.stopApp} />
    }
    return <ApplicationList apps={this.applications} onLaunch={this.launchApp} />
  }
}
```

**Why separate?**
- Single responsibility: manage apps
- No Greenfield knowledge needed
- Easy to test
- Clear API boundaries

#### 4. CanvasDisplay
**Responsibility:** Show/hide canvas and controls

```typescript
class CanvasDisplay {
  // Show canvas when mounted
  componentDidMount() {
    const canvas = document.getElementById('greenfield-canvas')
    canvas.style.display = 'block'
  }
  
  // Hide canvas when unmounted
  componentWillUnmount() {
    const canvas = document.getElementById('greenfield-canvas')
    canvas.style.display = 'none'
  }
  
  // Render controls only
  render() {
    return (
      <div className="controls">
        <button onClick={this.props.onStop}>Stop</button>
        <button onClick={this.toggleFullscreen}>Fullscreen</button>
      </div>
    )
  }
}
```

**Why separate?**
- Single responsibility: display management
- No application logic
- No Greenfield logic
- Pure UI component

### Backend Components

#### 1. compositor-proxy-cli (Greenfield)
**Responsibility:** Wayland compositor

**We don't modify this** - it's Greenfield's proven implementation.

```bash
# Just run it
compositor-proxy-cli \
  --bind-port 8081 \
  --base-url ws://localhost:8080 \
  --applications '{"calculator": {"executable": "gnome-calculator"}}'
```

#### 2. Application API (Optional)
**Responsibility:** REST API for application management

```typescript
// Simple REST API
app.get('/api/apps', (req, res) => {
  res.json({ applications: [...] })
})

app.post('/api/apps/:id/launch', (req, res) => {
  // Launch via backend or let frontend use Greenfield's launcher
  res.json({ success: true, appId: req.params.id })
})

app.delete('/api/apps/:id/stop', (req, res) => {
  // Stop application
  res.json({ success: true })
})
```

**Why optional?**
- Can use Greenfield's app launcher directly
- Backend only needed for:
  - Application catalog
  - User management
  - Logging/monitoring

## Data Flow

### Initialization Flow

```
1. Browser loads page
   ↓
2. App.tsx renders
   ↓
3. Canvas element created in DOM
   ↓
4. GreenfieldManager mounts
   ↓
5. GreenfieldManager.initialize() runs:
   a. Load WASM
   b. Create session
   c. Find canvas (it exists!)
   d. Initialize scene
   e. Register globals
   ↓
6. GreenfieldManager provides session to children
   ↓
7. ApplicationManager renders
   ↓
8. User sees application list
```

### Application Launch Flow

```
1. User clicks "Launch Calculator"
   ↓
2. ApplicationManager.launchApp('calculator')
   ↓
3. POST /api/apps/calculator/launch
   ↓
4. Backend/Greenfield launches app
   ↓
5. ApplicationManager updates state
   ↓
6. CanvasDisplay mounts
   ↓
7. Canvas becomes visible
   ↓
8. User sees application
```

### Application Stop Flow

```
1. User clicks "Stop"
   ↓
2. CanvasDisplay.onStop()
   ↓
3. ApplicationManager.stopApp()
   ↓
4. DELETE /api/apps/{id}/stop
   ↓
5. Backend stops app
   ↓
6. CanvasDisplay unmounts
   ↓
7. Canvas becomes hidden
   ↓
8. User sees application list
```

## Key Design Decisions

### 1. Canvas First
**Decision:** Render canvas before Greenfield initializes

**Rationale:**
- Greenfield needs canvas to exist
- Eliminates timing issues
- Makes initialization synchronous
- Obvious and explicit

### 2. Single Global Session
**Decision:** One Greenfield session for entire app

**Rationale:**
- Greenfield is designed this way
- Multiple sessions don't make sense
- Simpler state management
- Matches term.everything's approach

### 3. Separate Concerns
**Decision:** Each component has one job

**Rationale:**
- Easy to understand
- Easy to test
- Easy to modify
- Matches term.everything's clarity

### 4. No Hidden State
**Decision:** All state is explicit and visible

**Rationale:**
- No surprises
- Easy to debug
- Clear data flow
- Obvious dependencies

### 5. Minimal Abstraction
**Decision:** Direct API calls, no wrappers

**Rationale:**
- Less code to understand
- Fewer places for bugs
- Easier to trace issues
- Matches term.everything's directness

## Comparison with Original WAYOUT

### Original WAYOUT Issues

1. **Canvas timing** - Canvas created inside component that needs it
2. **Multiple sessions** - Tried to create session per app
3. **Complex state** - State spread across many components
4. **Hidden dependencies** - Not clear what depends on what
5. **Over-abstraction** - Too many layers

### SIMPLE_WAYOUT Solutions

1. **Canvas first** - Canvas at root, before everything
2. **Single session** - One global session
3. **Clear state** - State in obvious places
4. **Explicit dependencies** - Clear component hierarchy
5. **Direct calls** - Minimal abstraction

## File Structure

```
SIMPLE_WAYOUT/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root component
│   │   ├── GreenfieldManager.tsx      # Greenfield initialization
│   │   ├── ApplicationManager.tsx     # App lifecycle
│   │   ├── CanvasDisplay.tsx          # Display management
│   │   ├── ApplicationList.tsx        # App catalog
│   │   └── types.ts                   # TypeScript types
│   ├── index.html                     # Entry point
│   └── package.json                   # Dependencies
├── backend/
│   ├── server.ts                      # Optional REST API
│   └── package.json                   # Dependencies
├── docs/
│   ├── ARCHITECTURE.md                # This file
│   ├── GETTING_STARTED.md             # Quick start
│   └── API.md                         # API reference
└── README.md                          # Overview
```

## Testing Strategy

### Unit Tests

```typescript
// Test GreenfieldManager initialization
test('GreenfieldManager initializes correctly', async () => {
  const manager = new GreenfieldManager()
  await manager.initialize()
  
  expect(manager.ready).toBe(true)
  expect(manager.session).not.toBeNull()
  expect(manager.error).toBeNull()
})

// Test ApplicationManager launch
test('ApplicationManager launches app', async () => {
  const manager = new ApplicationManager()
  await manager.launchApp('calculator')
  
  expect(manager.runningApp).not.toBeNull()
  expect(manager.runningApp.id).toBe('calculator')
})
```

### Integration Tests

```typescript
// Test full flow
test('Launch and stop application', async () => {
  // 1. Initialize
  const app = mount(<App />)
  await waitFor(() => app.find('GreenfieldManager').prop('ready'))
  
  // 2. Launch
  app.find('button[data-app="calculator"]').click()
  await waitFor(() => app.find('CanvasDisplay').exists())
  
  // 3. Stop
  app.find('button[data-action="stop"]').click()
  await waitFor(() => app.find('ApplicationList').exists())
})
```

## Deployment

### Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (optional)
cd backend
npm install
npm run dev

# Compositor
compositor-proxy-cli --bind-port 8081
```

### Production

```bash
# Build frontend
cd frontend
npm run build

# Build Docker image
docker build -t simple-wayout .

# Run
docker run -p 8080:8080 simple-wayout
```

## Success Criteria

SIMPLE_WAYOUT is successful if:

1. ✅ Code is easy to understand
2. ✅ Components have single responsibilities
3. ✅ Data flow is obvious
4. ✅ No timing issues
5. ✅ Easy to test
6. ✅ Easy to modify
7. ✅ Works reliably

---

This architecture combines term.everything's simplicity with Greenfield's proven functionality to create a clean, maintainable system.
