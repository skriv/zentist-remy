# Remy AI Agent Icon Component

Remy is a compact animated agent icon (20×20 internal coordinate system, scalable via container size)
with three modes:

- **Follow** – Eyes track the cursor, border and eyes cycle smoothly through colors.
- **Think** – Same as Follow, but with a dashed rotating stroke to indicate activity.
- **Idle** – Static color; eyes smoothly drift back to center, blinking continues.

This bundle is the scaled version where the SVG uses `viewBox="0 0 20 20"`
and fills its wrapper. The default wrapper is 24×24, but you can change the size
by changing the wrapper dimensions.

## Files

- `remy.js`  – Remy class implementation (Follow / Think / Idle, theme-aware).
- `remy.css` – Styles, theme tokens, and animations. Includes scalable sizing.
- `demo.html` – Working demo with mode buttons and theme toggle.

## Quick Start

```html
<link rel="stylesheet" href="remy.css">
<script src="remy.js"></script>

<div id="remy1" style="width:24px; height:24px;"></div>

<script>
  const remy1 = new Remy({
    container: "#remy1"
  });

  remy1.setMode("follow"); // "follow" | "thinking" | "idle"
</script>
```

To change the size of Remy, just change the container dimensions:

```html
<div id="remyLarge" style="width:40px; height:40px;"></div>
```

The SVG will automatically scale to 100% of the wrapper.
