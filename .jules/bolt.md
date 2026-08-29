## 2024-05-24 - [Throttling High-Frequency Updates]
**Learning:** High-frequency events (like mousemove and requestAnimationFrame for non-essential visuals like blurred Ambilight) cause unnecessary CPU/GPU load and main-thread blocking if not throttled.
**Action:** Always throttle non-critical high-frequency operations. Use timestamp checks in requestAnimationFrame loops to target ~30fps for visual effects that don't benefit from higher framerates. Use debounce/throttle patterns for frequent DOM events like mousemove.
## 2024-05-24 - Hardware-Accelerated Animations
**Learning:** Using `transition: all` is a common anti-pattern that can lead to significant performance drops (jank) because it forces the browser to recalculate and transition properties that might trigger expensive layout changes or repaints, even if only visually lightweight properties like opacity or transform were intended to change.
**Action:** Always specify exact transition properties, prioritizing GPU-accelerated ones like `transform`, `opacity`, `color`, and `background-color`. Replaced `transition: all` across multiple core UI elements (`.controls-pill`, `.top-bar`, `.btn-icon`, `#lobbyScreen`) with specific hardware-friendly properties.
## 2024-05-24 - [Safe Third-Party API Calls]
**Learning:** Calling methods on third-party integration objects (like `ytPlayer` for YouTube) without checking if those methods exist can lead to runtime errors, particularly during initialization phases or if the API changes.
**Action:** Always verify that a function exists (`typeof obj.method === 'function'`) before calling it on any external or dynamically loaded object. Applied this to YouTube player volume controls (`mute` and `unMute`).
## 2026-08-29 - Implement Rate Limiting for Redundant Network Sync Requests
**Learning:** Preventing redundant broadcast loops or multi-peer request spam can often be achieved with simple timestamp-based debouncing or rate-limiting within event handlers.
**Action:** When working on networking or WebRTC event handling, actively look for request handlers that trigger 'broadcastAll' actions and ensure they have rate-limits to protect against spam.
## 2026-08-29 - Clean up workspace scripts
**Learning:** Do not commit temporary throwaway workspace scripts (like python fix scripts) into the main production codebase repository.
**Action:** Always use `git status` or `git diff --cached` before committing to ensure no unintended files are included, and manually remove temporary artifacts.
