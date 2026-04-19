# Releasing GRACE Marketplace

## Checklist

1. Update `CHANGELOG.md` for the target version.
2. Keep versions synchronized across:
   - `package.json`
   - `README.md`
   - `openpackage.yml`
   - `.claude-plugin/marketplace.json`
   - `plugins/grace/.claude-plugin/plugin.json`
3. Sync canonical skills in `skills/grace/*` with the packaged mirror in `plugins/grace/skills/grace/*`.
4. Run:
   - `bun run validate:ci`
   - `bun run release:checklist`
5. Review the GitHub Actions `Validate` workflow result before publishing.

## Notes

- `bun run validate:ci` covers tests, CLI smoke validation, and marketplace validation.
- `bun run release:checklist` verifies the current version is represented in `CHANGELOG.md` and that the release workflow/scripts exist.
- `scripts/validate-marketplace.ts` also checks packaged-vs-canonical drift and version consistency.
