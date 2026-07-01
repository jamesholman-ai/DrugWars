# UI Art Bible — Target Layout vs Current Build

Reference board: `assets/art/reference/ui/ui_bible_full.png`  
Crops: `ui_reference_01_dashboard.png` … `ui_reference_07_footer_actions.png`

## Asset folders (Art Bible §2)

| Path | Purpose | Status |
|------|---------|--------|
| `assets/icons/` | Transparent PNG icons (cash, drugs, nav) | Skeleton + README |
| `assets/backgrounds/cities/` | City heroes | → use `assets/art/cities/` + `imageRegistry` |
| `assets/backgrounds/events/` | Event modal headers | Skeleton + README |
| `assets/ui/cards/` | Stat card frames | Skeleton |
| `assets/ui/buttons/` | ENTER MARKET, etc. | Skeleton |
| `assets/ui/progress/` | Rank / health bars | Skeleton |
| `assets/ui/images/` | Hero decorations | Skeleton |

Code APIs:
- City art → `src/assets/imageRegistry.ts`
- UI / events → `src/assets/uiAssetRegistry.ts`

## Target layout mapping

| Mock module | Crop | Current screen | Match |
|-------------|------|----------------|-------|
| Main dashboard | `ui_reference_01_dashboard` | `GameScreen` (AAA Command) | Partial — stats, hero, intel present; missing 3-up finance row layout & weapon ENTER MARKET button |
| Market table | `ui_reference_02_market` | `MarketScreen` | Partial — terminal rows, no drug icon column |
| Travel | `ui_reference_03_travel` | `TravelScreen` | Partial — city cards + area grid; district thumbnails not yet |
| World event | `ui_reference_04_world_event` | `EventModal` | Legacy — emoji header, no photo background |
| City info | `ui_reference_05_city_info` | Travel `CityCard` expanded | Partial — travel card art wired; no specialty drug icons |
| Upgrades | `ui_reference_06_upgrades` | `BusinessesScreen` / Store | Legacy UI |
| Footer actions | `ui_reference_07_footer_actions` | `AAADayControl` + nav | Partial |

## Visual tokens (from mock)

- Background: near-black `#05060A`
- Cash / buy / go: neon green
- Debt / sell / danger: red
- Net worth / events: purple
- Heat / warnings: orange
- Cards: dark glass, 1px border, outer glow on active
- Typography: all-caps labels, bold stat numbers

## Recommended next steps (no gameplay changes)

1. **Icons** — export or generate transparent PNG set → `assets/icons/` → wire `uiAssetRegistry.getIconAsset`
2. **Event art** — `police_crackdown.png` etc. → `assets/backgrounds/events/` → extend import script + `EventModal`
3. **UI rebuild pass** — align `GameScreen`, `MarketScreen`, `TravelScreen`, `EventModal` to reference crops (layout only)
4. **District thumbnails** — small crops in `assets/art/cities/{City}/districts/` for Travel area grid

Import city art: `npm run import:art`  
Typecheck: `npm run typecheck`

See also: [ART_PIPELINE.md](./ART_PIPELINE.md)
