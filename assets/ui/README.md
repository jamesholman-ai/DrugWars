# UI chrome assets

Subfolders:
- `cards/` — panel backgrounds, stat card frames
- `buttons/` — primary/secondary button textures (ENTER MARKET, etc.)
- `progress/` — rank bar, health/heat track fills
- `images/` — misc UI decoration (weapon hero on ENTER MARKET, etc.)

PNG with alpha where needed. Match Art Bible: dark glass, neon border glow, 2xl radius.

Screens consume these via `src/assets/uiAssetRegistry.ts` when populated.
Until then, components use programmatic styles in `src/theme/theme.ts` and `src/components/aaa/`.

Reference crops: `assets/art/reference/ui/ui_reference_*.png`
