# SNDT on Steam: plan and handoff for Claude Code

Written 2026-11-21. Based on SNDT v1.1 (`main`, commit d80ef28).
Mockups: https://claude.ai/artifact/X5wdfx44XjVcFbpmL4omDB
Game design board: https://claude.ai/artifact/8gvURSnsTgUgoad47R3yGa

Work through the sections in order. Before changing code in any work package, read the relevant code and explain the approach first. The web version at sndt.cc must keep working after every step.

---

## 1. What we are building

A Steam version of SNDT with three modes, sharing one codebase with the web version:

- **Planning**: the current editor (what sndt.cc is today), plus a "Test run" button that runs the map in the sim for a minute and shows a legibility report.
- **Normal**: a game. Budget, overcrowding, a city that grows around well-served stations, rush hours, and legibility scoring. Handmade city outlines (Mini Metro style, not real map data) with random station and demand spawns from a seed.
- **Sandbox**: Normal with the limits off (no money, no failure, every spawn rate editable, time controls, overlays). Same engine, different rule set.

The core idea that makes it different from other transit games: **passengers plan trips from the diagram the player draws**, not from the real network. A clear diagram raises ridership, a confusing one (overlapping labels, unmarked transfers, similar line colours) sends people the wrong way. Legibility rules follow the chosen style set (an NYC-style map is not penalised for non-45° angles).

Two pillars, every system touches both:
- **Operate**: track, trains, capacity, money.
- **Communicate**: the diagram and its legibility.

### Phasing
1. **v1 (Steam)**: handmade cities, 2 line types, budget, overcrowding, growth, legibility scoring, Sandbox toggles.
2. **v1.x**: express services, construction tiers (surface, elevated, tunnel), events with temporary diagrams.
3. **Later**: unlocks, approval/council, historical scenarios, trains switching between lines (needs a track graph).

Steam Deck is not a priority. Target desktop, mouse and keyboard, 1920×1080. Steam Input mapping a controller to mouse and keyboard is enough for the Deck.

---

## 2. Decided tech stack

- **Wrapper: Tauri 2** (system webview, small builds, low RAM). Not Electron. Steam integration through `steamworks-rs` (achievements, Cloud, Workshop).
- **UI stays HTML/JS** (the current single-file app). No React, no rewrite.
- **Sim core in Rust**: native in the Tauri backend, compiled to WebAssembly for the browser, so the web version can run the sim too. Runs off the UI thread.
- **Map drawn on a canvas (WebGL)** for Steam, and eventually for the web too. `mapSVG()` stays for SVG/PNG export only.
- Linux uses WebKitGTK inside Tauri. Test rendering and performance there early.

A fully native rewrite (Rust/Godot with a web export) was considered and rejected: it would mean rebuilding `geom()`, SVG export, 11 languages including Arabic and CJK, the handbook demos, Crowdin, accounts and the gallery.

---

## 3. Codebase facts (as of v1.1)

- Everything is in `src/sndt.html` (about 5,400 lines, plain JS). Built with `scripts/build.py`.
- **Map data**: `M` (stations, lines, settings). Saved maps use map format v2 with upgrade steps (`MAP_FORMAT`, `MAP_STEPS`). Keep this.
- **Geometry**: `geom()` builds tracks, lane offsets and bundles (the tuned lane solver, station-first and lines-first layouts). It does not draw.
- **Drawing**: `mapSVG(editor)` calls `geom()`, then `strokeFor`, `stationSVG`, `labelSVG`, `xferSVG`, `legendSVG`, etc. These return **SVG strings**. `render()` puts the whole string into `#content` with `innerHTML` on every change.
- Paths are polylines only (`dOf()` writes `M…L…`); curves and round loops are already sampled into points.
- Text is measured through one function, `textW0()` (SVG text, falls back to canvas `measureText`).
- **Style sets**: `STYLE_SETS` (Default, Moscow, London, NYC) only fill look settings in `M.settings`; `tone()` shifts line colours at draw time; `SET_FEATURES` / `feat()` turn on per-set tools.
- **Platform layer**: `PLAT` (kv storage, clipboard, open links, downloads, scripts, font URLs). Tauri and Steam code plug in here.
- Fonts: PT Sans, Cabin, Inter, JetBrains Mono, Archivo Black. All SIL OFL, safe to bundle in a paid desktop app.
- Test tools: `tools/pan-perf.mjs`, `tools/drag-perf.mjs` (new), `tools/layout-check.mjs`, `tools/screenshot.mjs`.

---

## 4. Work packages, in order

### WP1. Drag performance (do first)

Measured with `tools/drag-perf.mjs` on Ibrahim's PC, synthetic map of 768 stations, 43 lines, 6,206 SVG nodes:

