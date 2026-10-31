# SNDT v1.0.4

Bug fixes and small features after v1.0.3 (v1.1 shelved meanwhile).


## Fixes
- Messages at the bottom no longer pile on top of each other: a new message replaces the one still showing (e.g. switching Free → Grid placement quickly; reported by Kentōyäm).
- Lines that run straight through a station keep their lane on both sides more often (fewer sideways nudges at stations):
  - a bundle that leaves a station straight and only bends a little further on now counts as carrying straight on, so its lines are lined up across the station (it used to count as a turn and was left unaligned: 9中東綫 at 水枯圍, 8那烙綫 at 白場圍 and 法拉 on the Tung Sha map);
  - where two lines swap sides across a station, the side that can actually be reordered is reordered (a side that is one shared segment can't be, and used to "win" at no cost and change nothing: 7新田綫/9中東綫 at 莫古斯).
  - Layout check: rmp-tung-sha 22 → 9 sideways jumps, untitled-network 35 → 30, rmp-older 2 → 1 (baseline not saved yet).
- Where a line turns at a station and its piece ends in a rounded bend, the two pieces now meet in one corner (looking a little way back along the bend) instead of a small sideways step (13東環綫 at 水枯圍, 7新田綫 at 莎諾). Lines carrying straight on are left alone.
