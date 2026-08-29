## 2024-05-24 - [Throttling High-Frequency Updates]
**Learning:** High-frequency events (like mousemove and requestAnimationFrame for non-essential visuals like blurred Ambilight) cause unnecessary CPU/GPU load and main-thread blocking if not throttled.
**Action:** Always throttle non-critical high-frequency operations. Use timestamp checks in requestAnimationFrame loops to target ~30fps for visual effects that don't benefit from higher framerates. Use debounce/throttle patterns for frequent DOM events like mousemove.
## 2024-05-24 - [Prevent Layout Thrashing in Drag Events]
**Learning:** Calling getBoundingClientRect() inside a mousemove or touchmove handler forces synchronous layout calculations, causing layout thrashing.
**Action:** Cache bounding box measurements on mousedown/touchstart and reuse the cached values during the high-frequency move events.
## 2024-05-24 - [Eliminating Forced Synchronous Reflows]
**Learning:** Forcing a reflow by reading layout properties (like `offsetHeight` or `scrollHeight`) immediately after DOM insertion blocks the main thread unnecessarily.
**Action:** Use double `requestAnimationFrame` to trigger CSS transitions cleanly without blocking layout, and batch DOM scroll updates.
