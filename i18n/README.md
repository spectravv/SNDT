# Translations (Crowdin)

The app's text lives in `src/sndt.html`. These files are the copy Crowdin works with.

- `en.json` is the source: every English line in the app. Keys are the English text; lines from the small tables
  start with a hint (`how:`, `blocks:`, `time unit:`, `theme word:`, `theme:`, `pattern:`).
- `<lang>.json` holds the translations (zh, es, fr, de, ru, it, pt = Brazilian Portuguese, ms, ar, tr).
- Keep placeholders as they are: `{n}`, `{t}`, `{h}`, `{v}` and `$1`, `$2` (a name or number goes there).

## Workflow
Crowdin project: https://crowdin.com/project/sndt-cc (string-based). `scripts/crowdin.mjs` reads the API token from
`CROWDIN_TOKEN` or `~/.crowdin-token`.

1. After changing app text: `node scripts/i18n-export.mjs`, then `node scripts/crowdin.mjs push` to send `en.json` to Crowdin.
   Lines whose English didn't change keep their translations.
2. To bring translations in: `node scripts/crowdin.mjs pull` (approved translations only, into `<lang>.json`), then
   `node scripts/i18n-import.mjs --dry` to see what would change, and `node scripts/i18n-import.mjs` to write it.
   Lines that are empty, still English, or lose a placeholder or HTML tag are skipped and listed.
3. Test (`node tools/touch-test.mjs`, a look in the changed languages), then deploy as usual.

A new language (a file whose code isn't in `LANGS`/`LI` in `src/sndt.html` yet) is reported, not imported: it needs adding to the app first.
