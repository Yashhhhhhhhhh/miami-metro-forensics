## 2024-05-24 - [Throttling High-Frequency Updates]
**Learning:** High-frequency events (like mousemove and requestAnimationFrame for non-essential visuals like blurred Ambilight) cause unnecessary CPU/GPU load and main-thread blocking if not throttled.
**Action:** Always throttle non-critical high-frequency operations. Use timestamp checks in requestAnimationFrame loops to target ~30fps for visual effects that don't benefit from higher framerates. Use debounce/throttle patterns for frequent DOM events like mousemove.
## 2024-05-24 - Hardware-Accelerated Animations
**Learning:** Using `transition: all` is a common anti-pattern that can lead to significant performance drops (jank) because it forces the browser to recalculate and transition properties that might trigger expensive layout changes or repaints, even if only visually lightweight properties like opacity or transform were intended to change.
**Action:** Always specify exact transition properties, prioritizing GPU-accelerated ones like `transform`, `opacity`, `color`, and `background-color`. Replaced `transition: all` across multiple core UI elements (`.controls-pill`, `.top-bar`, `.btn-icon`, `#lobbyScreen`) with specific hardware-friendly properties.
## 2026-08-29 - Multi-Peer Audio Element Robustness
**Learning:** Autoplay policies and varying browser support (like Safari needing `webkitAudioContext` and `playsInline`) can break dynamically created audio elements for incoming streams without throwing clear application-level errors unless explicitly handled.
**Action:** Always wrap `.play()` calls in a `.catch()` block when handling streams and instantiate `AudioContext` using the fallback `(window.AudioContext || window.webkitAudioContext)` to ensure maximum compatibility.
