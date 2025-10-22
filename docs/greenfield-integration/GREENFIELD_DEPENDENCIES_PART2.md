# Greenfield Native Dependencies - Part 2: Build History & Errors

## Part 4: Complete Build History from TEST_LOGS

### Timeline of Build Attempts

Based on TEST_LOGS analysis, here's what was tried and what failed:

#### Attempt 1: Direct npm Install (FAILED)
**Date:** Early development
**Approach:** Try to install `@gfld/compositor-proxy-cli` from npm
**Command:**
```bash
npm install -g @gfld/compositor-proxy-cli
```

**Result:** ❌ FAILED
**Errors:**
```
Error: The module was compiled against a different Node.js version
Error: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.38' not found
```

**Why it failed:**
- npm package has pre-built binaries for specific Node.js version
- Ubuntu 22.04 has GLIBC 2.35, package needs 2.38
- Native addons don't match system architecture
- No way to rebuild without source

**Lesson:** Pre-built npm packages don't work across different systems.

#### Attempt 2: Build from Source (PARTIALLY SUCCESSFUL)
**Date:** Mid development
**Approach:** Clone Greenfield repo and build everything
**Commands:**
```bash
git clone https://github.com/udevbe/greenfield.git
cd greenfield
yarn install
yarn build
```

**Result:** ⚠️ PARTIALLY SUCCESSFUL
**Errors encountered:**
```
ERROR: Dependency "gstreamer-gl-1.0" not found
ERROR: xkb-base meson option invalid
ERROR: Cannot find libwayland-server.so.0
ERROR: WASM module loading failed
ERROR: Canvas timing issues
ERROR: WebSocket double-slash bug
```

**What worked:**
- TypeScript compilation
- Protocol generation
- Basic compositor structure

**What didn't work:**
- Native addon compilation (missing dependencies)
- GStreamer integration (wrong version)
- WASM modules (incomplete implementation)
- Application rendering (Wayland socket issues)

**Lesson:** Building from source requires extensive system setup.

#### Attempt 3: Docker Build (SUCCESSFUL)
**Date:** Later development
**Approach:** Use Docker to control entire build environment
**File:** `docker/Dockerfile`

**Result:** ✅ SUCCESS
**Why it worked:**
- Controlled base image (Debian Bookworm)
- All dependencies installed in correct order
- GStreamer built from source with exact options
- Native addons compiled in same environment they run
- No version mismatches

**Build time:** 15-25 minutes
**Image size:** ~2GB

**Lesson:** Docker provides reproducible build environment.

### Specific Errors and Solutions

#### Error 1: GLIBC Version Mismatch
**Error:**
```
/lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.38' not found
```

**Root cause:**
- Native addons compiled on system with GLIBC 2.38
- Target system (Ubuntu 22.04) has GLIBC 2.35
- GLIBC is not forward-compatible

**Attempted solutions:**
1. ❌ Upgrade GLIBC (breaks system)
2. ❌ Use older Node.js (still needs GLIBC 2.38)
3. ✅ Build in Docker with matching GLIBC

**Final solution:** Use Debian Bookworm (has GLIBC 2.36+)

#### Error 2: GStreamer Plugin Not Found
**Error:**
```
ERROR: Dependency "gstreamer-gl-1.0" not found
ERROR: Plugin 'nvcodec' not found
```

**Root cause:**
- System GStreamer packages don't include all plugins
- GL support requires specific build options
- NVCODEC plugin not in standard packages

**Attempted solutions:**
1. ❌ Install more packages (plugins still missing)
2. ❌ Use PPA (version conflicts)
3. ✅ Build GStreamer from source

**Final solution:** Build GStreamer 1.20 from source with all plugins enabled

#### Error 3: Node.js ABI Mismatch
**Error:**
```
Error: The module was compiled against a different Node.js version
```

**Root cause:**
- Native addons compiled for Node.js 18
- System has Node.js 12 or 20
- ABI (Application Binary Interface) changed

**Attempted solutions:**
1. ❌ Use nvm to switch versions (still mismatch)
2. ❌ Rebuild addons (missing dependencies)
3. ✅ Use exact Node.js version in Docker

**Final solution:** Pin Node.js v20.9.0 in Docker build

#### Error 4: Wayland Display Not Found
**Error:**
```
ERROR: Cannot connect to Wayland display
ERROR: WAYLAND_DISPLAY not set
```

**Root cause:**
- Applications connecting to system Wayland, not compositor
- Socket path not accessible
- Environment variables not set correctly

**Attempted solutions:**
1. ❌ Set WAYLAND_DISPLAY manually (wrong socket)
2. ❌ Copy socket to different location (permission denied)
3. ⚠️ Use XWayland (works but not ideal)

