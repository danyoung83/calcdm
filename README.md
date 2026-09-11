# Magic Calculator

A fake iPhone Calculator "app" for magic routines. It's a fullscreen, untouchable image that mimics the real iOS Calculator showing `0`. Add it to your Home Screen and it's indistinguishable from the real thing.

Based on [andyjermann/fakecalc](https://github.com/andyjermann/fakecalc), copied as-is so it can be tweaked here.

## Files

- `index.html` — fullscreen wrapper, no zoom, no selection, no touch callout
- `calc-zero.jpg` — screenshot of the iOS Calculator (cropped to remove the status bar). Sized for iPhone 15 Pro Max
- `calc-icon.png` — Home Screen icon
- `netlify.toml` — publishes the repo root, no build step

## Deploy to Netlify

1. Netlify → **Add new site → Import an existing project → GitHub**
2. Pick this repo. Build command: leave empty. Publish directory: `.` (already set in `netlify.toml`)
3. Deploy

## Add to Home Screen (iPhone)

1. Open the Netlify URL in **Safari**
2. **Share → Add to Home Screen**
3. Name it **Calculator** and tap **Add**

## Fit it to your own phone

The screenshot is device-specific. To make it match yours:

1. Open the real Calculator app showing a clean `0`, take a screenshot
2. Crop off the status bar (time, battery) in Photos → Edit
3. Replace `calc-zero.jpg` with it and push
