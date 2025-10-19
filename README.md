# SIMPLE_WAYOUT

Clean, simple Wayland-to-web architecture inspired by term.everything's clarity and Greenfield's proven compositor.

## Philosophy

**Simplicity over complexity. Clarity over cleverness.**

SIMPLE_WAYOUT combines:
- **term.everything's** clean architecture and single-responsibility components
- **Greenfield's** proven Wayland compositor and video streaming
- **WAYOUT's** vision of web-based remote desktop

## Key Principles

1. **Canvas First** - Canvas exists before Greenfield initializes (eliminates timing issues)
2. **Single Session** - One global Greenfield session (matches Greenfield's design)
3. **Clear Components** - Each component has one job (easy to understand)
4. **No Magic** - Everything is explicit (easy to debug)
5. **Minimal Abstraction** - Direct API calls (easy to trace)

## Architecture

```
App.tsx
  ├─ <canvas> (rendered first!)
  └─ GreenfieldManager (initializes Greenfield)
      └─ ApplicationManager (manages app lifecycle)
          ├─ ApplicationList (shows apps)
          └─ CanvasDisplay (shows canvas + controls)
```

Each component has a single, clear responsibility. No hidden dependencies.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for compositor-proxy)

### Development

```bash
# 1. Start compositor-proxy
docker run -d \
  -p 8081:8081 \
  --name compositor-proxy \
  david510c/greenfield-base:v1.5-diagnostic-fixed-v4

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Start frontend dev server
npm run dev

# 4. Open browser
open http://localhost:3000
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

## Project Structure

```
SIMPLE_WAYOUT/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root - renders canvas first
│   │   ├── GreenfieldManager.tsx      # Initializes Greenfield
│   │   ├── ApplicationManager.tsx     # Manages app lifecycle
│   │   ├── CanvasDisplay.tsx          # Shows canvas + controls
│   │   ├── ApplicationList.tsx        # Shows app catalog
│   │   └── types.ts                   # TypeScript types
│   ├── index.html
│   └── package.json
├── backend/                           # Optional REST API
├── docs/
│   ├── ARCHITECTURE.md                # Detailed architecture
│   └── GETTING_STARTED.md             # Setup guide
└── README.md                          # This file
```

## What Makes This "Simple"?

### 1. Clear Initialization Sequence

```typescript
// GreenfieldManager.initialize()
await loadWASM()           // Step 1
await createSession()      // Step 2
await waitForCanvas()      // Step 3
await initScene()          // Step 4
await registerGlobals()    // Step 5
// Done!
```

No hidden steps, no magic, just a clear sequence.

### 2. Single Responsibility Components

```typescript
// GreenfieldManager: Initialize Greenfield
// ApplicationManager: Manage apps
// CanvasDisplay: Show/hide canvas
// ApplicationList: Display apps
```

Each component does ONE thing. Easy to understand, test, and modify.

### 3. Explicit Dependencies

```typescript
// App.tsx
<canvas />                    // Canvas first
<GreenfieldManager>           // Then Greenfield
  <ApplicationManager />      // Then apps
</GreenfieldManager>
```

The component tree shows exactly what depends on what.

### 4. No Hidden State

```typescript
// All state is visible
const [session, setSession] = useState(null)
const [ready, setReady] = useState(false)
const [error, setError] = useState(null)
```

No global state, no context magic, just React state.

## Comparison with Original WAYOUT

| Aspect | Original WAYOUT | SIMPLE_WAYOUT |
|--------|----------------|---------------|
| Canvas timing | Inside component | At root level |
| Sessions | Multiple attempts | One global |
| Components | Complex hierarchy | Flat, clear |
| State | Spread across many | Localized |
| Abstraction | Many layers | Minimal |
| Debugging | Difficult | Easy |

## Lessons from term.everything

1. **Clear Architecture** - Each component has obvious purpose
2. **Minimal Abstraction** - Direct, not wrapped
3. **Explicit Flow** - Easy to trace execution
4. **Single Responsibility** - One job per component
5. **No Magic** - Everything is obvious

## Lessons from Greenfield

1. **Proven Compositor** - Don't reinvent the wheel
2. **Video Streaming** - H.264 encoding/decoding works
3. **Protocol Implementation** - Wayland protocol is complex
4. **Browser Integration** - Canvas + WebCodecs is the way

## Success Criteria

SIMPLE_WAYOUT is successful if:

- ✅ Code is easy to understand
- ✅ Components are independent
- ✅ Data flow is obvious
- ✅ No timing issues
- ✅ Easy to test
- ✅ Easy to modify
- ✅ Works reliably

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Detailed architecture explanation
- [Getting Started](./docs/GETTING_STARTED.md) - Setup and development guide
- [API Reference](./docs/API.md) - API documentation

## Contributing

SIMPLE_WAYOUT follows these principles:

1. **Keep it simple** - Don't add complexity
2. **One job per component** - Single responsibility
3. **Explicit over implicit** - No magic
4. **Clear over clever** - Obvious code wins
5. **Test everything** - If it's not tested, it's broken

## License

MIT

## Credits

- **term.everything** - Inspiration for clean architecture
- **Greenfield** - Proven Wayland compositor
- **WAYOUT** - Original vision and goals

---

**Remember:** Simplicity is not about doing less. It's about doing things clearly.
