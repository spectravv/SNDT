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

## v1.0.3
Suggestions by ChaoDee (2026-10-30):
- Legend text for every row: change what Planned, Under construction, Out-of-station interchange and Not in service say, with a description after each (e.g. a second language), like a line's legend text; facility icons in the legend (none / the ones used / all / chosen ones), also with their own text. DONE (preview).
- The not-in-service X follows the station mark when the mark sits off the station's point (lane offsets). DONE (preview).
- Facility icon size: a slider in Station → Facilities. DONE (preview).
- Tighter line spacing in names whose CJK row is drawn bigger (孖角 / Twin Point). DONE (preview).
- Header/"Map" panel naming is confusing (renaming the map; "Map" sounded like map settings). User picked (2026-10-30), to try first: rename the map by clicking its name in the header, the arrow opens Your maps, the panel is called "This map", header buttons stay. DONE (preview).
- Bug: Ma Lai Hau – Wong Hoi Shek gets wrong lane offsets with every bend type except Zigzag (the pink band was only the selection highlight). FIXED (preview) with the reporter's map.
- Bug (ChaoDee, video 2026-10-30): an express passing Stations 22 and 21 without stopping can't be put beside the stopping line or reordered there. FIXED (preview) with "Stops here" (pass without stopping).
- Creators: StarlightPixels joins as Tester; a quote under every creator ("Yo tengo" for StarlightPixels); ChaoDee is now Lead Tester. DONE (preview).

