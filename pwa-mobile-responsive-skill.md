---
title: Building Dynamically Mobile-Responsive Progressive Web Apps
description: Best practices for building PWAs that adapt fluidly across the full spectrum of Android and iOS mobile screens — from small phones to large tablets. Covers viewport handling, safe areas, responsive CSS architecture, touch UX, display modes, offline resilience, performance budgets, and testing strategy.
skill_type: guide
---

# Building Dynamically Mobile-Responsive Progressive Web Apps

## When to Use This Skill

Load this when you are asked to:
- Design or review the responsive architecture of a PWA targeting Android and iOS.
- Diagnose layout breakage on specific mobile viewport sizes.
- Set up a web app manifest, display modes, or safe-area handling for mobile installability.
- Establish a performance budget or offline strategy for a field-deployed PWA.
- Audit whether a PWA meets the bar for "app-like" feel on mobile.

---

## 1. Viewport — The Foundation

Nothing downstream works if the viewport is not set correctly.

### Must-have meta tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

| Token | Purpose |
|---|---|
| `width=device-width` | Matches CSS pixels to the device's logical viewport width. |
| `initial-scale=1` | Prevents iOS from zooming out to fit the page. |
| `viewport-fit=cover` | Required for iOS safe-area insets (see §3). |

**Do not** set `maximum-scale=1` or `user-scalable=no` unless you have a compelling accessibility-reviewed reason — this breaks users with low vision.

---

## 2. The `100vh` Problem and the Fix

On mobile browsers, `100vh` includes the address bar height, causing content to be cut off when the bar collapses.

**Preferred approaches (pick one):**

```css
/* Option A: modern custom property (Chrome 108+, Safari 15.4+) */
html {
  height: 100vh;
  height: 100dvh;  /* dynamic viewport height */
}

/* Option B: JS-driven CSS custom property (all browsers) */
:root {
  --vh: 1vh;
}
window.addEventListener('resize', () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
});

/* Usage */
.fullscreen {
  height: calc(var(--vh, 1vh) * 100);
}
```

`dvh` (dynamic viewport height) is the long-term answer; the JS fallback covers older iOS and Android WebViews today.

---

## 3. Safe Areas (Notch, Dynamic Island, Home Indicator)

iOS 11+ exposes `env(safe-area-inset-*)`. Combine with `viewport-fit=cover` and a padding wrapper.

```css
.ios-safe {
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
}

/* Useful for fixed-position bottom sheets / tab bars */
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

Android does not expose safe-area env vars yet, but uses `windowInsets` via the Android WebView. For PWAs running in Chrome on Android, standard content within the viewport is not obscured by system bars — safe-area padding is primarily an iOS concern today.

**Add safe-area CSS metadata to your manifest:**

```json
{
  "display": "standalone",
  "safeArea": {
    "top": "env(safe-area-inset-top)",
    "bottom": "env(safe-area-inset-bottom)"
  }
}
```

---

## 4. Fluid, Context-Aware Responsive Architecture

### 4.1 Container Queries Over Media Queries (where possible)

Component-level responsiveness with container queries means a card works correctly inside a sidebar, a grid, or a full-width row without rewriting media queries.

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 200px 1fr; }
}
@container (max-width: 399px) {
  .card { display: flex; flex-direction: column; }
}
```

Fall back to media queries for page-level layout (shell, nav).

### 4.2 Fluid Typography with `clamp()`

Replace fixed media-query breakpoints for font sizes with `clamp()`:

```css
html {
  font-size: clamp(14px, 1.2vw + 0.5rem, 18px);
}

h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}
```

### 4.3 Breakpoint Strategy

Use a **mobile-first** approach — default styles for the smallest screen, then layer in complexity. A practical set:

| Name | Min-width | Typical devices |
|---|---|---|
| `sm` | 0px | Phones (default) |
| `md` | 640px | Large phones / small tablets portrait |
| `lg` | 768px | Tablets portrait |
| `xl` | 1024px | Tablets landscape / small desktop |

Avoid targeting specific device dimensions (e.g. "iPhone 14 width"); target layout **needs**, not devices.

### 4.4 Logical CSS Properties

Use logical (flow-relative) properties so RTL and vertical writing modes work automatically:

```css
/* Instead of: margin-left, padding-right, border-top */
padding-inline-start: 1rem;
margin-block-end: 2rem;
border-block-start: 2px solid #ccc;
```

---

## 5. Touch UX — Designing for Fingers, Not Mice

### 5.1 Minimum Touch Target Size

Apple HIG and Material Design both require a minimum interactive target of **44 × 44 dp / 48 × 48 CSS px**. Do not make the visible element that small; pad the hit area.

```css
.icon-button {
  width: 24px;
  height: 24px;
  /* Expand the hit area */
  padding: 12px;
  margin: -12px;
}
```

### 5.2 Hover Fallbacks

Hover does not exist on touch. Design every hover state so there is a non-hover equivalent (e.g., persistent active state, toggle, or bottom sheet).

