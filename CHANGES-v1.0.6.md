# SNDT v1.0.6

## New
- Manual layout: a third button in the lane layout switch (LINES | STATIONS | MANUAL). Picking Manual freezes the lanes exactly as they are drawn at that moment (from Lines first or Stations first) and saves each line's sideways offset at both ends of every segment, in lanes (`seg.lanes {lineId:[start,end]}`, plus a third value for the legs in between on routes with three or more legs; `settings.layoutBase` remembers which automatic layout was frozen). The automatic layout no longer moves frozen lines. Segments drawn after freezing follow the automatic layout until they are moved or reset.
  - Lanes are kept per part: each leg of a segment's route between corners has its own value (`seg.lanes {lineId:[part1,part2,…]}`; a straight or smooth segment keeps `[start,end]` and steps across at 45° in the middle when they differ).
  - Click a line to pick the part under the pointer (between two corners); Shift-click picks more parts, on any segment or line, and Shift-clicking a picked part drops it. Drag sideways to move every picked part: each part moves across its own direction, so dragging both parts of an L diagonally moves its corner. Corners follow to where the parts meet, also at bend points between segments. Steps are half a lane on the grid, a tenth of a lane in Free placement, and any amount with Alt. On touch, a part has to be picked before it can be dragged, so swiping across lines still pans. (User request 2026-11-12, after a mockup on c&t Lake.)
  - In Manual, hand-drawn routes don't show the "add a bend" handles in the middle of each leg, where grabbing a line now moves its lanes; the corner handles stay.
  - Several picked parts show as "N parts of lines" in the panel.
  - The segment panel shows "Lanes on this segment": each line's offset per part (or at both stations), typed in lanes, plus "Back to the automatic lanes here", which re-freezes just that segment from the automatic layout. Line order on the segment is hidden in Manual, because it only affects the automatic layout.
  - Station marks follow their lines in Manual, as they do in Lines first.
  - Leaving Manual drops the saved lanes and goes back to the automatic layout (undo brings them back).
  - Freezing is faithful: on the test maps the frozen drawing matches the automatic one to within half a pixel, apart from two odd hand-drawn hooks on c&t Lake.
- Header: the GRID | FREE switch now hides below 1360px window width (was 1200) and the lane layout switch below 1164px (was 1100), to make room for the new button. Placement is still in This map.
