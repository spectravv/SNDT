# SNDT roadmap (ideas parked for later versions)

## v1.0
- Update name (decided 2026-10-28): v1.0 is the **"Super Original Networking (SON)" update** ("v1.0 – Super Original Networking (SON) Update"). The app itself stays SNDT.
- Massive final bugfix pass before release.
  - ~~Fixed (likely cause)~~: station label positions sometimes don't apply; the label stays where it was. Needs a map or steps to reproduce.
  - ~~Fixed~~: holding the middle mouse button and scrolling fast jumps the view to around x 20000, y 20000. Cause found: the middle-button pan keeps the view position from when the drag started, so after a wheel zoom mid-drag, the next mouse move puts that old position back at the new zoom. Fix: restart the pan from the current view after each zoom (or ignore the wheel while panning). Not caused by the v1.0 panning change; the pan code is unchanged.
  - ~~Improve "Reorder lines at stations"~~ (done): at busy junctions the reorder dots are a jumbled mess. Place each dot relative to the direction its line comes from and goes to, instead of at a fixed position.
  - MTR import follow-ups to check in that pass: ~~the MTR import dialog's Line types rows at phone width~~ (tested by the user, fine); "Fetch map" end to end on a phone: decided to test on sndt.cc right after the v1.0 deploy; crowded MTR city centres: moved to v1.1.
