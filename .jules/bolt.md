## 2024-05-24 - [Throttling High-Frequency Updates]
**Learning:** High-frequency events (like mousemove and requestAnimationFrame for non-essential visuals like blurred Ambilight) cause unnecessary CPU/GPU load and main-thread blocking if not throttled.
**Action:** Always throttle non-critical high-frequency operations. Use timestamp checks in requestAnimationFrame loops to target ~30fps for visual effects that don't benefit from higher framerates. Use debounce/throttle patterns for frequent DOM events like mousemove.
## 2024-05-24 - [Prevent Layout Thrashing in Drag Events]
**Learning:** Calling getBoundingClientRect() inside a mousemove or touchmove handler forces synchronous layout calculations, causing layout thrashing.
**Action:** Cache bounding box measurements on mousedown/touchstart and reuse the cached values during the high-frequency move events.
## 2024-05-24 - [Eliminating Forced Synchronous Reflows]
**Learning:** Forcing a reflow by reading layout properties (like `offsetHeight` or `scrollHeight`) immediately after DOM insertion blocks the main thread unnecessarily.
**Action:** Use double `requestAnimationFrame` to trigger CSS transitions cleanly without blocking layout, and batch DOM scroll updates.
## 2024-05-24 - [Avoid Heavy Object Creation in Loops]
**Learning:** Creating new Audio objects dynamically inside WebRTC call streams (which can happen frequently during multi-peer reconnection bursts) blocks the main thread.
**Action:** Pre-allocate or reuse Audio elements using an object pool whenever possible.
## 2024-05-24 - [DOM Traversal and Caching]
**Learning:** Querying the DOM via document.getElementById repeatedly inside frequently called functions (like toast notifications) adds unnecessary CPU overhead.
**Action:** Cache static DOM elements in memory (e.g. inside a central UI object) during initialization and reference the cached node rather than querying the DOM tree.
## 2024-05-24 - [XSS Safety Over Micro-Optimizations]
**Learning:** Replacing safe DOM text node generation with string interpolation (`insertAdjacentHTML`) to save negligible DOM creation time exposes the application to severe XSS attacks.
**Action:** Never sacrifice security for micro-optimizations. Always use safe text assignment (`textContent`) for user-generated input.