- Precision (user decision 2026-10-31, from "how costly would RMP-style placement be"): step 1 precise placement (Grid / Free switch in the top bar, alignment snapping with guides, tenths, arrow nudges) DONE (preview); step 3 manual station marks (an interchange's pill length and angle set by hand) to do in v1.0.3.

## v1.0.4 (next, started 2026-10-31)
Bug fixes and small features; v1.1 is shelved until these are done (user decision 2026-10-31).
- Step 3 of the precision plan: an interchange's pill length and angle set by hand (moved here from v1.0.3).
- Free placement: new stations placed by clicking snap into line with other stations too (only dragging does so far).
- Lines-first lane layout as a SECOND layout mode (user decision 2026-10-31, after the "lines run straight" patch was reverted; the current station-first layout stays as it is and stays the default, the new one is a per-map setting, settings.layout 'lines'): stop letting station points decide where lanes go. Lanes are laid out along whole runs of lines first, and stations are drawn on top wherever their lines pass. Map format, editor, imports, timeline and ILVF stay as they are; this replaces the shift solver in geom() (bundles at each station linked in a spanning tree, where any link that disagrees is dropped and becomes a jump).
  - S1. Measuring first: add to tools/layout-check.mjs, per map, steps at stations (straight-through and turns), jogs inside segments, stretched marks (pill wider than its lines need), how far marks drift from their station points. Test set: test-maps/ plus Curt's three Tung Sha versions (~/Downloads/chtr-tung-sha-rail.json, (1), (2)).
  - S2. Solve all shifts together instead of a tree: weighted least squares over the same links (straight through a station: strong; along a straight segment: strong; turns: weak), reweighted so a conflict ends up as one clean step in the cheapest place rather than many small ones (IRLS); plus a cohesion term so a station's bundles don't drift apart (no stretched pill, the 馬麗口 case) and a weak pull towards the station point.
  - S3. Stations slightly out of line (up to about one lane): add a "run straight" link for the segment, solved together with the rest, so a station pulled two ways (馬麗口 by 黃海石 and 羅方) settles where both fit (there: 5 units left, all three lines straight) or keeps the jog when nothing fits.
  - S4. Labels, click areas and selection rings follow the drawn mark, not the station point.
  - S5. Tune on the test set, check with the user on Curt's maps, then save the layout-check baseline.
  - Kept from today: lines straight through a station aligned by their leaving direction, the reorder fixes, corner joins for turns, the clean X for unavoidable swaps.
- Header is cut off at about 950 px wide (since v1.0.2). (2026-10-31: down to 12 px of overflow at 901–962 px after the top-bar tightening for the LINES | STATIONS switch.)
- Bugs from players:
  - Using "Line order on this segment" (the ↑/↓ arrows in a segment's panel) completely disables reordering lines by dragging the dots at stations (screenshot 2026-10-31, ~/Pictures/Screenshots/2026-10-31_00-31.png). Likely cause, not yet checked: the arrows store a fixed order on the segment (`M.segs[key].order`), and the layout skips both the automatic ordering and the station's dot order (`station.laneOrder`) for any segment that has one; nothing clears it when dots are dragged later.
  - Ma Lai Hau (CHTR Tung Sha map): the purple line doesn't stop there and shouldn't interact with the station, yet it is held in a lane through it, between yellow and blue, inside the pill (screenshot 2026-10-31, ~/Pictures/Screenshots/2026-10-31_00-34.png). Not reproducible with the map JSON from 2026-10-30 (purple runs beside the station there), so the map has changed since; needs the current JSON. Two possible causes: (1) Ma Lai Hau was added to purple's stops and unticked under "Stops here" (pass without stopping keeps a lane through the station by design; the pill spans yellow to blue around it); (2) purple's path now passes within ¾ lane of the station, so it is detected as an express through it. UPDATE with the new JSON (~/Downloads/chtr-tung-sha-rail(1).json): it is cause (1): purple has Ma Lai Hau in its stops with "Stops here" unticked. Design question for the user: should a pass-through line still hold a lane through the station, or be left free?
  - Random nudges (screenshots 2026-10-31_00-35, _00-35_1, _00-35_2, _00-35_3, plus 00-36_1 above the stations): a line arrives at a station in one lane and leaves in another, drawn as a small sideways step at the station. Investigated on the new JSON (line width 9, gap 5, lane 14): 14 such joins, half a lane (7) or a full lane (14): 9中東綫 at 莫古斯, 那烙中環, 水枯圍; 3東西綫 at 馬麗口, 和文; 13東環綫 at 馬麗口, 水枯圍, 法拉; 7新田綫 at 麻灣, 莫古斯, 莎諾; 8那烙綫 at 白場圍, 豐各, 法拉. Pattern: one of the line's two segments at the station shares a bundle with another line and the other doesn't, so their lane offsets differ; the step that lines up straight-through lines across a station misses these. Within segments there are only 3 tiny jogs (7新田綫, 0.7–1.8).
  - 法拉 / 水枯圍 area is a mess (screenshot 2026-10-31_00-36_1): green and purple drawn on top of each other where they touch, yellow and purple too, and nudges on yellow and purple just above the stations. Same lane-offset problem as the nudges (13東環綫 and 8那烙綫 at 法拉, 9中東綫 and 13東環綫 at 水枯圍 are in the list above).
  - 東沙中環 / Tung Sha Central (screenshot 2026-10-31_00-43): blue 3東西綫 runs straight through the hub west→east, but arrives from the west in the bottom lane of a three-line bundle (dark red 1東沙綫, pale green 2東沙快綫, blue) and leaves east alone from the hub's centre, so it jumps sideways inside the station. Expected: leave east at the same (bottom) level, or run through the centre on both sides. The user can't fix it by hand: the pale green express ends at the hub, so the order can't be swapped to put blue in the middle. Same family as the nudges (straight-through line gets different lanes on each side); 3東西綫 at 東沙中環 isn't in the 14-join list because the jump is hidden inside the pill.
  - 白場圍 / 白珞 (screenshots 2026-10-31_00-45_1 and _00-45): green 8那烙綫 turns from south to east at 白場圍 beside the pale green express. As placed, green's corner swings down to the express's level and jumps back up to its own lane at the station, so the two corners clip into each other. With 白場圍 moved right, green no longer runs parallel to the express into 白珞 but curves across into the top lane just before it. Same family as the nudges: 8那烙綫 at 白場圍 is in the 14-join list (a full-lane jump between its segment from Station 21 and its segment to 白珞).
  - 利立 (screenshot 2026-10-31_00-36): yellow 9中東綫 doubles back over the same piece: its stops run 莎諾 > Station 33 (bend point) > 利立 > Station 33 > 利立 > 麻灣, after an earlier visit to 利立, so it draws over itself three times and the station mark shows through. Probably an accident while drawing; SNDT should stop a line doubling back over the piece it just drew, and Clean up map could find and fix it. (7新田綫 also visits 莎諾 twice, but as a loop's end, which is fine.)
  - From the Discord bug forum (fetched 2026-10-31 from the bot's Supabase table `discord_posts`; media saved in ~/Pictures/Screenshots/sndt-discord/: offset-1…7.png, red-right.mp4, stretch.png, gridfree.png):
    - "Incorrect offset of line segments at interchanges" (Curt, 2026-10-30, 7 screenshots): Tung Sha map, yellow between 馬麗口 Ma Lai Hau and 黃海石 Wong Hoi Shek; with every bend style (straight then 45°, 45° then straight, direct, across then turn, turn then across, curve, zigzag) yellow leaves the 馬麗口 pill at a different sideways offset than it arrives at 黃海石, and the pills stretch to cover it. Posted before v1.0.3's laneStep fix; same lane-offset family as the nudges above, re-check after that fix.
    - "Bruh" (Curt, 2026-10-30, video): red and green run side by side through Station 22 and Station 21; red jogs sideways between the two stations, and dragging Station 21 a little left or right flips the order so red ends up on the right of green (Curt wants red to stay on the left). Lane order changes with small moves; same family (laneOrder / lane offsets), re-check after the v1.0.3 fix.
    - "Unnecessary stretching of station caused by segments misalignment" (Curt, 2026-10-31, 1 screenshot, different map: 黃徑 Yellowway, 灣景 Shorelay, 重生區): the interchange pill at 重生區 is stretched diagonally because the dashed (planned) purple line and the green line arrive at offsets that don't line up. Needs that map's JSON.
    - "Overlap when switching between grid and free modes" (Kentōyäm, 2026-10-31, Brave on Windows 11): switching Free → Grid quickly shows both "Free placement…" and "Grid placement…" messages on top of each other. Cause: every toast() adds a new box at the same spot without removing the one still showing.
- Ideas from players still open on Discord (fetched 2026-10-31; not scheduled yet, for the user to sort):
  - Font choice for text objects in the Text panel, plus the Cianan Ur font (SIL OFL) (Paddy, 2026-10-30).
  - Facility icons next to labels: alignment toggle (top / centre / bottom, default top) and an "icons per row" number so long icon rows wrap (Curt, 2026-10-31).
  - Legend stacking: an "items per row/column" number so a legend with many lines wraps into more columns (0 = unlimited, the default) (Curt, 2026-10-31).
  - Hide the grid dots when zoomed out below 25% (the map turns grey) (Curt, 2026-10-31).
  - Double-click selects a whole line with its stations and bend points too, to build timelines faster (Curt, 2026-10-31; today double-click selects the line's segments only).
  - Facilities shown in the isolated line view (ILVF), as an option (Curt, 2026-10-31).
  - Station numbers (Aquaqua, 2026-10-31; details are in the thread's 9 replies, not in the post).
  - (Already planned elsewhere: NYC station style → v1.1; Ticks polish → Later; "Map" config section rename → Planned on Discord.)

## v1.1 (shelved 2026-10-31; work kept on branch v1.1, worktree ~/Documents/sndt-1.1, last commit c76726c)
- Style sets: one pick restyles the whole map, beyond what colour templates do (background, line look, station and interchange style, fonts, labels, terminus badges, frame/title/legend). Geometry and label positions never change. References (2026-10-29, in ~/Downloads): 
  - Łódź regional poster (ŁKA): cream paper, thick coloured frame, big two-language title block, thin parallel lines, white stations with dark outline, IC markers, two-column legend.
  - Charlotte (transitscapes): white, heavy rounded lines, small white dots, lettered roundels at each terminus, huge bold title, roundel legend with end stations.
  - Moscow metro/MCD (metro_map_0926.pdf): white, thin lines, outlined-circle interchanges joined by connectors, numbered line circles at the ends, green parks and landmark icons behind.
  - Dark Transit (Claude web, sndt-style-reference.html + SNDT_MAP_STYLES.md): dark slate with a faint grid, glowing lines, pill interchanges with one dot per line, number badges.
  - Frosted Glass (same files): pastel gradient with blurred colour blobs, white-cased lines with soft shadow, white discs, labels on frosted pills.
  - Dutch rail (photo of an NS map, 2026-10-29): thick parallel lines with thin white gaps between them, small white stop dots inside the line, short black leader ticks from the stop to its name, interchanges as a dark bar across all lines with a white dot per line, line codes (S64, IC27) written in pills inside the line, big bold capitals for main stations.
- Style set decisions (user, 2026-10-29): picking a set only FILLS the existing settings, which stay editable after; line colours are kept but their saturation/brightness is shifted to match the set; all six ship in v1.1; names: Poster (Łódź), Bold (Charlotte), Flowing (Moscow), Night Transit (Dark Transit), Frost (Frosted Glass), Ribbon (Dutch rail).

## v1.0.5 (RELEASED 2026-11-02, see releases/v1.0.5/ and CHANGES-v1.0.5.md)
Done: all player bugs and ideas below except where noted. Tried and rejected by the user: interchange slots (stations as a resizable grid of slots), automatic fare zones from per-station zone numbers (user wanted cosmetic, district-style zones instead).
Still open from this list: Manual layout (below, moved to v1.0.6); hand-drawn route under a bundle (c&t Lake, Ivybridge – Ivybridge Market) still merges crossing gaps into one hole (user can reset the route); 利立 doubling-back line; handbook articles + Crowdin strings for everything new since v1.0.4; GitHub push of v1.0.5.

v1.0.5.1 hotfix released 2026-11-07 (ILVF station numbers, striped lines bend, no A›B›A, Clean up "Lines that double back"; log CHANGES-v1.0.5.1.md).

## v1.0.6 — The “Connected” Update (released 2026-11-12)
- Left after release: hairline seam where two touching areas with gap 0 meet (seen in the CHTR title box on curt-tung-sha maps), from the district-outline fix; update Discord post statuses (one-way arrows, district outlines, fonts, Helvetica, cloud storage, tutorial pop-up).
- Manual layout (step 2 of the precision plan), carried over from v1.0.5. First pass done 2026-11-08 (see CHANGES-v1.0.6.md).
- Bugs from players (2026-11-02):
  - "Line between stations": a striped (white blocks inside the line) line's blocks go askew around a bend (screenshot only; which map and style isn't known yet).
  - Isolated line view, large interchanges (Chrome and the mobile app): at a station with many lines (Stopton Central, 6 lines) the coloured ticks below the station bunch up against each other and the circle, the black ones merging.
  - "Interchange lines not connecting correctly" (user, 2026-11-02, ~/Downloads/ct-lake-network.json, copied to test-maps/ct-lake-network.json): between Ivybridge (140,-120) and Ivybridge Market (240,-105), cyan and magenta vanish for a stretch. Both layouts. Cause: the segment has a hand-drawn route (175,-115 / 185,-95 / 205,-95 / 240,-90) that dives under the blue/red/orange/green bundle at a shallow angle; each crossing cuts a gap in the line underneath and the four gaps merge into one long hole. With the hand route removed cyan runs clean, but magenta still has to cross blue/red/orange to reach its lane between orange and lime at Ivybridge Market, and is drawn with a long slanted gap plus a small hook right of the station. Left as it is (user decision 2026-11-03, after a mockup of a thin strand through long gaps vs the single line drawn over the bundle).
- Bugs from players (fetched 2026-11-12):
  - Curt, 2026-11-11, "One-way arrows appearing where they shouldn't": a one-way branch marked the two-way stops it shares (Yelloway, Spawn). FIXED: a stop gets the chevron only when every line stopping there runs one way through it, all the same way.
  - Curt, 2026-11-07, "I froze SNDT": a fare zone with 200 numbers and number size 1. FIXED: the number search tries at most ~80×80 spots and the count is capped at 12 (61 ms for that case).
  - Curt, 2026-11-05, "Outlines on districts overlap each other": screenshot expired; overlapping districts already cut around each other. Needs the screenshot or the map.
- Ideas from players (fetched 2026-11-12):
  - Plentk, 2026-11-01: renumber stations after an infill station. Already done in v1.0.5 (line panel: Renumber stations); the Discord post can be closed.
  - Absolutely Nobody, 2026-11-06: remember that the tutorial was taken or skipped, and a button to open it again. Already so (sndt:tour in the browser; Help opens it); it only comes back when site data is cleared or in a private window.
  - waterberry507, 2026-11-07: a desktop version for Windows 11. SNDT installs as an app (Install button, PWA).
  - VoltedFromMatrix, 2026-11-10: a Discord link in the empty bottom-left corner.
  - StarlightPixels, 2026-11-04: Helvetica (normal and bold) as a font.
  - Curt, 2026-11-05: separate fonts for CJK, non-CJK and secondary text (e.g. MTR: Noto Serif HK for Chinese, Noto Sans HK for English), with one main font as the default.
  - Absolutely Nobody, 2026-11-07: cloud storage / accounts to edit the same maps on several devices.
  - MatMat, 2026-11-09: add the Traindex bot to the Discord server (server admin, not the app).
- Ideas from players (2026-11-02): all done in v1.0.5 (fare zones as an area Kind, ILVF interchange styles Names/Codes/Dots, Renumber stations).
- Manual layout (step 2 of the precision plan; moved here from v1.2 by the user on 2026-10-31): a "Manual layout" switch per map (Free mode then means precise + manual) that freezes the automatic layout into per-line, per-segment sideways offsets, which the user then sets by dragging or typing; the automatic bundling/reordering leaves them alone; switching back returns to automatic; a single segment can be re-frozen from the automatic layout.

## v1.0.7 (next)
- Unique nicknames (user decision 2026-11-12): no two accounts can have the same nickname, case-insensitive ("Spectra" and "spectra" count as the same). Plan: unique index on lower(btrim(nickname)) in profiles (check for existing duplicates first), and a clear message in the Account panel when a nickname is taken. Maybe also reserve "Anonymous".
- Hairline seam where two touching areas with gap 0 meet (from the v1.0.6 district-outline fix; see the CHTR title box on curt-tung-sha maps).

## Accounts (planned 2026-11-12, user decisions)
- Sign in with Google or an email link (Supabase Auth, project sndt). Optional: the app keeps working without an account.
- Scope: cloud sync of your own maps + share links + public gallery with reporting.
- Local first: maps stay in IndexedDB (done in v1.0.6), signed-in saves also go to the cloud; the later save wins and the older version is kept as a backup (5 per map).
- Privacy (user 2026-11-12): no passwords anywhere (Google + email link only); the name/picture Google sends are stripped on arrival (triggers on auth.users / auth.identities), so the only personal detail kept is the email; gallery shows a self-chosen nickname (profiles table).
- Limits: 50 maps, 5 MB per map, 50 MB per account. "Delete my account" removes everything. Needs a privacy page.
- Database: supabase/accounts.sql, APPLIED to sndt 2026-11-12 as migrations accounts + accounts_tidy (column json renamed data: json is a keyword in the project's Postgres 17). User approved the limits (until a paid Supabase plan). Tested 2026-11-12 on a local Postgres 15 with stand-ins for Supabase auth/storage (branching needs the Pro plan): Google name/picture stripped on insert and update, owners only see their own maps, others only gallery maps, link maps only by slug, nobody but the owner can change a map, reports unreadable to players, 5 MB / 50 maps / 50 MB limits, backups trimmed to 5, thumbs only in your own folder, delete_me removes everything.
- User setup: Google OAuth client, Supabase Auth URLs (sndt.cc), custom SMTP for email links (Supabase's built-in sender only allows a few emails per hour).
- Steps: 1) apply SQL, 2) sign-in UI, 3) sync, 4) share links, 5) gallery + reports, 6) privacy page + delete account.
- Progress 2026-11-12: 1) applied; 2) sign-in done (375ad0d), tested by the user on a Vercel preview with Google + email link; Google name/picture confirmed stripped on the real project; 3) sync done (ef5c32e), user tested PC + phone on preview 7f07pqmp0: works (1 map in the account). Delete account button already in step 2. 4) share links, 5) gallery + reports, 6) privacy page done 2026-11-12 (573a01f, migration accounts_share), on preview sndt-reu0jnjru; WAITING for the user's test (share link, gallery picture, report). User to do before release: Resend SMTP + DNS for sndt.cc into Supabase Auth SMTP; Google Auth Platform › Audience › Publish app; then deploy to sndt.cc on their OK.

