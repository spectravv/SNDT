# v1.0 "Super Original Networking (SON)" update

Goal: the final release. A big bugfix and polish pass, plus the items listed under v1.0 in ROADMAP.md.

## What changed — for players

- **Smooth panning and zooming on big maps.** Dragging the map used to stutter more the more things were on it. On a 708-station test map, a drag went from about 15–20 frames per second to a steady 60.

- **Six new colour templates** (Map → Colours): Slate, Mint, Mono (black on white, good for printing), Overworld, Nether and The End. That makes ten. Each button shows a small preview of its colours, and the template you're using is highlighted.
- **Zigzag** bend type *(idea by 81_71M)*: straight, then 45°, then straight again, with the straight part split evenly between both ends.
- **Mix types** *(idea by 81_71M)*: in Map → Lines, switch "Bend types" to **Mix types** and tick the types you want. Every segment without its own bend then gets the ticked type that fits best:
  - **Direct** when the two stations already line up straight or at 45°, unless that would cross several other lines.
  - Otherwise the bend that keeps the lines smoothest through stations and crosses the fewest other lines.
  - **Curve** only where nothing else fits, more often for far-apart stations.
  - Segments you've set by hand keep their bend.
  - Selecting a segment shows which type was picked; choosing a type there fixes it for that segment.
- **Fixed:** holding the middle mouse button while scrolling fast threw the view far away (to around x 20000, y 20000). It now zooms around the cursor and keeps panning from there.
- **Station shapes** *(ideas by Vsad and Plentk)*: Map → Stations → "Single-line stops" now offers Circles, Ticks (London style), Squares, Rounded squares, Diamonds and Bars. Each station, interchange and terminus also has its own **Shape** setting ("Same as map" by default). Interchanges spanning several lines stretch the shape across them.
- **Custom station icons** *(idea by Curt)*: in a station's panel (or for several selected stations), **Custom icon → + Upload PNG or SVG…**. The icon either **replaces the marker** or sits **on top of the marker**, with a **Size** slider from 25% to 400%. Uploaded icons stay in the map's icon library so other stations can reuse them; **Remove unused icons** clears out ones nothing uses. Labels and stubs make room for bigger icons.
- **One-way segments** *(idea by Vsad)*: select a segment and set **Direction** for that line: Two way, or one way in either direction. Chevrons along the track show the way. A stop where every segment of a line is one-way gets a small arrow in its marker.
- **Tidier "Reorder lines at stations" dots**: each line's dot now sits just outside the station on that line's own track, in lane order, instead of piling up where lines turn.
- **Auto build**: select a station and short stubs point where you could build next (straight on and 45° either way when extending a line that ends there, every free direction for a new line). A floating bar picks **New line** or **Extend <line>**; extending is the default when a line ends at the station. Click a stub to start drawing from it; its tip is a temporary bend point that disappears when you place the next station. Turn it off in Map → Lines → Auto build.
- **Search** (magnifier button, Ctrl+K or /): finds tools, common actions (export, fit, tutorial, theme…) and every map setting by name, including words on the setting's buttons. Picking a setting opens its section (switching to Advanced if needed) and outlines the field.
- **New tutorial**: six chapters (Basics, Lines and tracks, Stations and labels, Map look, Timeline, Sharing and more) covering every feature. "Try it" steps ask you to do something on the map (place stations, draw a line, move a station, extend a line with auto build, select a segment or a station, open the Timeline, generate the track, play it), notice when you have, and move on. Practise on a blank map, jump between chapters, and finished chapters get a tick. Fully translated into all 11 languages, using the same names as the app's own buttons and panels.
- **Fixed:** picking a label side for a station sometimes did nothing. With "Keep station names off lines" on, a side that touched a line was silently swapped for another one. Now a side you pick stays; the label only moves further out on that side if it would sit on a line (Auto still picks any side).
- **Handbook** at **sndt.cc/handbook** (Help → Handbook): every tool and setting of the Map and Timeline sections, Simple and Advanced, in 18 articles with search, a contents sidebar and **live demos** that run the real SNDT inside the page (bend types, Mix types, station shapes, custom icons, one way, reorder lines, auto build, colour templates, drawing). Demos never touch your own maps or settings. "Try it in SNDT" links open the app at a tutorial chapter or a setting.
- **Help button** in the header (it was the ? icon) now offers the Tutorial or the Handbook.
- **Creators corner** (Help → Creators, and a Creators section in the handbook): Spectra (Developer), ChaoDee (Main Tester), Renikh, Sachen and Vsad (Testers), and a thank-you to the Petrolavia community.
- **Support SNDT button** (heart) in the header and in the ☰ menu on phones links to Ko-fi.
- **Discord button** in the header (and in the ☰ menu on phones) links to the SNDT Discord server.

## What changed — for developers

- Colour templates live in one list, `MAP_THEMES` (key, name, [background, text, station fill, water]); the `preset:` action and the buttons both read it. The new names have entries in all 11 languages.
- Zigzag is route `'zigzag'` in `ROUTES` / `routePts()`.
- Mix types: `M.settings.routeMix` (array, 2+ entries of `ROUTE_MIX`) turns it on; `M.settings.route` stays as the first ticked type, so older versions and the line-drawing preview still work. `geom()` marks tracks without `sg.route` as `t.auto`, and `autoRoutes()` picks for them:
  - It starts with each track's cheapest type on its own, then does two passes with the neighbours' choices known.
  - The cost adds up: turn penalties at both end stations against the next track of the same line (0 / 1 / 3 / 8 / 20 for 0 / 45 / 90 / 135 / 180°), the bends inside the track itself, 2 per crossing with another track (with a bounding-box prefilter), +2.5 for a curve (+1.5 when the ends are over 12 grid steps apart), and −5 for Direct.
  - Cost: about +5–10 ms per `geom()` on a 233-segment map. The layout check is unchanged with Mix off.
