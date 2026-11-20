# SNDT v1.1 — full change log

Started 2026-10-29 (first attempt, kept as branch `v1.1-old`), restarted 2026-11-19 on top of v1.0.7. Branch `v1.1`.

## Style sets (Map → Style sets)
- Default, Moscow, London and NYC. A set fills existing settings only; nothing moves; line colours are kept and shifted with Line colour saturation / brightness (`tone()`).
- Each set's own tools show only while it is picked (`SET_FEATURES` / `feat()`).
- Moscow: PT Sans, ticks, Joined rings (one circle per interchange, arcs in the line colours, contact-centred), round walking links with shaded edges, round walking-link circles for 3+ stations (Put the stations on the circle), Round line badges placed by hand (Add badges at the ends, drag; Short code).
- London: Cabin, dark blue names, ticks, white rings in the text colour (`ringInk`, switchable), Step-free facility sign.
- NYC (idea: StarlightPixels): Inter, line services (`line.services`), route bullets at every station (`xferStyle:'bullets'`), per-station bullet options (stops here, Express ◆, one-way arrow, Move the bullets aside + drag), service strips (`svcStrips`, one lane slot each in both lane layouts and Manual), hatched planned/building lines (`statusLook:'hatch'`), upright second names, Name weight.
- Dropped from the first attempt: Poster, Bold, Night Transit, Frost, Ribbon and their tools.

## Lines and editing
- Several segments at once: Shift-click segments, then Status, Colour here, Style here, Bend type for all (Curt).
- Line styles: Triple (hollow); Dash length / Gap length for Dashed, Thin dashed, Railway; Gap between dots for Dotted; Outline colour for Outlined (rthorpey12).
- Selection box of rotated text and labels turns with them (Curt).
- Strip map (isolated line view): Loops as a circle (racetrack), loop's first station no longer shown three times (VSad).

## Under the hood (Steam prep)
- Platform layer `PLAT` (storage, clipboard, links, downloads, scripts, font URLs).
- Map format v2 with upgrade steps (`MAP_FORMAT`, `MAP_STEPS`); a map from a newer SNDT shows a warning.
- Saving when browser storage is full shows a warning instead of failing silently.

## Handbook
- New article Style sets with a live demo; notes for the new line styles, several segments, strip-map loops, fonts.
- Live demos fill their window again (embed grid row bug) and the right mouse button drags the map in them.

## Translations
- ~60 new strings in all 10 languages; English on Crowdin, ours uploaded as unapproved suggestions.