## Later
- MTR import: an option to spread out only the crowded areas (dense city centres) on import, instead of the whole map (decided 2026-10-28). (moved out of v1.0.2 on 2026-10-29)
- Translator credits: a Translators part in the Creators popup (and the handbook's Creators section), filled from the Crowdin contributors once translations arrive. (moved out of v1.0.2 on 2026-10-29)
- New languages from Crowdin (Czech, Danish, Irish, Japanese, Korean, Dutch, Polish, Filipino are open there; Irish added 2026-10-28 on a player request): add each to LANGS/LI and the language menu once it is translated and approved. (moved out of v1.0.2 on 2026-10-29)
- Handbook translation: put the handbook's text on Crowdin too, instead of translating it by hand. (moved out of v1.0.2 on 2026-10-29)
- Traditional Chinese (Hong Kong) on Crowdin (idea by Curt, who will translate with VSad/義沙得): zh-HK added as a Crowdin target 2026-10-28 (replaced zh-TW, which was the wrong variant); add it to LANGS/LI and the language menu once translated (pull writes i18n/zh-HK.json). The app's current `zh` is Simplified. Cantonese dropped: the user decided Traditional Chinese is enough. (moved out of v1.0.2 on 2026-10-29)
- Ticks station style polish (moved out of v1.0.2 on 2026-10-29) (rthorpey12: "hella unpolished"; optional, he's fine without it).
