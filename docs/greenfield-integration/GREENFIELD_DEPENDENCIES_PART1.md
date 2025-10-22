# Greenfield Native Dependencies - Part 1: Overview & Build History

## Executive Summary

The Greenfield compositor-proxy requires **extensive native C/C++ libraries** that are extremely difficult to build and integrate. After analyzing the complete build history from TEST_LOGS and git commits, this document explains:

1. **What libraries are required** and why
2. **Why building them is so complex**
3. **Why using the Docker image is strongly recommended**
4. **Whether integration into SIMPLE_WAYOUT is feasible**

## Critical Finding

**⚠️ The compositor-proxy CANNOT be easily integrated into SIMPLE_WAYOUT** because it requires:
- 3 custom-built native Node.js addons (.node files)
- 3 custom-built shared libraries (.so files)
- Patched Wayland server implementation
- GStreamer with specific plugins and configurations
- Complex build toolchain (CMake, Ninja, Meson)
- Linux-specific system libraries

**Recommendation:** Use the pre-built Docker image approach (current implementation).

---

## Part 1: Required Native Libraries

### 1. Core Native Addons (Node.js C++ Modules)

These are **custom-built** C/C++ modules that Node.js loads directly:

#### a) `wayland-server-addon.node`
**Purpose:** Provides Node.js bindings to the Wayland server protocol
**Source:** `packages/compositor-proxy/native/wayland/src/node-addon/wayland-server-addon.c`
**Dependencies:**
- libwayland-server.so.0 (custom patched version)
- libwestfield.so (custom library)
- libffi (system library)
- pthreads

**What it does:**
- Creates Wayland display and event loop
- Manages Wayland clients (native applications)
- Handles Wayland protocol messages
- Provides file descriptor management
- Manages shared memory buffers

**Why it's complex:**
- Uses custom patched Wayland server (not standard libwayland)
- Requires deep understanding of Wayland protocol
- Manages low-level file descriptors and sockets
- Handles inter-process communication

#### b) `proxy-encoding-addon.node`
**Purpose:** Video encoding for streaming application windows
**Source:** `packages/compositor-proxy/native/encoding/src/node_encoder.c`
**Dependencies:**
- libproxy-encoding.so (custom library)
- GStreamer 1.0+ with specific plugins
- libgraphene (graphics library)
- EGL (OpenGL ES interface)
- OpenGL 3.3+
- libgbm (Generic Buffer Management)
- libdrm (Direct Rendering Manager)

**What it does:**
- Captures application window buffers
- Encodes video frames (H.264, NVENC, VAAPI)
- Manages GPU memory and DMA buffers
- Handles hardware acceleration
- Streams encoded frames to browser

**Why it's complex:**
- Requires GPU access (/dev/dri/renderD128)
- Uses DMA-BUF for zero-copy buffer sharing
- Needs specific GStreamer plugins compiled with correct options
- Hardware-specific encoding (NVIDIA, Intel, AMD)
- Complex memory management

#### c) `proxy-poll-addon.node`
**Purpose:** Event loop integration for file descriptor polling
**Source:** `packages/compositor-proxy/native/poll/src/poll.c`
**Dependencies:**
- Standard C library (libc)
- Linux epoll/poll system calls

**What it does:**
- Integrates Wayland event loop with Node.js event loop
- Monitors file descriptors for events
- Handles non-blocking I/O
- Manages timeouts and callbacks

**Why it's needed:**
- Wayland uses file descriptors for everything
- Node.js needs to know when Wayland has events
- Prevents blocking the Node.js event loop

### 2. Custom Shared Libraries

These are **custom-built** shared libraries that the addons depend on:

#### a) `libwayland-server.so.0`
**Purpose:** Patched Wayland server implementation
**Source:** `packages/compositor-proxy/native/wayland/src/wayland-server/`
**Size:** ~200KB
**Why custom:**
- Standard libwayland doesn't support remote clients
- Greenfield patches add WebSocket support
- Modified to work without X11/Wayland compositor
- Custom event handling for browser integration

**Patches applied:**
```c
// From changes.diff
- Standard socket handling
+ WebSocket-compatible socket handling
- Local Unix sockets only
+ Network socket support
- Standard event loop
+ Node.js-compatible event loop
```

#### b) `libwestfield.so`
**Purpose:** Greenfield-specific Wayland extensions
**Source:** `packages/compositor-proxy/native/wayland/src/westfield-*.c`
**Size:** ~150KB
**What it provides:**
- DMA-BUF support for zero-copy buffers
- EGL integration for GPU rendering
- XWayland support (X11 apps on Wayland)
- Custom buffer management
- DRM format handling

**Why it's needed:**
- Standard Wayland doesn't have these features
- Required for GPU acceleration
- Enables hardware video encoding
- Supports X11 applications

#### c) `libproxy-encoding.so`
**Purpose:** Video encoding implementation
**Source:** `packages/compositor-proxy/native/encoding/src/`
**Size:** ~100KB
**Dependencies:**
- GStreamer 1.18+ (gstreamer-1.0, gstreamer-app-1.0, gstreamer-video-1.0, gstreamer-gl-1.0)
- libgraphene-1.0
- EGL
- OpenGL
- libgbm
- libdrm

