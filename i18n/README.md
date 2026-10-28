# Translations (Crowdin)

The app's text lives in `src/sndt.html`. These files are the copy Crowdin works with.

- `en.json` is the source: every English line in the app. Keys are the English text; lines from the small tables
  start with a hint (`how:`, `blocks:`, `time unit:`, `theme word:`, `theme:`, `pattern:`).
- `<lang>.json` holds the translations (zh, es, fr, de, ru, it, pt = Brazilian Portuguese, ms, ar, tr).
- Keep placeholders as they are: `{n}`, `{t}`, `{h}`, `{v}` and `$1`, `$2` (a name or number goes there).

## Workflow
1. After changing app text: `node scripts/i18n-export.mjs`, then upload `en.json` to Crowdin as the new source.
2. To bring translations in: download them from Crowdin into this folder (one `<lang>.json` per language), then
   `node scripts/i18n-import.mjs --dry` to see what would change, and `node scripts/i18n-import.mjs` to write it.
   Lines that are empty, still English, or lose a placeholder or HTML tag are skipped and listed.
3. Test (`node tools/touch-test.mjs`, a look in the changed languages), then deploy as usual.

A new language (a file whose code isn't in `LANGS`/`LI` in `src/sndt.html` yet) is reported, not imported: it needs adding to the app first.