| | Median frame | render() | geom() | SVG string | innerHTML | other | layout | style |
|---|---|---|---|---|---|---|---|---|
| Current | 217 ms | 125 ms | 72 | 13 | 14 | 25 | 29 | 14 |
| will-change off | 150 ms | 124 ms | 72 | 13 | 14 | 25 | 28 | 13 |

Target: 16.7 ms per frame.

**1a. `will-change` only during gestures.**
`#map` and `#under` have `will-change:transform` in CSS. Remove it from the CSS and set it from JS only while a pan or zoom gesture runs: add it when the CSS-transform path starts in `viewChanged()`, remove it in `commitView()` / `applyView()`.
Check: `node tools/drag-perf.mjs --size 32` should match the `--no-will-change` numbers (about 150 ms median). `node tools/pan-perf.mjs` must not get worse.

**1b. Incremental `geom()` while dragging.**
Every mouse move calls `requestRender()` → `render()` → full `geom()` for the whole network. At drag start keep the full `G`; on each move recompute only the tracks touching the moved stations (and their lane offsets), reusing everything else. Small inaccuracies during the drag are fine. On drop, run the full `geom()` as now so the final result is identical.
First read `geom()` and explain which parts are local and which are global (spanning tree, lines-first lane solver, IRLS). If the solver is fully global, propose an alternative such as freezing the lanes during the drag.
Check: `tools/layout-check.mjs` results unchanged after a drop; `drag-perf.mjs` frame time drops.

**1c. Break down "other" (25 ms).** Extend `drag-perf.mjs` to time `renderOverlay`, `renderGrid`, `syncFonts` and the rest of `render()`, in case something cheap is hiding there.

### WP2. Small fixes from the v1.1 review

- White terminus badges use `filter="url(#sndt-shadow)"`, but no `sndt-shadow` filter exists anywhere. Either remove the attribute or draw the shadow as an offset semi-transparent shape. Do not add an SVG filter.
- Add a named constant `LOOK_KEYS`: the union of every style set's keys (the Default set already computes it inside `applyStyleSet`). Use it in `applyStyleSet`. Later it drives "export this style" and Workshop sharing.

### WP3. Tauri spike

Wrap the current built `sndt.html` in Tauri 2 with no code changes beyond what Tauri needs. Run it on Linux Mint (WebKitGTK).
Check: fonts and all four style sets render correctly; compare dragging and panning speed with Chrome (adapt `drag-perf.mjs` if possible, otherwise time by hand). Report anything that renders differently.
Then implement `PLAT` for Tauri: `kv` and map storage on disk, `download` through a save dialog, `fontUrl` mapped to bundled fonts, `script` to bundled files, `open` through the system browser. Set `PLAT.kind='steam'`.

### WP4. Display list (map drawing split from SVG)

Goal: `(M, G, settings) → list of primitives → backend`. Primitives: path (polyline with stroke, width, dash, caps, joins), circle, rect, tick, capsule, text, image, gradient stroke, mask/cut region.
- Start with `strokeFor` (one switch, about 10 line styles): make it return primitives, add an SVG backend that turns them into the same SVG string as now. Output must be byte-for-byte or visually identical: compare with `tools/screenshot.mjs` on several maps in every style set.
- Then `stationSVG`, `xferSVG`, `labelSVG`, the rest, one function per step.
- Keep `mapSVG()` working for export throughout.

### WP5. Canvas backend

- WebGL (or Canvas2D first if simpler) backend for the display list. Labels can stay on a Canvas2D or DOM layer above WebGL to keep text crisp.
- Cache the display list per line; redraw only what changed.
- Hardest part: SVG `<mask>` (line crossing cut-outs, overlapping area cut-outs) needs a stencil buffer. Port it last and test it carefully.
- Gradient walking links (Moscow), NYC hatching and rounded clips are straightforward.
- This removes the SVG string + innerHTML + style/layout cost from WP1, and makes grab/drop animations on the map possible (lift and scale on grab, small settle on drop).

### WP6. Steam UI layout (different from the web layout)

Split each panel into:
1. **Panel description (shared)**: a function returning plain data (fields, options, actions with their `data-act`). No HTML.
2. **Layout renderer (per platform)**: web renders the current sidebars; Steam renders the layouts in section 5.

Keep `data-act` names identical so click handling stays shared. Start with the station, line and map settings panels; leave rare dialogs as they are. Set `data-plat="steam"` on `<html>` when `PLAT.kind==='steam'` for Steam-only CSS. Steam-only parts (main menu, mode picker, HUD, pause menu) live in their own section of code.

UI animations: CSS transitions/keyframes and `element.animate()`, animating only `transform` and `opacity`, 120–200 ms, respecting `prefers-reduced-motion`. Because panels are rebuilt with `innerHTML`, use keyframe animations for things appearing, update in place for state changes (toggles, selection), and FLIP for lists that reorder.

### WP7. Game (later, after WP1–WP5)

