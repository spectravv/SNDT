# SNDT v1.0.6

## New
- Manual layout: a third button in the lane layout switch (LINES | STATIONS | MANUAL). Picking Manual freezes the lanes exactly as they are drawn at that moment (from Lines first or Stations first) and saves each line's sideways offset at both ends of every segment, in lanes (`seg.lanes {lineId:[start,end]}`, plus a third value for the legs in between on routes with three or more legs; `settings.layoutBase` remembers which automatic layout was frozen). The automatic layout no longer moves frozen lines. Segments drawn after freezing follow the automatic layout until they are moved or reset.
  - Drag a line sideways on the map to move it along its whole segment, and on through bend points where the same lines carry on. Hold Shift to move only the end nearer the pointer; the line then steps across at 45° in the middle. Steps are half a lane on the grid, a tenth of a lane in Free placement, and any amount with Alt. On touch, a line has to be selected before it can be dragged, so swiping across lines still pans.
  - The segment panel shows "Lanes on this segment": each line's offset at both stations (and in between), typed in lanes, plus "Back to the automatic lanes here", which re-freezes just that segment from the automatic layout. Line order on the segment is hidden in Manual, because it only affects the automatic layout.
  - Station marks follow their lines in Manual, as they do in Lines first.
  - Leaving Manual drops the saved lanes and goes back to the automatic layout (undo brings them back).
  - Freezing is faithful: on the test maps the frozen drawing matches the automatic one to within half a pixel, apart from two odd hand-drawn hooks on c&t Lake.
- Header: the GRID | FREE switch now hides below 1360px window width (was 1200) and the lane layout switch below 1164px (was 1100), to make room for the new button. Placement is still in This map.
