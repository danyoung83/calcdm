# calcdm

A working replica of the iOS 26 Calculator, built as a web app you add to your Home Screen, with a forcing mechanism built in. It's made for the [I.C.F. calculator force](https://thedailymagician.com/icf-force), and lets you do the final phase with the phone face up while the spectator drums their fingers on the screen.

Live: **https://calcdm.netlify.app**

Inspired by [andyjermann/fakecalc](https://github.com/andyjermann/fakecalc), which was a static screenshot. This is a real calculator with the same pixel geometry as the iOS 26 app, measured from screenshots on an iPhone 14 Pro.

## How it works

It works as a normal calculator but has the forcing mechanism:

1. **Set the force number.** Type a number, then hold the clock icon (top left) for a second. The display clears and the clock hand swings to 9 o'clock, which tells you it's set. Hold the calculator icon (top right) at any time to peek at the number.

2. **Do any calculation.** Any adding, subtracting, multiplying or dividing, as per the normal routine.

3. **When you're ready for the final calculation**, press **+ twice** if the running total is below the force number, or **− twice** if it's above. Nothing visible changes.

4. **Every tap anywhere on the screen** then enters the next digit of the difference needed to get to the force number. So you can have them drum their fingers over it, or turn it over as in the original routine. A tap with two or three fingers counts as one tap, and it doesn't matter which keys they hit. The clock hand moves to **6 o'clock** when all digits are in, so you know it's done. Extra taps do nothing.

5. **Hit equals.** You get the force number.

The whole thing is self-working, with no shortcuts or mental maths, and you can do it face up. After the reveal the force number clears itself and the clock hand returns to 3 o'clock.

Other things worth knowing:

- Hold the clock icon while the display shows 0 to clear the force number.
- If you get the direction wrong in step 3, the sum on screen won't add up, though **=** still shows the force number.
- Tapping **AC** after the digits are complete abandons the force and keeps the number set. While digits are still owed, AC and backspace count as taps like any other key.
- You can preset the number from an iOS Shortcut by opening `https://calcdm.netlify.app/?t=1234`. It survives relaunching the app until it's used or cleared.

## Add to Home Screen

1. Open https://calcdm.netlify.app in **Safari**.
2. **Share → Add to Home Screen**. Name it **Calculator**. It picks up the real app's icon.
3. Launch it from the Home Screen once while online so it caches. It then works offline.

Tested on an iPhone 14 Pro. Sizes are expressed relative to screen width, so other iPhones should scale, but they may need a tweak.

## Background

- [The Jerx: the calculator force, face up](https://www.thejerx.com/blog/2025/5/6/t12u882u8mz4kzsjc0hfh1efgbqdpx)
- [The Jerx: Carefree Toxic](https://www.thejerx.com/blog/2025/5/13/carefree-toxic)
- [The Daily Magician: the I.C.F. force](https://thedailymagician.com/icf-force)

## Development

Static files, no build step.

- `index.html` — markup, with the operator and icon glyphs as inline SVG sized to the reference
- `style.css` — all geometry as multiples of `--u`, one point on a 393pt-wide screen, anchored to the safe areas
- `app.js` — calculator engine (iOS precedence, %, ±, backspace, repeated =, swipe-to-delete) and the force logic
- `manifest.webmanifest`, `sw.js` — Home Screen install and offline cache
- `reference/` — the iOS screenshots used for calibration and `compare.html`, a dev page that overlays one on the live app (`?ref=ios26&mode=diff|half|off`)

Deploy with `netlify deploy --prod --dir .` from the project folder (it's linked to the Netlify site).
