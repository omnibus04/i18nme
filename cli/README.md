# i18nme

Translation as a build step, not a dashboard you log into.

```bash
npx i18nme init --source-locale en --target-locales de,fr,es
export I18NME_API_KEY=...   # from your project's API Keys page
npx i18nme sync
```

`sync` only translates strings that changed since the last run — repeats are
served from translation memory and cost nothing.

## Commands

- **`i18nme init`** — creates `i18nme.config.json` and an empty source locale file.
- **`i18nme sync`** — diffs your source locale file against the local lockfile
  (`.i18nme-lock.json`), translates only what changed, and writes the results
  into each target locale file. `--force` resyncs everything; `--overwrite`
  replaces existing translations instead of only filling in missing ones.
- **`i18nme status [--check]`** — shows translation completeness per target
  locale. `--check` exits non-zero if anything is missing, for use as a CI
  gate that fails the build on incomplete translations.

## Configuration

`i18nme.config.json`:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "es"],
  "files": "locales/{locale}.json",
  "format": "json"
}
```

`apiBaseUrl`/`portalBaseUrl` can be overridden in the config file or via the
`I18NME_API_URL`/`I18NME_PORTAL_URL` environment variables (self-hosted
deployments).

## GitHub Action

```yaml
- uses: omnibus04/i18nme/cli/action@v1
  with:
    api-key: ${{ secrets.I18NME_API_KEY }}
```

Runs `i18nme sync` and opens a PR with the updated translation files.

## Committing the lockfile

Commit `.i18nme-lock.json` alongside your source locale file — it's what
makes CI runs diff-only. Without it, every run re-translates every key (still
correct, since the server checks translation memory too, just slower).
