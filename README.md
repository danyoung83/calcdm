# Magic Calculator

A working replica of the iOS 26 Calculator, built as a PWA, with a hidden force for magic routines. Opened from the Home Screen it looks and behaves like the real app.

Started from [andyjermann/fakecalc](https://github.com/andyjermann/fakecalc), which was a static screenshot. This version is a real calculator with the same pixel geometry, measured from a screenshot of the real app on a 393 x 852 pt iPhone (15/16/17 Pro size). All sizes are expressed relative to screen width, so other models scale proportionally.

## The secret

**Set the target number**
1. Type the number you want to force.
2. Hold the clock button in the top left for about a second. The display clears to 0.
3. The tell: the clock's minute hand normally points to 3 o'clock. While a target is set it points to 9 o'clock.

**Check the target:** hold the calculator button in the top right. The target shows on the display while you hold, then the previous value comes back.

**Clear the target:** hold the clock button while the display shows 0. The minute hand goes back to 3.

You can also set it via URL, handy from an iOS Shortcut: `https://magic-calculator-944.netlify.app/?t=1234`. The target survives relaunching the app until it's used or cleared.

**Perform**
1. Let the spectator type and calculate whatever they like.
2. When you want to end, press **+ twice** (or **− twice**). Nothing visible changes. The app now knows the difference between what's on screen and the target.
3. From now on, every tap anywhere on the screen enters the next digit of that difference. A rap with two or three fingers counts as one tap. It doesn't matter which key, or whether it's a key at all. Once the difference is fully entered, further taps do nothing.
4. Tap **=**. The target appears, and the target clears itself.

Use **+ +** when the running total is below the target and **− −** when it's above. If you pick the wrong direction the maths on screen won't add up, though **=** still shows the target. Tapping **AC** after the digits are complete abandons the force and keeps the target set.

## Deploy

The folder is linked to the Netlify site. After any change:

```
netlify deploy --prod --dir .
```

## Add to Home Screen (iPhone)

1. Open the Netlify URL in **Safari**.
2. **Share → Add to Home Screen**. Name it **Calculator**.
3. Launch it from the Home Screen once while online so the service worker caches it. It then works offline.

## Files

- `index.html` — markup, with the operator and icon glyphs as inline SVG sized to the reference
- `style.css` — all geometry in CSS px (equal to iOS pt); safe-area insets keep it aligned under the status bar and home indicator
- `app.js` — calculator engine (iOS precedence, %, ±, backspace, repeated =, swipe-to-delete on the display) and the force logic
- `manifest.webmanifest`, `sw.js` — PWA install and offline cache
- `reference/ios26-calc.jpg` — the iOS 26 screenshot used for calibration (`calc-zero.jpg` is the older iOS 18 one)
- `reference/compare.html` — dev page that overlays a reference on the live app (`?ref=ios26|ios18&mode=diff|half|off`)

## Calibrating for a different iPhone

Everything is a multiple of `--u`, one point on a 393pt-wide screen, so the layout scales with width and is anchored to the safe areas. To check another model exactly: take a screenshot of the real Calculator showing 0, drop it in `reference/`, point `compare.html` at it, and adjust the numbers at the top of `style.css`. Convert screenshot pixels to points at `screen-width-in-pt / image-width-in-px`.