- The wheel handler rebases a running middle-button pan (`drag.sx/sy/vx/vy`) after each zoom.
- Station shapes: `SHAPES`, `shapeSVG()`; `stationSVG()` uses `s.shape || S.stopStyle` for the stop/interchange/terminus marker.
- One-way: `L.segs[key].oneway` = `'fwd'|'back'` relative to the line's stop order (survives splitting a segment; `reverse` flips it). `onewaySVG()` draws the chevrons and fills `G.owStops`.
- Reorder dots: `laneNow()` places each dot at the line's end on the reference arm (or the opposite arm) plus the station radius + 1.2 × line width outward. Order logic unchanged.
- Auto build: `abInfo()/autoBuildSVG()/abBarSync()/startStub()/dropTip()`; stubs are overlay elements `data-kind="stub"`; `#abBar` is positioned from the view. Preference `sndt:autobuild` (local).
- Search: `searchIndex()` reads a hidden render of `inspMap()`; `searchGo(pane, fieldIndex, adv)` opens it. Shortcut Ctrl+K or /.
- Tutorial: `TUT` (chapters → steps with `sel/t/b/tb/ts/setup/task/done`), polled every 300 ms on Try it steps; Try it steps don't dim the page or catch keys. Completed chapters in `sndt:tutDone`.
- Label side fix in `autoLabels()`: hand-picked sides only push outward. The layout check reports label-only differences on isere-v1 and rmp-tung-sha against the baseline (no line paths changed); Baseline re-saved after the user approved the look (2026-10-28).
- Custom icons: `M.icons` (id, name, src, ar); station fields `cicon`, `ciconSize` (%), `ciconOver`. `ciconBox()/ciconSVG()`; PNG/JPG/WebP are redrawn at 160 px max as PNG, SVGs under 60 KB are kept. Size slider writes on input with one undo step per drag.
- Phones: a touch within the station marker (+16 px) grabs the station even when a stub's touch area overlaps it; stub hit areas start 10 px outside the marker. Tutorial cards are compact under 900 px, and Try it steps hide the text behind "Show text".
- Handbook: `src/handbook.html`, deployed to `site/handbook/index.html` by `scripts/deploy.sh`. Demos load the app with `?embed=1#embed` (`EMBED`): no header or side panels, `lsSet()` and `scheduleSave()` do nothing, and the page drives it with `postMessage` (`load` with map/tool/mode/panel/pane/select/lane, `act`, `set`, `tool`, `fit`; the frame answers `ready`).
- Deep links: `#search=<words>`, `#tutorial=<chapter id>`, `#tool=<name>` (`deepLink()`).
- `site/sw.js`: each page is cached under its own path (`/` and `/handbook/`), so opening the handbook no longer replaces the offline copy of the app. Cache bumped to `sndt-v2`.
- Coverage: every field, checkbox and button label of every panel (Map, station, line, segment, several stations, text, area, nature, water, image, legend, tools, Timeline) is mentioned in the handbook (checked by script against the live panels).
- Tutorial translations: 108 new `L10N` rows (tutorial texts, phone texts, tasks and buttons). Switching language while the tutorial is open redraws it.
- Creators: `CREATORS` / `PETROLAVIA` (128 px heads from `assets/staff/*_logo.png`, embedded as data URIs; the handbook carries a copy of the same list).
- `DONATE_URL` is set to https://ko-fi.com/spectra_vv.
- `DISCORD_URL` is set to https://discord.gg/jTycUK7Uvs.

- Pan, pinch and wheel zoom (`viewChanged()`) no longer rewrite the SVG `transform` on every move: Chrome lays out the whole SVG again each time (about 44 ms per move with 7,000 elements). During a gesture the two map layers (`#map`, `#under`) move with a CSS transform on the GPU instead. The real transform is written by `commitView()` once the view has been still for 150 ms, or by any `applyView()` call.
- `mapRect()` replaces `svg.getBoundingClientRect()` everywhere, so screen-to-map maths stays right while the CSS transform is on. Both map layers have `overflow:visible` and `transform-origin:0 0`, so off-screen parts come into view while dragging.
- The map background colour is now set on `#stage` rather than `#under`, so it doesn't move with the layer during a drag.
- New check: `node tools/pan-perf.mjs [--copies N] [--select] [--shot file.png]` loads `test-maps/rmp-tung-sha.json` N times side by side, drags with the middle mouse button, and reports frame times plus layout/script time. `--shot` zooms in, pans and takes a screenshot before the real transform is written.
  - Before: 4 copies, median frame 50 ms, all 120 frames over 33 ms, 5.3 s of layout.
  - After: median 16.7 ms, no frames over 33 ms, 27 ms of layout.
- `tools/touch-test.mjs` passes. Once, "double-tap on a district selects it" failed, then passed on three reruns; it looks like a timing flake in the check.
