## 2023-10-27 - Icon-only buttons accessibility pattern
**Learning:** Found a systemic issue where many critical icon-only UI controls (play, mute, sidebar toggle, mic toggle) and range inputs lacked basic ARIA labels or titles, rendering them opaque to screen readers. The application heavily utilizes SVG icons inside standard button elements.
**Action:** When adding new interactive components, especially media controls or sidebar toggles that rely on SVG icons, always pair them with an `aria-label` and `title` to ensure keyboard and screen reader accessibility from the start.
