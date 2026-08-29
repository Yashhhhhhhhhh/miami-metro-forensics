## 2024-05-24 - [Throttling High-Frequency Updates]
**Learning:** High-frequency events (like mousemove and requestAnimationFrame for non-essential visuals like blurred Ambilight) cause unnecessary CPU/GPU load and main-thread blocking if not throttled.
**Action:** Always throttle non-critical high-frequency operations. Use timestamp checks in requestAnimationFrame loops to target ~30fps for visual effects that don't benefit from higher framerates. Use debounce/throttle patterns for frequent DOM events like mousemove.
