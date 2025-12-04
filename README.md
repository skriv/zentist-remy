# Remy Component

Remy is a compact animated agent icon (20×20) with three modes:

- **Follow** – Eyes track the cursor, border and eyes cycle smoothly through colors.
- **Think** – Same as Follow, but with a dashed rotating stroke to indicate activity.
- **Idle** – Static color; eyes smoothly drift back to center, blinking continues.

This bundle was generated from the `remy.html` demo file and split into:
- `remy.js`  – The Remy class implementation (no HTML, no layout).
- `remy.css` – Styling, theme tokens, and animations.
- `demo.html` – A working demo page wiring everything together.

## Quick Start

1. Include the CSS and JS:

```html
<link rel="stylesheet" href="remy.css">
<script src="remy.js"></script>
```

2. Add a container:

```html
<div id="remy1"></div>
```

3. Initialize Remy:

```html
<script>
  const remy1 = new Remy({
    container: "#remy1",
    palette: {
      light: {
        followColor: "#617280",
        idleColor:   "#657C89",
        cycleColors: ["#155DFC", "#E7000B", "#19C37D"]
      },
      dark: {
        followColor: "#C9D3DD",
        idleColor:   "#4B5D70",
        cycleColors: ["#38BDF8", "#FB7185", "#4ADE80"]
      }
    }
  });

  remy1.setMode("follow"); // "follow" | "thinking" | "idle"
</script>
```

## Theme Handling

Remy respects:

- Explicit `data-theme="light"` or `data-theme="dark"` on the `<html>` element.
- Otherwise, falls back to `prefers-color-scheme` (system theme).

If you change the theme dynamically, call:

```js
remy1.handleThemeChange();
```

or use the global helper logic from `demo.html`, which updates all instances via `window.__remyInstances`.

## Demo

Open `demo.html` in a browser to see:

- Live Follow / Think / Idle mode switching.
- Page-wide theme toggle: Auto / Light / Dark.
