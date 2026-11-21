# Contributing to SNDT

Thanks for helping! Bug reports, ideas, translations and code are all welcome.

## Licence of contributions

SNDT's editor is open source under the AGPL-3.0 (see `LICENSE`). Spectra also uses the same code in other versions of SNDT, including paid ones (such as a Steam version), which may not be open source.

By sending a contribution (a pull request, a patch, or a translation on [Crowdin](https://crowdin.com/project/sndt-cc)), you agree that:

1. it is your own work, or you have the right to share it;
2. it is published under the AGPL-3.0 like the rest of the repository; and
3. you also give Spectra a permanent, worldwide, free licence to use, change and distribute it in any version of SNDT, under any licence, including paid and closed-source versions.

You keep the copyright to your work. If you don't agree, please don't send the contribution, or say so in your pull request and we'll talk about it.

## Translations

Translations are done on Crowdin: https://crowdin.com/project/sndt-cc. Translators are credited in the app.

## Code

Everything lives in `src/sndt.html`; build with `python3 scripts/build.py`. Run `node tools/layout-check.mjs` before sending changes to line drawing.