- ~~Turn on the donate button~~ (done in v1.0: https://ko-fi.com/spectra_vv).
- ~~Smooth panning~~ (done, see CHANGES-v1.0.md): dragging the map stuttered more the more things were on it.
- ~~New connection type "Zigzag"~~ (done) (idea by 81_71M): straight, then 45°, then straight again (the `_/‾` shape).
- ~~Mixing connection types~~ (done, "Mix types") (idea by 81_71M): in the map-wide route picker, tick several types at once (for example Direct + Curve + "45°, then straight"). For each segment the engine then picks the best of the ticked types, based on where the two stations are: Direct when they're already in a straight or 45° line, otherwise the ticked bend that fits best. Segments set by hand keep their own type. (Not "several types inside one connection"; 81_71M clarified this.)
- ~~One-way routes and one-way stops~~ (done) (idea by Vsad): a line, or a part of it, that runs in one direction only, and stops that are only served in one direction.
  - Agreed: set per segment, as "One way" or "Two way" (the default). One-way segments show small arrows along the track. A stop counts as one-way when the line passes it only in one direction; the stop marker shows that (exact look to propose).
- ~~More map colour templates~~ (done: six new ones, see CHANGES-v1.0.md).
- ~~A full tutorial~~ (done, English; translate after approval) that covers every feature, possibly interactive (the player does each step).
- ~~Auto build~~ (done): selecting a station shows short "o<" stubs pointing out of it in the directions you could build, plus a floating bar to pick "New line" or "Extend <line>" (default: extend if the station is the end of a line, else new line). Clicking a stub opens the line tool and keeps drawing from the stub's tip. Inspired by RMP but not a copy.
  - Agreed details: stubs are 3 grid steps long (15 at the default grid). The tip is only a temporary bend point; it is removed when the first station is placed, and that segment uses the automatic routing.
- ~~More station shapes~~ (done) (idea by Vsad): the map-wide stop style only offers Circles and Ticks (London style). Add more, for example square, rounded square, diamond, and a thin bar.
- ~~Square station blobs~~ (done) where needed (idea by Plentk): a per-station (or per-interchange) option to draw the station as a square or rounded-square blob instead of the default shape.
  - Agreed: build these two as one feature. The map-wide stop style sets the default shape, and every station can override it in its own settings ("Same as map" by default), with all the same shapes available.
- ~~Custom station icons~~ (done) (idea by Curt): import a PNG or SVG as a station's icon, scale it, replace the marker or sit on top of it.
- ~~Handbook~~ (done, English): sndt.cc/handbook with live demos. Translate it into all 11 languages LAST, after the tutorial translation, and only after the user has checked their usage budget.
- ~~Tutorial translation~~ (done, all 11 languages).
- ~~Tool search~~ (done): a search bar that finds tools (and probably settings) by name.
- ~~Turn on the Discord button~~ (done in v1.0).

## v1.0.2 (released 2026-10-29)
- ~~ILVF~~ (done 2026-10-29, user-approved, in the handbook) Isolated line view, "ILVF" (idea by Paddy): a straight, horizontal strip of one or more chosen lines for platform displays and station signs (his reference: the brown line drawn straight, stations evenly spaced, names above, interchange markers with short stubs of the other lines' colours going off it). His proposed flow: a button next to + in the Lines panel → pick the lines to isolate → a panel at the bottom shows the strip → its own export (PNG/SVG).
- ~~Circular routes~~ (done 2026-10-29): a loop line can be drawn as a real round circle ("Draw as a round circle"), plus "Put the stations on the circle".
- ~~Delete a selected segment, not the whole line; double-click a segment selects the whole line~~ (done 2026-10-29, idea: the user).
- ~~Map cleaner tool (idea by rthorpey12)~~ (done 2026-10-29): "Clean up map…" under the map name in the Map panel.

## v1.1
- Style sets: one pick restyles the whole map, beyond what colour templates do (background, line look, station and interchange style, fonts, labels, terminus badges, frame/title/legend). Geometry and label positions never change. References (2026-10-29, in ~/Downloads): 
  - Łódź regional poster (ŁKA): cream paper, thick coloured frame, big two-language title block, thin parallel lines, white stations with dark outline, IC markers, two-column legend.
  - Charlotte (transitscapes): white, heavy rounded lines, small white dots, lettered roundels at each terminus, huge bold title, roundel legend with end stations.
  - Moscow metro/MCD (metro_map_0926.pdf): white, thin lines, outlined-circle interchanges joined by connectors, numbered line circles at the ends, green parks and landmark icons behind.
  - Dark Transit (Claude web, sndt-style-reference.html + SNDT_MAP_STYLES.md): dark slate with a faint grid, glowing lines, pill interchanges with one dot per line, number badges.
  - Frosted Glass (same files): pastel gradient with blurred colour blobs, white-cased lines with soft shadow, white discs, labels on frosted pills.
  - Dutch rail (photo of an NS map, 2026-10-29): thick parallel lines with thin white gaps between them, small white stop dots inside the line, short black leader ticks from the stop to its name, interchanges as a dark bar across all lines with a white dot per line, line codes (S64, IC27) written in pills inside the line, big bold capitals for main stations.
- Style set decisions (user, 2026-10-29): picking a set only FILLS the existing settings, which stay editable after; line colours are kept but their saturation/brightness is shifted to match the set; all six ship in v1.1; names: Poster (Łódź), Bold (Charlotte), Flowing (Moscow), Night Transit (Dark Transit), Frost (Frosted Glass), Ribbon (Dutch rail).

## Later
- MTR import: an option to spread out only the crowded areas (dense city centres) on import, instead of the whole map (decided 2026-10-28). (moved out of v1.0.2 on 2026-10-29)
- Translator credits: a Translators part in the Creators popup (and the handbook's Creators section), filled from the Crowdin contributors once translations arrive. (moved out of v1.0.2 on 2026-10-29)
- New languages from Crowdin (Czech, Danish, Irish, Japanese, Korean, Dutch, Polish, Filipino are open there; Irish added 2026-10-28 on a player request): add each to LANGS/LI and the language menu once it is translated and approved. (moved out of v1.0.2 on 2026-10-29)
- Handbook translation: put the handbook's text on Crowdin too, instead of translating it by hand. (moved out of v1.0.2 on 2026-10-29)
- Traditional Chinese (Hong Kong) on Crowdin (idea by Curt, who will translate with VSad/義沙得): zh-HK added as a Crowdin target 2026-10-28 (replaced zh-TW, which was the wrong variant); add it to LANGS/LI and the language menu once translated (pull writes i18n/zh-HK.json). The app's current `zh` is Simplified. Cantonese dropped: the user decided Traditional Chinese is enough. (moved out of v1.0.2 on 2026-10-29)
- Ticks station style polish (moved out of v1.0.2 on 2026-10-29) (rthorpey12: "hella unpolished"; optional, he's fine without it).
