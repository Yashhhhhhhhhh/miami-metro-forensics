## 2024-05-24 - [Throttling High-Frequency Updates]
**Learning:** High-frequency events (like mousemove and requestAnimationFrame for non-essential visuals like blurred Ambilight) cause unnecessary CPU/GPU load and main-thread blocking if not throttled.
**Action:** Always throttle non-critical high-frequency operations. Use timestamp checks in requestAnimationFrame loops to target ~30fps for visual effects that don't benefit from higher framerates. Use debounce/throttle patterns for frequent DOM events like mousemove.

## 2024-05-24 - Hardware-Accelerated Animations
**Learning:** Using `transition: all` is a common anti-pattern that can lead to significant performance drops (jank) because it forces the browser to recalculate and transition properties that might trigger expensive layout changes or repaints, even if only visually lightweight properties like opacity or transform were intended to change.
**Action:** Always specify exact transition properties, prioritizing GPU-accelerated ones like `transform`, `opacity`, `color`, and `background-color`. Replaced `transition: all` across multiple core UI elements (`.controls-pill`, `.top-bar`, `.btn-icon`, `#lobbyScreen`) with specific hardware-friendly properties.

## 2024-05-24 - [Safe Third-Party API Calls]
**Learning:** Calling methods on third-party integration objects (like `ytPlayer` for YouTube) without checking if those methods exist can lead to runtime errors, particularly during initialization phases or if the API changes.
**Action:** Always verify that a function exists (`typeof obj.method === 'function'`) before calling it on any external or dynamically loaded object. Applied this to YouTube player volume controls (`mute` and `unMute`).

## 2024-03-24 - Optimized DOM Updates in Playback Loops
**Learning:** Updating DOM element properties (like `textContent` or `classList`) on every frame or tick within high-frequency loops (like `setInterval` or `timeupdate` events), even with identical values, forces the browser to evaluate style recalculations, triggering minor but cumulative layout thrashing and painting.
**Action:** Always implement a caching mechanism (e.g., storing the previous formatted string or state) to conditionally update DOM properties only when the underlying value actually changes.

## 2024-03-24 - Optimized Sync.enforce DOM text layout updates
**Learning:** Similarly, when receiving state updates over WebRTC (via `Sync.enforce`), unconditionally updating DOM elements like textContent causes layout thrashing even if the time string hasn't changed.
**Action:** Add caching variables to ensure textContent assignments are skipped if the formatted string matches the previous frame.

## 2024-03-24 - Optimized Scrubber DOM style updates
**Learning:** Assigning `style.width` and `style.left` to elements in Javascript on every frame triggers complete browser layout recalculations and repaints, even if the resulting string evaluates to the exact same visual pixel position.
**Action:** Always read the style string value first and use a conditional check to verify if the percentage string has changed before assigning new values to `style.width` or `style.left`.

## 2024-03-24 - Throttled mousemove scrubber tracking
**Learning:** Directly executing functions that perform DOM reads (like `getBoundingClientRect()`) within high-frequency events (`mousemove`, `touchmove`, `scroll`) blocks the main thread because the browser evaluates it synchronously with the pointer events.
**Action:** Throttle such tracking logic using `requestAnimationFrame`, which executes just before the next repaint, perfectly aligning layout reads and writes without bogging down the event loop.

## 2024-03-24 - Optimized UI fade tracking
**Learning:** Calling `classList.add` unconditionally on every mousemove triggers layout evaluations even if the class already exists. Furthermore, arbitrary throttle timers like `Date.now() > 100` are misaligned with the browser's refresh rate.
**Action:** Use `requestAnimationFrame` for all high-frequency UI interactions to align with the browser paint cycle, and cache class states to prevent redundant `classList` additions.
