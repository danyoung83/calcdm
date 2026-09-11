# Magic Calculator

A working replica of the iOS 18 Calculator, built as a PWA, with a hidden force for magic routines. Opened from the Home Screen it looks and behaves like the real app.

Started from [andyjermann/fakecalc](https://github.com/andyjermann/fakecalc), which was a static screenshot. This version is a real calculator with the same pixel geometry, measured from that screenshot (iPhone 15 Pro Max).

## The secret

**Set the target number**
1. Type the number you want to force.
2. Long-press (hold ~0.7s) the orange history icon in the top left. The display clears to 0.
3. A tiny dark grey dot appears at the bottom left, just above the home indicator. That's how you know a target is set.

To clear the target, long-press the history icon while the display shows 0. The dot disappears.

You can also set it via URL, handy from an iOS Shortcut: `https://your-site.netlify.app/?t=1234`. The target survives relaunching the app until it's used or cleared.

**Perform**
1. Let the spectator type and calculate whatever they like.
2. When you want to end, press **+ twice** (or **− twice**). Nothing visible changes. The app now knows the difference between what's on screen and the target.
3. From now on, every key tap enters the next digit of that difference, regardless of which key is tapped. Once the difference is fully entered, extra taps do nothing.
4. Press **=**. The target appears.

After the force fires, the target is cleared and the app is a normal calculator again.

Use **+ +** when the running total is below the target and **− −** when it's above. If you pick the wrong direction the maths on screen won't add up, though **=** still shows the target.

## Deploy to Netlify

1. Netlify → **Add new site → Import an existing project → GitHub**, pick this repo.
2. Build command: empty. Publish directory: `.` (already set in `netlify.toml`).
3. Deploy.

## Add to Home Screen (iPhone)

1. Open the Netlify URL in **Safari**.
2. **Share → Add to Home Screen**. Name it **Calculator**.
3. Launch it from the Home Screen once while online so the service worker caches it. It then works offline.

## Files

- `index.html` — markup, with the operator and icon glyphs as inline SVG sized to the reference
- `style.css` — all geometry in CSS px (equal to iOS pt); safe-area insets keep it aligned under the status bar and home indicator
- `app.js` — calculator engine (iOS precedence, %, ±, repeated =, swipe-to-delete on the display) and the force logic
- `manifest.webmanifest`, `sw.js` — PWA install and offline cache
- `reference/calc-zero.jpg` — the original iOS screenshot used for calibration
- `reference/compare.html` — dev page that overlays the reference on the live app (`?mode=diff|half|off`)

## Calibrating for a different iPhone

The layout is anchored to the safe areas, so it adapts, but button height and font sizes are tuned for the 15 Pro Max. To match another model exactly: take a screenshot of the real Calculator showing 0, drop it in `reference/`, and re-measure button size, gaps and the display glyph. The values live at the top of `style.css`.
