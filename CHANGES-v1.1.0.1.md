# SNDT v1.1.0.1 (patch)

## Faster
- Dragging stations and other things on big maps: `will-change:transform` on `#map`/`#under` is dropped while an object drag runs (`mapLayer(false)` in the map's pointermove for every drag type except pan, marquee and dtap) and restored in `endPointer`. Measured with `tools/drag-perf.mjs --size 32` (768 stations, 6,206 SVG nodes): median frame 217 → 150 ms. `tools/pan-perf.mjs` unchanged (16.7 ms, no frames over 33 ms). Turning it on only during pans was tried first and dropped: it cost two 50 ms frames per pan (layer created at the start, torn down at the end).
- New tool `tools/drag-perf.mjs` (frame times plus geom / SVG string / innerHTML / style / layout per render).

## Fixes
- White terminus badges referenced a `sndt-shadow` SVG filter that never existed; the attribute is gone (filters also won't port to the planned WebGL renderer).

## Code
- `LOOK_KEYS`: every look setting any style set touches; `applyStyleSet` uses it (behaviour unchanged).

## Site
- New Terms page, sndt.cc/terms (`site/terms/index.html`), linked in the landing page footer: free use, your maps are yours, gallery rules, AGPL licence and other (paid) versions, contribution terms.
- `CONTRIBUTING.md`: contributions are AGPL and also licensed to Spectra for any version of SNDT, including paid and closed ones.

Checks: layout-check no problems, 0 changed line paths.
