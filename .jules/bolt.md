## 2024-05-24 - [Throttling High-Frequency Updates]
**Learning:** High-frequency events (like mousemove and requestAnimationFrame for non-essential visuals like blurred Ambilight) cause unnecessary CPU/GPU load and main-thread blocking if not throttled.
**Action:** Always throttle non-critical high-frequency operations. Use timestamp checks in requestAnimationFrame loops to target ~30fps for visual effects that don't benefit from higher framerates. Use debounce/throttle patterns for frequent DOM events like mousemove.
## 2024-05-24 - Hardware-Accelerated Animations
**Learning:** Using `transition: all` is a common anti-pattern that can lead to significant performance drops (jank) because it forces the browser to recalculate and transition properties that might trigger expensive layout changes or repaints, even if only visually lightweight properties like opacity or transform were intended to change.
**Action:** Always specify exact transition properties, prioritizing GPU-accelerated ones like `transform`, `opacity`, `color`, and `background-color`. Replaced `transition: all` across multiple core UI elements (`.controls-pill`, `.top-bar`, `.btn-icon`, `#lobbyScreen`) with specific hardware-friendly properties.
<<<<<<< HEAD

## 2026-08-29 - Seamless mute toggle memory
**Learning:** In continuous control inputs like volume sliders, tracking previous states must happen actively on the `input` event (if value > 0) to ensure external toggles (like a mute button) can correctly revert to the last meaningful interaction, rather than getting stuck at 0.
**Action:** When implementing mute toggles paired with sliders, always bind the state tracking and UI element visibility updates directly to the slider's `input` event to capture intermediate values reliably before reaching zero.
=======
## 2024-05-24 - [Safe Third-Party API Calls]
**Learning:** Calling methods on third-party integration objects (like `ytPlayer` for YouTube) without checking if those methods exist can lead to runtime errors, particularly during initialization phases or if the API changes.
**Action:** Always verify that a function exists (`typeof obj.method === 'function'`) before calling it on any external or dynamically loaded object. Applied this to YouTube player volume controls (`mute` and `unMute`).
>>>>>>> origin/main
