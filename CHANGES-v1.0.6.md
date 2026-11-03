# SNDT v1.0.6

## Fixes
- Striped lines: the white blocks are now drawn as a dashed stroke along the line instead of separate boxes, so a block on a bend bends with the line instead of sticking out askew (player report 2026-11-02, "Line between stations").
- Isolated line view: at big interchanges (Stopton Central, 6 lines) the coloured ticks under the station are spaced wider and start a little below the station mark, so they no longer bunch up or run into its outline (black lines merged with it).
- A line can no longer be drawn straight back to the station it just came from (A › B › A); SNDT says so instead. This is how 9中東綫 on Curt's Tung Sha map ended up running 莎諾 › Station 33 › 利立 › Station 33 › 利立 › 麻灣.
- Clean up map has a new "Lines that double back" section: it drops the extra trip back (A › B › A › B › C becomes A › B › C) when the skipped station is still on the line elsewhere. A deliberate trip out to a station and back (A › B › C › B › A) is left alone. Found on the three Curt Tung Sha maps (9中東綫) and the old RMP import (Line 9), nothing on the other test maps. The map drew the same before and after, because the drawing already merges a line's repeated pieces. What changes is the stop list, which the ILVF strip, route length, travel time and the timeline read.

## New
- Isolated line view: a "Station numbers" switch in the strip's bar (on by default) shows each station's code on that line (from the line's Station codes, e.g. EW 3, or one typed for the station) in a badge in the line's colour above its mark. Lines without codes look as before.