**Final solution:** This is a known limitation - applications must be launched by compositor

#### Error 5: Canvas Timing Issues
**Error:**
```
ERROR: Canvas not found
ERROR: initScene failed - canvas undefined
```

**Root cause:**
- Canvas created after Greenfield initialized
- React component lifecycle timing
- Async initialization race condition

**Attempted solutions:**
1. ❌ Use setTimeout (unreliable)
2. ❌ Use useEffect dependencies (still racy)
3. ✅ Render canvas FIRST, then initialize

**Final solution:** SIMPLE_WAYOUT's canvas-first architecture

#### Error 6: WebSocket Double-Slash Bug
**Error:**
```
ERROR: WebSocket path //mkfifo not found
ERROR: Cannot read property of undefined
```

**Root cause:**
- Base URL had trailing slash: `ws://localhost:8081/`
- Path concatenation: `base + '/mkfifo'` = `//mkfifo`
- Server expected `/mkfifo`, got `//mkfifo`

**Attempted solutions:**
1. ❌ Fix client-side URL construction (server still broken)
2. ❌ Fix server-side path matching (client still broken)
3. ✅ Fix base URL default (no trailing slash)

**Final solution:** Restore default base URL to `ws://localhost:8081` (no trailing slash)

#### Error 7: WASM Module Incomplete
**Error:**
```
ERROR: _xkb_context_new is not a function
ERROR: lengthBytesUTF8 is not defined
ERROR: HEAP8 is not defined
```

**Root cause:**
- WASM module stub was incomplete
- Missing 50+ Emscripten functions
- No memory management functions

**Attempted solutions:**
1. ❌ Use real WASM (compilation too complex)
2. ❌ Minimal stubs (still missing functions)
3. ✅ Complete stub implementation

**Final solution:** Implement all 50+ required functions as stubs

---

## Part 5: Why Docker Image Is Preferred

### Advantages of Docker Approach

#### 1. Reproducible Builds
**Problem:** "Works on my machine" syndrome
**Solution:** Docker ensures same environment everywhere

**Example:**
```dockerfile
FROM debian:bookworm-20240904-slim
# Everyone gets exact same base
```

#### 2. Dependency Management
**Problem:** Complex dependency tree with version conflicts
**Solution:** Docker installs everything in correct order

**Example:**
```dockerfile
RUN apt-get install -y \
    libgstreamer1.0-dev=1.20.3-0 \
    # Exact versions locked
```

#### 3. Build Caching
**Problem:** Rebuilding everything takes 20+ minutes
**Solution:** Docker caches each layer

**Example:**
```
Step 5/20 : RUN apt-get install... (CACHED)
Step 6/20 : RUN git clone...      (CACHED)
Step 7/20 : RUN yarn build        (2 minutes)
```

#### 4. Isolation
**Problem:** Build tools conflict with system packages
**Solution:** Docker isolates build environment

**Example:**
```
Container: GStreamer 1.20 (custom build)
Host: GStreamer 1.18 (system package)
No conflict!
```

#### 5. Portability
**Problem:** Different Linux distributions have different packages
**Solution:** Docker works everywhere

**Example:**
```
Ubuntu 20.04: ✅ Works
Ubuntu 22.04: ✅ Works
Debian 11:    ✅ Works
Arch Linux:   ✅ Works
```

### Disadvantages of Building Locally

#### 1. System Pollution
Installing build dependencies pollutes your system:
```bash
# These stay on your system forever:
apt-get install build-essential cmake ninja-build meson \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-bad1.0-dev libgraphene-1.0-dev \
    # ... 50+ more packages
```

#### 2. Version Conflicts
System packages may conflict:
```
Your system: libwayland-server0 (1.20.0)
Greenfield needs: libwayland-server0 (custom patched)
Result: Conflict!
```

#### 3. Hard to Reproduce
Different systems have different results:
```
Developer A: Ubuntu 22.04 - Works
Developer B: Ubuntu 20.04 - Fails (old GStreamer)
Developer C: Debian 11 - Fails (old meson)
```

#### 4. Time Consuming
Every developer must:
- Install all dependencies (30+ minutes)
- Build GStreamer (20 minutes)
- Build Greenfield (15 minutes)
- Debug issues (hours)

With Docker:
- Pull image (5 minutes)
- Run (instant)

#### 5. Maintenance Burden
When dependencies update:
- Everyone must update their system
- Everyone must rebuild
- Everyone may hit different issues

With Docker:
- Update Dockerfile once
- Push new image
- Everyone pulls new image

---

Continue to Part 3...