**What it does:**
- Initializes GStreamer pipelines
- Configures video encoders (x264, nvh264, vaapih264)
- Manages encoding parameters (bitrate, framerate, quality)
- Handles buffer conversion and color space
- Implements frame callbacks

---

## Part 2: System Dependencies

### Required System Libraries

These must be installed on the system:

#### Graphics Stack
```
libegl1-mesa (or libegl1)
libgl1-mesa-glx (or libgl1)
libgles2-mesa (or libgles2)
libgbm1
libdrm2
libglvnd0
libglx0
libglapi-mesa
```

#### Wayland
```
libwayland-client0
libwayland-server0 (replaced by custom version)
libwayland-egl1-mesa
```

#### GStreamer (Critical!)
```
libgstreamer1.0-0 (>= 1.18)
libgstreamer-plugins-base1.0-0
libgstreamer-plugins-good1.0-0
libgstreamer-plugins-bad1.0-0
libgstreamer-plugins-ugly1.0-0
gstreamer1.0-plugins-base
gstreamer1.0-plugins-good
gstreamer1.0-plugins-bad
gstreamer1.0-plugins-ugly
gstreamer1.0-gl
gstreamer1.0-libav
```

**Why GStreamer is critical:**
- Provides video encoding (H.264, VP8, VP9)
- Hardware acceleration support (NVENC, VAAPI, OMX)
- Format conversion and scaling
- Complex plugin system with many dependencies

#### Other Dependencies
```
libffi8
libgraphene-1.0-0
libudev1
libinput10
libosmesa6
xwayland (for X11 app support)
xauth
xxd
inotify-tools
```

### Build-Time Dependencies

To compile the native addons, you need:

```
build-essential (gcc, g++, make)
cmake (>= 3.13)
ninja-build
pkg-config
python3
git
meson (>= 0.61)
flex
bison
liborc-0.4-dev-bin
```

Plus development headers for all runtime libraries:
```
libffi-dev
libudev-dev
libgbm-dev
libdrm-dev
libegl-dev
libopengl-dev
libglib2.0-dev
libgstreamer1.0-dev
libgstreamer-plugins-base1.0-dev
libgstreamer-plugins-bad1.0-dev
libgraphene-1.0-dev
```

---

## Part 3: Why Building Is So Complex

### 1. GStreamer Build Complexity

**The Problem:**
GStreamer must be built from source with specific options to enable all required plugins.

**From `compositor-proxy-cli-build.sh`:**
```bash
git clone --depth 1 --branch 1.20 https://gitlab.freedesktop.org/gstreamer/gstreamer.git
cd gstreamer
meson build \
    --buildtype=release \
    --strip \
    -Dgpl=enabled \
    -Dorc=enabled \
    -Dbase=enabled \
    -Dgood=enabled \
    -Dbad=enabled \
    -Dugly=enabled \
    -Dauto_features=disabled \
    -Dgst-plugins-base:app=enabled \
    -Dgst-plugins-base:gl=enabled \
    -Dgst-plugins-base:gl-graphene=enabled \
    -Dgst-plugins-base:gl_winsys=egl \
    -Dgst-plugins-base:gl_api=opengl \
    -Dgst-plugins-bad:gl=enabled \
    -Dgst-plugins-bad:nvcodec=enabled
ninja -C build
```

**Why this is hard:**
- Takes 15-25 minutes to build
- Requires 2GB+ disk space
- Many dependencies must be exactly right
- Plugin configuration is complex
- Different for each hardware (NVIDIA, Intel, AMD)
- Easy to get wrong and hard to debug

**Errors encountered (from TEST_LOGS):**
```
ERROR: Dependency "gstreamer-gl-1.0" not found
ERROR: Plugin 'nvcodec' not found
ERROR: OpenGL headers not found
ERROR: EGL not available
```

### 2. Native Addon Build Issues

**The Problem:**
Building Node.js native addons requires exact version matching.

**From build history:**
```
Error: The module was compiled against a different Node.js version
Error: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.38' not found
Error: Cannot find module '../build/Release/wayland-server-addon.node'
```

**Why this happens:**
- Node.js ABI changes between versions
- System GLIBC version must match
- Build must be for exact architecture (x64, arm64)
- Paths must be exactly right

### 3. Wayland Server Patching

**The Problem:**
Standard libwayland doesn't work for remote clients.

**From `generate_patched_wayland_server.sh`:**
```bash
# Clone standard Wayland
git clone https://gitlab.freedesktop.org/wayland/wayland.git

# Apply Greenfield patches
patch -p1 < changes.diff

# Build patched version
meson build
ninja -C build
```

**What the patches do:**
- Modify socket handling for network support
- Change event loop for Node.js compatibility
- Add hooks for WebSocket integration
- Remove X11 dependencies

**Why you can't skip this:**
- Standard libwayland will not work
- Patches are essential for remote operation
- Must be compiled, not just installed

---

Continue to Part 2...