```css
/* Good: hover enhances, not required */
.card:hover { transform: translateY(-4px); }
.card:active { transform: translateY(-2px); } /* touch feedback */

/* Bad: hover reveals content with no touch alternative */
.dropdown:hover .menu { display: block; } /* BLOCKED on touch */
```

### 5.3 Pull-to-Refresh and Overscroll

By default, Chrome on Android triggers pull-to-refresh at the document body level. Disable it intentionally if it conflicts with your UX:

```css
body {
  overscroll-behavior-y: contain; /* prevent pull-to-refresh on body */
}
```

Disable iOS-style "bounce" only if it causes bugs; it is a familiar native feel.

### 5.4 Scroll Performance

```css
/* Force GPU compositing for scroll-heavy elements */
.scroll-container {
  will-change: transform;
  -webkit-overflow-scrolling: touch; /* legacy iOS; mostly moot in modern WebKit */
}
```

Avoid `overflow: scroll` on deeply nested elements on iOS — can cause intermittent scroll-jank.

---

## 6. PWA Manifest — App-Like Installation and Display

### 6.1 Minimal manifest.json

```json
{
  "name": "My App",
  "short_name": "MyApp",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "New post",
      "url": "/compose",
      "icons": [{ "src": "/icons/compose.png", "sizes": "96x96" }]
    }
  ]
}
```

**iOS-specific:** Apple ignores `orientation` and uses `apple-mobile-web-app-capable`. Ensure you also set:

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="MyApp">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

### 6.2 Display Modes

| Value | Behavior |
|---|---|
| `fullscreen` | No browser chrome; best for games. |
| `standalone` | No URL bar, but keeps system status bar. **Default for PWAs.** |
| `minimal-ui` | Minimal chrome with some navigation controls. Legacy; avoid. |
| `browser` | Standard tabbed browser. Use as fallback. |

Always test in all three: installed standalone, homescreen shortcut (iOS), and regular browser tab.

---

## 7. Responsive Images and Assets

### 7.1 Art Direction with `<picture>`

```html
<picture>
  <source media="(min-width: 768px)" srcset="hero-desktop.webp">
  <source media="(max-width: 767px)" srcset="hero-mobile.webp">
  <img src="hero-mobile.webp" alt="..." decoding="async">
</picture>
```

### 7.2 Resolution Switching

```html
<img
  src="icon-192.png"
  srcset="icon-192.png 1x, icon-384.png 2x"
  alt=""
  width="192"
  height="192"
>
```

### 7.3 `content-visibility` for Long Lists

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 80px; /* estimated row height */
}
```

This lets the browser skip rendering off-screen list items, dramatically reducing time-to-interactive on long feeds.

---

## 8. Offline and Resilience Strategy

### 8.1 Service Worker Caching Strategy (Pragmatic Three-Tier)

```javascript
// Cache shell assets: app shell, CSS, JS bundles, manifest
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. App shell: cache-first (instant on revisit)
  if (request.destination === 'document' ||
      url.pathname.match(/\.(js|css|woff2|png|jpg|ico)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 2. API calls: network-first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 3. Images: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});