- First a throwaway prototype outside SNDT: one city outline, one line type, passengers as counts per station and destination (never one object per passenger), stations that overflow. Check it's fun before building the real thing.
- Then the Rust sim core: station graph shortest paths with a transfer penalty (recomputed only when the map changes), trains on routes with frequencies, boarding and capacity, demand curve over the day. Trains and passengers drawn on their own layer; the static map is drawn once.
- Passengers read the diagram: route choice uses the drawn diagram plus legibility penalties defined per style set (in `SET_FEATURES` or next to it).
- City file format: outline, water, district zones with demand weights; spawns from a seed so runs can be shared and replayed.

---

## 5. Steam UI spec (from the mockups)

### Design tokens (SNDT's own, dark theme)
- Paper `#121212`, paper-2 `#1e1e1d`, field `#1a1a19`, ink `#eaeaea`, muted `#9a978f`, hair `#3a3936`, red `#ff2a2a`. Map background stays light paper `#efede7`.
- Type: Archivo Black, uppercase, for titles; JetBrains Mono for everything else. Buttons uppercase with about 0.06em letter spacing.
- Square corners everywhere. 2px ink borders. Floating panels get the hard shadow `4px 4px 0` ink; urgent cards (alerts, the selected station card) get a red hard shadow. 3px ink rule under the top bar.
- Segmented controls like `.seg`: 2px ink border, selected option solid ink with paper text.
- Primary buttons: red background, black (`#0b0b0b`) text.
- Map line red is darker (`#c8102e`) so it doesn't clash with UI red.

### Main menu
Map full screen in the background. Solid left panel (640 px): logo and tagline, big red "Continue" (current save name and in-game time), then New city, Sandbox, Planning, Workshop; Settings and Quit at the bottom; version line. Recent maps (thumbnail, name, mode, last played) floating bottom right.

### Planning mode
- Top bar: pause menu button, map name (Archivo Black), PLANNING tag, undo/redo; right side: style set picker, Export, red "Test run".
- Floating tool rail on the left: Select V, Station S, Line L, Area A, Water W, Text T, Image I. Each button shows its shortcut letter.
- Selecting a station opens a **context card next to it** (no inspector sidebar): name field, line chips, Mark (Map / Circle / Tick / Pill), Label (Auto / Left / Right / Above), "Extend a line", "More…".
- Bottom left: minimap with the view rectangle. Bottom centre: hint bar (drag to move, shift-click, right-click). Bottom right: Grid / Free, zoom.

### Normal mode
- Top bar: pause menu, city name, clock block (day, time, phase such as "Morning rush") with speed controls (pause, 1×, 2×, 4×; keys Space, 1, 2, 3); right side: Budget, Satisfaction %, Legibility /100, Riders today.
- Left panel: lines with load bars (red at 90% or more), trains count and frequency, "+ New".
- Overcrowded station: red rings on the map plus an alert card next to it: waiting count, time until the platform is full, why (for example transfers people can't find on the map), actions "Add train to Line X" and "Fix on map".
- Top right: notification stack (rush hour coming, legibility problems).
- Bottom left: demand curve for the day with the current time marked.
- Bottom centre: build bar with costs (Surface, Elevated, Tunnel, Station, Train), then "Edit diagram" and "Legibility report".

---

## 6. Rules and constraints

- Keep the web version working after every step; one codebase.
- No SVG filters (`feGaussianBlur`, drop shadows) on the map: they don't port to WebGL. Glows and shadows are extra strokes or shapes.
- Fonts must be SIL OFL or similar. No official logos, roundels or proprietary typefaces (Johnston, Helvetica) in styles. Name styles after cities ("Moscow", "London"), never as official maps.
- Map format changes go through `MAP_STEPS` so old maps keep loading.
- Measure before and after every performance change with the tools in `tools/`.
- Steam Direct: $100 per app, 21-day wait after paying before release. A "Coming soon" page (for wishlists) only once the prototype works and has screenshots.

---

## 7. Licensing (decided 2026-11-21)

**Open editor, closed game.**
- The editor stays AGPL-3.0 and free on sndt.cc, in the public repo `spectravv/SNDT`.
- The game (sim core, city files, Normal/Sandbox rules, Steam-only UI, Steamworks code) lives in a **private repo** and ships closed in the paid Steam build. Spectra holds the copyright to all SNDT code, so the same editor code can be used in the closed build (dual licensing).
- Shared pieces that also help the web editor (display list, canvas backend, `PLAT`) stay in the public repo.
- So the sim is **not** compiled to WASM for the free web version. sndt.cc gets at most the Planning "Test run" as a teaser.
- Contributions (code and Crowdin translations) are covered by `CONTRIBUTING.md`: AGPL plus a licence to Spectra for any version, including paid and closed ones. Ask existing translators (zh-HK, id, nl, pl) and testers shown in the Creators popup for their OK before their work ships in the Steam build.
- Steamworks SDK: ship only Valve's redistributable binaries, never the SDK source.
