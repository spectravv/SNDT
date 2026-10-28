# SNDT — Simple Network Designer Tool

A web app for drawing transit network maps for Minecraft servers: stations, lines, rivers, nature, districts, images, and an animated timeline that exports to video.

- Live site: https://sndt.cc (also https://sndt-vv.vercel.app)
- Discord: https://discord.gg/jTycUK7Uvs

## Folder layout

```
sndt/
├── src/sndt.html          The app. Edit this file.
├── site/                  What gets deployed. Generated, do not edit by hand.
│   ├── index.html         Built from src/sndt.html
│   └── .vercel/           Links this folder to the Vercel project
├── scripts/
│   ├── build.py           Wraps src/sndt.html into a full web page
│   └── deploy.sh          Builds, then deploys to production (sndt.cc)
├── tools/
│   ├── run-in-browser.mjs Opens a page in headless Chrome, runs JavaScript, saves a screenshot
│   ├── screenshot.mjs     Takes a screenshot (optionally transparent, any size and scale)
│   └── logo.html          Renders the logo variants (#mark, #mark-light, #icon, #word-light, #word-dark)
├── assets/                Logos and showcase screenshots
└── test-maps/             Maps from users for reproducing bugs (open via Import)
```

## How the app is built

The whole app is one HTML file: markup, styles and script, with no build step and no dependencies to install.

- `src/sndt.html` starts with `<title>` and `<style>`, without `<!doctype>`, `<html>` or `<head>`.
- `scripts/build.py` turns it into a normal web page for the website by adding the document head.

Loaded from CDNs at runtime:

- Google Fonts: Archivo Black, JetBrains Mono, Figtree, Overpass, Pixelify Sans.
- `webm-muxer@5.1.4` (MIT) from jsDelivr. It only loads when someone exports a timeline video.

## Where data lives

- On the website: maps are saved in each visitor's browser storage. Every web address has its own storage, so maps saved on sndt-vv.vercel.app do not appear on sndt.cc. Use Export → JSON backup and Import to move them.
- Not saved anywhere: timeline audio is kept in memory until the page is closed.

## Languages

The interface is in 11 languages: English, Simplified Chinese (简体中文), Spanish, French, German, Russian, Italian, Portuguese, Malay, Arabic and Turkish. Pick one from the language menu in the header; the choice is remembered in the browser, and the first visit follows the browser's language.

- The translation table is the `L10N` array near the top of the script in `src/sndt.html`. Each row is `[English, Simplified Chinese, Spanish, French, German, Russian, Italian, Portuguese, Malay, Arabic, Turkish]`; the `LI` map next to it gives each language's column. Any new interface text needs a row with all 11.
- Text with numbers or names in it is handled by the `PAT` patterns just below it.
- User content such as station, line and map names is never translated. Those elements carry a `data-nt` attribute.

## Checking the line drawing

Run `node tools/layout-check.mjs` after changing how lines are drawn (`geom()`, `lineRuns()`, `crossings()` in `src/sndt.html`). It needs `google-chrome`; `rsvg-convert` is optional.

- It draws every map in `test-maps/` (SNDT backups and Rail Map Painter files) and compares it with `test-maps/baseline/`. Changed lines are listed with where they are, and before/after pictures go to `tools/layout-out/`.
- It counts sideways jumps (a line stepping sideways at a station) and fails if a map has more than its baseline.
- It draws 100 random variations of each map (moved stations, other bend styles, hand-set line orders) and fails if any of them breaks. Use `--runs N` to change the number.
- Once a change looks right, save it as the new baseline with `--save`.

## Main features

- **Stations:** station types, auto-placed labels, sublabels, label backgrounds, facility icons, and positions from in-game coordinates.
- **Lines:** line types (subway, tram, bus, regional and local rail, HSR, ferry, minecart, ice boat and more), statuses (planned, under construction), and per-segment colour and style.
- **Track shapes:** 45°, 90°, direct, curve, circular arc (fitted to neighbouring track or with manual degrees), free shape, and rounded corners.
- **Drawing quality:** lines sharing track run side by side in a consistent order, keep their lanes straight through stations and around turns, and cross where they split rather than inside a station. You can also set the line order at any station by hand: turn on "Reorder lines at stations" and drag one line's dot onto another. Where lines cross, the lower one gets a gap of the size you pick (Small, Medium, Large, or 0 to draw straight over).
- **Scenery:** water (river, lake, eraser), nature areas, districts built from rectangles with overlap cutting, and images with rounded corners and borders.
- **Timeline:** a camera that follows the build-up, a flow-through option, audio, and WebM export.
- **Grid:** new maps start with a 5-unit grid (25 blocks per grid cell for game coordinates); each map keeps its own grid size.
- **Interface:** collapsible and resizable panels, Simple and Advanced modes, light and dark themes, 11 languages, and a first-run tutorial.