```

**Strategy summary:**

| Asset type | Strategy | Rationale |
|---|---|---|
| Shell (HTML/CSS/JS, manifest) | Cache-first | Offline installability, instant load |
| API reads | Stale-while-revalidate | Show cached data, refresh in background |
| API writes | Network-only | Never lose user data |
| Images | Stale-while-revalidate | Show instantly, update silently |

### 8.2 Skeleton Screens

Show skeleton placeholders (not spinners) while content loads. Spinners imply failure; skeletons imply "filling in."

```css
.skeleton {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
```

Use container queries to make skeletons match their card's column/reflow layout.

---

## 9. Performance Budgets for Mobile

Core Web Vitals thresholds (Google's "Good" bar):

| Metric | Mobile threshold | Why it matters for PWA |
|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5 s | First perceptual load |
| FID (First Input Delay) | ≤ 100 ms | Tap responsiveness |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | Tap target reliability |
| TTI (Time to Interactive) | ≤ 5 s | PWA feel threshold |

### Mobile-specific budget caps

- **JS bundle gzipped:** ≤ 150 KB (initial), ≤ 50 KB per route chunk
- **CSS:** ≤ 50 KB gzipped
- **Largest image:** ≤ 100 KB; use AVIF/WebP with JPEG fallback
- **Fonts:** Subset to required glyphs; use `font-display: swap;` to avoid FOIT
- **Third-party scripts:** Budget ≤ 50 KB total; lazy-load analytics

```css
/* Prevent layout shift from late-loading fonts */
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont.woff2') format('woff2');
  font-display: swap;
  size-adjust: 100%;
}
```

---

## 10. Accessibility — Mobile Is Mainstream, Not Edge Case

- **Color contrast:** WCAG AA — 4.5:1 for normal text, 3:1 for large text.
- **Focus indicators:** Must be visible; on touch, focus appears on tap — design for it.
- **Screen readers:** VoiceOver (iOS) and TalkBack (Android) navigate differently; test with both.
- **Reduced motion:** Respect `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- **Dark mode:** Use `prefers-color-scheme` and ensure the theme color in the manifest also updates.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --text: #f1f5f9;
    --accent: #60a5fa;
  }
}
```

---

## 11. iOS- vs Android-Specific Quirks

| Quirk | Platform | Mitigation |
|---|---|---|
| `100vh` includes address bar | iOS Safari | Use `dvh` or JS-based `--vh` variable |
| Safe area insets not applied in some WebView configs | iOS | Test in real-app WebView, not just Safari |
| Pull-to-refresh conflicts with in-app scroll | Chrome Android | `overscroll-behavior-y: contain` on body |
| Overscroll "bounce" causes layout shift | iOS | Test with actual device; avoid fixed footer overlays |
| Dynamic Island / notch covering top UI | iOS 14+ | `env(safe-area-inset-top)` in manifest + CSS |
| Home indicator covers bottom nav | iOS 12+ | `env(safe-area-inset-bottom)` padding on nav |
| Font rendering smaller than set size | iOS | Avoid `text-size-adjust: none`; allow user font scaling |
| Tap highlighting (gray flash) | Both | `-webkit-tap-highlight-color: transparent;` if desired |

---

## 12. Testing Strategy

### Device Coverage Matrix

| Category | Minimum to test |
|---|---|
| Small phone | iPhone SE (375 × 667 dp) / Android 5" phone |
| Medium phone | iPhone 14 Pro (393 × 852 dp) / Pixel 7 |
| Large phone / foldable inner | iPhone 14 Pro Max (430 × 932) / Foldable |
| Tablet | iPad (810 × 1080) / Android 10" tablet |
| Desktop | 1280 × 800 at minimum |

### Toolchain

- **Lighthouse** (Chrome DevTools): PWA score, Core Web Vitals — run on throttled mobile profile.
- **WebPageTest:** Real device labs (Android, iOS) with filmstrip view for perceived performance.
- **Xcode Simulator + Safari Web Inspector:** Essential for iOS WebView debugging.
- **Android Studio Emulator + Chrome remote debugging:** Android WebView.
- **Real device lab services:** BrowserStack, Sauce Labs for browser + OS matrix.
- **Responsive Design Mode** (Firefox DevTools): Excellent for viewport edge cases.
- **RUM (Real User Monitoring):** Field data beats synthetic — hook into Analytics or Sentry.

### Checklist Before Shipping

```
[ ] Viewport meta tag correct and no forced-zoom
[ ] `dvh` fallback in place (or JS polyfill)
[ ] Safe-area padding applied for iOS notch / home indicator
[ ] All interactive targets ≥ 44 × 44 dp
[ ] No hover-only interactions
[ ] Manifest: name, icons (192 + 512 + maskable), theme_color
[ ] `<link rel="manifest">` and Apple touch icons present
[ ] Service worker registered with working offline fallback
[ ] Skeleton screens / offline UI state tested
[ ] Core Web Vitals pass on throttled 4G mid-tier hardware
[ ] Tested on real iOS Safari + Android Chrome (not just emulators)
[ ] Dark mode and reduced motion media queries respected
[ ] ARIA labels on icon-only buttons
```

---

## 13. Recommended Tooling and Libraries

| Use case | Tool / Library |
|---|---|
| Service worker boilerplate | Workbox (Google) |
| PWA manifest generation | `vite-plugin-pwa`, `@angular/pwa`, `next-pwa` |
| Container query polyfill | `container-query-polyfill` (for older browsers) |
| Responsive image transform | `<source srcset>` + `sizes` + Cloudinary / Imgix |
| Scroll performance audit | Lighthouse "Avoid large DOM" / "DOOM" count |
| Visual regression | Playwright + Percy or Chromatic |
| Mobile touch testing | Playwright (`page.tap()`), Detox (React Native hybrid) |

---

## 14. Decision Guide: PWA vs Native Wrapper

| Consideration | PWA | Capacitor / TWA wrapper |
|---|---|---|
| Single codebase | ✅ | ✅ |
| App store presence | ❌ | ✅ |
| Push notifications on iOS | ✅ (limited) | ✅ (full) |
| Background sync | Partial | Partial |
| Access to native APIs | CSS/JS APIs only | All plugin APIs |
| Update control | Instant | Review queue |
| Best for | General content, SaaS, catalogs | Apps needing deep native integration |

If app store presence is a hard requirement, wrap the same codebase in **Capacitor** (iOS + Android) or **Trusted Web Activity** (Android only). The responsive CSS and PWA manifest you built still apply unchanged.

---

> **Sources and grounding:** This skill draws on first-party documentation from MDN Web Docs (PWA guides, Responsive Design module), web.dev (Learn PWA — App design, Foundations, CSS best practices), Web Fundamentals (Google), Apple Human Interface Guidelines (iOS safe areas, touch targets), Material Design guidelines (Android touch target sizes), and the Web App Manifest specification (W3C). Community signals referenced: React GitHub issue #17258 on iOS WKWebView `onClick`, and GitHub repository search patterns for PWA + mobile responsive work.
