# SNDT v1.0.1 (bugfix)

- Legend order now matches the Lines list: lines A to Z (numbers in order), grouped by type the same way. Also applies to the end-of-video legend board. (shared `linesAZ` helper)
- New station shapes (Map → Stations "Single-line stops", or a station's own Shape):
  - **Hexagons**: stretched across side-by-side lines like the other shapes.
  - **Big squares (cover crossings)**: one rounded block over every line end at the station. Where two different lines meet at an angle it grows by half a station size so their tracks end inside it (reference: user's screenshot 2026-10-28). Single-line stops get a rounded square.
- Hubs can pick a shape too (the Shape menu was only shown for stops, interchanges and termini); a big-square hub keeps its double ring.
- Translations added for both shape names (all 11 languages); run `node scripts/i18n-export.mjs` + Crowdin push to sync.
- Legend description (line → "Legend description", `L.legendDesc`): optional second text shown after the line's name in the legend, lighter weight, italic, muted (55% opacity). The legend box widens to fit it. On the end-of-video legend board it fills the muted second-name spot when that line's board has no second name of its own.
- Legend → "Also show": switches for the Planned/Under construction rows, Out-of-station interchange and Not in service (`legend.showStatus/showXfer/showNis`, default on). Also apply to the end-of-video legend board.
